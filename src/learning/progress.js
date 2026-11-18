/**
 * src/learning/progress.js
 * Learning progress helpers — pure functions, no DOM.
 *
 * Progress schema:
 * {
 *   courseId: string,
 *   currentSectionId: number,
 *   completedSectionIds: number[],
 *   scores: { [sectionId]: { flashcards?: {seen,known}, quiz?: {correct,total,attempts} } },
 *   finishedAt?: number
 * }
 */

/** Create a fresh progress object for a course. */
export function createProgress(courseId, firstSectionId) {
  return {
    courseId,
    currentSectionId: firstSectionId,
    completedSectionIds: [],
    scores: {},
    finishedAt: null,
  };
}

/** Mark a section as complete and advance to the next. */
export function completeSection(progress, sectionId, nextSectionId) {
  if (!progress.completedSectionIds.includes(sectionId)) {
    progress.completedSectionIds.push(sectionId);
  }
  progress.currentSectionId = nextSectionId ?? null;
  if (nextSectionId === null) progress.finishedAt = Date.now();
  return progress;
}

/**
 * Calculate completion percentage.
 * @param {object} progress
 * @param {number} totalSections
 * @returns {number} 0–100
 */
export function calcCompletionPct(progress, totalSections) {
  if (!totalSections) return 0;
  return Math.round((progress.completedSectionIds.length / totalSections) * 100);
}
