# lilet_r3ad ⚡

> **In-browser AI study assistant.** AI inference runs locally; Supabase provides email accounts and private cloud-synced book libraries.
> Built with vanilla JavaScript + Vite + WebLLM (`Qwen2.5-1.5B-Instruct-q4f16_1-MLC`).

---

## 🌟 Features

- **Local AI in Web Worker:** The LLM runs locally inside your browser via WebGPU inside a background Web Worker so the interface never freezes.
- **Multilingual Support:** Full Unicode normalization and right-to-left (`dir="auto"`) formatting for Arabic, French, and English courses.
- **Document Processing:** Supports PDF, DOCX, and TXT files with structure-aware chapter and section extraction.
- **Strict Grounding:** The AI only answers using facts from your uploaded course. If the answer is not in the material, it says so directly.
- **Per-account libraries:** Uploaded books are stored in Supabase and protected by row-level security so each account sees only its own books.
- **Local AI:** Course content used for inference stays in the browser; Supabase is used for account authentication and book synchronization.

---

## 📋 Product Flow

1. **Landing Screen (`#/`):** Feature overview, privacy reassurance, and non-blocking background model loading.
2. **Upload Screen (`#/app`):** Drag-and-drop course upload, real-time section extraction, and Mode Selection popup.
3. **Teacher Mode (`#/teacher`):** Grounded tutor chat with BM25-lite keyword retrieval, quick prompts (Simplify, Example, Summarize, ELI10), and source citations.
4. **Study Partner (`#/path`):** Structured section roadmap designed for guided learning, flashcards, and quizzes.

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js:** v18+ (Node 20+ recommended)
- **Browser:** Desktop Google Chrome or Microsoft Edge with WebGPU enabled.

### 2. Install & Run Locally
```bash
# Install dependencies
npm install

# Start local dev server
npm run dev
```
Open `http://localhost:5173` in Chrome or Edge.

### 3. Configure Supabase

Create a Supabase project, then run [`supabase/schema.sql`](supabase/schema.sql) in its SQL Editor to create the user-owned book table and row-level security policy. Copy `.env.example` to `.env` and set the project URL and anon key:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Set the same two environment variables in Vercel for every deployment environment, then redeploy. The anon key is intended for browser use; never use a service-role key in the client.

---

## 🧪 Testing & Verification

```bash
# Run pure module unit tests
npm test

# Build production bundle and run test suite
npm run check
```

---

## 📦 Production Build & Deployment

```bash
# Build production bundle into dist/
npm run build

# Preview production build locally
npm run preview
```

### Deploy to Netlify
The project includes a pre-configured `netlify.toml`:
- **Build command:** `npm run build`
- **Publish directory:** `dist`
- **Headers:** Configured for cross-origin worker isolation and client-side single page app routing.

---

## 📖 Documentation
- [Architecture Guide](docs/ARCHITECTURE.md)
- [Data Schemas & Contracts](docs/SCHEMAS.md)
- [Manual Testing Checklist](docs/MANUAL_TESTS.md)
- [Technical Audit](AUDIT.md)
