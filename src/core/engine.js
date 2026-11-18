/**
 * src/core/engine.js
 * AI engine singleton with Web Worker execution and Priority Queue.
 *
 * Exports:
 *   startLoading()          – idempotent, call at boot
 *   getStatus()             – { state, progress, error }
 *   onStatus(cb)            – subscribe; returns unsubscribe fn
 *   whenReady()             – Promise that resolves when model is loaded
 *   generate(msgs, opts)    – priority streaming generation
 *   retryLoading()          – resets and restarts after failure
 *
 * Priority Queue:
 *   - opts.priority = "user" (default) or "background"
 *   - "user" requests immediately jump ahead of any queued "background" requests.
 *   - All calls are serialized through the Web Worker.
 */

import { CreateWebWorkerMLCEngine } from "@mlc-ai/web-llm";
import { MODEL_ID } from "../app/config.js";

// ── Internal State ────────────────────────────────────────────────────────────
let _engine      = null;
let _status      = { state: "idle", progress: 0, error: null };
let _listeners   = new Set();
let _loading     = false;

let _readyResolve = null;
let _readyReject  = null;
let _readyPromise = new Promise((res, rej) => {
  _readyResolve = res;
  _readyReject  = rej;
});

// Priority Queue: array of { messages, options, resolve, reject, priority }
const _queue = [];
let _isProcessing = false;

function _setStatus(state, progress = 0, error = null) {
  _status = { state, progress, error };
  for (const cb of _listeners) {
    try { cb({ ..._status }); } catch (e) { console.error("engine.onStatus:", e); }
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export function getStatus() {
  return { ..._status };
}

export function onStatus(cb) {
  _listeners.add(cb);
  try { cb({ ..._status }); } catch {}
  return () => _listeners.delete(cb);
}

export function whenReady() {
  if (_status.state === "ready")       return Promise.resolve();
  if (_status.state === "unsupported") return Promise.reject(new Error(_status.error));
  if (_status.state === "error")       return Promise.reject(new Error(_status.error));
  return _readyPromise;
}

export function startLoading() {
  if (_loading || _status.state === "ready") return;
  _loading = true;

  if (!navigator.gpu) {
    _setStatus("unsupported", 0, "WebGPU is not available. Please use desktop Chrome or Edge.");
    if (_readyReject) _readyReject(new Error("WebGPU not supported"));
    return;
  }

  // Request persistent storage so IndexedDB weights are retained
  try { navigator.storage?.persist?.(); } catch {}

  _setStatus("loading", 0);

  (async () => {
    try {
      const worker = new Worker(
        new URL("./worker.js", import.meta.url),
        { type: "module" }
      );

      _engine = await CreateWebWorkerMLCEngine(worker, MODEL_ID, {
        initProgressCallback: ({ progress }) => {
          _setStatus("loading", Math.round((progress || 0) * 100));
        },
      });

      _setStatus("ready", 100);
      if (_readyResolve) _readyResolve();
    } catch (err) {
      console.error("Engine load error:", err);
      _setStatus("error", 0, err.message || "Failed to load AI model");
      if (_readyReject) _readyReject(err);
      _loading = false;
    }
  })();
}

export function retryLoading() {
  if (_status.state !== "error") return;
  _loading = false;
  _readyPromise = new Promise((res, rej) => {
    _readyResolve = res;
    _readyReject  = rej;
  });
  _setStatus("idle", 0, null);
  startLoading();
}

/**
 * Generate response through priority queue.
 *
 * @param {Array<{role:string,content:string}>} messages
 * @param {object} [options]
 * @param {"user"|"background"} [options.priority="user"]
 * @param {(delta:string, full:string) => void} [options.onToken]
 * @returns {Promise<string>}
 */
export async function generate(messages, options = {}) {
  await whenReady();

  return new Promise((resolve, reject) => {
    const priority = options.priority || "user";
    const job = { messages, options, resolve, reject, priority };

    if (priority === "user") {
      // Find the last index of existing user jobs, or insert at front of background jobs
      let insertIdx = _queue.length;
      for (let i = 0; i < _queue.length; i++) {
        if (_queue[i].priority === "background") {
          insertIdx = i;
          break;
        }
      }
      _queue.splice(insertIdx, 0, job);
    } else {
      _queue.push(job);
    }

    _processQueue();
  });
}

async function _processQueue() {
  if (_isProcessing || _queue.length === 0) return;
  _isProcessing = true;

  const current = _queue.shift();

  try {
    const { onToken, priority, ...chatOptions } = current.options;

    const stream = await _engine.chat.completions.create({
      messages: current.messages,
      ...chatOptions,
      stream: true,
    });

    let full = "";
    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta?.content || "";
      if (delta) {
        full += delta;
        if (onToken) {
          try { onToken(delta, full); } catch {}
        }
      }
    }

    current.resolve(full.trim());
  } catch (err) {
    current.reject(err);
  } finally {
    _isProcessing = false;
    _processQueue();
  }
}

export { MODEL_ID };
