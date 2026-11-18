/**
 * Text and structure extraction for PDF, DOCX, and TXT files directly in the browser.
 * Returns { text, blocks } where blocks is an array of:
 * { type: "heading" | "para", level?: number, text: string, page?: number, fromOutline?: boolean }
 */

/**
 * Extracts plain text and semantic blocks from a File object (.txt, .pdf, .docx).
 *
 * @param {File} file
 * @returns {Promise<{ text: string, blocks: Array<{ type: "heading" | "para", level?: number, text: string, page?: number, fromOutline?: boolean }> }>}
 */
export async function extractText(file) {
  if (!file) throw new Error("No file provided");

  const name = file.name || "";
  const ext = name.split(".").pop().toLowerCase();

  let res;
  if (ext === "pdf" || file.type === "application/pdf") {
    res = await extractPdf(file);
  } else if (
    ext === "docx" ||
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    res = await extractDocx(file);
  } else {
    res = await extractTxt(file);
  }

  // Ensure backward compatibility: return object with text, blocks and toString()
  return {
    text: res.text || "",
    blocks: res.blocks || [],
    toString() {
      return this.text;
    },
  };
}

/**
 * Extract text and blocks from PDF.
 * Checks pdf.getOutline() first. If empty, rebuilds lines from getTextContent()
 * with font-size and bold heading detection, removing running headers/footers.
 */
async function extractPdf(file) {
  const arrayBuffer = await file.arrayBuffer();

  try {
    const pdfjs = await import(
      /* @vite-ignore */ "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs"
    );
    if (pdfjs?.GlobalWorkerOptions) {
      pdfjs.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs";
    }

    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;

    // 1. Try outline (bookmarks) first
    let outline = null;
    try {
      outline = await pdf.getOutline();
    } catch {
      outline = null;
    }

    if (Array.isArray(outline) && outline.length > 0) {
      const outlineHeadings = [];
      async function processOutline(items, level = 1) {
        for (const item of items) {
          let pageNum = 1;
          try {
            let dest = item.dest;
            if (typeof dest === "string") {
              dest = await pdf.getDestination(dest);
            }
            if (Array.isArray(dest) && dest[0]) {
              const pageIdx = await pdf.getPageIndex(dest[0]);
              pageNum = pageIdx + 1;
            }
          } catch {
            // Destination resolution failed, default to page 1
          }
          const title = (item.title || "").trim();
          if (title) {
            outlineHeadings.push({
              type: "heading",
              level,
              text: title,
              page: pageNum,
              fromOutline: true,
            });
          }
          if (Array.isArray(item.items) && item.items.length > 0) {
            await processOutline(item.items, level + 1);
          }
        }
      }
      await processOutline(outline, 1);

      if (outlineHeadings.length > 0) {
        const blocks = [];
        const headingsByPage = new Map();
        for (const h of outlineHeadings) {
          if (!headingsByPage.has(h.page)) headingsByPage.set(h.page, []);
          headingsByPage.get(h.page).push(h);
        }

        for (let p = 1; p <= numPages; p++) {
          if (headingsByPage.has(p)) {
            for (const h of headingsByPage.get(p)) {
              blocks.push(h);
            }
          }
          const page = await pdf.getPage(p);
          const content = await page.getTextContent();
          const pageStrings = content.items.map((i) => i.str || "").filter(Boolean);
          const pageText = pageStrings.join(" ").replace(/\s+/g, " ").trim();
          if (pageText) {
            const paras = pageText.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
            for (const para of paras) {
              blocks.push({ type: "para", text: para, page: p });
            }
          }
        }

        const fullText = blocks.map((b) => b.text).join("\n\n");
        return { text: fullText, blocks };
      }
    }

    // 2. Heuristic extraction: rebuild lines from getTextContent()
    const pagesData = [];
    const fontSizeCounts = new Map();

    for (let p = 1; p <= numPages; p++) {
      const page = await pdf.getPage(p);
      const content = await page.getTextContent();
      const rawItems = content.items || [];
      const lines = [];

      for (const item of rawItems) {
        const str = item.str || "";
        if (!str.trim()) continue;

        const x = item.transform?.[4] || 0;
        const y = item.transform?.[5] || 0;
        const height =
          item.height ||
          Math.abs(item.transform?.[0]) ||
          Math.abs(item.transform?.[3]) ||
          12;
        const fontName = item.fontName || "";
        const isBold = /bold/i.test(fontName);

        const roundedSize = Math.round(height * 2) / 2;
        fontSizeCounts.set(
          roundedSize,
          (fontSizeCounts.get(roundedSize) || 0) + str.length
        );

        // Group by y coordinate with 3px tolerance
        let line = lines.find((l) => Math.abs(l.y - y) <= 3);
        if (!line) {
          line = { y, items: [], page: p };
          lines.push(line);
        }
        line.items.push({ str, x, y, size: roundedSize, isBold });
      }

      // Sort lines top to bottom (descending y)
      lines.sort((a, b) => b.y - a.y);

      // Assemble lines
      const builtLines = [];
      for (const line of lines) {
        const hasArabic = /[\u0600-\u06FF]/.test(
          line.items.map((i) => i.str).join("")
        );
        if (!hasArabic) {
          line.items.sort((a, b) => a.x - b.x);
        }
        const lineText = line.items
          .map((i) => i.str)
          .join(" ")
          .replace(/\s+/g, " ")
          .trim();
        if (!lineText) continue;

        const maxItem = line.items.reduce(
          (max, it) => (it.size > max.size ? it : max),
          line.items[0]
        );

        builtLines.push({
          text: lineText,
          y: Math.round(line.y),
          size: maxItem.size,
          isBold: line.items.some((i) => i.isBold),
          page: p,
        });
      }

      pagesData.push({ pageNum: p, lines: builtLines });
    }

    // Body font size: most common size weighted by characters
    let bodySize = 12;
    let maxCharCount = 0;
    for (const [size, count] of fontSizeCounts.entries()) {
      if (count > maxCharCount) {
        maxCharCount = count;
        bodySize = size;
      }
    }

    // Filter running headers/footers/page numbers
    const lineYOccurrences = new Map();
    if (numPages > 2) {
      for (const page of pagesData) {
        const seen = new Set();
        for (const l of page.lines) {
          const key = `${l.text}|${Math.round(l.y / 5) * 5}`;
          if (!seen.has(key)) {
            seen.add(key);
            lineYOccurrences.set(key, (lineYOccurrences.get(key) || 0) + 1);
          }
        }
      }
    }

    const blocks = [];
    for (const page of pagesData) {
      const validLines = [];
      for (const l of page.lines) {
        // Remove page numbers (only digits)
        if (/^\d+$/.test(l.text.trim())) continue;

        // Remove running headers/footers repeating on > 30% of pages
        const key = `${l.text}|${Math.round(l.y / 5) * 5}`;
        const occ = lineYOccurrences.get(key) || 0;
        if (numPages > 2 && occ / numPages > 0.3) {
          continue;
        }

        validLines.push(l);
      }

      let currentParaLines = [];
      for (let i = 0; i < validLines.length; i++) {
        const line = validLines[i];
        const trimmed = line.text.trim();
        const isHeading =
          line.size >= 1.15 * bodySize ||
          (line.isBold && trimmed.length < 80 && !/[.,;:]$/.test(trimmed));

        if (isHeading && trimmed.length < 90 && !/[.,;:]$/.test(trimmed)) {
          if (currentParaLines.length > 0) {
            blocks.push({
              type: "para",
              text: currentParaLines.join(" "),
              page: page.pageNum,
            });
            currentParaLines = [];
          }
          const level = line.size >= 1.35 * bodySize ? 1 : 2;
          blocks.push({
            type: "heading",
            level,
            text: trimmed,
            page: page.pageNum,
          });
        } else {
          currentParaLines.push(trimmed);
          const nextLine = validLines[i + 1];
          const endsWithPunct = /[.!?؟]$/.test(trimmed);
          // Gap threshold for paragraph break
          if (
            endsWithPunct &&
            nextLine &&
            Math.abs(line.y - nextLine.y) > line.size * 1.8
          ) {
            blocks.push({
              type: "para",
              text: currentParaLines.join(" "),
              page: page.pageNum,
            });
            currentParaLines = [];
          }
        }
      }

      if (currentParaLines.length > 0) {
        blocks.push({
          type: "para",
          text: currentParaLines.join(" "),
          page: page.pageNum,
        });
      }
    }

    const fullText = blocks.map((b) => b.text).join("\n\n");
    return { text: fullText, blocks };
  } catch (err) {
    console.warn("PDF extraction fallback:", err);
    const rawText = await fallbackPdfExtract(arrayBuffer);
    const blocks = rawText
      .split(/\n\s*\n/)
      .map((p) => ({ type: "para", text: p.trim() }))
      .filter((b) => b.text);
    return { text: rawText, blocks };
  }
}

/**
 * Basic heuristic text extractor for uncompressed or simple PDF objects.
 */
function fallbackPdfExtract(buffer) {
  const bytes = new Uint8Array(buffer);
  const text = new TextDecoder("latin1").decode(bytes);
  const matches = [];
  const regex = /\(([^()]+)\)\s*Tj|\[([^\]]+)\]\s*TJ/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match[1]) {
      matches.push(match[1]);
    } else if (match[2]) {
      const subRegex = /\(([^()]+)\)/g;
      let subMatch;
      while ((subMatch = subRegex.exec(match[2])) !== null) {
        matches.push(subMatch[1]);
      }
    }
  }

  const result = matches.join(" ").trim();
  if (result.length > 50) return result;

  throw new Error(
    "Could not extract readable text from PDF. Please ensure the PDF contains selectable text."
  );
}

/**
 * Extract text and blocks from DOCX using Mammoth convertToHtml and DOMParser.
 * Maps h1..h6 to headings (level 1..6), p and li to paragraphs.
 * Never inserts HTML into the active document.
 */
async function extractDocx(file) {
  const arrayBuffer = await file.arrayBuffer();

  try {
    const mammoth = await import(
      /* @vite-ignore */ "https://cdn.jsdelivr.net/npm/mammoth@1.8.0/+esm"
    );
    const result = await mammoth.convertToHtml({ arrayBuffer });
    const html = result.value || "";

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const blocks = [];
    function walkNodes(node) {
      for (const child of node.childNodes) {
        if (child.nodeType === Node.ELEMENT_NODE) {
          const tagName = child.tagName.toLowerCase();
          const headingMatch = tagName.match(/^h([1-6])$/);
          if (headingMatch) {
            const text = child.textContent.trim();
            if (text) {
              blocks.push({
                type: "heading",
                level: parseInt(headingMatch[1], 10),
                text,
              });
            }
          } else if (tagName === "p" || tagName === "li") {
            const text = child.textContent.trim();
            if (text) {
              blocks.push({
                type: "para",
                text,
              });
            }
          } else {
            walkNodes(child);
          }
        }
      }
    }

    walkNodes(doc.body);
    const fullText = blocks.map((b) => b.text).join("\n\n");
    return { text: fullText, blocks };
  } catch (err) {
    console.warn("Mammoth extraction error:", err);
    throw new Error("Could not extract text from DOCX file: " + err.message);
  }
}

/**
 * Extract text and blocks from TXT file.
 * Blocks are paragraphs separated by blank lines.
 */
async function extractTxt(file) {
  const text = await file.text();
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const blocks = paragraphs.map((p) => ({
    type: "para",
    text: p,
  }));

  return { text, blocks };
}
