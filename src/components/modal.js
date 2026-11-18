/**
 * src/components/modal.js
 * Modal dialog component with focus trap, Escape key support,
 * compact upload modal, outline editor modal, and study mode picker.
 */

import { el, append, empty } from "../utils/dom.js";
import { createOutlineEditor } from "./outline-editor.js";
import { processDocument } from "../document/pipeline.js";
import { setCourse } from "../app/state.js";
import { saveCourse } from "../storage/store.js";
import { navigate } from "../app/router.js";

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
 * @returns {{ overlay: HTMLElement, container: HTMLElement, close: () => void }}
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

  // Close helper
  let isClosed = false;
  const close = () => {
    if (isClosed) return;
    isClosed = true;
    document.removeEventListener("keydown", onKeyDown);
    overlay.remove();
    if (onClose) onClose();
  };

  // Header with title and prominent × close button
  const header = el("div", { cls: "modal-header" });
  const titleWrap = el("div", { attrs: { style: "flex:1;min-width:0;" } });
  const titleEl = el("h2", { cls: "modal-title", text: title, attrs: { id: "modal-title" } });
  titleWrap.appendChild(titleEl);
  if (subtitle) {
    const subEl = el("p", { cls: "modal-sub", text: subtitle });
    titleWrap.appendChild(subEl);
  }

  const closeBtn = el("button", {
    cls: "modal-close-btn",
    text: "✕",
    attrs: { type: "button", "aria-label": "Close dialog" },
  });
  closeBtn.addEventListener("click", () => close());

  append(header, titleWrap, closeBtn);
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
      'button:not(.modal-close-btn), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (firstFocusable) firstFocusable.focus();
  });

  return { overlay, container, close };
}

/**
 * Normalizes course structure for the outline editor.
 */
export function courseToOutline(course) {
  const sections = Array.isArray(course.sections) && course.sections.length > 0
    ? course.sections
    : (course.parts || []);

  let chapters = (course.chapters || []).map((ch) => ({
    id: ch.id,
    title: ch.title,
    sections: sections.filter((s) => s.chapterId === ch.id || ch.sectionIds?.includes(s.id)),
  }));

  if (chapters.length === 0 || chapters.every((c) => c.sections.length === 0)) {
    chapters = [{
      id: 1,
      title: (course.name || "Course").replace(/\.[^.]+$/, ""),
      sections: sections.map((s) => ({ ...s })),
    }];
  }

  return {
    name: course.name,
    chapters,
    method: course.method || "size",
  };
}

/**
 * Converts edited outline back to course format.
 */
export function outlineToCourse(outline, originalCourse) {
  const v2Chapters = [];
  const v2Sections = [];
  let secCounter = 1;

  (outline.chapters || []).forEach((ch, chIdx) => {
    const chId = ch.id || (chIdx + 1);
    const secIds = [];
    (ch.sections || []).forEach((sec) => {
      const sId = sec.id || secCounter++;
      secIds.push(sId);
      v2Sections.push({
        id: sId,
        chapterId: chId,
        title: sec.title || `Part ${sId}`,
        text: sec.text || "",
        charCount: (sec.text || "").length,
      });
    });
    v2Chapters.push({
      id: chId,
      title: ch.title || `Chapter ${chIdx + 1}`,
      level: 1,
      sectionIds: secIds,
    });
  });

  return {
    ...originalCourse,
    name: outline.name || originalCourse.name,
    chapters: v2Chapters,
    sections: v2Sections,
  };
}

/**
 * Opens the Outline Editor in a modal dialog.
 * Allows user to review, rename, split, and delete sections before starting study mode.
 */
export function renderOutlineModal(parent, course, { onProceed, onBack } = {}) {
  const outline = courseToOutline(course);
  let currentOutline = outline;

  const editor = createOutlineEditor(currentOutline, {
    onChange: (updated) => {
      currentOutline = updated;
    },
  });

  const backBtn = el("button", {
    cls: "btn btn-outline btn-sm",
    text: "← Back",
    attrs: { type: "button" },
  });

  const proceedBtn = el("button", {
    cls: "btn btn-primary btn-sm",
    text: "Start Studying →",
    attrs: { type: "button" },
  });

  const modal = createModal(parent, {
    title: "Course Outline",
    subtitle: `Review, rename, split, or delete sections for "${course.name}":`,
    body: editor,
    footerButtons: [backBtn, proceedBtn],
    onClose: () => {
      if (onBack) onBack();
    },
  });

  backBtn.addEventListener("click", () => {
    modal.close();
    if (onBack) onBack();
  });

  proceedBtn.addEventListener("click", () => {
    const finalCourse = outlineToCourse(currentOutline, course);
    saveCourse(finalCourse);
    setCourse(finalCourse);
    modal.close();
    if (onProceed) {
      onProceed(finalCourse);
    } else {
      renderModePopup(parent, {
        onTeacher: () => navigate("/teacher"),
        onPath: () => navigate("/path"),
      });
    }
  });

  return modal;
}

/**
 * Compact upload modal with progress, close/cancel buttons, and outline transition.
 */
export function renderUploadModal(parent, { onComplete, onCancel } = {}) {
  let uploadedCourse = null;
  let uploadedFile = null;

  const fileInputId = "upload-modal-input-" + Date.now();
  const fileInput = el("input", {
    cls: "sr-only",
    attrs: {
      type: "file",
      accept: ".pdf,.docx,.txt",
      "aria-label": "Upload course file",
      id: fileInputId,
    },
  });

  const zone = el("label", {
    cls: "dash-drop-zone",
    attrs: { for: fileInputId, tabindex: "0", "aria-label": "Upload a file — PDF, DOCX, or TXT" },
  });
  const zoneIcon = el("span", {
    cls: "dash-drop-icon",
    attrs: { "aria-hidden": "true" },
  });
  zoneIcon.innerHTML = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--accent);"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`;
  const zoneText = el("p", { cls: "dash-drop-text", text: "Click to browse or drag & drop" });
  const zoneHint = el("p", { cls: "dash-drop-hint", text: "Supported: PDF, DOCX, TXT" });
  append(zone, zoneIcon, zoneText, zoneHint);

  zone.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); zone.click(); }
  });
  zone.addEventListener("dragover", (e) => {
    e.preventDefault();
    zone.classList.add("dash-drop-zone--over");
  });
  zone.addEventListener("dragleave", () => zone.classList.remove("dash-drop-zone--over"));
  zone.addEventListener("drop", (e) => {
    e.preventDefault();
    zone.classList.remove("dash-drop-zone--over");
    const file = e.dataTransfer?.files?.[0];
    if (file) _handleUpload(file);
  });
  fileInput.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (file) _handleUpload(file);
    fileInput.value = "";
  });

  const chipArea = el("div", { cls: "dash-chip-area" });
  const statusEl = el("div", { cls: "dash-upload-status" });
  statusEl.style.display = "none";

  const nextBtn = el("button", {
    cls: "btn btn-primary btn-sm",
    text: "Review Outline →",
    attrs: { type: "button", disabled: "true" },
  });
  const cancelBtn = el("button", {
    cls: "btn btn-outline btn-sm",
    text: "Cancel",
    attrs: { type: "button" },
  });

  async function _handleUpload(file) {
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    if (!["pdf", "docx", "txt"].includes(ext)) {
      statusEl.style.display = "block";
      statusEl.textContent = `Unsupported format ".${ext}". Use PDF, DOCX, or TXT.`;
      statusEl.className = "dash-upload-status dash-upload-status--error";
      return;
    }

    uploadedFile = file;

    empty(chipArea);
    const chip = el("div", { cls: "dash-file-chip" });
    const chipName = el("span", { cls: "dash-chip-name", text: file.name });
    const chipProg = el("div", { cls: "dash-chip-prog-track" });
    const chipFill = el("div", { cls: "dash-chip-prog-fill" });
    chipProg.appendChild(chipFill);
    append(chip, chipName, chipProg);
    chipArea.appendChild(chip);

    statusEl.style.display = "block";
    statusEl.textContent = "Processing…";
    statusEl.className = "dash-upload-status";

    nextBtn.setAttribute("disabled", "true");

    let pct = 0;
    const fakeProgress = setInterval(() => {
      pct = Math.min(pct + 8, 85);
      chipFill.style.width = `${pct}%`;
    }, 200);

    try {
      const course = await processDocument(file, (msg) => {
        statusEl.textContent = msg;
      });
      clearInterval(fakeProgress);
      chipFill.style.width = "100%";
      statusEl.textContent = "Ready!";
      statusEl.className = "dash-upload-status dash-upload-status--ok";
      uploadedCourse = course;
      nextBtn.removeAttribute("disabled");
    } catch (err) {
      clearInterval(fakeProgress);
      statusEl.textContent = `Error: ${err.message}`;
      statusEl.className = "dash-upload-status dash-upload-status--error";
    }
  }

  const modal = createModal(parent, {
    title: "New course",
    subtitle: "Upload a course document to study",
    body: [zone, fileInput, chipArea, statusEl],
    footerButtons: [cancelBtn, nextBtn],
    onClose: () => {
      if (onCancel) onCancel();
    },
  });

  cancelBtn.addEventListener("click", () => {
    modal.close();
    if (onCancel) onCancel();
  });

  nextBtn.addEventListener("click", () => {
    if (!uploadedCourse) return;
    modal.close();
    renderOutlineModal(parent, uploadedCourse, {
      onProceed: (finalCourse) => {
        if (onComplete) {
          onComplete(finalCourse);
        } else {
          renderModePopup(parent, {
            onTeacher: () => navigate("/teacher"),
            onPath: () => navigate("/path"),
          });
        }
      },
    });
  });

  return modal;
}

/**
 * Render the Mode Selection Popup (Teacher vs Study partner)
 *
 * @param {HTMLElement} parent
 * @param {object} callbacks
 * @param {() => void} callbacks.onTeacher
 * @param {() => void} callbacks.onPath
 * @param {() => void} [callbacks.onCancel]
 */
export function renderModePopup(parent, { onTeacher, onPath, onCancel }) {
  const cardsWrap = el("div", { cls: "mode-cards" });

  // Card 1: Teacher
  const teacherCard = el("button", {
    cls: "mode-card",
    attrs: { type: "button", "aria-label": "Select Teacher mode" },
  });
  append(
    teacherCard,
    el("img", {
      cls: "mode-card-img",
      attrs: {
        src: "/assets/aistudio/teacher_58a6face.png",
        alt: "Teacher",
        style: "width:52px;height:52px;object-fit:contain;margin-bottom:8px;",
      },
    }),
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
    el("img", {
      cls: "mode-card-img",
      attrs: {
        src: "/assets/aistudio/student_2f90309c.png",
        alt: "Study partner",
        style: "width:52px;height:52px;object-fit:contain;margin-bottom:8px;",
      },
    }),
    el("h3", { cls: "mode-card-title", text: "Study partner" }),
    el("p", { cls: "mode-card-desc", text: "Turn your course into a step-by-step path with bite-sized sections, flashcards, and quizzes." })
  );

  append(cardsWrap, teacherCard, pathCard);

  const cancelBtn = el("button", {
    cls: "btn btn-outline btn-sm",
    text: "Cancel",
    attrs: { type: "button" },
  });

  const modal = createModal(parent, {
    title: "Choose Your Study Mode",
    subtitle: "Select how you would like to explore this course:",
    body: cardsWrap,
    footerButtons: [cancelBtn],
    onClose: () => {
      if (onCancel) onCancel();
    },
  });

  cancelBtn.addEventListener("click", () => {
    modal.close();
    if (onCancel) onCancel();
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
