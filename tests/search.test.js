import test from "node:test";
import assert from "node:assert";
import { searchParts } from "../src/document/search.js";

const sampleParts = [
  { id: 1, title: "Photosynthesis", text: "Plants convert solar light energy into chemical sugars using chloroplasts and water." },
  { id: 2, title: "Cellular Respiration", text: "Mitochondria break down glucose molecules to generate ATP energy for cellular activities." },
  { id: 3, title: "Human Circulatory System", text: "The heart pumps oxygenated blood through arteries and veins across organs." },
];

test("Search Ranking - returns relevant part based on keyword matches", () => {
  const results = searchParts("chloroplasts and sunlight photosynthesis", sampleParts, 1);
  assert.strictEqual(results.length, 1);
  assert.strictEqual(results[0].id, 1);
});

test("Search Ranking - works across French words with accents", () => {
  const frParts = [
    { id: 1, title: "L'énergie solaire", text: "Les panneaux solaires photovoltaïques captent la lumière." },
    { id: 2, title: "Système respiratoire", text: "Les poumons assurent les échanges gazeux d'oxygène." },
  ];
  const results = searchParts("energie photovoltaique", frParts, 1);
  assert.strictEqual(results[0].id, 1);
});

test("Search Ranking - works across Arabic words with and without tashkeel", () => {
  const arParts = [
    { id: 1, title: "الخلايا النباتية", text: "تحتوي الخلايا النباتية على جدار خلوي وبلاستيدات خضراء تقوم بالبناء الضوئي." },
    { id: 2, title: "الجهاز الهضمي", text: "يقوم الجهاز الهضمي بتفتيت الطعام وامتصاص العناصر الغذائية الضرورية." },
  ];
  const results = searchParts("البناء الضَّوْئِيِّ", arParts, 1);
  assert.strictEqual(results[0].id, 1);
});

test("Search Ranking - falls back to first k parts when no keywords match", () => {
  const results = searchParts("completely unrelated quantum teleportation", sampleParts, 2);
  assert.strictEqual(results.length, 2);
  assert.strictEqual(results[0].id, 1);
  assert.strictEqual(results[1].id, 2);
});
