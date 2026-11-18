/**
 * src/components/status-chip.js
 * Status chip displaying the AI engine loading progress & status.
 */

import { el, append, empty } from "../utils/dom.js";
import { onStatus, retryLoading } from "../core/engine.js";

/**
 * Creates and binds an AI Status Chip element.
 * @returns {HTMLElement}
 */
export function createStatusChip() {
  const chip = el("div", {
    cls: "status-chip",
    attrs: {
      "aria-live": "polite",
      "aria-label": "AI Engine Status",
      "data-state": "idle",
    },
  });

  const dot = el("span", { cls: "status-chip-dot" });
  const textEl = el("span", { cls: "status-chip-text", text: "Initializing AI..." });
  append(chip, dot, textEl);

  let retryBtn = null;

  onStatus((status) => {
    chip.setAttribute("data-state", status.state);
    if (retryBtn) {
      retryBtn.remove();
      retryBtn = null;
    }

    switch (status.state) {
      case "loading":
        textEl.textContent = `AI tutor loading ${status.progress}%`;
        break;
      case "ready":
        textEl.textContent = "AI tutor ready";
        break;
      case "unsupported":
        textEl.textContent = "AI not supported on this browser (use desktop Chrome or Edge)";
        break;
      case "error":
        textEl.textContent = `AI error: ${status.error || "Failed to load"}`;
        retryBtn = el("button", {
          cls: "btn btn-sm btn-outline",
          text: "Retry",
          attrs: { type: "button", style: "margin-left:6px;padding:2px 6px;" },
        });
        retryBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          retryLoading();
        });
        chip.appendChild(retryBtn);
        break;
      case "idle":
      default:
        textEl.textContent = "AI tutor standby";
        break;
    }
  });

  return chip;
}
