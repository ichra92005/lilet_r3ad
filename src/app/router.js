/**
 * src/app/router.js
 * Minimal hash router.  No dependencies.
 *
 * Usage:
 *   onRoute((route) => { ... });  // register listener
 *   navigate("/teacher");         // change route + fire listeners
 *   getCurrentRoute();            // read current route
 *   initRouter();                 // call once at boot to fire current hash
 */

let _currentRoute = "";
let _listeners = [];

/** Parse location.hash → "/teacher", "/" etc. */
function _parseHash() {
  const h = location.hash.replace(/^#/, "") || "/";
  return h.startsWith("/") ? h : "/" + h;
}

function _fire(route) {
  _currentRoute = route;
  for (const cb of _listeners) {
    try { cb(route); } catch (e) { console.error("Router:", e); }
  }
}

/**
 * Navigate to a route.
 * Re-fires listeners even if the hash is unchanged (useful for forced re-render).
 */
export function navigate(route) {
  const target = route.startsWith("/") ? route : "/" + route;
  if (location.hash === "#" + target) {
    _fire(target);           // same hash → still re-render
  } else {
    location.hash = "#" + target; // hashchange → fires _fire via listener
  }
}

/** Register a route-change callback. Returns an unsubscribe function. */
export function onRoute(cb) {
  _listeners.push(cb);
  return () => { _listeners = _listeners.filter((l) => l !== cb); };
}

/** Get the current route string (e.g. "/teacher"). */
export function getCurrentRoute() {
  return _currentRoute || _parseHash();
}

/** Fire listeners for the current hash.  Call once at boot. */
export function initRouter() {
  _fire(_parseHash());
}

window.addEventListener("hashchange", () => _fire(_parseHash()));
