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
