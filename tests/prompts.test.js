import test from "node:test";
import assert from "node:assert";
import { buildTutorMessages, SYSTEM_PROMPT_TUTOR } from "../src/core/prompts.js";
import { CONTEXT_LIMIT_CHARS, CHAT_HISTORY_EXCHANGES } from "../src/app/config.js";

test("Prompts: system prompt contains strict grounding rules", () => {
  const msgs = buildTutorMessages({ mode: "ask", question: "What is photosynthesis?" });
  assert.strictEqual(msgs[0].role, "system");
  assert.strictEqual(msgs[0].content, SYSTEM_PROMPT_TUTOR);
  assert.ok(msgs[0].content.includes("This is not in your document"));
});

test("Prompts: context-length is strictly bounded to 3000 characters", () => {
  const giantPart = {
    id: 1,
    title: "Large Chapter",
    text: "A".repeat(5000), // 5000 chars
  };

  const msgs = buildTutorMessages({
    mode: "ask",
    question: "Summarize this",
    contextParts: [giantPart],
  });

  const userMsg = msgs[msgs.length - 1].content;
  // Extract context within DOCUMENT:\n"""\n...\n"""
  const match = userMsg.match(/"""\n([\s\S]*?)\n"""/);
  assert.ok(match, "Context block should exist");
  assert.ok(match[1].length <= CONTEXT_LIMIT_CHARS, `Context length was ${match[1].length}, expected <= ${CONTEXT_LIMIT_CHARS}`);
});

test("Prompts: trims history to last 2 exchanges (max 4 messages)", () => {
  const fullHistory = [
    { role: "user", content: "Q1" },
    { role: "assistant", content: "A1" },
    { role: "user", content: "Q2" },
    { role: "assistant", content: "A2" },
    { role: "user", content: "Q3" },
    { role: "assistant", content: "A3" },
  ];

  const msgs = buildTutorMessages({
    mode: "ask",
    question: "Q4",
    history: fullHistory,
  });

  // Expected: 1 system message + 4 trimmed history messages + 1 new user message = 6 messages
  assert.strictEqual(msgs.length, 6);
  assert.strictEqual(msgs[1].content, "Q2");
  assert.strictEqual(msgs[2].content, "A2");
  assert.strictEqual(msgs[3].content, "Q3");
  assert.strictEqual(msgs[4].content, "A3");
});
