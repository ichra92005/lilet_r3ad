/**
 * src/screens/teacher.js
 * Tutor chat screen (#/teacher).
 * Full chat behavior: search, quick buttons, source label, streaming, history.
 * All model calls go through engine.generate().
 * "Message before model ready" case: queued and auto-answered when ready.
 */
import { navigate }  from "../app/router.js";
import { el, append, empty } from "../utils/dom.js";
import { loadCourse, clearCourse } from "../storage/store.js";
import { searchParts } from "../document/search.js";
import { buildTutorMessages, GENERATION_SETTINGS } from "../core/prompts.js";
import { generate, getStatus, whenReady, onStatus } from "../core/engine.js";
import { getCourse, setCourse } from "../app/state.js";

export function renderTeacher(container) {
  container.className = "screen";

  const course = getCourse() || loadCourse();
  if (!course) {
    navigate("/app");
    return;
  }

  // Flatten sections → parts array for backward compat
  const parts = _getSections(course);

  // ── Layout ─────────────────────────────────────────────────────────────
  const layout = el("div", { cls: "app-screen" });

  // Sidebar
  const sidebar = el("aside", { cls: "sidebar" });
  _buildSidebar(sidebar, course, parts);
  layout.appendChild(sidebar);

  // Chat panel
  const chatPanel = el("main", { cls: "chat-panel card" });
  const chatAbout = _buildChatAbout(parts);
  const msgs      = el("div", { cls: "chat-messages", attrs: { "aria-live": "polite", "aria-label": "Tutor chat" } });
  const quickRow  = _buildQuickButtons();
  const inputRow  = _buildInputRow();

  append(chatPanel, chatAbout, msgs, quickRow, inputRow);
  layout.appendChild(chatPanel);
  container.appendChild(layout);

  // ── State ───────────────────────────────────────────────────────────────
  let history    = [];
  let lastAnswer = "";
  let lastQ      = "";
  let generating = false;

  // Welcome message
  _addBubble(msgs, "assistant", `📖 Loaded "${course.name}". Ask me anything about it!`);

  // ── Helpers ─────────────────────────────────────────────────────────────
  function _addBubble(container, role, text, source) {
    const wrap   = el("div", { cls: `chat-bubble chat-bubble-${role}` });
    const textEl = el("div", { cls: "chat-text", text });
    wrap.appendChild(textEl);
    if (source) {
      const srcEl = el("div", { cls: "chat-source", text: source });
      wrap.appendChild(srcEl);
    }
    container.appendChild(wrap);
    container.scrollTop = container.scrollHeight;
    return { wrap, textEl };
  }

  function _setGenerating(val) {
    generating = val;
    inputRow.querySelector(".chat-input").disabled  = val;
    inputRow.querySelector(".send-btn").disabled    = val;
    chatAbout.querySelector(".select-target").disabled = val;
    for (const btn of quickRow.querySelectorAll(".btn-quick")) btn.disabled = val;
  }

  // ── Chat handler ────────────────────────────────────────────────────────
  async function handleChat(mode, questionText = "") {
    if (!parts.length) {
      _addBubble(msgs, "system", "No sections found. Please upload a document first.");
      return;
    }

    const q = questionText.trim();

    if ((mode === "simplify" || mode === "example" || mode === "eli10") && !lastAnswer && !lastQ && !q) {
      _addBubble(msgs, "system", "Please ask a question first.");
      return;
    }

    // Context selection
    const targetVal = chatAbout.querySelector(".select-target").value;
    let contextParts;
    if (targetVal === "all") {
      contextParts = searchParts(q || lastQ, parts, 2);
    } else {
      const pid = Number(targetVal);
      const chosen = parts.find((p) => p.id === pid);
      contextParts = chosen ? [chosen] : searchParts(q, parts, 2);
    }
    if (!contextParts.length) contextParts = parts.slice(0, 2);

    const sourceLabel = contextParts.length === 1
      ? `Source: Part ${contextParts[0].id}`
      : `Source: Parts ${contextParts.map((p) => p.id).join(", ")}`;

    // User bubble text
    const userLabel = {
      simplify:  "Simplify the explanation",
      example:   "Give an example based on the document",
      summarize: `Summarize (${targetVal === "all" ? "Whole document" : `Part ${targetVal}`})`,
      eli10:     "Explain like I'm 10",
      ask:       q,
    }[mode] ?? q;

    _addBubble(msgs, "user", userLabel);

    // Build messages
    const messages = buildTutorMessages({
      mode, question: q || (mode === "ask" ? "" : lastQ),
      contextParts, history, lastAnswer,
    });

    // Check if engine is ready
    const status = getStatus();
    let asstBubble;

    if (status.state !== "ready") {
      const pct = status.state === "loading" ? ` (${status.progress}%)` : "";
      asstBubble = _addBubble(msgs, "assistant",
        `The AI is still loading${pct}. I will answer as soon as it is ready.`, sourceLabel);
      // Queue: answer when engine becomes ready
      whenReady().then(() => _doGenerate(messages, asstBubble, q, userLabel)).catch(() => {
        asstBubble.textEl.textContent = "AI failed to load. Please refresh the page.";
      });
      return;
    }

    asstBubble = _addBubble(msgs, "assistant", "…", sourceLabel);
    await _doGenerate(messages, asstBubble, q, userLabel);
  }

  async function _doGenerate(messages, asstBubble, q, userLabel) {
    _setGenerating(true);
    asstBubble.textEl.textContent = "";

    try {
      const full = await generate(messages, {
        ...GENERATION_SETTINGS,
        onToken: (_, fullSoFar) => {
          asstBubble.textEl.textContent = fullSoFar;
          msgs.scrollTop = msgs.scrollHeight;
        },
      });

      const answer = full || "This is not in your document.";
      asstBubble.textEl.textContent = answer;
      lastAnswer = answer;
      if (q) lastQ = q;
      history.push({ role: "user", content: userLabel });
      history.push({ role: "assistant", content: answer });
    } catch (err) {
      console.error("generate error:", err);
      asstBubble.textEl.textContent = `Error: ${err.message}`;
    } finally {
      _setGenerating(false);
      inputRow.querySelector(".chat-input").focus();
    }
  }

  // ── Input events ────────────────────────────────────────────────────────
  const chatInput = inputRow.querySelector(".chat-input");
  const sendBtn   = inputRow.querySelector(".send-btn");

  sendBtn.addEventListener("click", () => {
    const v = chatInput.value.trim();
    if (!v || generating) return;
    chatInput.value = "";
    handleChat("ask", v);
  });

  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendBtn.click(); }
  });

  for (const btn of quickRow.querySelectorAll(".btn-quick")) {
    btn.addEventListener("click", () => { if (!generating) handleChat(btn.dataset.mode); });
  }
}

// ── Private helpers ──────────────────────────────────────────────────────────

function _getSections(course) {
  if (Array.isArray(course.sections) && course.sections.length > 0) {
    return course.sections.map((s) => ({ id: s.id, title: s.title, text: s.text }));
  }
  if (Array.isArray(course.parts)) return course.parts;
  return [];
}

function _buildSidebar(sidebar, course, parts) {
  // Doc card
  const docCard = el("div", { cls: "card card-sm section-doc" });

  const hdr = el("div", { cls: "card-header" });
  const title = el("h2", { text: "Document", dirAuto: false, cls: "" });
  title.style.cssText = "font-size:1rem;font-weight:700;";

  const clearBtn = el("button", { cls: "btn btn-outline btn-sm", text: "New course", attrs: { type: "button" } });
  clearBtn.addEventListener("click", () => {
    clearCourse();
    setCourse(null);
    navigate("/app");
  });
  append(hdr, title, clearBtn);

  const name = el("p", { cls: "doc-name", text: course.name });

  const partsHdr = el("div", { cls: "parts-header" });
  const partsTitle = el("h3", { text: "Sections" });
  partsTitle.style.cssText = "font-size:0.88rem;font-weight:600;";
  const partsCount = el("span", { cls: "badge", text: `${parts.length} parts`, dirAuto: false });
  append(partsHdr, partsTitle, partsCount);

  const list = el("div", { cls: "parts-list" });
  for (const part of parts) {
    const item = _makePartItem(part);
    list.appendChild(item);
  }

  append(docCard, hdr, name, partsHdr, list);
  sidebar.appendChild(docCard);

  // Study partner button
  const switchBtn = el("button", {
    cls: "btn btn-outline btn-sm",
    text: "Study partner →",
    attrs: { type: "button", style: "width:100%;" },
  });
  switchBtn.addEventListener("click", () => navigate("/path"));
  sidebar.appendChild(switchBtn);
}

function _makePartItem(part) {
  const item = el("div", { cls: "part-item", dataset: { partId: String(part.id) } });

  const hdr  = el("div", { cls: "part-item-header" });
  const idBadge = el("span", { cls: "part-item-id", text: `Part ${part.id}`, dirAuto: false });
  const titleEl = el("span", { cls: "part-item-title", text: part.title || `Part ${part.id}` });
  append(hdr, idBadge, titleEl);

  // Preview: first sentence only
  const fullText = (part.text || "").trim();
  const preview  = _firstSentence(fullText);
  const hasMore  = fullText.length > preview.length + 1;

  const body = el("div", { cls: "part-item-body", text: preview });
  append(item, hdr, body);

  if (hasMore) {
    let expanded = false;
    const toggleBtn = el("button", { cls: "part-toggle-btn", attrs: { type: "button", "aria-expanded": "false" } });
    const icon  = el("span", { text: "▼", dirAuto: false });
    const label = el("span", { text: "More", dirAuto: false });
    append(toggleBtn, icon, label);
    toggleBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      expanded = !expanded;
      body.textContent = expanded ? fullText : preview;
      icon.textContent  = expanded ? "▲" : "▼";
      label.textContent = expanded ? "Less" : "More";
      toggleBtn.setAttribute("aria-expanded", String(expanded));
    });
    item.appendChild(toggleBtn);
  }

  return item;
}

function _firstSentence(text) {
  const m = text.match(/^([^.!?؟]+[.!?؟])/);
  if (m) return m[1].trim();
  const line = text.split("\n")[0].trim();
  return line.length > 130 ? line.slice(0, 127).replace(/\s+\S*$/, "") + "…" : line;
}

function _buildChatAbout(parts) {
  const row = el("div", { cls: "chat-about-row" });
  const lbl = el("label", { cls: "chat-about-label", text: "Chat about:", attrs: { for: "chat-target" } });
  const sel = el("select", { cls: "select-target", attrs: { id: "chat-target", "aria-label": "Chat scope" } });

  const all = el("option", { text: "Whole document", attrs: { value: "all" } });
  sel.appendChild(all);
  for (const p of parts) {
    const opt = el("option", { text: `Part ${p.id}: ${p.title || ""}`, attrs: { value: String(p.id) } });
    sel.appendChild(opt);
  }
  append(row, lbl, sel);
  return row;
}

function _buildQuickButtons() {
  const row = el("div", { cls: "quick-actions" });
  for (const [mode, label] of [
    ["simplify", "Simplify"],
    ["example",  "Give an example"],
    ["summarize","Summarize this part"],
    ["eli10",    "Explain like I'm 10"],
  ]) {
    const btn = el("button", { cls: "btn-quick", text: label, dirAuto: false, attrs: { type: "button" }, dataset: { mode } });
    row.appendChild(btn);
  }
  return row;
}

function _buildInputRow() {
  const row = el("div", { cls: "chat-input-row" });
  const inp = el("input", {
    cls: "chat-input",
    attrs: {
      type: "text",
      placeholder: "Ask a question about your document…",
      autocomplete: "off",
      "aria-label": "Chat input",
    },
  });
  inp.setAttribute("dir", "auto");
  const btn = el("button", { cls: "btn btn-primary send-btn", text: "Send", dirAuto: false, attrs: { type: "button" } });
  append(row, inp, btn);
  return row;
}
