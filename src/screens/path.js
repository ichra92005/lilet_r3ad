/**
 * src/screens/path.js
 * Study partner learning path screen (#/path).
 *
 * Implements:
 * - Chapter list formatted like a to-do list with checked status
 * - Progress bar under the list that turns to 100% when quizzes are finished
 * - Big Start button leading to first chapter or where last stopped
 * - "Flashcards" button right next to the Start button
 * - Chapter study view showing:
 *    1) Exactly what is written in the document
 *    2) Clear structured explanation
 *    3) "Next" button under the explanation leading to the quiz
 * - Quiz view where user can:
 *    - Skip the quiz or do it
 *    - See the score after completion
 *    - Redo the quiz with changed arrangement (shuffled questions & options)
 *    - Pass to the next chapter
 *    - Mark chapter as checked (100%) upon quiz completion
 */

import { navigate } from "../app/router.js";
import { el, append, empty } from "../utils/dom.js";
import { loadCourse, loadProgress, saveProgress } from "../storage/store.js";
import { getCourse } from "../app/state.js";
import { createProgress, completeSection, calcCompletionPct } from "../learning/progress.js";
import { generateExplanation, generateQuiz, generateFlashcards } from "../learning/generate.js";
import { createQuiz } from "../components/quiz.js";
import { createFlashcardDeck } from "../components/flashcards.js";
import { createModal } from "../components/modal.js";

export function renderPath(container) {
  container.className = "screen";

  const course = getCourse() || loadCourse();
  if (!course) {
    navigate("/app");
    return;
  }

  const sections = Array.isArray(course.sections) && course.sections.length > 0
    ? course.sections
    : (course.parts || []);

  if (sections.length === 0) {
    empty(container);
    const wrap = el("div", { cls: "path-screen card", attrs: { style: "text-align:center;padding:40px;" } });
    append(
      wrap,
      el("h3", { text: "No chapters found in this document." }),
      el("p", { cls: "text-muted", text: "Please upload a course document with text to study." })
    );
    const backBtn = el("button", { cls: "btn btn-primary", text: "Go to upload", attrs: { type: "button" } });
    backBtn.addEventListener("click", () => navigate("/app"));
    wrap.appendChild(backBtn);
    container.appendChild(wrap);
    return;
  }

  // Load or create learning progress
  let progress = loadProgress();
  if (!progress || progress.courseId !== course.id) {
    progress = createProgress(course.id, sections[0]?.id || 1);
    saveProgress(progress);
  }

  // Currently active section ID for study view (null = show to-do list overview)
  let activeSectionId = null;

  // Render controller
  function render() {
    empty(container);
    if (activeSectionId !== null) {
      const activeSection = sections.find((s) => s.id === activeSectionId) || sections[0];
      _renderChapterView(container, activeSection, sections, progress, {
        onBack: () => {
          activeSectionId = null;
          render();
        },
        onChapterComplete: (updatedProgress, nextSecId) => {
          progress = updatedProgress;
          saveProgress(progress);
          if (nextSecId !== null && nextSecId !== undefined) {
            activeSectionId = nextSecId;
          } else {
            activeSectionId = null;
          }
          render();
        },
      });
    } else {
      _renderOverview(container, course, sections, progress, {
        onStartChapter: (secId) => {
          activeSectionId = secId;
          render();
        },
      });
    }
  }

  render();
}

/**
 * Renders the Main To-Do List Overview of Chapters & Progress
 */
function _renderOverview(container, course, sections, progress, { onStartChapter }) {
  const wrap = el("div", { cls: "path-screen" });

  // ── Header Card ──────────────────────────────────────────────────────────
  const headerCard = el("div", {
    cls: "card",
    attrs: { style: "display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;padding:24px;" },
  });

  const titleGroup = el("div", { attrs: { style: "flex:1;min-width:240px;display:flex;align-items:center;gap:16px;" } });
  const studentMascot = el("img", {
    attrs: {
      src: "/assets/aistudio/student_2f90309c.png",
      alt: "Study partner mascot",
      style: "width:48px;height:48px;object-fit:contain;border-radius:50%;background:rgba(123,179,211,0.2);padding:3px;flex-shrink:0;",
    },
  });
  const titleInfo = el("div", { attrs: { style: "flex:1;min-width:0;" } });
  append(
    titleInfo,
    el("div", {
      cls: "badge badge-sky",
      text: "Study Partner",
      attrs: { style: "margin-bottom:8px;font-size:0.75rem;" },
      dirAuto: false,
    }),
    el("h2", {
      text: course.name || "Your Study Course",
      attrs: { style: "font-size:1.5rem;color:var(--text);margin-bottom:4px;" },
    }),
    el("p", {
      cls: "text-muted",
      text: `Step-by-step learning path • ${sections.length} chapter${sections.length === 1 ? "" : "s"} to complete`,
    })
  );
  append(titleGroup, studentMascot, titleInfo);

  const navActions = el("div", { attrs: { style: "display:flex;gap:10px;align-items:center;" } });
  const backChatBtn = el("button", {
    cls: "btn btn-outline btn-sm",
    text: "← Back to chat",
    attrs: { type: "button", "aria-label": "Back to chat" },
  });
  backChatBtn.addEventListener("click", () => navigate("/teacher"));

  const backDashBtn = el("button", {
    cls: "btn btn-outline btn-sm",
    text: "Dashboard",
    attrs: { type: "button", "aria-label": "Back to dashboard" },
  });
  backDashBtn.addEventListener("click", () => navigate("/dashboard"));

  navActions.appendChild(backChatBtn);
  navActions.appendChild(backDashBtn);

  append(headerCard, titleGroup, navActions);
  wrap.appendChild(headerCard);

  // ── Big Start Button + Flashcards Button Row ────────────────────────────
  // Determine where to start: first incomplete chapter or currentSectionId
  let targetSection = null;
  if (progress.currentSectionId) {
    targetSection = sections.find((s) => s.id === progress.currentSectionId);
  }
  if (!targetSection) {
    targetSection = sections.find((s) => !progress.completedSectionIds.includes(s.id)) || sections[0];
  }

  const targetIdx = sections.findIndex((s) => s.id === targetSection.id);
  const isStarted = progress.completedSectionIds.length > 0;
  const startBtnLabel = isStarted
    ? `Continue Learning (Chapter ${targetIdx + 1}) →`
    : `Start Learning (Chapter 1) →`;

  const mainActionsCard = el("div", {
    cls: "card path-actions-card",
    attrs: {
      style:
        "display:flex;gap:16px;align-items:center;flex-wrap:wrap;padding:20px 24px;background:var(--surface2);border-radius:var(--radius-lg);",
    },
  });

  const bigStartBtn = el("button", {
    cls: "btn btn-primary btn-big-start",
    text: startBtnLabel,
    attrs: {
      type: "button",
      style: "font-size:1.05rem;padding:14px 28px;font-weight:700;border-radius:var(--radius);flex:1;min-width:220px;",
    },
  });
  bigStartBtn.addEventListener("click", () => {
    onStartChapter(targetSection.id);
  });

  // "falsh card" button next to Start button
  const flashcardBtn = el("button", {
    cls: "btn btn-peach btn-flashcard",
    text: "Flashcards",
    attrs: {
      type: "button",
      style:
        "font-size:1.05rem;padding:14px 24px;font-weight:700;border-radius:var(--radius);background:var(--peach);color:var(--text-on-pastel);border:1px solid rgba(46,43,95,0.15);",
      "aria-label": "Open course flashcards",
    },
  });
  flashcardBtn.addEventListener("click", () => {
    _openCourseFlashcards(wrap, sections);
  });

  append(mainActionsCard, bigStartBtn, flashcardBtn);
  wrap.appendChild(mainActionsCard);

  // ── Chapter To-Do List ──────────────────────────────────────────────────
  const listCard = el("div", { cls: "card", attrs: { style: "padding:24px;" } });

  const listHeader = el("div", {
    attrs: {
      style: "display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;flex-wrap:wrap;gap:8px;",
    },
  });
  append(
    listHeader,
    el("h3", { text: "Chapter Checklist & To-Do List", attrs: { style: "font-size:1.2rem;color:var(--text);" } }),
    el("span", {
      cls: "text-muted",
      text: `${progress.completedSectionIds.length} of ${sections.length} done`,
      attrs: { style: "font-size:0.85rem;" },
    })
  );
  listCard.appendChild(listHeader);

  const todoList = el("div", {
    cls: "todo-list-container",
    attrs: { style: "display:flex;flex-direction:column;gap:10px;" },
  });

  sections.forEach((sec, idx) => {
    const isCompleted = progress.completedSectionIds.includes(sec.id);
    const isCurrent = sec.id === targetSection.id;

    const todoItem = el("div", {
      cls: `todo-item ${isCompleted ? "todo-item-completed" : isCurrent ? "todo-item-current" : ""}`,
      attrs: {
        role: "button",
        tabindex: "0",
        style:
          "display:flex;align-items:center;justify-content:space-between;gap:14px;padding:14px 18px;border-radius:var(--radius);border:1px solid var(--border);background:var(--surface);cursor:pointer;transition:all 0.2s;",
        "aria-label": `Chapter ${idx + 1}: ${sec.title}, ${isCompleted ? "Completed 100%" : "Not completed"}`,
      },
    });

    // Left: Checkbox + Title
    const leftGroup = el("div", { attrs: { style: "display:flex;align-items:center;gap:14px;flex:1;min-width:0;" } });

    // Checkbox indicator
    const checkbox = el("div", {
      cls: `todo-checkbox ${isCompleted ? "todo-checkbox-checked" : ""}`,
      attrs: {
        style: `width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.85rem;flex-shrink:0;${
          isCompleted
            ? "background:var(--success);color:#ffffff;border:none;"
            : isCurrent
            ? "border:2px solid var(--accent);color:var(--accent);"
            : "border:2px solid var(--border);color:transparent;"
        }`,
      },
      text: isCompleted ? "✓" : isCurrent ? "▶" : "",
    });

    const info = el("div", { attrs: { style: "flex:1;min-width:0;" } });
    const titleText = el("div", {
      text: `Chapter ${idx + 1}: ${sec.title || "Untitled Section"}`,
      attrs: {
        style: `font-weight:600;font-size:0.95rem;color:var(--text);${
          isCompleted ? "text-decoration:none;opacity:0.85;" : ""
        }`,
      },
    });

    const snippetText = el("div", {
      cls: "text-muted",
      text: sec.text ? `${sec.text.slice(0, 75).trim()}…` : "Chapter content",
      attrs: {
        style: "font-size:0.78rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px;",
      },
    });

    append(info, titleText, snippetText);
    append(leftGroup, checkbox, info);

    // Right: Status Badge
    const rightGroup = el("div", { attrs: { style: "display:flex;align-items:center;gap:10px;flex-shrink:0;" } });

    let statusBadge;
    if (isCompleted) {
      statusBadge = el("span", {
        cls: "badge",
        text: "✓ 100% Done",
        attrs: {
          style: "background:rgba(47, 158, 107, 0.15);color:var(--success);font-weight:700;border:none;",
        },
      });
    } else if (isCurrent) {
      statusBadge = el("span", {
        cls: "badge",
        text: "In Progress",
        attrs: {
          style: "background:var(--sky-blue);color:var(--text-on-pastel);font-weight:700;border:none;",
        },
      });
    } else {
      statusBadge = el("span", {
        cls: "badge",
        text: "To Do",
        attrs: { style: "color:var(--muted);" },
      });
    }

    const arrowIcon = el("span", {
      text: "→",
      attrs: { style: "font-weight:700;color:var(--muted);font-size:0.9rem;" },
    });

    append(rightGroup, statusBadge, arrowIcon);
    append(todoItem, leftGroup, rightGroup);

    // Open chapter on click or Enter key
    const openChapter = () => onStartChapter(sec.id);
    todoItem.addEventListener("click", openChapter);
    todoItem.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openChapter();
      }
    });

    todoList.appendChild(todoItem);
  });

  listCard.appendChild(todoList);

  // ── Progress Bar UNDER the List ─────────────────────────────────────────
  const completionPct = calcCompletionPct(progress, sections.length);
  const isAllComplete = completionPct === 100;

  const progressWrap = el("div", {
    cls: "progress-todo-wrap",
    attrs: {
      style:
        "margin-top:24px;padding-top:20px;border-top:1px solid var(--border);display:flex;flex-direction:column;gap:8px;",
    },
  });

  const progressLabels = el("div", {
    attrs: { style: "display:flex;justify-content:space-between;align-items:center;font-size:0.88rem;" },
  });

  append(
    progressLabels,
    el("span", {
      text: isAllComplete ? "Entire Course Completed!" : "Overall Course Progress",
      attrs: { style: "font-weight:700;color:var(--text);" },
    }),
    el("span", {
      text: `${completionPct}%`,
      attrs: {
        style: `font-weight:700;font-size:1.05rem;color:${isAllComplete ? "var(--success)" : "var(--accent)"};`,
      },
    })
  );

  const track = el("div", { cls: "progress-bar-track", attrs: { style: "height:12px;background:var(--surface2);" } });
  const fill = el("div", {
    cls: "progress-bar-fill",
    attrs: {
      style: `width:${completionPct}%;background:var(--salmon);border-radius:9999px;transition:width 0.4s ease;`,
    },
  });
  track.appendChild(fill);

  append(progressWrap, progressLabels, track);

  if (isAllComplete) {
    const congrats = el("p", {
      text: "Outstanding! All quizzes are completed and every chapter is checked at 100%.",
      attrs: {
        style: "color:var(--success);font-weight:600;font-size:0.9rem;text-align:center;margin-top:6px;",
      },
    });
    progressWrap.appendChild(congrats);
  }

  listCard.appendChild(progressWrap);
  wrap.appendChild(listCard);
  container.appendChild(wrap);
}

/**
 * Chapter Study View:
 * 1. Shows exactly what is written in the document
 * 2. Shows the structured explanation
 * 3. Under the explanation, has a prominent "Next: Take Quiz →" button
 * 4. Leads to the quiz where user can skip, do, see score, redo with rearranged questions, and pass to next chapter.
 */
function _renderChapterView(container, section, sections, progress, { onBack, onChapterComplete }) {
  const wrap = el("div", { cls: "path-screen" });
  const secIdx = sections.findIndex((s) => s.id === section.id);
  const isCompleted = progress.completedSectionIds.includes(section.id);
  const nextSec = secIdx < sections.length - 1 ? sections[secIdx + 1] : null;

  // ── Navigation & Title Header ───────────────────────────────────────────
  const headerCard = el("div", {
    cls: "card",
    attrs: { style: "display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;padding:20px;" },
  });

  const headerLeft = el("div");
  append(
    headerLeft,
    el("div", {
      cls: "badge badge-sky",
      text: `Chapter ${secIdx + 1} of ${sections.length}`,
      attrs: { style: "margin-bottom:6px;font-size:0.75rem;" },
      dirAuto: false,
    }),
    el("h2", {
      text: section.title || `Chapter ${secIdx + 1}`,
      attrs: { style: "font-size:1.35rem;color:var(--text);margin-bottom:4px;" },
    }),
    el("span", {
      cls: "text-muted",
      text: isCompleted ? "✓ Completed (100% quiz finished)" : "In Progress",
      attrs: { style: "font-size:0.85rem;" },
    })
  );

  const backBtn = el("button", {
    cls: "btn btn-outline btn-sm",
    text: "← Back to chapters",
    attrs: { type: "button", "aria-label": "Back to chapter list" },
  });
  backBtn.addEventListener("click", onBack);

  append(headerCard, headerLeft, backBtn);
  wrap.appendChild(headerCard);

  // ── 1. Document Content: Show exactly what is written in document ───────
  const docCard = el("div", { cls: "card", attrs: { style: "padding:24px;" } });
  const docHeader = el("div", {
    attrs: {
      style: "display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;border-bottom:1px solid var(--border);padding-bottom:10px;",
    },
  });
  append(
    docHeader,
    el("h3", { text: "Original Document Text", attrs: { style: "font-size:1.15rem;color:var(--text);" } }),
    el("span", {
      cls: "badge",
      text: `${section.text?.length || 0} characters`,
      attrs: { style: "color:var(--muted);" },
    })
  );

  const docTextBody = el("div", {
    cls: "doc-original-content",
    attrs: {
      style:
        "font-size:0.95rem;line-height:1.75;color:var(--text);white-space:pre-wrap;background:var(--surface2);padding:18px 20px;border-radius:var(--radius);border-left:4px solid var(--periwinkle);max-height:420px;overflow-y:auto;",
    },
    text: section.text || "No text found for this section.",
  });

  append(docCard, docHeader, docTextBody);
  wrap.appendChild(docCard);

  // ── 2. The Explanation ──────────────────────────────────────────────────
  const explanationData = generateExplanation(section);

  const explCard = el("div", { cls: "card", attrs: { style: "padding:24px;" } });
  const explHeader = el("div", {
    attrs: {
      style: "display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;border-bottom:1px solid var(--border);padding-bottom:10px;",
    },
  });
  append(
    explHeader,
    el("h3", { text: "Explanation & Key Concepts", attrs: { style: "font-size:1.15rem;color:var(--text);" } }),
    el("span", {
      cls: "badge",
      text: "Bite-Sized Breakdown",
      attrs: { style: "background:var(--peach);color:var(--text-on-pastel);font-weight:700;border:none;" },
    })
  );

  const explBody = el("div", {
    attrs: { style: "display:flex;flex-direction:column;gap:16px;color:var(--text);" },
  });

  // Summary
  if (explanationData.summary) {
    const summaryBox = el("div", {
      attrs: {
        style:
          "padding:14px 18px;background:rgba(233, 154, 123, 0.12);border-radius:var(--radius);border-left:4px solid var(--salmon);font-size:0.95rem;line-height:1.6;",
      },
    });
    append(
      summaryBox,
      el("strong", { text: "Core Idea: ", attrs: { style: "color:var(--text);" } }),
      el("span", { text: explanationData.summary })
    );
    explBody.appendChild(summaryBox);
  }

  // Key points
  if (Array.isArray(explanationData.keyPoints) && explanationData.keyPoints.length > 0) {
    const pointsList = el("div", {
      attrs: { style: "display:flex;flex-direction:column;gap:8px;padding-left:4px;" },
    });
    explanationData.keyPoints.forEach((pt) => {
      const ptItem = el("div", {
        attrs: { style: "display:flex;align-items:flex-start;gap:10px;font-size:0.92rem;line-height:1.55;" },
      });
      const bullet = el("span", {
        text: "•",
        attrs: { style: "color:var(--accent);font-size:1.3rem;line-height:1;" },
      });
      const ptText = el("span", { text: pt });
      append(ptItem, bullet, ptText);
      pointsList.appendChild(ptItem);
    });
    explBody.appendChild(pointsList);
  }

  // Practical Takeaway
  if (explanationData.coreConcept) {
    const takeawayBox = el("div", {
      attrs: {
        style:
          "padding:12px 16px;background:rgba(123, 179, 211, 0.15);border-radius:var(--radius);font-size:0.88rem;color:var(--text);",
      },
    });
    append(
      takeawayBox,
      el("strong", { text: "Key Takeaway: " }),
      el("span", { text: explanationData.coreConcept })
    );
    explBody.appendChild(takeawayBox);
  }

  // ── 3. Prominent "Next" button under the explanation ────────────────────
  const nextQuizRow = el("div", {
    attrs: {
      style:
        "display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-top:20px;padding-top:16px;border-top:1px solid var(--border);",
    },
  });

  const nextDesc = el("p", {
    cls: "text-muted",
    text: "Ready to test your knowledge? Take the quiz to mark this chapter as 100% complete.",
    attrs: { style: "font-size:0.85rem;margin:0;flex:1;min-width:200px;" },
  });

  const nextToQuizBtn = el("button", {
    cls: "btn btn-primary",
    text: "Next: Take Quiz →",
    attrs: {
      type: "button",
      style: "font-size:1rem;padding:12px 24px;font-weight:700;",
      "aria-label": "Proceed to chapter quiz",
    },
  });

  append(nextQuizRow, nextDesc, nextToQuizBtn);
  append(explCard, explHeader, explBody, nextQuizRow);
  wrap.appendChild(explCard);

  // ── 4. Quiz Container (Revealed or Scrolled into upon clicking "Next") ───
  const quizAnchor = el("div", { attrs: { id: "quiz-section-anchor", style: "display:none;" } });
  const questions = generateQuiz(section);

  const nextChapterLabel = nextSec
    ? `Next Chapter: Chapter ${secIdx + 2} →`
    : "Finish Course →";

  const quizCard = createQuiz(questions, {
    nextLabel: nextChapterLabel,
    onComplete: (score) => {
      // Mark chapter as complete in progress and save score
      const updated = completeSection(progress, section.id, nextSec ? nextSec.id : null);
      if (!updated.scores) updated.scores = {};
      updated.scores[section.id] = {
        quiz: {
          correct: score.correct,
          total: score.total,
          attempts: (updated.scores[section.id]?.quiz?.attempts || 0) + 1,
        },
      };
      saveProgress(updated);
    },
    onSkip: () => {
      // User chose to skip quiz
      if (nextSec) {
        onChapterComplete(progress, nextSec.id);
      } else {
        onBack();
      }
    },
    onNextChapter: () => {
      // User completed quiz and clicked next chapter
      if (nextSec) {
        onChapterComplete(progress, nextSec.id);
      } else {
        // Last chapter finished: navigate to /final or show course complete
        navigate("/final");
      }
    },
  });

  quizAnchor.appendChild(quizCard);
  wrap.appendChild(quizAnchor);

  // Clicking "Next" reveals the quiz card and smoothly scrolls into view
  nextToQuizBtn.addEventListener("click", () => {
    quizAnchor.style.display = "block";
    nextToQuizBtn.style.display = "none";
    nextDesc.textContent = "Answer the questions below or skip to continue:";
    quizAnchor.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  container.appendChild(wrap);
}

/**
 * Modal dialog for Course Flashcards
 */
function _openCourseFlashcards(parent, sections) {
  // Aggregate flashcards from all sections
  let allCards = [];
  sections.forEach((sec) => {
    const cards = generateFlashcards(sec);
    allCards.push(...cards);
  });

  if (allCards.length === 0) {
    allCards = [
      {
        front: "What is this course about?",
        back: "Review the chapters in the checklist to explore all concepts in detail.",
      },
    ];
  }

  let modal = null;
  const deck = createFlashcardDeck(allCards, {
    onClose: () => {
      if (modal) modal.close();
    },
  });

  modal = createModal(parent, {
    title: "Course Flashcards",
    subtitle: "Study and review key concepts across all chapters",
    body: deck,
  });
}
