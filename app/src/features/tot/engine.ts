import type { InitProgressReport, MLCEngineInterface } from '@mlc-ai/web-llm'

/*
  Loads WebLLM only when TOT is opened (dynamic import), inside a Web Worker.
  The model weights download once and stay in the browser cache, so TOT
  works offline afterwards.
*/

export type Engine = MLCEngineInterface

export async function webgpuAvailable(): Promise<boolean> {
  const gpu = (navigator as Navigator & { gpu?: { requestAdapter: () => Promise<unknown> } }).gpu
  if (!gpu) return false
  try {
    return !!(await gpu.requestAdapter())
  } catch {
    return false
  }
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
