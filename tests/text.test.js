import test from "node:test";
import assert from "node:assert";
import { normalizeToken, tokenize, splitSentences } from "../src/utils/text.js";

test("Text Normalization - French accents stripped", () => {
  assert.strictEqual(normalizeToken("Élève"), "eleve");
  assert.strictEqual(normalizeToken("garçon"), "garcon");
  assert.strictEqual(normalizeToken("très"), "tres");
  assert.strictEqual(normalizeToken("naïve"), "naive");
});

test("Text Normalization - Arabic tashkeel (diacritics) and tatweel (kashida) stripped", () => {
  // Tashkeel
  const withTashkeel = "كِتَابٌ مَفْتُوحٌ";
  const withoutTashkeel = "كتاب مفتوح";
  assert.strictEqual(normalizeToken(withTashkeel), withoutTashkeel);

  // Tatweel / Kashida: كــــتــــاب
  const withTatweel = "كــــتــــاب";
  assert.strictEqual(normalizeToken(withTatweel), "كتاب");
});

test("Tokenize - handles Arabic, French, and English words", () => {
  const enTokens = tokenize("Hello world! This is a test.");
  assert.deepStrictEqual(enTokens, ["hello", "world", "this", "is", "test"]);

  const frTokens = tokenize("L'éducation et la société moderne.");
  assert.ok(frTokens.includes("education"));
  assert.ok(frTokens.includes("societe"));

  const arTokens = tokenize("مرحبا بكم في الجامعة الوطنية");
  assert.ok(arTokens.includes("مرحبا"));
  assert.ok(arTokens.includes("الجامعة"));
});

test("Sentence splitting - respects . ! ? and Arabic ؟", () => {
  const text = "First sentence. Second sentence! Third sentence? الجملة الرابعة؟ Final.";
  const sentences = splitSentences(text);
  assert.strictEqual(sentences.length, 5);
  assert.strictEqual(sentences[0], "First sentence.");
  assert.strictEqual(sentences[1], "Second sentence!");
  assert.strictEqual(sentences[2], "Third sentence?");
  assert.strictEqual(sentences[3], "الجملة الرابعة؟");
  assert.strictEqual(sentences[4], "Final.");
});
