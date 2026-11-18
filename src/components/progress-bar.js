/**
 * src/components/progress-bar.js
 * Visual progress bar component with percentage indicator.
 */

import { el, append } from "../utils/dom.js";

/**
 * Creates a progress bar element.
 * @param {number} initialPct (0-100)
 * @returns {{ element: HTMLElement, setProgress: (pct: number) => void }}
 */
export function createProgressBar(initialPct = 0) {
  const container = el("div", {
    cls: "progress-bar-container",
    attrs: {
      role: "progressbar",
      "aria-valuenow": String(initialPct),
      "aria-valuemin": "0",
      "aria-valuemax": "100",
      style: "display:flex;flex-direction:column;gap:4px;width:100%;",
    },
  });

  const header = el("div", {
    attrs: { style: "display:flex;justify-content:space-between;font-size:0.75rem;color:var(--muted);" },
  });
  const label = el("span", { text: "Progress" });
  const pctText = el("span", { text: `${Math.round(initialPct)}%`, dirAuto: false });
  append(header, label, pctText);

  const track = el("div", { cls: "progress-bar-track" });
  const fill = el("div", {
    cls: "progress-bar-fill",
    attrs: { style: `width:${Math.max(0, Math.min(100, initialPct))}%;` },
  });
  track.appendChild(fill);

  append(container, header, track);

  const setProgress = (pct) => {
    const clamped = Math.max(0, Math.min(100, pct));
    fill.style.width = `${clamped}%`;
    pctText.textContent = `${Math.round(clamped)}%`;
    container.setAttribute("aria-valuenow", String(Math.round(clamped)));
  };

  return { element: container, setProgress };
}
