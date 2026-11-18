/**
 * src/utils/text.js
 * Text normalization helpers for Arabic, French, and English.
 * Used by search.js and structure.js.
 * No DOM, no browser APIs.
 */

/**
 * Normalize a text token for consistent comparison:
 * 1. NFD → strip Latin accents (é→e, ç→c …)
 * 2. Strip Arabic tashkeel (diacritics) and tatweel (kashida)
 * 3. Lowercase
 *
 * @param {string} text
 * @returns {string}
 */
export function normalizeToken(text) {
  if (!text) return "";
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")          // Latin accents
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "") // Arabic tashkeel + tatweel
    .toLowerCase();
}

/**
 * Tokenize text into normalized tokens (length ≥ 2).
 * Splits on non-letter/digit boundaries — works for Arabic, French, English.
 *
 * @param {string} text
 * @returns {string[]}
 */
export function tokenize(text) {
  if (!text) return [];
  return normalizeToken(text)
    .split(/[^\p{L}\p{N}]+/u)
    .filter((t) => t.length >= 2);
}

/**
 * Split text into sentences.
 * Handles . ! ? ؟ as sentence terminators.
 *
 * @param {string} text
 * @returns {string[]}
 */
export function splitSentences(text) {
  if (!text) return [];
  return text
    .split(/(?<=[.!?؟])(?:\s+|\n+)/)
    .map((s) => s.trim())
    .filter(Boolean);
}
