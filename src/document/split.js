/**
 * Fallback size-based document splitter.
 * Uses structure-aware outline builder first, and falls back to size-based chunking.
 */

import { buildOutline } from "./structure.js";

/**
 * Splits document text into structured parts.
 *
 * @param {string} text
 * @returns {Array<{id: number, title: string, text: string}>}
 */
export function splitIntoParts(text) {
  if (!text || typeof text !== "string") return [];

  try {
    const outline = buildOutline([], text);
    if (outline && Array.isArray(outline.parts) && outline.parts.length > 0) {
      return outline.parts;
    }
  } catch (err) {
    console.warn("buildOutline failed, using size-based fallback:", err);
  }

  return fallbackSizeSplit(text);
}

/**
 * Original size-based splitter used as the last fallback.
 */
function fallbackSizeSplit(text) {
  const TARGET = 1500;
  const MAX = 2200;
  const MIN_LAST = 400;

  const clean = text
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  let units = clean.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
  units = units.flatMap((u) => (u.length > MAX ? splitSentences(u, MAX) : [u]));

  const parts = [];
  let current = "";
  for (const u of units) {
    if (current && current.length + u.length > TARGET) {
      parts.push(current.trim());
      current = "";
    }
    current += (current ? "\n" : "") + u;
  }
  if (current.trim()) {
    if (parts.length && current.length < MIN_LAST) {
      parts[parts.length - 1] += "\n" + current.trim();
    } else {
      parts.push(current.trim());
    }
  }

  return parts.map((t, i) => ({
    id: i + 1,
    title: makeTitle(t),
    text: t,
  }));
}

function splitSentences(paragraph, max) {
  const sentences = paragraph.split(/(?<=[.!?؟])\s+/);
  const out = [];
  let cur = "";
  for (const s of sentences) {
    if (cur && cur.length + s.length > max) {
      out.push(cur);
      cur = "";
    }
    cur += (cur ? " " : "") + s;
  }
  if (cur) out.push(cur);
  return out;
}

function makeTitle(text) {
  const words = text.replace(/\s+/g, " ").split(" ").slice(0, 6).join(" ");
  return words.replace(/[.,;:!?؟]+$/, "") + "…";
}
