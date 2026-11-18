/**
 * src/document/pipeline.js
 * Document processing pipeline — the only public entry point for file → course.
 *
 * processDocument(file, onProgress?) → course object (v2 schema)
 *
 * This is the "seam": the splitter/outline builder can be replaced
 * inside _buildOutline() without touching any screen or storage code.
 */

import { extractText }  from "./extract.js";
import { buildOutline } from "./structure.js";
import { splitIntoParts } from "./split.js";
import { SCHEMA_VERSION } from "../app/config.js";

/**
 * Process a File into a course object ready for saveCourse().
 *
 * @param {File} file
 * @param {(message: string) => void} [onProgress]
 * @returns {Promise<object>} v2 course object
 */
export async function processDocument(file, onProgress) {
  if (!file) throw new Error("No file provided.");
  const log = onProgress || (() => {});

  log("Reading file…");
  const res = await extractText(file);
  const text   = typeof res === "string" ? res : res.text;
  const blocks = Array.isArray(res.blocks) ? res.blocks : [];

  if (!text || !text.trim()) {
    throw new Error("No readable text found in this file.");
  }

  log("Finding sections…");
  let chapters = [], sections = [], method = "size";

  try {
    const outline = buildOutline(blocks, text);
    if (outline?.parts?.length > 0) {
      method   = outline.method;
      chapters = outline.chapters;
      sections = outline.parts; // flat list (backward compat)
    }
  } catch (err) {
    console.warn("buildOutline failed, using fallback:", err);
  }

  if (sections.length === 0) {
    method   = "size";
    sections = splitIntoParts(text);
    chapters = [{
      id: 1,
      title: file.name.replace(/\.[^.]+$/, ""),
      level: 1,
      sectionIds: sections.map((s) => s.id),
    }];
  }

  log(`Found ${sections.length} section${sections.length === 1 ? "" : "s"}`);

  const id = String(Date.now());

  // Build v2 sections with charCount and chapterId
  const v2Sections = sections.map((p) => {
    // Find which chapter this section belongs to
    const ch = chapters.find((c) =>
      Array.isArray(c.sectionIds)
        ? c.sectionIds.includes(p.id)
        : Array.isArray(c.sections) && c.sections.some((s) => s.id === p.id)
    );
    return {
      id: p.id,
      chapterId: ch?.id ?? 1,
      title: p.title || `Part ${p.id}`,
      text: p.text || "",
      charCount: (p.text || "").length,
    };
  });

  // Normalise chapters to v2 (add sectionIds if missing)
  const v2Chapters = chapters.map((ch) => ({
    id: ch.id,
    title: ch.title,
    level: ch.level || 1,
    sectionIds: ch.sectionIds ||
      (Array.isArray(ch.sections) ? ch.sections.map((s) => s.id) : []),
  }));

  return {
    schemaVersion: SCHEMA_VERSION,
    id,
    name: file.name,
    createdAt: Date.now(),
    method,
    chapters: v2Chapters,
    sections: v2Sections,
  };
}
