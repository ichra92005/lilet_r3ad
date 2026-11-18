/**
 * src/document/search.js
 * BM25-lite relevance search over document sections.
 * Uses shared tokenizer from utils/text.js.
 */

import { tokenize } from "../utils/text.js";

/**
 * Find the k most relevant sections for a question using BM25-lite scoring.
 * Falls back to the first k sections if nothing matches.
 *
 * @param {string} question
 * @param {Array<{id:number,title:string,text:string}>} parts
 * @param {number} [k=2]
 * @returns {Array<{id:number,title:string,text:string}>}
 */
export function searchParts(question, parts, k = 2) {
  if (!Array.isArray(parts) || parts.length === 0) return [];
  if (parts.length <= k) return [...parts];

  const qTokens = tokenize(question);
  if (!qTokens.length) return parts.slice(0, k);

  const N = parts.length;
  const docTokens = parts.map((p) => tokenize(`${p.title || ""} ${p.text || ""}`));
  const avgdl = docTokens.reduce((s, t) => s + t.length, 0) / N || 1;

  // Build TF maps per doc
  const tfMaps = docTokens.map((tokens) => {
    const m = new Map();
    for (const t of tokens) m.set(t, (m.get(t) || 0) + 1);
    return m;
  });

  // DF for query tokens
  const uniq = [...new Set(qTokens)];
  const df = new Map();
  for (const qt of uniq) {
    let count = 0;
    for (const m of tfMaps) if (m.has(qt)) count++;
    df.set(qt, count);
  }

  // BM25 (k1=1.2, b=0.75)
  const k1 = 1.2, b = 0.75;
  const scored = parts.map((part, i) => {
    const tf  = tfMaps[i];
    const len = docTokens[i].length;
    let score = 0;
    for (const qt of uniq) {
      const f = tf.get(qt) || 0;
      if (f > 0) {
        const idf = Math.log(1 + (N - df.get(qt) + 0.5) / (df.get(qt) + 0.5));
        score += idf * (f * (k1 + 1)) / (f + k1 * (1 - b + b * (len / avgdl)));
      }
    }
    return { part, score, i };
  });

  const max = Math.max(...scored.map((s) => s.score));
  if (max <= 0) return parts.slice(0, k);

  scored.sort((a, b) => b.score - a.score || a.i - b.i);
  return scored.slice(0, k).map((s) => s.part);
}
