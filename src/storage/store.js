/**
 * src/storage/store.js
 * Versioned localStorage wrapper with:
 *  - Quota-safe writes (catches QuotaExceededError, shows visible message)
 *  - Migration from old schema (v1: { name, savedAt, parts }) → v2 schema
 *  - Validation guard: corrupted JSON returns null silently
 *
 * Schema v2 Course:
 * {
 *   schemaVersion: 2,
 *   id: string,          (Date.now() as string)
 *   name: string,
 *   createdAt: number,
 *   method: string,
 *   chapters: [{ id, title, level, sectionIds: number[] }],
 *   sections: [{ id, chapterId, title, text, charCount }]
 * }
 */

import { STORAGE_KEY_COURSE, STORAGE_KEY_PROGRESS, SCHEMA_VERSION } from "../app/config.js";

// ── helpers ───────────────────────────────────────────────────────────────────

function _get(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function _set(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    if (err.name === "QuotaExceededError" || err.code === 22) {
      // Show visible error — the app never crashes silently on quota
      _showQuotaError();
    } else {
      console.error("store: write failed", err);
    }
    return false;
  }
}

function _showQuotaError() {
  // Insert a dismissible banner at the top of <body>
  if (document.getElementById("quota-error-banner")) return;
  const banner = document.createElement("div");
  banner.id = "quota-error-banner";
  banner.setAttribute("role", "alert");
  banner.style.cssText =
    "position:fixed;top:0;left:0;right:0;z-index:9999;background:#ef4444;" +
    "color:#fff;padding:10px 16px;font-size:0.9rem;text-align:center;";
  banner.textContent =
    "⚠️ Browser storage is full. Your progress could not be saved. " +
    "Please clear some space or use a different browser.";
  const closeBtn = document.createElement("button");
  closeBtn.textContent = "✕";
  closeBtn.style.cssText = "margin-left:12px;background:none;border:none;color:#fff;cursor:pointer;font-size:1rem;";
  closeBtn.setAttribute("aria-label", "Dismiss");
  closeBtn.onclick = () => banner.remove();
  banner.appendChild(closeBtn);
  document.body.prepend(banner);
}

// ── migration ─────────────────────────────────────────────────────────────────

/**
 * Migrate a v1 course (name, savedAt, parts) → v2 schema.
 */
function _migrateV1(old) {
  if (!old || !Array.isArray(old.parts)) return null;
  const sections = old.parts.map((p) => ({
    id: p.id,
    chapterId: 1,
    title: p.title || `Part ${p.id}`,
    text:  p.text  || "",
    charCount: (p.text || "").length,
  }));
  const chapter = {
    id: 1,
    title: (old.name || "Document").replace(/\.[^.]+$/, ""),
    level: 1,
    sectionIds: sections.map((s) => s.id),
  };
  return {
    schemaVersion: SCHEMA_VERSION,
    id: String(old.savedAt || Date.now()),
    name: old.name || "Untitled",
    createdAt: old.savedAt || Date.now(),
    method: old.method || "size",
    chapters: [chapter],
    sections,
  };
}

// ── Course ────────────────────────────────────────────────────────────────────

/**
 * Load the saved course.  Migrates v1 data transparently.
 * Returns null if nothing is saved or data is corrupt.
 * @returns {object|null}
 */
export function loadCourse() {
  const raw = _get(STORAGE_KEY_COURSE);
  if (!raw) return null;

  // Migrate v1
  if (!raw.schemaVersion || raw.schemaVersion < 2) {
    const migrated = _migrateV1(raw);
    if (migrated) {
      _set(STORAGE_KEY_COURSE, migrated); // persist migrated form
      return migrated;
    }
    return null;
  }

  // Validate basic shape
  if (!Array.isArray(raw.sections) || !Array.isArray(raw.chapters)) return null;
  return raw;
}

/**
 * Save a course.  Accepts both the new schema and the pipeline output shape.
 * Normalises to v2 before writing.
 *
 * @param {object} course
 * @returns {boolean} true if saved successfully
 */
export function saveCourse(course) {
  if (!course) return false;

  // Pipeline still returns { name, parts, chapters, method, savedAt }
  // Convert to v2 if not already there
  let doc = course;
  if (!doc.schemaVersion || doc.schemaVersion < 2) {
    doc = _migrateV1(doc) || course;
    if (!doc.schemaVersion) {
      // Build v2 from pipeline shape
      const sections = (course.parts || []).map((p) => ({
        id: p.id,
        chapterId: (course.chapters?.[0]?.id) || 1,
        title: p.title || `Part ${p.id}`,
        text: p.text || "",
        charCount: (p.text || "").length,
      }));
      doc = {
        schemaVersion: SCHEMA_VERSION,
        id: String(course.savedAt || Date.now()),
        name: course.name || "Untitled",
        createdAt: course.savedAt || Date.now(),
        method: course.method || "size",
        chapters: course.chapters || [],
        sections,
      };
    }
  }

  return _set(STORAGE_KEY_COURSE, doc);
}

/** Clear the saved course. */
export function clearCourse() {
  localStorage.removeItem(STORAGE_KEY_COURSE);
}

// ── Progress ──────────────────────────────────────────────────────────────────

export function loadProgress() { return _get(STORAGE_KEY_PROGRESS); }

export function saveProgress(progress) { return _set(STORAGE_KEY_PROGRESS, progress); }

export function clearProgress() { localStorage.removeItem(STORAGE_KEY_PROGRESS); }

// ── Legacy compat (old code uses saveDoc / loadDoc / clearDoc) ────────────────

export { saveCourse as saveDoc, loadCourse as loadDoc, clearCourse as clearDoc };
