import { WebWorkerMLCEngineHandler } from "@mlc-ai/web-llm";

// Instantiate handler in the worker thread
const handler = new WebWorkerMLCEngineHandler();

self.onmessage = (msg) => {
  handler.onmessage(msg);
};
