/**
 * src/components/chat.js
 * Reusable chat components: bubble creation and message list container.
 */

import { el, append } from "../utils/dom.js";

/**
 * Creates a message list container with accessibility attributes.
 * @param {string} label
 * @returns {HTMLElement}
 */
export function createMessageList(label = "Chat messages") {
  return el("div", {
    cls: "chat-messages",
    attrs: {
      "aria-live": "polite",
      "aria-label": label,
    },
  });
}

/**
 * Appends a chat bubble to a container.
 *
 * @param {HTMLElement} container
 * @param {"user"|"assistant"|"system"} role
 * @param {string} text
 * @param {string} [source=""]
 * @returns {{ bubbleEl: HTMLElement, textEl: HTMLElement, sourceEl: HTMLElement|null }}
 */
export function appendBubble(container, role, text = "", source = "") {
  const bubbleEl = el("div", { cls: `chat-bubble chat-bubble-${role}` });
  const textEl = el("div", { cls: "chat-text", text });
  bubbleEl.appendChild(textEl);

  let sourceEl = null;
  if (source) {
    sourceEl = el("div", { cls: "chat-source", text: source });
    bubbleEl.appendChild(sourceEl);
  }

  container.appendChild(bubbleEl);
  container.scrollTop = container.scrollHeight;

  return { bubbleEl, textEl, sourceEl };
}
