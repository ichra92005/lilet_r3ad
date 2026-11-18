/**
 * src/components/outline-editor.js
 * Outline editor component for reviewing, renaming, splitting, and merging chapters and sections.
 */

import { el, append, empty } from "../utils/dom.js";

/**
 * Creates an outline tree editor.
 *
 * @param {object} outline - { name, chapters, method }
 * @param {object} options
 * @param {(updatedOutline: object) => void} options.onChange
 * @returns {HTMLElement}
 */
export function createOutlineEditor(outline, { onChange }) {
  const container = el("div", { cls: "outline-tree" });

  function render() {
    empty(container);

    (outline.chapters || []).forEach((ch, chIdx) => {
      const chapterCard = el("div", { cls: "outline-chapter" });

      // Header
      const header = el("div", { cls: "outline-chapter-header" });
      const titleGroup = el("div", { attrs: { style: "display:flex;align-items:center;gap:8px;flex:1;" } });
      const badge = el("span", { cls: "badge", text: `Chapter ${chIdx + 1}`, dirAuto: false });

      const titleInput = el("input", {
        cls: "input-edit-title",
        attrs: { type: "text", "aria-label": `Title for Chapter ${chIdx + 1}` },
      });
      titleInput.value = ch.title || `Chapter ${chIdx + 1}`;
      titleInput.addEventListener("input", (e) => {
        ch.title = e.target.value;
        if (onChange) onChange(outline);
      });

      append(titleGroup, badge, titleInput);
      header.appendChild(titleGroup);

      // Chapter actions (Merge with next)
      if (chIdx < outline.chapters.length - 1) {
        const mergeBtn = el("button", {
          cls: "btn-outline-action",
          text: "Merge with next chapter",
          attrs: { type: "button" },
        });
        mergeBtn.addEventListener("click", () => {
          const nextCh = outline.chapters[chIdx + 1];
          ch.sections = ch.sections || [];
          ch.sections.push(...(nextCh.sections || []));
          outline.chapters.splice(chIdx + 1, 1);
          render();
          if (onChange) onChange(outline);
        });
        header.appendChild(mergeBtn);
      }

      chapterCard.appendChild(header);

      // Section List
      const sectionList = el("div", { cls: "outline-section-list" });

      (ch.sections || []).forEach((sec, secIdx) => {
        const secItem = el("div", { cls: "outline-section-item" });

        const secInput = el("input", {
          cls: "input-edit-title",
          attrs: { type: "text", "aria-label": `Title for section ${sec.title}` },
        });
        secInput.value = sec.title;
        secInput.addEventListener("input", (e) => {
          sec.title = e.target.value;
          if (onChange) onChange(outline);
        });
        secItem.appendChild(secInput);

        const infoRow = el("div", { attrs: { style: "display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;" } });
        const charCount = (sec.text || "").length;
        const countBadge = el("span", { cls: "outline-char-count", text: `${charCount.toLocaleString()} chars`, dirAuto: false });
        infoRow.appendChild(countBadge);

        const actionsRow = el("div", { cls: "outline-actions-row" });

        // Split button
        const splitBtn = el("button", { cls: "btn-outline-action", text: "Split", attrs: { type: "button" } });
        splitBtn.addEventListener("click", () => {
          const text = sec.text || "";
          const mid = Math.floor(text.length / 2);
          const splitIdx = text.indexOf("\n\n", mid) !== -1 ? text.indexOf("\n\n", mid) : mid;
          const text1 = text.slice(0, splitIdx).trim();
          const text2 = text.slice(splitIdx).trim();

          sec.text = text1;
          const newSec = {
            id: Date.now() + Math.random(),
            title: `${sec.title} (Part 2)`,
            text: text2,
          };
          ch.sections.splice(secIdx + 1, 0, newSec);
          render();
          if (onChange) onChange(outline);
        });
        actionsRow.appendChild(splitBtn);

        // Delete button
        const delBtn = el("button", { cls: "btn-outline-action btn-outline-danger", text: "Delete", attrs: { type: "button" } });
        delBtn.addEventListener("click", () => {
          ch.sections.splice(secIdx, 1);
          if (ch.sections.length === 0 && outline.chapters.length > 1) {
            outline.chapters.splice(chIdx, 1);
          }
          render();
          if (onChange) onChange(outline);
        });
        actionsRow.appendChild(delBtn);

        infoRow.appendChild(actionsRow);
        secItem.appendChild(infoRow);
        sectionList.appendChild(secItem);
      });

      chapterCard.appendChild(sectionList);
      container.appendChild(chapterCard);
    });
  }

  render();
  return container;
}
