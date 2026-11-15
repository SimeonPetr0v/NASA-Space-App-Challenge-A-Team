/*
  TOT language models (WebLLM prebuilt MLC builds, run fully on the device
  with WebGPU). The first one is the default; any other WebLLM model id can
  be added here. downloadGB is the one-time download, cached by the browser.
*/

/*
  Each model has two builds: f16 (smaller, needs the WebGPU 'shader-f16'
  feature) and f32 (works on graphics chips without it, as on many Android
  phones, but needs about 20 % more memory). The app picks the build the
  device supports. Phones default to the smallest model.
*/
/** grounded: too small to write numbers safely; Khonsu writes the measured values and what to do, the model only adds a short explanation */
export type TotModel = { id: string; f32Id: string; name: string; downloadGB: number; note: string; grounded?: boolean }

export const TOT_MODELS: TotModel[] = [
  { id: 'Llama-3.2-1B-Instruct-q4f16_1-MLC', f32Id: 'Llama-3.2-1B-Instruct-q4f32_1-MLC', name: 'Llama 3.2 1B', downloadGB: 0.9, note: 'Default on computers and tablets.' },
  { id: 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC', f32Id: 'Qwen2.5-0.5B-Instruct-q4f32_1-MLC', name: 'Qwen 2.5 0.5B', downloadGB: 0.9, note: 'Smallest. Default on phones. Khonsu writes the numbers; the model explains.', grounded: true },
  { id: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC', f32Id: 'Qwen2.5-1.5B-Instruct-q4f32_1-MLC', name: 'Qwen 2.5 1.5B', downloadGB: 1.6, note: 'Better answers, needs more graphics memory.' },
]
export const TOT_PHONE_DEFAULT = 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC'

export const TOT_MODEL_KEY = 'ahm:tot-model'
export const TOT_CHAT_KEY = 'ahm:tot-chat'
export const TOT_MAX_MESSAGES = 40
