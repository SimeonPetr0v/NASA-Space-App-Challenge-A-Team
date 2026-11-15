import type { InitProgressReport, MLCEngineInterface } from '@mlc-ai/web-llm'

/*
  Loads WebLLM only when TOT is opened (dynamic import), inside a Web Worker.
  The model weights download once and stay in the browser cache, so TOT
  works offline afterwards.
*/

export type Engine = MLCEngineInterface

/** WebGPU support and whether the graphics chip has 16-bit float shaders (many phones do not) */
export async function gpuInfo(): Promise<{ ok: boolean; f16: boolean }> {
  const gpu = (navigator as Navigator & { gpu?: { requestAdapter: () => Promise<{ features: Set<string> } | null> } }).gpu
  if (!gpu) return { ok: false, f16: false }
  try {
    const adapter = await gpu.requestAdapter()
    return { ok: !!adapter, f16: !!adapter?.features.has('shader-f16') }
  } catch {
    return { ok: false, f16: false }
  }
}

/** Plain-language reason when the model cannot start */
export function explainError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e)
  if (/shader-f16|FeatureSupport/i.test(msg)) return 'This graphics chip cannot run this model build. Reload the page; TOT will use the build that fits this device.'
  if (/out of memory|OOM|device (was )?lost|allocation|maxBufferSize|maxStorageBuffer/i.test(msg)) return 'Not enough graphics memory for this model. Pick Qwen 2.5 0.5B, close other apps and try again.'
  if (/quota|storage|QuotaExceeded/i.test(msg)) return 'Not enough free storage for the download. Free some space on the device and try again.'
  if (/network|fetch|Failed to fetch/i.test(msg)) return 'The download was interrupted. Check the internet connection and try again; it continues where it stopped.'
  return `The model could not start (${msg.slice(0, 160)}).`
}

export async function modelCached(modelId: string): Promise<boolean> {
  try {
    const { hasModelInCache } = await import('@mlc-ai/web-llm')
    return await hasModelInCache(modelId)
  } catch {
    return false
  }
}

export async function loadEngine(modelId: string, onProgress: (r: InitProgressReport) => void): Promise<{ engine: Engine; worker: Worker }> {
  const { CreateWebWorkerMLCEngine } = await import('@mlc-ai/web-llm')
  const worker = new Worker(new URL('./tot.worker.ts', import.meta.url), { type: 'module' })
  try {
    const engine = await CreateWebWorkerMLCEngine(worker, modelId, { initProgressCallback: onProgress })
    return { engine, worker }
  } catch (e) {
    worker.terminate()
    throw e
  }
}

/* One interface for both engines, so the TOT page does not care which one runs */
export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }
export type Runner = {
  kind: 'gpu' | 'cpu'
  stream: (messages: ChatMessage[], max: number, onText: (all: string) => void) => Promise<void>
  interrupt: () => void
  dispose: () => Promise<void>
}

export function gpuRunner(engine: Engine, worker: Worker): Runner {
  return {
    kind: 'gpu',
    stream: async (messages, max, onText) => {
      const chunks = await engine.chat.completions.create({ messages, stream: true, temperature: 0.3, max_tokens: max })
      let text = ''
      for await (const chunk of chunks) {
        text += chunk.choices[0]?.delta?.content ?? ''
        onText(text)
      }
    },
    interrupt: () => engine.interruptGenerate(),
    dispose: async () => {
      await engine.unload().catch(() => undefined)
      worker.terminate()
    },
  }
}

/*
  Backup for devices without WebGPU (many Android phones): a small model on
  the processor via Transformers.js in a worker. Slower, so the page sends it
  a shorter prompt.
*/
export const CPU_MODEL = { id: 'HuggingFaceTB/SmolLM2-360M-Instruct', dtype: 'q4', name: 'SmolLM2 360M', downloadGB: 0.4 }

export function loadCpuRunner(onProgress: (pct: number, text: string) => void): Promise<Runner> {
  const worker = new Worker(new URL('./cpu.worker.ts', import.meta.url), { type: 'module' })
  return new Promise((resolve, reject) => {
    let onText: ((all: string) => void) | null = null
    let text = ''
    let finish: (() => void) | null = null
    let fail: ((e: Error) => void) | null = null
    worker.onmessage = (e: MessageEvent<{ type: string; pct?: number; text?: string; message?: string }>) => {
      const m = e.data
      if (m.type === 'progress') onProgress(m.pct ?? 0, m.text ?? '')
      else if (m.type === 'ready')
        resolve({
          kind: 'cpu',
          stream: (messages, max, cb) =>
            new Promise<void>((res, rej) => {
              onText = cb
              text = ''
              finish = res
              fail = rej
              worker.postMessage({ type: 'generate', messages, max })
            }),
          interrupt: () => worker.postMessage({ type: 'interrupt' }),
          dispose: async () => worker.terminate(),
        })
      else if (m.type === 'token') {
        text += m.text ?? ''
        onText?.(text)
      } else if (m.type === 'done') finish?.()
      else if (m.type === 'error') {
        const err = new Error(m.message)
        if (fail) fail(err)
        else {
          worker.terminate()
          reject(err)
        }
      }
    }
    worker.onerror = (e) => {
      worker.terminate()
      reject(new Error(e.message || 'The worker could not start'))
    }
    worker.postMessage({ type: 'load', model: CPU_MODEL.id, dtype: CPU_MODEL.dtype })
  })
}

/** Whether the backup model is already in the browser cache (Transformers.js keeps it in 'transformers-cache') */
export async function cpuModelCached(): Promise<boolean> {
  try {
    const cache = await caches.open('transformers-cache')
    const keys = await cache.keys()
    return keys.some((k) => k.url.includes(CPU_MODEL.id) && k.url.includes('.onnx'))
  } catch {
    return false
  }
}
