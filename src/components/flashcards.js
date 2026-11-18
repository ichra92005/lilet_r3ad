/**
 * src/components/flashcards.js
 * Flashcard display component (flip interaction).
 * Uses peach palette with dark navy text on pastel fill.
 */

import { el, append } from "../utils/dom.js";

/**
 * Creates a flashcard component.
 * @param {Array<{ front: string, back: string }>} cards
 * @param {object} [options]
 * @param {(results: { seen: number, known: number }) => void} [options.onComplete]
 * @param {() => void} [options.onClose]
 * @returns {HTMLElement}
 */
export function createFlashcardDeck(cards, { onComplete, onClose } = {}) {
  const container = el("div", {
    cls: "flashcards-deck card",
    attrs: {
      style: "display:flex;flex-direction:column;align-items:center;gap:18px;padding:24px;max-width:620px;margin:0 auto;width:100%;",
    },
  });

  if (!cards || cards.length === 0) {
    container.appendChild(el("p", { cls: "empty-hint", text: "No flashcards available for this section." }));
    if (onClose) {
      const closeBtn = el("button", { cls: "btn btn-outline btn-sm", text: "Close", attrs: { type: "button" } });
      closeBtn.addEventListener("click", onClose);
      container.appendChild(closeBtn);
    }
    return container;
  }

  let index = 0;
  let isFlipped = false;
  let knownCount = 0;

  const topRow = el("div", {
    attrs: { style: "display:flex;justify-content:space-between;align-items:center;width:100%;" },
  });

  const counter = el("span", {
    cls: "quiz-tag",
    text: `Card 1 of ${cards.length}`,
    attrs: {
      style:
        "background:var(--peach);color:var(--text-on-pastel);font-weight:700;padding:4px 12px;border-radius:9999px;font-size:0.8rem;",
    },
    dirAuto: false,
  });

  topRow.appendChild(counter);

  if (onClose) {
    const closeBtn = el("button", {
      cls: "btn btn-ghost btn-sm",
      text: "✕ Done",
      attrs: { type: "button", style: "color:var(--muted);font-weight:600;" },
    });
    closeBtn.addEventListener("click", onClose);
    topRow.appendChild(closeBtn);
  }

  const cardBox = el("div", {
    cls: "flashcard-card",
    attrs: {
      tabindex: "0",
      role: "button",
      "aria-label": "Flashcard, click or press Space to flip",
      style:
        "width:100%;min-height:190px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:28px 24px;background:var(--peach);color:var(--text-on-pastel);border:2px solid rgba(46,43,95,0.18);border-radius:var(--radius-lg);cursor:pointer;text-align:center;box-shadow:var(--shadow);transition:all 0.22s ease;",
    },
  });

  const flipHint = el("span", {
    text: "Tap or click to flip 🔄",
    attrs: {
      style: "font-size:0.75rem;opacity:0.75;margin-bottom:8px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;",
    },
  });

  const content = el("p", {
    text: cards[0].front,
    attrs: { style: "font-size:1.15rem;font-weight:600;line-height:1.5;margin:0;" },
  });

  append(cardBox, flipHint, content);

  const flip = () => {
    isFlipped = !isFlipped;
    flipHint.textContent = isFlipped ? "Answer / Back 💡 (tap to flip)" : "Question / Front ❓ (tap to flip)";
    content.textContent = isFlipped ? cards[index].back : cards[index].front;
    cardBox.style.transform = isFlipped ? "rotateY(0deg) scale(1.02)" : "rotateY(0deg) scale(1)";
  };

  cardBox.addEventListener("click", flip);
  cardBox.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      flip();
    }
  });

  const actions = el("div", {
    attrs: { style: "display:flex;gap:12px;width:100%;justify-content:center;flex-wrap:wrap;" },
  });

  const flipBtn = el("button", {
    cls: "btn btn-outline btn-sm",
    text: "Flip card 🔄",
    attrs: { type: "button" },
  });
  flipBtn.addEventListener("click", flip);

  const knownBtn = el("button", {
    cls: "btn btn-primary btn-sm",
    text: "I know this ✓",
    attrs: { type: "button" },
  });
  knownBtn.addEventListener("click", () => {
    knownCount++;
    nextCard();
  });

  const nextBtn = el("button", {
    cls: "btn btn-outline btn-sm",
    text: "Next card →",
    attrs: { type: "button" },
  });
  nextBtn.addEventListener("click", () => nextCard());

  append(actions, flipBtn, knownBtn, nextBtn);
  append(container, topRow, cardBox, actions);

  function nextCard() {
    index++;
    if (index >= cards.length) {
      container.textContent = "";
      const done = el("div", {
        attrs: {
          style:
            "text-align:center;padding:28px 20px;display:flex;flex-direction:column;align-items:center;gap:12px;",
        },
      });

      append(
        done,
        el("span", { text: "🎉", attrs: { style: "font-size:3rem;" }, dirAuto: false }),
        el("h4", { text: "Flashcards completed!", attrs: { style: "font-size:1.3rem;color:var(--text);" } }),
        el("p", {
          cls: "text-muted",
          text: `You marked ${knownCount} of ${cards.length} cards as known.`,
        })
      );

      const reviewRow = el("div", { attrs: { style: "display:flex;gap:10px;margin-top:8px;" } });
      const restartBtn = el("button", {
        cls: "btn btn-outline btn-sm",
        text: "Review Again 🔄",
        attrs: { type: "button" },
      });
      restartBtn.addEventListener("click", () => {
        index = -1;
        knownCount = 0;
        nextCard();
      });
      reviewRow.appendChild(restartBtn);

      if (onClose) {
        const doneBtn = el("button", {
          cls: "btn btn-primary btn-sm",
          text: "Back to Chapter",
          attrs: { type: "button" },
        });
        doneBtn.addEventListener("click", onClose);
        reviewRow.appendChild(doneBtn);
      }

      done.appendChild(reviewRow);
      container.appendChild(done);

      if (onComplete) onComplete({ seen: cards.length, known: knownCount });
      return;
    }

    isFlipped = false;
    flipHint.textContent = "Tap or click to flip 🔄";
    content.textContent = cards[index].front;
    cardBox.style.transform = "none";
    counter.textContent = `Card ${index + 1} of ${cards.length}`;
  }

  return container;
}
