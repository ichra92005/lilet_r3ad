/**
 * src/learning/generate.js
 * On-demand content generation and in-memory + localStorage cache.
 *
 * Provides:
 *  - getCached(sectionId) / setCached(sectionId, data)
 *  - generateExplanation(section)
 *  - generateQuiz(section)
 *  - generateFlashcards(section)
 *  - rearrangeQuiz(questions)
 */

import { STORAGE_KEY_GENERATED } from "../app/config.js";
import { splitSentences } from "../document/structure.js";
import { getCurrentUser } from "../lib/authProvider.js";

function _cacheKey() {
  const userId = getCurrentUser()?.id;
  return userId ? `${STORAGE_KEY_GENERATED}:${userId}` : STORAGE_KEY_GENERATED;
}

function _loadCache() {
  try {
    return JSON.parse(localStorage.getItem(_cacheKey()) || "{}");
  } catch {
    return {};
  }
}

function _saveCache(cache) {
  try {
    localStorage.setItem(_cacheKey(), JSON.stringify(cache));
  } catch {}
}

/** Get cached generated content for a section, or null. */
export function getCached(sectionId) {
  return _loadCache()[sectionId] ?? null;
}

/** Save generated content for a section. */
export function setCached(sectionId, content) {
  const cache = _loadCache();
  cache[sectionId] = { ...(cache[sectionId] || {}), ...content, generatedAt: Date.now() };
  _saveCache(cache);
}

/** Clear all cached generated content. */
export function clearGeneratedCache() {
  localStorage.removeItem(_cacheKey());
}

/**
 * Generate a clear, structured explanation for a section.
 * Returns { summary, keyPoints: string[], coreConcept: string }
 */
export function generateExplanation(section) {
  if (!section) return { summary: "", keyPoints: [], coreConcept: "" };

  const cached = getCached(section.id);
  if (cached?.explanation) {
    return cached.explanation;
  }

  const rawText = (section.text || "").trim();
  const sentences = splitSentences(rawText);
  const title = section.title || "This Chapter";

  let summary = "";
  let keyPoints = [];
  let coreConcept = "";

  if (sentences.length === 0) {
    summary = `This section covers ${title}.`;
    keyPoints = [rawText || `Review the contents of ${title}.`];
    coreConcept = title;
  } else if (sentences.length <= 2) {
    summary = sentences[0];
    keyPoints = sentences;
    coreConcept = `Key idea in ${title}: ${sentences[0]}`;
  } else {
    // Lead summary
    summary = sentences[0];

    // Select 3 to 5 informative sentences as key points
    const candidates = sentences.slice(1);
    const step = Math.max(1, Math.floor(candidates.length / 4));
    for (let i = 0; i < candidates.length && keyPoints.length < 4; i += step) {
      const s = candidates[i].trim();
      if (s && s.length > 20 && !keyPoints.includes(s)) {
        keyPoints.push(s);
      }
    }

    if (keyPoints.length === 0 && sentences[1]) {
      keyPoints.push(sentences[1]);
    }

    // Core concept takeaway
    const lastSentence = sentences[sentences.length - 1];
    coreConcept = lastSentence.length > 30 ? lastSentence : `Understanding the main principles of ${title}.`;
  }

  const explanation = {
    title,
    summary,
    keyPoints,
    coreConcept,
  };

  setCached(section.id, { explanation });
  return explanation;
}

/**
 * Generate multiple choice quiz questions for a section.
 * Each question has { q, options, answer, explanation }.
 */
export function generateQuiz(section) {
  if (!section) return [];

  const cached = getCached(section.id);
  if (Array.isArray(cached?.quiz) && cached.quiz.length > 0) {
    return cached.quiz;
  }

  const rawText = (section.text || "").trim();
  const sentences = splitSentences(rawText).filter((s) => s.length > 25);
  const title = section.title || "this section";
  const questions = [];

  if (sentences.length === 0) {
    questions.push({
      q: `What is the primary topic discussed in "${title}"?`,
      options: [
        `The concepts and details described in ${title}`,
        "An unrelated fictional story",
        "A historical event from 2000 years ago",
        "General unrelated definitions",
      ],
      answer: 0,
      explanation: `The chapter specifically covers the material and concepts introduced under "${title}".`,
    });
  } else {
    // Question 1: Main focus / overview
    const mainIdea = sentences[0];
    questions.push({
      q: `According to "${title}", what is the primary focus of this section?`,
      options: [
        mainIdea,
        `Contradicting the facts outlined in ${title}`,
        "Explaining an unrelated topic without reference to the text",
        "Dismissing the importance of these concepts",
      ],
      answer: 0,
      explanation: `The text introduces this topic by stating: "${mainIdea.slice(0, 140)}...".`,
    });

    // Question 2: Detail from middle of section
    if (sentences.length > 1) {
      const midIdx = Math.floor(sentences.length / 2);
      const fact = sentences[midIdx];
      questions.push({
        q: `Which of the following statements is directly supported by the text?`,
        options: [
          fact,
          "The document states that this process is never required",
          "This principle has no practical relevance in the field",
          "All previous conclusions in this chapter are incorrect",
        ],
        answer: 0,
        explanation: `The document explicitly notes: "${fact.slice(0, 140)}...".`,
      });
    }

    // Question 3: Conclusion / Takeaway
    if (sentences.length > 3) {
      const endFact = sentences[sentences.length - 1];
      questions.push({
        q: `What key takeaway or conclusion is emphasized in this chapter?`,
        options: [
          endFact,
          "The document leaves the topic completely undefined",
          "None of the points discussed should be applied",
          "The concepts discussed were disproven in modern practice",
        ],
        answer: 0,
        explanation: `The text highlights this point: "${endFact.slice(0, 140)}...".`,
      });
    }
  }

  // Shuffle options so correct answer is not always index 0
  const finalized = rearrangeQuiz(questions);
  setCached(section.id, { quiz: finalized });
  return finalized;
}

/**
 * Generate flashcards for a section.
 * Array of { front: string, back: string }.
 */
export function generateFlashcards(section) {
  if (!section) return [];

  const cached = getCached(section.id);
  if (Array.isArray(cached?.flashcards) && cached.flashcards.length > 0) {
    return cached.flashcards;
  }

  const rawText = (section.text || "").trim();
  const sentences = splitSentences(rawText).filter((s) => s.length > 20);
  const title = section.title || "Key Concept";
  const cards = [];

  // Card 1: Chapter overview
  cards.push({
    front: `What is the core topic of "${title}"?`,
    back: sentences[0] || `This section explains the fundamentals and details of ${title}.`,
  });

  // Cards 2-4: Key points
  if (sentences.length > 1) {
    cards.push({
      front: `Key point in ${title}:`,
      back: sentences[Math.floor(sentences.length / 2)] || sentences[1],
    });
  }

  if (sentences.length > 2) {
    cards.push({
      front: `Important conclusion from ${title}:`,
      back: sentences[sentences.length - 1],
    });
  }

  setCached(section.id, { flashcards: cards });
  return cards;
}

/**
 * Utility to shuffle an array in-place using Fisher-Yates.
 */
function _shuffle(arr) {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Rearranges quiz questions and options.
 * Changes the arrangement of questions and choices while keeping the right answer marked correctly.
 */
export function rearrangeQuiz(questions) {
  if (!Array.isArray(questions)) return [];

  const shuffledQuestions = _shuffle(questions);

  return shuffledQuestions.map((q) => {
    const originalAnswerText = q.options[q.answer];
    const shuffledOptions = _shuffle(q.options);
    const newAnswerIdx = shuffledOptions.indexOf(originalAnswerText);

    return {
      ...q,
      options: shuffledOptions,
      answer: newAnswerIdx >= 0 ? newAnswerIdx : 0,
    };
  });
}
