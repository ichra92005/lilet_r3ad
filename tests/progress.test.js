import test from "node:test";
import assert from "node:assert";
import { createProgress, completeSection, calcCompletionPct } from "../src/learning/progress.js";

test("Progress: creates initial progress correctly", () => {
  const p = createProgress("course-123", 1);
  assert.strictEqual(p.courseId, "course-123");
  assert.strictEqual(p.currentSectionId, 1);
  assert.deepStrictEqual(p.completedSectionIds, []);
  assert.strictEqual(p.finishedAt, null);
});

test("Progress: advances sections and marks completion", () => {
  let p = createProgress("course-123", 1);
  p = completeSection(p, 1, 2);
  assert.deepStrictEqual(p.completedSectionIds, [1]);
  assert.strictEqual(p.currentSectionId, 2);
  assert.strictEqual(p.finishedAt, null);

  // Finishing last section (nextSectionId = null)
  p = completeSection(p, 2, null);
  assert.deepStrictEqual(p.completedSectionIds, [1, 2]);
  assert.strictEqual(p.currentSectionId, null);
  assert.ok(typeof p.finishedAt === "number");
});

test("Progress: calculates completion percentage accurately", () => {
  const p = {
    courseId: "course-123",
    completedSectionIds: [1, 2],
  };
  assert.strictEqual(calcCompletionPct(p, 4), 50);
  assert.strictEqual(calcCompletionPct(p, 2), 100);
  assert.strictEqual(calcCompletionPct(p, 0), 0);
});
