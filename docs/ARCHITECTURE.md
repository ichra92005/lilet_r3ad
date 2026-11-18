# Architecture Guide — lilet_r3ad

## 1. System Overview

`lilet_r3ad` is a 100% browser-based educational assistant. It has no backend server, no external AI API, and no telemetry. All computation, file extraction, structure analysis, embedding-free keyword retrieval (BM25-lite), and language model inference run inside the client environment.

```
┌────────────────────────────────────────────────────────────┐
│                        User Browser                        │
│                                                            │
│  ┌─────────────────────── UI Thread ────────────────────┐  │
│  │                                                      │  │
│  │  Router (#/, #/app, #/teacher, #/path, #/final)      │  │
│  │  Observable State (store.js, state.js)               │  │
│  │  Pipeline (extract.js -> structure.js -> split.js)  │  │
│  │  Search BM25-lite (search.js, text.js)               │  │
│  │  Priority Generation Queue (engine.js)               │  │
│  │                                                      │  │
│  └──────────────────────────┬───────────────────────────┘  │
│                             │ postMessage                  │
│  ┌──────────────────────────▼───────────────────────────┐  │
│  │                   Web Worker Thread                  │  │
│  │                                                      │  │
│  │  WebLLM Engine Handler (worker.js)                   │  │
│  │  WebGPU Model Runtime (Qwen2.5-1.5B-Instruct-q4f16)  │  │
│  │  IndexedDB Model Cache                               │  │
│  │                                                      │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

---

## 2. Directory Structure & Responsibilities

- **`src/app/`**:
  - `config.js`: Constant definitions (model ID, character budgets, target chunk sizes, schema version).
  - `router.js`: Lightweight hash router (`navigate`, `onRoute`, `getCurrentRoute`).
  - `state.js`: Observable shared memory for course, progress, and engine status.
- **`src/core/`**:
  - `engine.js`: WebLLM singleton wrapper, priority queue, and streaming interface.
  - `worker.js`: WebLLM Worker handler execution entry point.
  - `prompts.js`: Central prompt repository and message builder functions.
  - `json-guard.js`: JSON extraction, bracket counting, schema validation, and retry handler.
- **`src/document/`**:
  - `extract.js`: PDF (pdf.js), Word (mammoth), and text extractors.
  - `structure.js`: Outline detection via bookmarks, headings, patterns, and TextTiling.
  - `split.js`: Size-bounded splitter with sentence boundary preservation.
  - `search.js`: BM25-lite keyword scoring with Unicode normalization.
  - `pipeline.js`: Public processing seam connecting raw file to normalized Course object.
- **`src/learning/`**:
  - `generate.js`: Cache layer for on-demand generated content.
  - `progress.js`: Completion tracking and percentage calculation.
  - `final-quiz.js`: Cross-section quiz generator and scoring utilities.
- **`src/storage/`**:
  - `store.js`: Versioned `localStorage` manager with migration and quota handling.
- **`src/utils/`**:
  - `dom.js`: Safe DOM manipulation (textContent only, `dir="auto"`).
  - `text.js`: Multilingual Unicode text normalizer (Arabic, French, English).
  - `async.js`: Mutex locks and timeout utilities.
- **`src/screens/`**:
  - `landing.js`, `app.js`, `teacher.js`, `path.js`, `final.js`.
- **`src/components/`**:
  - Reusable UI elements: `modal.js`, `status-chip.js`, `chat.js`, `progress-bar.js`, `flashcards.js`, `quiz.js`, `outline-editor.js`.

---

## 3. Key Design Decisions

1. **Security & Zero XSS Policy:**
   No `innerHTML` or `insertAdjacentHTML` is used with dynamic content. All text is inserted via `textContent`. Every text container has `dir="auto"` to properly format right-to-left languages (Arabic).
2. **Non-blocking Model Loading:**
   The AI model loads inside a dedicated Web Worker immediately upon visiting the landing page. The user can navigate, upload documents, and inspect sections without any main thread stutter.
3. **Queue Prioritization:**
   Interactive user chat takes priority over background generative tasks. If a user asks a question while background jobs are waiting, the question jumps to the head of the line.
