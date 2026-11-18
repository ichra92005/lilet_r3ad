/**
 * src/core/worker.js
 * WebLLM Web Worker handler.
 * This file runs inside a dedicated Worker thread.
 * The main thread creates it via:
 *   new Worker(new URL("./core/worker.js", import.meta.url), { type: "module" })
 */
import { WebWorkerMLCEngineHandler } from "@mlc-ai/web-llm";

const handler = new WebWorkerMLCEngineHandler();
self.onmessage = (msg) => handler.onmessage(msg);
