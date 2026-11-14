/*
  TOT language models (WebLLM prebuilt MLC builds, run fully on the device
  with WebGPU). The first one is the default; any other WebLLM model id can
  be added here. downloadGB is the one-time download, cached by the browser.
*/

export type TotModel = { id: string; name: string; downloadGB: number; note: string }

export const TOT_MODELS: TotModel[] = [
  { id: 'Llama-3.2-1B-Instruct-q4f16_1-MLC', name: 'Llama 3.2 1B', downloadGB: 0.9, note: 'Default. Good answers on most laptops and tablets.' },
  { id: 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC', name: 'Qwen 2.5 0.5B', downloadGB: 0.9, note: 'Smallest. For phones and older devices.' },
  { id: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC', name: 'Qwen 2.5 1.5B', downloadGB: 1.6, note: 'Better answers, needs more graphics memory.' },
]

export const TOT_MODEL_KEY = 'ahm:tot-model'
export const TOT_CHAT_KEY = 'ahm:tot-chat'
export const TOT_MAX_MESSAGES = 40
