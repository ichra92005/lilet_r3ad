/**
 * src/components/modal.js
 * Modal dialog component with focus trap and Escape key support.
 */

import { el, append } from "../utils/dom.js";

/**
 * Creates and renders a modal container.
 *
 * @param {HTMLElement} parent
 * @param {object} options
 * @param {string} options.title
 * @param {string} [options.subtitle]
 * @param {HTMLElement|HTMLElement[]} options.body
 * @param {HTMLElement[]} [options.footerButtons]
 * @param {() => void} [options.onClose]
 * @returns {{ overlay: HTMLElement, close: () => void }}
 */
export function createModal(parent, { title, subtitle, body, footerButtons = [], onClose }) {
  const overlay = el("div", {
    cls: "modal-overlay",
    attrs: {
      role: "dialog",
      "aria-modal": "true",
      "aria-labelledby": "modal-title",
    },
  });

  const container = el("div", { cls: "modal-container card" });

  // Header
  const header = el("div", { cls: "modal-header" });
  const titleEl = el("h2", { cls: "modal-title", text: title, attrs: { id: "modal-title" } });
  header.appendChild(titleEl);
  if (subtitle) {
    const subEl = el("p", { cls: "modal-sub", text: subtitle });
    header.appendChild(subEl);
  }
  container.appendChild(header);

  // Body
  const bodyEl = el("div", { cls: "modal-body" });
  if (Array.isArray(body)) {
    append(bodyEl, ...body);
  } else if (body) {
    bodyEl.appendChild(body);
  }
  container.appendChild(bodyEl);

  // Footer
  if (footerButtons.length > 0) {
    const footer = el("div", { cls: "modal-footer" });
    append(footer, ...footerButtons);
    container.appendChild(footer);
  }

  overlay.appendChild(container);

  // Close helper
  let isClosed = false;
  const close = () => {
    if (isClosed) return;
    isClosed = true;
    document.removeEventListener("keydown", onKeyDown);
    overlay.remove();
    if (onClose) onClose();
  };

  // Keyboard navigation & Focus trap
  const onKeyDown = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
      return;
    }
    if (e.key === "Tab") {
      const focusable = container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  document.addEventListener("keydown", onKeyDown);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      close();
    }
  });

  parent.appendChild(overlay);

  // Focus the first actionable element
  requestAnimationFrame(() => {
    const firstFocusable = container.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (firstFocusable) firstFocusable.focus();
  });

  return { overlay, close };
}

/**
 * Render the Mode Selection Popup (Teacher vs Study partner)
 *
 * @param {HTMLElement} parent
 * @param {object} callbacks
 * @param {() => void} callbacks.onTeacher
 * @param {() => void} callbacks.onPath
 */
export function renderModePopup(parent, { onTeacher, onPath }) {
  const cardsWrap = el("div", { cls: "mode-cards" });

  // Card 1: Teacher
  const teacherCard = el("button", {
    cls: "mode-card",
    attrs: { type: "button", "aria-label": "Select Teacher mode" },
  });
  append(
    teacherCard,
    el("span", { cls: "mode-card-icon", text: "👨‍🏫", dirAuto: false }),
    el("h3", { cls: "mode-card-title", text: "Teacher" }),
    el("p", { cls: "mode-card-desc", text: "Ask me anything about your course. Search, simplify, examples, and answers strictly from your document." })
  );

  // Card 2: Study Partner
  const pathCard = el("button", {
    cls: "mode-card",
    attrs: { type: "button", "aria-label": "Select Study Partner mode" },
  });
  append(
    pathCard,
    el("span", { cls: "mode-card-icon", text: "🚀", dirAuto: false }),
    el("h3", { cls: "mode-card-title", text: "Study partner" }),
    el("p", { cls: "mode-card-desc", text: "Turn your course into a step-by-step path with bite-sized sections, flashcards, and quizzes." })
  );

  append(cardsWrap, teacherCard, pathCard);

  const modal = createModal(parent, {
    title: "Choose Your Study Mode",
    subtitle: "Select how you would like to explore this course:",
    body: cardsWrap,
  });

  teacherCard.addEventListener("click", () => {
    modal.close();
    onTeacher();
  });

  pathCard.addEventListener("click", () => {
    modal.close();
    onPath();
  });
}
