/**
 * src/core/prompts.js
 * ALL system prompts and prompt-builder functions in one place.
 * No DOM, no network, no imports from other src/ files.
 *
 * Modes: "ask" | "simplify" | "example" | "summarize" | "eli10"
 */

import { CONTEXT_LIMIT_CHARS, CHAT_HISTORY_EXCHANGES, GENERATION_SETTINGS } from "../app/config.js";

export { GENERATION_SETTINGS };

// ── System prompts ────────────────────────────────────────────────────────────

export const SYSTEM_PROMPT_TUTOR =
  "You are a study helper for students. " +
  "Use ONLY the DOCUMENT given below. Do not add facts from your own memory. " +
  "Explain in very simple words and short sentences, like talking to a 12-year-old. " +
  "Maximum 6 sentences, then stop. " +
  "If the answer is not in the document, say exactly: This is not in your document. " +
  "Answer in the same language as the student's question " +
  "(if there is no question, use the document's language).";

export const SYSTEM_PROMPT_PATH =
  "You are a study helper. Use ONLY the SECTION given below. " +
  "Be concise, friendly, and educational. " +
  "Answer in the same language as the student's question.";

// ── Prompt builders ───────────────────────────────────────────────────────────

/**
 * Build the messages array for a tutor-chat turn.
 *
 * @param {{
 *   mode: "ask"|"simplify"|"example"|"summarize"|"eli10",
 *   question: string,
 *   contextParts: Array<{id:number,title:string,text:string}>,
 *   history: Array<{role:string,content:string}>,
 *   lastAnswer: string
 * }} params
 */
export function buildTutorMessages({ mode = "ask", question = "", contextParts = [], history = [], lastAnswer = "" }) {
  // 1. Build document context (capped at CONTEXT_LIMIT_CHARS)
  let ctx = (Array.isArray(contextParts) ? contextParts : [])
    .map((p) => `[Part ${p.id}: ${p.title || ""}]\n${p.text || ""}`)
    .join("\n\n")
    .trim();
  if (ctx.length > CONTEXT_LIMIT_CHARS) ctx = ctx.slice(0, CONTEXT_LIMIT_CHARS);

  // 2. Build task prompt by mode
  const q = (question || "").trim();
  const a = (lastAnswer || "").trim();

  let task;
  switch (mode) {
    case "simplify":
      task = a
        ? `Re-explain this answer in even simpler words:\n"${a}"`
        : q
        ? `Explain this in extremely simple words:\n"${q}"`
        : "Re-explain the main idea of the document in even simpler words.";
      break;
    case "example":
      task = a
        ? `Give one easy, concrete example from the document to illustrate:\n"${a}"`
        : q
        ? `Give one easy, concrete example from the document for:\n"${q}"`
        : "Give one easy, concrete example from the document for the main idea.";
      break;
    case "summarize":
      task = "Summarize the selected part in exactly 4 short bullet points.";
      break;
    case "eli10":
      task = q
        ? `Explain this like I'm 10 years old:\n"${q}"`
        : a
        ? `Explain this like I'm 10 years old:\n"${a}"`
        : "Explain the document like I'm 10 years old.";
      break;
    case "ask":
    default:
      task = q ? `Question: ${q}` : "Explain the main idea of the document simply.";
  }

  // 3. Keep only last CHAT_HISTORY_EXCHANGES exchanges (each = 1 user + 1 asst)
  const trimHistory = (Array.isArray(history) ? history : [])
    .filter((m) => m.role === "user" || m.role === "assistant")
    .slice(-(CHAT_HISTORY_EXCHANGES * 2));

  const userContent = `DOCUMENT:\n"""\n${ctx}\n"""\n\n${task}`;

  return [
    { role: "system", content: SYSTEM_PROMPT_TUTOR },
    ...trimHistory,
    { role: "user", content: userContent },
  ];
}
