/**
 * src/screens/app.js
 * Main app screen (#/app).
 * Shows upload flow, "Continue with…" if a course is saved, and the mode popup.
 */
import { navigate } from "../app/router.js";
import { el, append, empty } from "../utils/dom.js";
import { loadCourse, saveCourse, clearCourse } from "../storage/store.js";
import { processDocument } from "../document/pipeline.js";
import { setCourse } from "../app/state.js";
import { renderModePopup, renderOutlineModal } from "../components/modal.js";

export function renderApp(container) {
  container.className = "screen";
  container.style.cssText = "display:flex;flex-direction:column;min-height:calc(100dvh - 56px);";

  // ── Chat-style layout ──────────────────────────────────────────────────
  const chatWrap = el("div", { cls: "chat-panel card", attrs: { style: "margin:16px;flex:1;" } });
  const msgs     = el("div", { cls: "chat-messages", attrs: { "aria-live": "polite", "aria-label": "Upload chat" } });
  chatWrap.appendChild(msgs);
  container.appendChild(chatWrap);

  function addBubble(role, text) {
    const b = el("div", { cls: `chat-bubble chat-bubble-${role}`, text });
    msgs.appendChild(b);
    msgs.scrollTop = msgs.scrollHeight;
    return b;
  }

  const saved = loadCourse();

  if (saved) {
    // ── Continue or new course ───────────────────────────────────────────
    addBubble("assistant", `Welcome back! You have a saved course: "${saved.name}".`);

    const row = el("div", { cls: "quick-actions" });

    const contBtn = el("button", {
      cls: "btn btn-primary btn-sm",
      text: `Continue with "${saved.name}"`,
      attrs: { type: "button" },
    });
    contBtn.addEventListener("click", () => {
      setCourse(saved);
      _showModePopup(container, saved);
    });

    const newBtn = el("button", {
      cls: "btn btn-outline btn-sm",
      text: "New course",
      attrs: { type: "button" },
    });
    newBtn.addEventListener("click", () => {
      clearCourse();
      setCourse(null);
      empty(msgs);
      row.remove();
      _promptUpload(msgs, container);
    });

    append(row, contBtn, newBtn);
    chatWrap.appendChild(row);
  } else {
    _promptUpload(msgs, container);
  }
}

function _promptUpload(msgs, container) {
  function addBubble(role, text) {
    const b = el("div", { cls: `chat-bubble chat-bubble-${role}`, text });
    msgs.appendChild(b);
    msgs.scrollTop = msgs.scrollHeight;
    return b;
  }

  addBubble("assistant", "Hello! Upload your course (PDF, DOCX, or TXT) and I'll help you study it.");

  // ── Drop zone / file picker ────────────────────────────────────────────
  const zone = el("div", { cls: "drop-zone", text: "Drag & drop your file here, or click to browse" });
  const fileInput = el("input", {
    cls: "sr-only",
    attrs: {
      type: "file",
      accept: ".pdf,.docx,.txt",
      "aria-label": "Upload course file",
      id: "file-upload",
    },
  });

  zone.addEventListener("click", () => fileInput.click());
  zone.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") fileInput.click(); });
  zone.setAttribute("tabindex", "0");
  zone.setAttribute("role", "button");
  zone.setAttribute("aria-label", "Upload course file");

  // Drag-and-drop
  zone.addEventListener("dragover", (e) => { e.preventDefault(); zone.classList.add("drag-over"); });
  zone.addEventListener("dragleave", () => zone.classList.remove("drag-over"));
  zone.addEventListener("drop", (e) => {
    e.preventDefault();
    zone.classList.remove("drag-over");
    const file = e.dataTransfer?.files?.[0];
    if (file) _handleFile(file, msgs, zone, fileInput, container);
  });

  fileInput.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (file) _handleFile(file, msgs, zone, fileInput, container);
    fileInput.value = "";
  });

  msgs.appendChild(zone);
  msgs.appendChild(fileInput);
}

async function _handleFile(file, msgs, zone, fileInput, container) {
  // Validate extension
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  if (!["pdf", "docx", "txt"].includes(ext)) {
    const b = el("div", { cls: "chat-bubble chat-bubble-system", text: `Unsupported file type ".${ext}". Please upload a PDF, DOCX, or TXT.` });
    msgs.appendChild(b);
    return;
  }

  zone.style.display    = "none";
  fileInput.style.display = "none";

  function status(text) {
    const b = el("div", { cls: "chat-bubble chat-bubble-system", text });
    msgs.appendChild(b);
    msgs.scrollTop = msgs.scrollHeight;
    return b;
  }

  const processingBubble = status("Processing your file…");

  try {
    const course = await processDocument(file, (msg) => {
      processingBubble.textContent = msg;
    });

    saveCourse(course);
    setCourse(course);

    const n = course.sections?.length ?? course.parts?.length ?? 0;
    status(`Found ${n} section${n === 1 ? "" : "s"} in "${file.name}". Review sections outline:`);

    renderOutlineModal(document.body, course, {
      onProceed: (finalCourse) => {
        saveCourse(finalCourse);
        setCourse(finalCourse);
        _showModePopup(container, finalCourse);
      },
    });
  } catch (err) {
    console.error("processDocument error:", err);
    status(`Error: ${err.message}`);
    // Re-show upload zone
    zone.style.display    = "";
    fileInput.style.display = "";
  }
}

function _showModePopup(container, course) {
  renderModePopup(document.body, {
    onTeacher: () => navigate("/teacher"),
    onPath:    () => navigate("/path"),
  });
}
