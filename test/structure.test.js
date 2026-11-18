import assert from "node:assert";
import { buildOutline } from "../src/structure.js";

console.log("Running Acceptance Tests for structure.js...\n");

// Test a: PDF with bookmarks (blocks with fromOutline = true)
{
  const blocks = [
    { type: "heading", level: 1, text: "Introduction to Biology", fromOutline: true },
    { type: "para", text: "Biology is the scientific study of life and living organisms. It covers cell structure, genetics, metabolism, and ecology. ".repeat(6) },
    { type: "heading", level: 1, text: "Cellular Mechanics", fromOutline: true },
    { type: "para", text: "Cells are the functional basic units of all known organisms. Cells take up nutrients, convert nutrients into energy, and reproduce. ".repeat(6) },
  ];
  const outline = buildOutline(blocks);
  assert.strictEqual(outline.method, "pdf-outline", "Expected method 'pdf-outline'");
  assert.strictEqual(outline.chapters.length, 2, "Expected 2 chapters from outline");
  assert.strictEqual(outline.chapters[0].title, "Introduction to Biology");
  assert.strictEqual(outline.chapters[1].title, "Cellular Mechanics");
  console.log("✓ Test a (PDF with bookmarks) passed.");
}

// Test b: DOCX with Heading 1/2 styles
{
  const blocks = [
    { type: "heading", level: 1, text: "Chapter 1: Foundations" },
    { type: "para", text: "This chapter covers the basic building blocks of modern science and empirical methodologies. ".repeat(6) },
    { type: "heading", level: 2, text: "Section 1.1: Scientific Method" },
    { type: "para", text: "Hypothesis testing requires controlled experiments and reproducible measurements across diverse trials. ".repeat(6) },
  ];
  const outline = buildOutline(blocks);
  assert.strictEqual(outline.method, "headings", "Expected method 'headings'");
  assert(outline.parts.length >= 2, "Expected at least 2 parts from DOCX headings");
  console.log("✓ Test b (DOCX headings 1/2) passed.");
}

// Test c: PDF without bookmarks (blocks from heuristic extraction)
{
  const blocks = [
    { type: "heading", level: 1, text: "Solar Physics" },
    { type: "para", text: "The Sun is the star at the center of the Solar System. It is a nearly perfect sphere of hot plasma, heated to incandescence by nuclear fusion reactions in its core. ".repeat(6) },
    { type: "heading", level: 2, text: "Thermonuclear Core" },
    { type: "para", text: "Nuclear fusion in the core of the Sun converts hydrogen into helium at extreme temperatures exceeding fifteen million kelvins. ".repeat(6) },
  ];
  const outline = buildOutline(blocks);
  assert.strictEqual(outline.method, "headings", "Expected method 'headings'");
  console.log("✓ Test c (PDF heading heuristics) passed.");
}

// Test d: TXT with lines like "Chapter 1", "الفصل الأول", "2.1 Title"
{
  const p1 = "Physics is the natural science of matter, its fundamental constituents, its motion and behavior through space and time, and the related entities of energy and force. It is one of the most fundamental scientific disciplines. ".repeat(3);
  const p2 = "Classical mechanics is a physical theory describing the motion of macroscopic objects, from projectiles to parts of machinery, and astronomical objects, such as spacecraft, planets, stars, and galaxies. ".repeat(3);
  const p3 = "تعتبر قوانين نيوتن للحركة أساس الميكانيكا الكلاسيكية التي تشرح حركة الأجرام السماوية والأجسام الأرضية بدقة متناهية تحت تأثير قوى الجاذبية المختلفة عبر الفضاء الشاسع. ".repeat(4);

  const txtContent = `Chapter 1: The Foundations\n${p1}\n\n2.1 Classical Mechanics\n${p2}\n\nالفصل الثاني: الحركة والجاذبية\n${p3}`;

  const blocks = txtContent.split(/\n\s*\n/).map((p) => ({ type: "para", text: p.trim() }));
  const outline = buildOutline(blocks, txtContent);
  assert.strictEqual(outline.method, "patterns", "Expected method 'patterns'");
  assert(outline.parts.length >= 3, `Expected at least 3 parts, got ${outline.parts.length}`);
  console.log("✓ Test d (Pattern-based headings in EN and AR) passed.");
}

// Test e: Plain text with no headings -> topic-shift boundaries, no section over 2400 chars
{
  const p1 = "Photosynthesis powers life on Earth. Chloroplasts contain chlorophyll molecules that absorb red and blue wavelengths of sunlight. Water molecules split into oxygen and protons. Electrons move along the transport chain to produce ATP and NADPH. ".repeat(7);
  const p2 = "Cellular respiration breaks down glucose to harvest biochemical energy in mitochondria. Glycolysis takes place in the cytoplasm and breaks glucose into pyruvate. The citric acid cycle and oxidative phosphorylation generate the bulk of cellular ATP. ".repeat(7);
  const p3 = "Ecological nutrient cycles govern biosphere sustainability. Carbon and nitrogen circulate continuously between abiotic reservoirs and biotic organisms. Decomposers return essential minerals to the soil and marine environments. ".repeat(7);

  const rawText = p1 + "\n\n" + p2 + "\n\n" + p3;
  const blocks = rawText.split(/\n\s*\n/).map((p) => ({ type: "para", text: p.trim() }));
  const outline = buildOutline(blocks, rawText);

  assert.strictEqual(outline.method, "topic-shift", "Expected method 'topic-shift'");
  assert(outline.parts.length >= 2, "Expected multiple parts from topic shift");
  for (const p of outline.parts) {
    assert(p.text.length <= 2400, `Section over 2400 chars: ${p.text.length}`);
  }
  console.log("✓ Test e (Topic shift & size constraints) passed.");
}

// Test f: No section ends mid-sentence; every section has a title
{
  const text = "First sentence of the text. Second sentence has more words. Third sentence concludes this paragraph.\n\nAnother paragraph begins here with interesting concepts. Final thought of the document.";
  const blocks = text.split(/\n\s*\n/).map((p) => ({ type: "para", text: p.trim() }));
  const outline = buildOutline(blocks, text);

  for (const part of outline.parts) {
    assert(part.title && part.title.length > 0, "Part must have a title");
    assert(/[.!?؟]$/.test(part.text.trim()), `Section does not end with sentence punctuation: "${part.text.slice(-20)}"`);
  }
  console.log("✓ Test f (Sentence integrity and titles) passed.");
}

console.log("\nAll structure.js acceptance tests passed successfully!");
