/**
 * src/components/quiz.js
 * Multiple choice quiz component.
 * Supports:
 * - Doing quiz questions with immediate feedback
 * - Skipping quiz questions ("he can skip them or do them")
 * - Showing score upon completion
 * - Redoing the quiz with rearranged questions and shuffled options ("ll chnage the arrangement")
 * - Passing to the next chapter ("or he can pass to next chp")
 */

import { el, append } from "../utils/dom.js";
import { rearrangeQuiz } from "../learning/generate.js";

/**
 * Creates an interactive quiz component.
 * @param {Array<{ q: string, options: string[], answer: number, explanation?: string }>} initialQuestions
 * @param {object} [options]
 * @param {(results: { correct: number, total: number }) => void} [options.onComplete]
 * @param {() => void} [options.onSkip]
 * @param {() => void} [options.onNextChapter]
 * @param {string} [options.nextLabel]
 * @returns {HTMLElement}
 */
export function createQuiz(initialQuestions, { onComplete, onSkip, onNextChapter, nextLabel = "Next Chapter →" } = {}) {
  const container = el("div", {
    cls: "quiz-container card",
    attrs: { style: "display:flex;flex-direction:column;gap:18px;padding:24px;" },
  });

  if (!initialQuestions || initialQuestions.length === 0) {
    container.appendChild(el("p", { cls: "empty-hint", text: "No quiz questions available for this section." }));
    if (onSkip || onNextChapter) {
      const skipRow = el("div", { attrs: { style: "display:flex;justify-content:center;margin-top:12px;" } });
      const proceedBtn = el("button", {
        cls: "btn btn-primary",
        text: nextLabel,
        attrs: { type: "button" },
      });
      proceedBtn.addEventListener("click", () => {
        if (onNextChapter) onNextChapter();
        else if (onSkip) onSkip();
      });
      skipRow.appendChild(proceedBtn);
      container.appendChild(skipRow);
    }
    return container;
  }

  let questions = [...initialQuestions];
  let index = 0;
  let correctCount = 0;

  function renderCurrent() {
    container.textContent = "";

    // Quiz Finished screen
    if (index >= questions.length) {
      const pct = Math.round((correctCount / questions.length) * 100);
      const isPerfect = pct === 100;
      const summary = el("div", {
        cls: "quiz-summary card-sm",
        attrs: {
          style:
            "text-align:center;padding:28px 20px;display:flex;flex-direction:column;align-items:center;gap:14px;background:var(--surface2);border-radius:var(--radius-lg);",
        },
      });

      const icon = el("img", {
        attrs: {
          src: "/assets/aistudio/student_2f90309c.png",
          alt: "Student mascot",
          style: "width:60px;height:60px;object-fit:contain;border-radius:50%;background:rgba(123,179,211,0.2);padding:4px;",
        },
      });

      const heading = el("h3", {
        text: isPerfect ? "Perfect Score! 100%" : "Quiz Completed!",
        attrs: { style: "font-size:1.4rem;color:var(--text);" },
      });

      const scoreBadge = el("div", {
        cls: "quiz-tag",
        text: `Score: ${correctCount} / ${questions.length} (${pct}%)`,
        attrs: {
          style:
            "display:inline-block;padding:6px 18px;border-radius:9999px;font-size:1rem;font-weight:700;background:var(--sky-blue);color:var(--text-on-pastel);",
        },
      });

      const desc = el("p", {
        cls: "text-muted",
        text: isPerfect
          ? "You mastered this chapter! It has been marked as 100% checked."
          : `You scored ${pct}%. You can redo the quiz with rearranged questions or proceed to the next chapter.`,
      });

      // Actions row: Redo (rearranged) + Next Chapter
      const actionRow = el("div", {
        attrs: { style: "display:flex;gap:12px;flex-wrap:wrap;justify-content:center;margin-top:8px;" },
      });

      const redoBtn = el("button", {
        cls: "btn btn-outline",
        text: "Redo Quiz",
        attrs: {
          type: "button",
          "aria-label": "Redo quiz with changed arrangement",
        },
      });
      redoBtn.addEventListener("click", () => {
        // Rearrange questions and options
        questions = rearrangeQuiz(questions);
        index = 0;
        correctCount = 0;
        renderCurrent();
      });

      const nextChapterBtn = el("button", {
        cls: "btn btn-primary",
        text: nextLabel,
        attrs: { type: "button" },
      });
      nextChapterBtn.addEventListener("click", () => {
        if (onNextChapter) onNextChapter();
      });

      append(actionRow, redoBtn, nextChapterBtn);
      append(summary, icon, heading, scoreBadge, desc, actionRow);
      container.appendChild(summary);

      if (onComplete) onComplete({ correct: correctCount, total: questions.length });
      return;
    }

    const cur = questions[index];

    // Header row: Question X of Y + Skip Quiz button
    const header = el("div", {
      attrs: { style: "display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;" },
    });

    const countBadge = el("span", {
      cls: "quiz-tag",
      text: `Question ${index + 1} of ${questions.length}`,
      attrs: {
        style:
          "background:var(--sky-blue);color:var(--text-on-pastel);font-weight:700;padding:4px 12px;border-radius:9999px;font-size:0.8rem;",
      },
      dirAuto: false,
    });

    header.appendChild(countBadge);

    if (onSkip) {
      const skipBtn = el("button", {
        cls: "btn btn-ghost btn-sm",
        text: "Skip Quiz ⏭",
        attrs: {
          type: "button",
          style: "color:var(--muted);font-weight:600;",
          "aria-label": "Skip this quiz",
        },
      });
      skipBtn.addEventListener("click", () => onSkip());
      header.appendChild(skipBtn);
    }

    // Question title
    const questionText = el("h4", {
      text: cur.q,
      attrs: { style: "font-size:1.1rem;line-height:1.4;color:var(--text);margin-top:4px;" },
    });

    // Options list
    const optionsList = el("div", { attrs: { style: "display:flex;flex-direction:column;gap:10px;" } });
    const explanationEl = el("div", {
      cls: "quiz-explanation-box card-sm",
      attrs: {
        style:
          "display:none;margin-top:10px;padding:12px 16px;background:var(--surface2);border-left:4px solid var(--accent);border-radius:var(--radius);font-size:0.88rem;color:var(--text);",
      },
    });

    const optionButtons = [];

    cur.options.forEach((optText, optIdx) => {
      const btn = el("button", {
        cls: "btn btn-outline quiz-option-btn",
        text: optText,
        attrs: {
          type: "button",
          style:
            "justify-content:flex-start;text-align:left;width:100%;padding:12px 16px;font-size:0.92rem;line-height:1.4;white-space:normal;",
        },
      });

      btn.addEventListener("click", () => {
        optionButtons.forEach((b) => (b.disabled = true));
        const isCorrect = optIdx === cur.answer;

        if (isCorrect) {
          correctCount++;
          btn.style.borderColor = "var(--success)";
          btn.style.background = "rgba(47, 158, 107, 0.18)";
          btn.style.color = "var(--text)";
          btn.style.fontWeight = "700";
        } else {
          btn.style.borderColor = "var(--error)";
          btn.style.background = "rgba(200, 69, 111, 0.18)";
          btn.style.color = "var(--text)";

          // Highlight the correct answer
          if (optionButtons[cur.answer]) {
            optionButtons[cur.answer].style.borderColor = "var(--success)";
            optionButtons[cur.answer].style.background = "rgba(47, 158, 107, 0.18)";
            optionButtons[cur.answer].style.color = "var(--text)";
            optionButtons[cur.answer].style.fontWeight = "700";
          }
        }

        if (cur.explanation) {
          explanationEl.textContent = `Explanation: ${cur.explanation}`;
          explanationEl.style.display = "block";
        }

        const nextRow = el("div", {
          attrs: { style: "display:flex;justify-content:flex-end;margin-top:14px;" },
        });

        const nextBtn = el("button", {
          cls: "btn btn-primary",
          text: index + 1 === questions.length ? "See Score & Finish →" : "Next Question →",
          attrs: { type: "button" },
        });
        nextBtn.addEventListener("click", () => {
          index++;
          renderCurrent();
        });

        nextRow.appendChild(nextBtn);
        container.appendChild(nextRow);
      });

      optionButtons.push(btn);
      optionsList.appendChild(btn);
    });

    append(container, header, questionText, optionsList, explanationEl);
  }

  renderCurrent();
  return container;
}
