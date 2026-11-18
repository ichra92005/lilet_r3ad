# Data Contracts & Schemas — lilet_r3ad

This document outlines the canonical JSON schemas and validation contracts for storage, learning progression, model-generated artifacts, and active chat sessions.

---

## 1. Course Schema (`SCHEMA_VERSION = 2`)

Persisted in `localStorage` under `lilet_r3ad_course`.

```typescript
interface Course {
  schemaVersion: 2;
  id: string;               // Unique timestamp identifier, e.g. "1710410000000"
  name: string;             // File name, e.g. "Biology_101.pdf"
  createdAt: number;        // Epoch timestamp (ms)
  method: "pdf-outline" | "headings" | "patterns" | "topic-shift" | "size";
  chapters: Chapter[];
  sections: Section[];      // Flat list of all sections, maintains backward compatibility
}

interface Chapter {
  id: number;               // 1-based index
  title: string;            // e.g. "Chapter 1: Cell Structure"
  level: number;            // 1, 2, or 3
  sectionIds: number[];     // IDs of sections belonging to this chapter
}

interface Section {
  id: number;               // 1-based unique identifier across document
  chapterId: number;        // Reference to parent chapter
  title: string;            // Generated or extracted section title
  text: string;             // Section body content (500–2400 chars)
  charCount: number;        // Length of text in characters
}
```

### Migration Policy:
- V1 documents (`{ name, savedAt, parts: [{ id, title, text }] }`) are automatically migrated into V2 schema on read via `store.js` (`_migrateV1`).

---

## 2. Progress Schema

Persisted in `localStorage` under `lilet_r3ad_progress`.

```typescript
interface Progress {
  courseId: string;
  currentSectionId: number | null;
  completedSectionIds: number[];
  scores: {
    [sectionId: number]: {
      flashcards?: {
        seen: number;
        known: number;
      };
      quiz?: {
        correct: number;
        total: number;
        attempts: number;
      };
    };
  };
  finishedAt?: number | null;
}
```

---

## 3. Generated Cache Schema

Persisted in `localStorage` under `lilet_r3ad_generated` as a map of `sectionId -> GeneratedSection`.

```typescript
interface GeneratedSectionCache {
  [sectionId: number]: {
    sectionId: number;
    simple?: string[];            // Bullet points for "Simplify"
    eli10?: string[];             // "Explain like I'm 10" explanation
    flashcards?: Flashcard[];     // Generated flashcards
    quiz?: QuizQuestion[];        // Section review quiz
    generatedAt: number;
    modelId: string;
  };
}

interface Flashcard {
  front: string;
  back: string;
}

interface QuizQuestion {
  q: string;
  options: [string, string, string, string]; // Exactly 4 choices
  answer: 0 | 1 | 2 | 3;                      // 0-based index of correct option
  explanation: string;
}
```

---

## 4. Chat Session Schema

In-memory exchange buffer per screen (`scope = "course" | sectionId`).

```typescript
interface ChatSession {
  scope: "course" | number;      // "course" for tutor chat, sectionId for path side-chat
  history: ChatExchange[];
  lastAnswer: string;
  lastQuestion: string;
}

interface ChatExchange {
  role: "user" | "assistant" | "system";
  content: string;
  sources?: number[];            // Section IDs used in context prompt
}
```

---

## 5. Validation Rules
1. **Never exceed context limits:** Maximum 3000 chars of document context sent to model (`buildTutorMessages`).
2. **Never break mid-sentence:** Split boundaries must align with sentence-ending punctuation (`.`, `!`, `?`, `؟`).
3. **JSON Guard:** Extracted model JSON must be parsed through `jsonGuard()` and checked against structural schemas before saving to cache.
