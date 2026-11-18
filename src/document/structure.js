/**
 * Structure-aware document splitter and outline builder.
 * Divides text into chapters and sections using:
 * 1. Extraction headings (PDF outline / DOCX styles / PDF font size heuristics)
 * 2. Heading regex patterns (Chapter, Section, Numbered, Roman, Arabic, All-caps)
 * 3. TextTiling-style topic shift detection (Cosine similarity of pseudosentence blocks)
 * 4. Size normalization (Target 1200-2000 chars, min 500, max 2400)
 */

import { tokenize } from "../utils/text.js";

// Common stopwords for English, French, and Arabic
const STOPWORDS = new Set([
  // English
  "the", "is", "at", "which", "on", "and", "a", "an", "in", "to", "for", "of", "it",
  "with", "as", "by", "this", "that", "from", "or", "are", "be", "was", "were", "they",
  "their", "we", "you", "not", "have", "has", "had", "can", "will", "would", "about",
  "there", "then", "into", "more", "other", "some", "such", "than", "its", "also",
  "all", "any", "been", "each", "how", "out", "them", "up", "when", "who", "what",
  // French
  "le", "la", "les", "un", "une", "des", "du", "de", "et", "est", "en", "que", "qui",
  "dans", "pour", "sur", "avec", "par", "ce", "cette", "ces", "sont", "ils", "elles",
  "nous", "vous", "pas", "plus", "mais", "comme", "tout", "tous", "faire", "leur",
  "aux", "ont", "ses", "son", "sa", "au", "ou", "si", "sans", "meme", "bien",
  // Arabic
  "من", "إلى", "عن", "على", "في", "حتى", "مع", "هو", "هي", "أن", "إن", "كان", "قد",
  "هذا", "هذه", "ذلك", "تلك", "التي", "الذي", "الذين", "ما", "لا", "كل", "أو", "ثم",
  "لقد", "بين", "إذا", "حيث", "كما", "غير", "عند", "وقد", "فإن", "فقد", "كانت", "يكون",
  "له", "لها", "بها", "فيه", "فيها", "منها", "منه", "إليه", "إليها", "عليهم", "عليهم"
]);

/**
 * Checks if a token is a stopword.
 */
function isStopword(token) {
  return STOPWORDS.has(token.toLowerCase());
}

/**
 * Splits text into sentences cleanly preserving sentence endings.
 * Never breaks words mid-sentence.
 */
export function splitSentences(text) {
  if (!text) return [];
  const raw = text.split(/(?<=[.!?؟])(?:\s+|\n+)/);
  const sentences = [];
  for (const s of raw) {
    const trimmed = s.trim();
    if (trimmed) sentences.push(trimmed);
  }
  return sentences;
}

/**
 * Pattern-based heading detection for lines.
 * Checks for Chapter/Section keywords, numbered outlines (1., 1.2),
 * Roman numerals, Arabic chapter words, and short ALL-CAPS lines.
 *
 * @param {string} line
 * @returns {{ isHeading: boolean, level: number, title: string } | null}
 */
export function matchHeadingPattern(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length > 90 || /[.,;]$/.test(trimmed)) {
    return null;
  }

  // 1. Chapter / Unit / Section keywords (EN, FR, AR)
  const kwMatch = trimmed.match(
    /^(?:chapter|part|unit|lesson|section|module|chapitre|partie|unité|leçon|séance|الفصل|الباب|الوحدة|الدرس|الجزء|المحور|القسم)\s+([0-9IVXLCDMivxlc\u0660-\u0669]+|one|two|three|four|five|six|seven|eight|nine|ten|premier|premiere|première|deuxième|troisième|الأول|الثاني|الثالث|الرابع|الخامس|[a-z])(?:\s*[:\-–—]|\s+|$)/i
  );
  if (kwMatch) {
    return { isHeading: true, level: 1, title: cleanHeadingText(trimmed) };
  }

  // 2. Numbered outline: ^\d+(\.\d+){0,3}[.)]?\s+\S
  const numMatch = trimmed.match(/^(\d+(\.\d+){0,3})[.)]?\s+(\S.*)/);
  if (numMatch) {
    const dots = (numMatch[1].match(/\./g) || []).length;
    return { isHeading: true, level: dots + 1, title: cleanHeadingText(trimmed) };
  }

  // 3. Roman numerals: ^[IVXLCDM]+[.)]\s+\S
  const romanMatch = trimmed.match(/^[IVXLCDM]+[.)]\s+(\S.*)/);
  if (romanMatch) {
    return { isHeading: true, level: 1, title: cleanHeadingText(trimmed) };
  }

  // 4. Short ALL-CAPS lines (Latin) of 2 to 8 words
  const words = trimmed.split(/\s+/);
  if (
    words.length >= 2 &&
    words.length <= 8 &&
    trimmed === trimmed.toUpperCase() &&
    /[A-Z]/.test(trimmed) &&
    !/[0-9]/.test(trimmed)
  ) {
    return { isHeading: true, level: 1, title: cleanHeadingText(trimmed) };
  }

  return null;
}

/**
 * Clean up title text by stripping markdown symbols and trailing punctuation.
 */
function cleanHeadingText(title) {
  return title
    .replace(/^#{1,6}\s+/, "")
    .replace(/^\*+|\*+$/g, "")
    .replace(/^_+|_+$/g, "")
    .replace(/[:\-–—]+$/, "")
    .trim();
}

/**
 * TextTiling topic shift detector.
 * Groups sentences into blocks of ~3 sentences, computes TF-IDF word vectors,
 * measures cosine similarity across a 3-block window, calculates depth scores,
 * and sets boundaries where depth >= mean + 0.5 * std and chunk >= 600 chars.
 *
 * @param {string[]} sentences
 * @param {number} [minChars=600]
 * @returns {number[]} Array of sentence boundary indices
 */
export function detectTopicShifts(sentences, minChars = 600) {
  if (sentences.length <= 3) return [0];

  const blockSize = 3;
  const blocks = [];
  for (let i = 0; i < sentences.length; i += blockSize) {
    blocks.push(sentences.slice(i, i + blockSize).join(" "));
  }

  if (blocks.length <= 1) return [0];

  // Tokenize blocks without stopwords
  const blockTokens = blocks.map((b) =>
    tokenize(b).filter((t) => !isStopword(t))
  );

  const N = blocks.length;
  const df = new Map();
  for (const tokens of blockTokens) {
    const unique = new Set(tokens);
    for (const t of unique) {
      df.set(t, (df.get(t) || 0) + 1);
    }
  }

  // Build TF-IDF vectors
  const blockVectors = blockTokens.map((tokens) => {
    const tf = new Map();
    for (const t of tokens) {
      tf.set(t, (tf.get(t) || 0) + 1);
    }
    const vec = new Map();
    for (const [t, count] of tf.entries()) {
      const idf = Math.log(1 + N / (df.get(t) || 1));
      vec.set(t, count * idf);
    }
    return vec;
  });

  // Calculate similarity between sliding windows of up to 3 blocks
  const similarities = [];
  for (let g = 0; g < N - 1; g++) {
    const vecBefore = new Map();
    for (let b = Math.max(0, g - 2); b <= g; b++) {
      for (const [w, v] of blockVectors[b].entries()) {
        vecBefore.set(w, (vecBefore.get(w) || 0) + v);
      }
    }

    const vecAfter = new Map();
    for (let b = g + 1; b <= Math.min(N - 1, g + 3); b++) {
      for (const [w, v] of blockVectors[b].entries()) {
        vecAfter.set(w, (vecAfter.get(w) || 0) + v);
      }
    }

    let dot = 0;
    let normB = 0;
    let normA = 0;
    for (const [w, v] of vecBefore.entries()) {
      normB += v * v;
      if (vecAfter.has(w)) dot += v * vecAfter.get(w);
    }
    for (const v of vecAfter.values()) {
      normA += v * v;
    }

    const denom = Math.sqrt(normB) * Math.sqrt(normA);
    similarities.push(denom > 0 ? dot / denom : 0);
  }

  // Calculate depth scores
  const depthScores = [];
  for (let g = 0; g < similarities.length; g++) {
    let leftPeak = similarities[g];
    for (let l = g - 1; l >= 0; l--) {
      if (similarities[l] >= leftPeak) leftPeak = similarities[l];
      else break;
    }

    let rightPeak = similarities[g];
    for (let r = g + 1; r < similarities.length; r++) {
      if (similarities[r] >= rightPeak) rightPeak = similarities[r];
      else break;
    }

    depthScores.push(leftPeak - similarities[g] + (rightPeak - similarities[g]));
  }

  const mean = depthScores.reduce((a, b) => a + b, 0) / depthScores.length;
  const variance =
    depthScores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) /
    depthScores.length;
  const std = Math.sqrt(variance);
  const threshold = mean + 0.5 * std;

  const boundaries = [0];
  let accumulatedChars = 0;

  for (let g = 0; g < depthScores.length; g++) {
    accumulatedChars += blocks[g].length;
    const sentenceIndex = (g + 1) * blockSize;
    if (depthScores[g] >= threshold && accumulatedChars >= minChars) {
      if (sentenceIndex < sentences.length) {
        boundaries.push(sentenceIndex);
        accumulatedChars = 0;
      }
    }
  }

  return boundaries;
}

/**
 * Generates a title for an unheaded section using the 3 most frequent non-stopword
 * keywords or the first 6 words.
 */
export function generateSectionTitle(text) {
  if (!text) return "Overview";

  const tokens = tokenize(text).filter((t) => !isStopword(t));
  if (tokens.length >= 2) {
    const counts = new Map();
    for (const t of tokens) {
      counts.set(t, (counts.get(t) || 0) + 1);
    }
    const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    const topKeywords = sorted.slice(0, 3).map(([w]) => {
      return w.charAt(0).toUpperCase() + w.slice(1);
    });
    if (topKeywords.length >= 2) {
      return topKeywords.join(", ");
    }
  }

  // Fallback: first 6 words
  const words = text.trim().split(/\s+/).slice(0, 6).join(" ");
  return words.replace(/[.,;:!?؟]+$/, "") || "Overview";
}

/**
 * Normalizes sizes of raw sections:
 * - Target 1200 - 2000 chars
 * - Min 500 chars (merge smaller sections into adjacent ones)
 * - Hard max 2400 chars (split larger sections using topic-shift / sentences)
 */
function normalizeSectionSizes(sections) {
  if (!sections.length) return [];

  // 1. Merge sections under 500 chars into previous (or next if first)
  let merged = [];
  for (let i = 0; i < sections.length; i++) {
    const sec = sections[i];
    if (sec.text.length < 500 && merged.length > 0) {
      merged[merged.length - 1].text += "\n\n" + sec.text;
    } else if (sec.text.length < 500 && i + 1 < sections.length) {
      sections[i + 1].text = sec.text + "\n\n" + sections[i + 1].text;
      if (!sections[i + 1].title || sections[i + 1].title === "Overview") {
        sections[i + 1].title = sec.title;
      }
    } else {
      merged.push({ ...sec });
    }
  }

  if (!merged.length && sections.length) {
    merged = [sections[0]];
  }

  // 2. Split sections over 2400 chars
  const result = [];
  for (const sec of merged) {
    if (sec.text.length <= 2400) {
      result.push(sec);
      continue;
    }

    // Split large section
    const pieces = splitLargeSection(sec.text);
    const total = pieces.length;
    for (let p = 0; p < total; p++) {
      const pieceTitle =
        total > 1 ? `${sec.title} (${p + 1}/${total})` : sec.title;
      result.push({
        title: pieceTitle,
        level: sec.level || 1,
        text: pieces[p].trim(),
      });
    }
  }

  return result;
}

/**
 * Splits text over 2400 chars into pieces <= 2400 chars without breaking mid-sentence.
 */
function splitLargeSection(text) {
  const sentences = splitSentences(text);
  if (sentences.length <= 1) {
    // If a single massive sentence, return as is
    return [text];
  }

  // Target size ~ 1600 chars per piece
  const numPieces = Math.max(2, Math.ceil(text.length / 1800));
  const boundaries = detectTopicShifts(sentences, 1000);

  // If topic shifts produced a reasonable number of chunks
  if (boundaries.length >= numPieces) {
    const chunks = [];
    for (let i = 0; i < boundaries.length; i++) {
      const start = boundaries[i];
      const end =
        i + 1 < boundaries.length ? boundaries[i + 1] : sentences.length;
      const chunkText = sentences.slice(start, end).join(" ").trim();
      if (chunkText) chunks.push(chunkText);
    }
    // Verify no chunk exceeds 2400 chars
    const allValid = chunks.every((c) => c.length <= 2400);
    if (allValid && chunks.length > 1) {
      return chunks;
    }
  }

  // Fallback: split by sentences targeting ~1600 chars
  const chunks = [];
  let currentChunk = [];
  let currentLength = 0;

  for (const s of sentences) {
    if (currentLength > 0 && currentLength + s.length > 1900) {
      chunks.push(currentChunk.join(" ").trim());
      currentChunk = [];
      currentLength = 0;
    }
    currentChunk.push(s);
    currentLength += s.length + 1;
  }

  if (currentChunk.length > 0) {
    const lastChunk = currentChunk.join(" ").trim();
    if (chunks.length > 0 && lastChunk.length < 400) {
      chunks[chunks.length - 1] += " " + lastChunk;
    } else {
      chunks.push(lastChunk);
    }
  }

  return chunks.length ? chunks : [text];
}

/**
 * Builds chapters and sections from blocks or plain text.
 *
 * @param {Array<{ type: "heading" | "para", level?: number, text: string, fromOutline?: boolean }>} [blocks=[]]
 * @param {string} [rawText=""]
 * @returns {{
 *   chapters: Array<{ id: number, title: string, level: number, sections: Array<{ id: number, title: string, text: string }> }>,
 *   parts: Array<{ id: number, title: string, text: string }>,
 *   method: "pdf-outline" | "headings" | "patterns" | "topic-shift" | "size"
 * }}
 */
export function buildOutline(blocks = [], rawText = "") {
  let method = "headings";
  const validBlocks = Array.isArray(blocks) ? blocks : [];
  const fullText =
    rawText || validBlocks.map((b) => b.text || "").join("\n\n").trim();

  let rawSections = [];

  // a. If there are at least 2 headings from extraction, use them.
  const extractionHeadings = validBlocks.filter(
    (b) => b.type === "heading" && b.text && b.text.trim()
  );

  if (extractionHeadings.length >= 2) {
    method = extractionHeadings.some((h) => h.fromOutline)
      ? "pdf-outline"
      : "headings";

    let currentSec = null;
    for (const b of validBlocks) {
      if (b.type === "heading" && b.text && b.text.trim()) {
        if (currentSec && currentSec.text.trim()) {
          rawSections.push(currentSec);
        }
        currentSec = {
          title: cleanHeadingText(b.text),
          level: b.level || 1,
          text: "",
        };
      } else if (b.type === "para" && b.text && b.text.trim()) {
        if (!currentSec) {
          currentSec = {
            title: "Introduction",
            level: 1,
            text: b.text.trim(),
          };
        } else {
          currentSec.text += (currentSec.text ? "\n\n" : "") + b.text.trim();
        }
      }
    }
    if (currentSec && currentSec.text.trim()) {
      rawSections.push(currentSec);
    }
  }

  // b. Else detect heading lines by pattern
  if (rawSections.length < 2) {
    const lines = fullText.split("\n").map((l) => l.trim()).filter(Boolean);
    const patternHeadings = [];

    for (let i = 0; i < lines.length; i++) {
      const match = matchHeadingPattern(lines[i]);
      if (match) {
        patternHeadings.push({ lineIndex: i, ...match });
      }
    }

    if (patternHeadings.length >= 2) {
      method = "patterns";
      rawSections = [];
      for (let h = 0; h < patternHeadings.length; h++) {
        const currentH = patternHeadings[h];
        const nextH = patternHeadings[h + 1];
        const startLine = currentH.lineIndex + 1;
        const endLine = nextH ? nextH.lineIndex : lines.length;
        const bodyText = lines.slice(startLine, endLine).join("\n\n").trim();

        // If there are intro lines before the first heading, capture them
        if (h === 0 && currentH.lineIndex > 0) {
          const introText = lines.slice(0, currentH.lineIndex).join("\n\n").trim();
          if (introText) {
            rawSections.push({
              title: "Introduction",
              level: 1,
              text: introText,
            });
          }
        }

        rawSections.push({
          title: currentH.title,
          level: currentH.level,
          text: bodyText,
        });
      }
    }
  }

  // c. If still fewer than 2 headings, use topic-change detection (TextTiling style)
  if (rawSections.length < 2) {
    method = "topic-shift";
    const sentences = splitSentences(fullText);

    if (sentences.length >= 6) {
      const boundaries = detectTopicShifts(sentences, 600);
      rawSections = [];
      for (let i = 0; i < boundaries.length; i++) {
        const start = boundaries[i];
        const end =
          i + 1 < boundaries.length ? boundaries[i + 1] : sentences.length;
        const secText = sentences.slice(start, end).join(" ").trim();
        if (secText) {
          rawSections.push({
            title: generateSectionTitle(secText),
            level: 1,
            text: secText,
          });
        }
      }
    }

    // Fallback if still under 2 sections
    if (rawSections.length < 2) {
      rawSections = [
        {
          title: generateSectionTitle(fullText),
          level: 1,
          text: fullText,
        },
      ];
    }
  }

  // d. Normalize sizes: target 1200-2000, hard max 2400, min 500
  const normalizedSections = normalizeSectionSizes(rawSections);

  // e. Assign titles to any sections that still lack one
  for (const sec of normalizedSections) {
    if (!sec.title || sec.title === "Overview") {
      sec.title = generateSectionTitle(sec.text);
    }
  }

  // f. Group sections into chapters:
  // - If level-1 headings exist, start a new chapter at each level-1
  // - Otherwise, make 1 chapter per 3-5 sections (default 3)
  const hasLevel1 = normalizedSections.some((s) => s.level === 1);
  const chapters = [];
  let currentChapter = null;
  let chapterCounter = 1;
  let sectionCounter = 1;

  if (hasLevel1) {
    for (const sec of normalizedSections) {
      if (sec.level === 1 || !currentChapter) {
        currentChapter = {
          id: chapterCounter++,
          title: sec.title,
          level: 1,
          sections: [],
        };
        chapters.push(currentChapter);
      }
      currentChapter.sections.push({
        id: sectionCounter++,
        title: sec.title,
        text: sec.text,
      });
    }
  } else {
    // Group 3-4 sections per chapter
    const groupSize = Math.max(3, Math.min(5, Math.ceil(normalizedSections.length / 3)));
    for (let i = 0; i < normalizedSections.length; i++) {
      if (i % groupSize === 0) {
        currentChapter = {
          id: chapterCounter++,
          title: `Chapter ${chapterCounter - 1}: ${normalizedSections[i].title}`,
          level: 1,
          sections: [],
        };
        chapters.push(currentChapter);
      }
      currentChapter.sections.push({
        id: sectionCounter++,
        title: normalizedSections[i].title,
        text: normalizedSections[i].text,
      });
    }
  }

  // Flat parts list for backward-compatibility with chat and search
  const parts = [];
  let partId = 1;
  for (const ch of chapters) {
    for (const sec of ch.sections) {
      parts.push({
        id: partId++,
        title: sec.title,
        text: sec.text,
      });
    }
  }

  return { chapters, parts, method };
}
