import { env, InterruptableStoppingCriteria, pipeline, TextStreamer } from '@huggingface/transformers'

/*
  TOT backup engine for devices without WebGPU: a small model run on the
  processor (ONNX Runtime WebAssembly) through Transformers.js, inside this
  worker so the page stays responsive. Model files and the runtime are
  cached by the browser after the first download, so it also works offline.
*/

env.allowLocalModels = false

type Msg =
  | { type: 'load'; model: string; dtype: string }
  | { type: 'generate'; messages: { role: string; content: string }[]; max: number }
  | { type: 'interrupt' }

type Generator = ((messages: unknown, options: Record<string, unknown>) => Promise<unknown>) & { tokenizer: unknown }

let generator: Generator | null = null
const stopper = new InterruptableStoppingCriteria()
const files = new Map<string, { loaded: number; total: number }>()
const post = (m: unknown) => (self as unknown as Worker).postMessage(m)

self.onmessage = async (e: MessageEvent<Msg>) => {
  const m = e.data
  if (m.type === 'load') {
    try {
      generator = (await pipeline('text-generation', m.model, {
        dtype: m.dtype as 'q4',
        device: 'wasm',
        progress_callback: (p: { status: string; file?: string; loaded?: number; total?: number }) => {
          if (p.status !== 'progress' || !p.file || !p.total) return
          files.set(p.file, { loaded: p.loaded ?? 0, total: p.total })
          let loaded = 0
          let total = 0
          files.forEach((f) => {
            loaded += f.loaded
            total += f.total
          })
          post({ type: 'progress', pct: Math.round((loaded / total) * 100), text: `Downloading ${Math.round(loaded / 1e6)} of ${Math.round(total / 1e6)} MB` })
        },
      })) as unknown as Generator
      post({ type: 'ready' })
    } catch (err) {
      post({ type: 'error', message: err instanceof Error ? err.message : String(err) })
    }
  } else if (m.type === 'generate') {
    if (!generator) return post({ type: 'error', message: 'Model not loaded' })
    stopper.reset()
    const streamer = new TextStreamer(generator.tokenizer as never, {
      skip_prompt: true,
      skip_special_tokens: true,
      callback_function: (text: string) => post({ type: 'token', text }),
    })
    try {
      await generator(m.messages, { max_new_tokens: m.max, do_sample: false, repetition_penalty: 1.1, streamer, stopping_criteria: stopper })
      post({ type: 'done' })
    } catch (err) {
      post({ type: 'error', message: err instanceof Error ? err.message : String(err) })
    }
  } else if (m.type === 'interrupt') {
    stopper.interrupt()
  }
}
