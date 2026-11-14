import { WebWorkerMLCEngineHandler } from '@mlc-ai/web-llm'

/* Runs the language model off the main thread so the app stays responsive */
const handler = new WebWorkerMLCEngineHandler()
self.onmessage = (msg: MessageEvent) => handler.onmessage(msg)
