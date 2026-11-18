import test from "node:test";
import assert from "node:assert";
import { extractJSON, validateJSON, jsonGuard } from "../src/core/json-guard.js";

test("json-guard: extracts bare JSON", () => {
  const raw = '{"name": "test", "items": [1, 2, 3]}';
  const parsed = extractJSON(raw);
  assert.deepStrictEqual(parsed, { name: "test", items: [1, 2, 3] });
});

test("json-guard: extracts fenced markdown JSON", () => {
  const raw = "Here is the response:\n```json\n[{\"q\": \"What is DNA?\", \"answer\": 0}]\n```\nHope that helps!";
  const parsed = extractJSON(raw);
  assert.deepStrictEqual(parsed, [{ q: "What is DNA?", answer: 0 }]);
});

test("json-guard: validates against schema", () => {
  const schema = {
    type: "object",
    required: ["q", "answer"],
    properties: {
      q: { type: "string" },
      answer: { type: "number" },
    },
  };

  assert.strictEqual(validateJSON({ q: "Question", answer: 1 }, schema), true);
  assert.strictEqual(validateJSON({ q: "Question" }, schema), false); // missing answer
  assert.strictEqual(validateJSON({ q: "Question", answer: "invalid" }, schema), false); // wrong type
});

test("json-guard: repairs broken JSON with retry callback", async () => {
  const brokenRaw = '{"q": "What is ATP? "answer": 0}'; // invalid JSON syntax
  const repairedRaw = '{"q": "What is ATP?", "answer": 0}';

  const schema = {
    type: "object",
    required: ["q", "answer"],
  };

  // Without retry, fails
  const failed = await jsonGuard(brokenRaw, schema);
  assert.strictEqual(failed.ok, false);

  // With retry repair function
  const success = await jsonGuard(brokenRaw, schema, async (prev) => repairedRaw);
  assert.strictEqual(success.ok, true);
  assert.deepStrictEqual(success.value, { q: "What is ATP?", answer: 0 });
});
