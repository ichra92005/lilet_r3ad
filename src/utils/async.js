/**
 * src/utils/async.js
 * Async utilities: lock, timeout.
 */

/**
 * Create an async lock (mutex).
 * Usage:
 *   const lock = createLock();
 *   const release = await lock.acquire();
 *   try { ... } finally { release(); }
 */
export function createLock() {
  let tail = Promise.resolve();
  return {
    acquire() {
      let release;
      const next = tail.then(() => new Promise((r) => (release = r)));
      tail = next;
      return next.then(() => release);
    },
  };
}

/**
 * Wraps a promise with a timeout.
 * @param {Promise<T>} promise
 * @param {number} ms
 * @param {string} [label]
 * @returns {Promise<T>}
 */
export function withTimeout(promise, ms, label = "Operation") {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ]);
}
