/**
 * src/app/state.js
 * Tiny observable store for cross-screen shared state.
 * Screens read state via getters and subscribe to changes via onChange().
 * Never import this into core/* or document/* (would create circular deps).
 */

const _state = {
  /** @type {object|null} The loaded course (new schema) */
  course: null,

  /** @type {object|null} Current learning progress */
  progress: null,

  /** @type {{ state: string, progress: number, error: string|null }} */
  engineStatus: { state: "idle", progress: 0, error: null },

  /** @type {string} Current active screen route */
  route: "/",
};

const _listeners = new Set();

/** Subscribe to any state change. Returns unsubscribe fn. */
export function onChange(cb) {
  _listeners.add(cb);
  return () => _listeners.delete(cb);
}

function _notify(key) {
  for (const cb of _listeners) {
    try { cb(key, _state[key]); } catch (e) { console.error("state.onChange:", e); }
  }
}

export function getCourse()       { return _state.course; }
export function getProgress()     { return _state.progress; }
export function getEngineStatus() { return { ..._state.engineStatus }; }
export function getRoute()        { return _state.route; }

export function setCourse(course) {
  _state.course = course;
  _notify("course");
}

export function setProgress(progress) {
  _state.progress = progress;
  _notify("progress");
}

export function setEngineStatus(status) {
  _state.engineStatus = { ..._state.engineStatus, ...status };
  _notify("engineStatus");
}

export function setRoute(route) {
  _state.route = route;
  _notify("route");
}
