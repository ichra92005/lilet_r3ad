/**
 * src/utils/dom.js
 * Safe DOM helpers — all text goes through textContent, never innerHTML.
 */

/**
 * Create an element with optional className, textContent, dir, and attributes.
 * @param {string} tag
 * @param {object} [opts]
 * @param {string}  [opts.cls]      – className
 * @param {string}  [opts.text]     – textContent
 * @param {boolean} [opts.dirAuto]  – set dir="auto" (default true for text)
 * @param {object}  [opts.attrs]    – additional attributes {name: value}
 * @param {object}  [opts.dataset]  – dataset entries {key: value}
 * @returns {HTMLElement}
 */
export function el(tag, opts = {}) {
  const node = document.createElement(tag);
  if (opts.cls)     node.className   = opts.cls;
  if (opts.text !== undefined) {
    node.textContent = opts.text;
    // Automatically add dir="auto" for text-bearing elements unless opted out
    if (opts.dirAuto !== false) node.setAttribute("dir", "auto");
  }
  if (opts.attrs) {
    for (const [k, v] of Object.entries(opts.attrs)) {
      node.setAttribute(k, v);
    }
  }
  if (opts.dataset) {
    for (const [k, v] of Object.entries(opts.dataset)) {
      node.dataset[k] = v;
    }
  }
  return node;
}

/** Append multiple children to a parent. */
export function append(parent, ...children) {
  for (const child of children) {
    if (child) parent.appendChild(child);
  }
  return parent;
}

/** Remove all children from a node. */
export function empty(node) {
  node.textContent = "";
  return node;
}

/**
 * Show a user-friendly error message inside a container.
 * @param {HTMLElement} container
 * @param {string} message
 */
export function showError(container, message) {
  const div = el("div", { cls: "error-message", text: message });
  container.appendChild(div);
}
