import test from "node:test";
import assert from "node:assert";

// Mock localStorage for Node.js test environment
const storage = new Map();
globalThis.localStorage = {
  getItem: (k) => storage.get(k) ?? null,
  setItem: (k, v) => storage.set(k, String(v)),
  removeItem: (k) => storage.delete(k),
  clear: () => storage.clear(),
};

import { loadCourse, saveCourse, clearCourse } from "../src/storage/store.js";
import { STORAGE_KEY_COURSE, SCHEMA_VERSION } from "../src/app/config.js";

test("Store: migrates v1 schema ({ name, savedAt, parts }) to v2 Course schema", () => {
  localStorage.clear();

  // Seed old v1 format
  const v1Doc = {
    name: "Legacy Biology Course.pdf",
    savedAt: 1700000000000,
    parts: [
      { id: 1, title: "Cells", text: "Introduction to eukaryotic cells." },
      { id: 2, title: "Organelles", text: "Mitochondria and ribosomes." },
    ],
  };
  localStorage.setItem(STORAGE_KEY_COURSE, JSON.stringify(v1Doc));

  // Load should migrate to v2
  const course = loadCourse();
  assert.ok(course, "Course should be loaded");
  assert.strictEqual(course.schemaVersion, SCHEMA_VERSION);
  assert.strictEqual(course.name, "Legacy Biology Course.pdf");
  assert.strictEqual(course.sections.length, 2);
  assert.strictEqual(course.sections[0].charCount, v1Doc.parts[0].text.length);
  assert.strictEqual(course.chapters.length, 1);
  assert.deepStrictEqual(course.chapters[0].sectionIds, [1, 2]);

  // Verify migrated version was persisted back to storage
  const persistedRaw = JSON.parse(localStorage.getItem(STORAGE_KEY_COURSE));
  assert.strictEqual(persistedRaw.schemaVersion, SCHEMA_VERSION);
});

test("Store: saves and retrieves valid v2 Course", () => {
  localStorage.clear();
  const v2Course = {
    schemaVersion: SCHEMA_VERSION,
    id: "course-999",
    name: "Modern Physics",
    createdAt: Date.now(),
    method: "headings",
    chapters: [{ id: 1, title: "Relativity", level: 1, sectionIds: [1] }],
    sections: [{ id: 1, chapterId: 1, title: "Special Relativity", text: "Speed of light is constant.", charCount: 28 }],
  };

  const ok = saveCourse(v2Course);
  assert.strictEqual(ok, true);

  const loaded = loadCourse();
  assert.deepStrictEqual(loaded, v2Course);
});

test("Store: clearCourse removes course from storage", () => {
  clearCourse();
  assert.strictEqual(loadCourse(), null);
});
