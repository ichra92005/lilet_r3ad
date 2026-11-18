import test from "node:test";
import assert from "node:assert";
import { buildOutline } from "../src/document/structure.js";
import { splitIntoParts } from "../src/document/split.js";

test("Section splitting - respects sentence boundaries and does not break mid-sentence", () => {
  const sentence = "The mitochondria is the powerhouse of eukaryotic cells. ";
  // Create paragraph of ~3000 chars
  const longText = sentence.repeat(45);
  const parts = splitIntoParts(longText);

  assert.ok(parts.length >= 2, "Expected multiple parts for long text");
  for (const part of parts) {
    const trimmed = part.text.trim();
    assert.ok(
      trimmed.endsWith(".") || trimmed.endsWith("!") || trimmed.endsWith("?") || trimmed.endsWith("…"),
      `Part does not end with sentence punctuation: "${trimmed.slice(-20)}"`
    );
  }
});

test("Structure Outline - merges small sections under 500 chars", () => {
  const blocks = [
    { type: "heading", level: 1, text: "Section 1" },
    { type: "para", text: "Short text." }, // < 500 chars
    { type: "heading", level: 1, text: "Section 2" },
    { type: "para", text: "Longer text explaining key biological principles across several comprehensive paragraphs. ".repeat(7) },
  ];
  const outline = buildOutline(blocks);
  assert.ok(outline.parts.length >= 1);
  for (const p of outline.parts) {
    assert.ok(p.text.length >= 500 || outline.parts.length === 1);
  }
});
