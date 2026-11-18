import test from "node:test";
import assert from "node:assert";
import {
  generateExplanation,
  generateQuiz,
  generateFlashcards,
  rearrangeQuiz,
} from "../src/learning/generate.js";

test("Learning Generate: creates structured explanation from section", () => {
  const section = {
    id: 101,
    title: "Mitochondria and Energy",
    text: "Mitochondria are known as the powerhouses of the cell. They generate most of the chemical energy needed to power the cell's biochemical reactions. Chemical energy produced by the mitochondria is stored in a small molecule called adenosine triphosphate (ATP). Cellular respiration takes place within the inner mitochondrial membrane.",
  };

  const expl = generateExplanation(section);
  assert.strictEqual(expl.title, "Mitochondria and Energy");
  assert.ok(typeof expl.summary === "string" && expl.summary.length > 0);
  assert.ok(Array.isArray(expl.keyPoints) && expl.keyPoints.length > 0);
  assert.ok(typeof expl.coreConcept === "string" && expl.coreConcept.length > 0);
});

test("Learning Generate: creates valid quiz questions", () => {
  const section = {
    id: 102,
    title: "Photosynthesis Process",
    text: "Photosynthesis is the process used by plants to convert light energy into chemical energy. This chemical energy is stored in carbohydrate molecules such as sugars. The process is largely responsible for producing and maintaining the oxygen content of the Earth's atmosphere.",
  };

  const quiz = generateQuiz(section);
  assert.ok(Array.isArray(quiz) && quiz.length >= 2);
  for (const q of quiz) {
    assert.ok(typeof q.q === "string");
    assert.strictEqual(q.options.length, 4);
    assert.ok(q.answer >= 0 && q.answer < 4);
    assert.ok(typeof q.options[q.answer] === "string");
    assert.ok(typeof q.explanation === "string");
  }
});

test("Learning Generate: rearrangeQuiz changes arrangement while preserving correct answer", () => {
  const originalQuestions = [
    {
      q: "What is ATP?",
      options: ["Energy currency", "A protein enzyme", "A cell wall component", "A lipid membrane"],
      answer: 0,
      explanation: "ATP stores energy.",
    },
    {
      q: "Where does glycolysis occur?",
      options: ["Mitochondrial matrix", "Cytoplasm", "Nucleus", "Ribosome"],
      answer: 1,
      explanation: "Glycolysis occurs in the cytoplasm.",
    },
  ];

  const rearranged = rearrangeQuiz(originalQuestions);
  assert.strictEqual(rearranged.length, 2);

  for (const r of rearranged) {
    const orig = originalQuestions.find((o) => o.q === r.q);
    assert.ok(orig, "Question prompt must be retained");
    const origCorrectText = orig.options[orig.answer];
    assert.strictEqual(r.options[r.answer], origCorrectText, "Correct answer text must remain the selected answer");
  }
});

test("Learning Generate: creates flashcards for section", () => {
  const section = {
    id: 103,
    title: "DNA Replication",
    text: "DNA replication is the biological process of producing two identical replicas of DNA from one original DNA molecule. DNA helicase unwinds the double helix at the replication fork. DNA polymerase synthesizes new strands by adding nucleotides complementary to the template strand.",
  };

  const cards = generateFlashcards(section);
  assert.ok(Array.isArray(cards) && cards.length >= 2);
  for (const c of cards) {
    assert.ok(typeof c.front === "string" && c.front.length > 0);
    assert.ok(typeof c.back === "string" && c.back.length > 0);
  }
});
