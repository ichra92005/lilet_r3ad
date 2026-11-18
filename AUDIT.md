# Technical Audit & Architecture Review — lilet_r3ad

Date: 2026-11-14  
Scope: Frontend application (Vite + vanilla JavaScript + WebLLM + Web Worker)  
Audited files: `index.html`, `src/**`, `tests/**`, `public/**`

---

## 1. Audit Matrix

| ID | Severity | File | Problem | Fix | Status |
|:---|:---|:---|:---|:---|:---|
| **AUD-01** | **Critical** | `src/style.css` | Duplicate CSS rules & syntax errors from manual edits causing Vite build failure (`Invalid qualified rule`). | Consolidate stylesheets into modular `tokens.css`, `base.css`, and `components.css`; import via clean Vite pipeline. | **FIXED** |
| **AUD-02** | **Critical** | `src/main.js` | Monolithic 800+ line file holding all application logic, rendering, event listeners, and engine calls. Crashes if DOM elements are missing. | Decomposed into decoupled architecture: `src/app/router.js`, `src/screens/*`, `src/components/*`, `src/core/*`. | **FIXED** |
| **AUD-03** | **Critical** | `src/engine.js` | Direct instantiation on main thread previously blocked UI responsiveness during heavy model weight downloads and compilation. | Moved model execution entirely to dedicated Web Worker via `CreateWebWorkerMLCEngine` and `WebWorkerMLCEngineHandler`. | **FIXED** |
| **AUD-04** | **High** | `src/core/engine.js` | Concurrent generation calls could corrupt KV-cache or produce interleaved output. Background generation could block immediate user questions. | Implemented priority generation queue: User chat turns jump ahead of background jobs, synchronized via mutex. | **FIXED** |
| **AUD-05** | **High** | `src/storage/store.js` | Browser localStorage quota exhaustion (5MB limit) on large course storage throws unhandled `QuotaExceededError`. | Wrapped storage in try/catch with quota detection and user-facing alert banner (`_showQuotaError`). | **FIXED** |
| **AUD-06** | **High** | `src/storage/store.js` | Older schema (`{ name, savedAt, parts }`) lacks chapters, charCounts, and version tracking. | Implemented transparent v1 → v2 migration layer in `loadCourse()` with schema version guard. | **FIXED** |
| **AUD-07** | **High** | `src/screens/teacher.js` | If student sends a question before WebLLM finishes loading (or on cold start), request was either dropped or caused an error. | Queued user questions automatically with progress notice; auto-executes generation upon `whenReady()`. | **FIXED** |
| **AUD-08** | **High** | `src/components/modal.js` | Modal lacked keyboard focus trap and Escape key listener, violating WCAG modal dialog accessibility. | Implemented modal focus trap, `aria-modal="true"`, `role="dialog"`, and `Escape` key close listener. | **FIXED** |
| **AUD-09** | **Medium** | `src/document/extract.js` | Remote CDN dynamic imports for PDF.js and Mammoth could fail in offline environments without clear error. | Added fallback heuristic extractors for plaintext/PDF and graceful error reporting in the UI. | **FIXED** |
| **AUD-10** | **Medium** | `src/document/search.js` | Search BM25 tokenizer was duplicated between `search.js` and `structure.js`. | Extracted centralized Unicode text normalizer (`normalizeToken`, `tokenize`, `splitSentences`) in `src/utils/text.js`. | **FIXED** |
| **AUD-11** | **Medium** | `src/app/config.js` | Magic numbers (model ID, char limits, target sizes, history length) scattered across multiple files. | Centralized all application constants in `src/app/config.js`. | **FIXED** |
| **AUD-12** | **Medium** | `src/core/json-guard.js` | Future study-partner tasks (quiz, flashcards) require structured JSON from small 1.5B LLM which often adds markdown fences or broken formatting. | Created `jsonGuard(text, schema, onRetry)` to parse fenced/bare JSON, validate structure, and repair once on failure. | **FIXED** |
| **AUD-13** | **Medium** | `src/screens/landing.js` | Duplicate code and missing responsive styles for mobile viewports. | Cleaned up landing renderer and added responsive media queries in `components.css`. | **FIXED** |
| **AUD-14** | **Low** | `index.html` | Hardcoded DOM layout prevented true single-page routing without full page reload. | Converted `index.html` to minimal mount shell with header and dynamic `#screen-container`. | **FIXED** |
| **AUD-15** | **Low** | `src/components/status-chip.js`| Status chip lacked accessibility announcements when model finished loading. | Added `aria-live="polite"` and clear text states. | **FIXED** |
| **AUD-16** | **Low** | Root | Missing `netlify.toml` and npm test/check scripts for automated CI/CD. | Added `netlify.toml` and package scripts (`test`, `check`). | **FIXED** |

---

## 2. Summary Counts
- **Critical:** 3 (3 fixed, 0 remaining)
- **High:** 5 (5 fixed, 0 remaining)
- **Medium:** 5 (5 fixed, 0 remaining)
- **Low:** 3 (3 fixed, 0 remaining)
- **Total Audited Items:** 16  
- **Total Fixed:** 16  
- **Remaining Issues:** 0
