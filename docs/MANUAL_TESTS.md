# Manual Testing Checklist — lilet_r3ad

Run these steps in **desktop Google Chrome or Microsoft Edge** on a machine with a WebGPU-compatible GPU.

---

## 1. Landing & Automatic Model Loading
- [ ] **Test 1.1: Automatic boot load**
  - Open `http://localhost:5173/` (or production URL).
  - Observe the top status chip or console: model loading begins automatically without clicking any button.
  - Verify the landing page shows the "lilet_r3ad" title, tagline, 3 feature cards, privacy lock note, and "Start studying" button.
- [ ] **Test 1.2: Navigation while model is loading**
  - While the model is still downloading (0%–50%), click "Start studying".
  - Verify the app transitions immediately to `#/app` without freezing or hitching.

---

## 2. Document Upload & Extraction
- [ ] **Test 2.1: PDF Upload**
  - Drag and drop or browse to select a standard multi-page PDF.
  - Verify chat shows progressive status bubbles: "Reading file…", "Finding sections…", "Found N sections…".
  - Verify the Mode Selection popup appears automatically after extraction.
- [ ] **Test 2.2: DOCX and TXT Upload**
  - Test uploading a Word document (`.docx`) and a plaintext file (`.txt`).
  - Verify both produce structured sections without error.
- [ ] **Test 2.3: Arabic Document (RTL Check)**
  - Upload an Arabic course document (PDF or TXT).
  - Check that Arabic headings and paragraph text render right-to-left (`dir="auto"`).
  - Verify Arabic diacritics (tashkeel) and tatweel (kashida) do not crash the outline splitter.

---

## 3. Mode Selection & Routing
- [ ] **Test 3.1: Mode Popup Interaction**
  - Click "Teacher" card → verify URL becomes `#/teacher`.
  - Click browser Back button → verify you return to `#/app`.
  - Click browser Forward button → verify you return to `#/teacher`.
- [ ] **Test 3.2: Study Partner Placeholder**
  - On `#/app`, select "Study partner" (or click "Study partner →" in the Teacher sidebar).
  - Verify URL is `#/path`.
  - Verify all course section titles are listed with step numbers.
  - Click "← Back to chat" → verify navigation to `#/teacher`.

---

## 4. Tutor Chat & AI Generation
- [ ] **Test 4.1: Message Sent Before Model is Ready**
  - Clear browser cache, reload, quickly navigate to `#/app`, upload a document, enter `#/teacher`.
  - Send a question while the model is still loading (e.g. at 30%).
  - Verify the assistant bubble shows: *"The AI is still loading (XX%). I will answer as soon as it is ready."*
  - Wait for loading to reach 100% → verify the assistant automatically streams the answer once ready.
- [ ] **Test 4.2: In-Document Grounding**
  - Ask a question directly covered by the uploaded text.
  - Check that answer is concise (≤ 6 sentences) and cites "Source: Part X" underneath.
  - Ask a question completely outside the document (e.g. "What is the capital of Mars?").
  - Verify the assistant strictly answers: *"This is not in your document."*
- [ ] **Test 4.3: Quick Action Buttons**
  - Click "Simplify" → verifies answer is re-explained in simpler terms.
  - Click "Give an example" → verifies an example is generated from the document.
  - Click "Summarize this part" → verifies a 4-bullet point summary.
  - Click "Explain like I'm 10" → verifies simplified kid-friendly language.
- [ ] **Test 4.4: Chat About Selector**
  - Change "Chat about:" from "Whole document" to a specific section.
  - Verify the source citation strictly references that selected part.

---

## 5. Persistence, State & Offline Reload
- [ ] **Test 5.1: Refresh on Teacher Screen**
  - On `#/teacher`, refresh the browser page (F5 / Cmd+R).
  - Verify the course is retained from storage and sections/chat are restored.
- [ ] **Test 5.2: Offline / Cached Load**
  - After the model has been downloaded once, refresh the page.
  - Verify WebLLM loads the model quickly from CacheStorage / IndexedDB.
- [ ] **Test 5.3: New Course Clear**
  - Click the "New course" button in the header.
  - Verify stored course is cleared, app redirects to `#/app`, and upload zone is reset.

---

## 6. Accessibility & Responsiveness
- [ ] **Test 6.1: Keyboard Navigation & Modal Escape**
  - On `#/app`, trigger the mode popup.
  - Press `Tab` and `Shift+Tab` to verify focus stays trapped inside the dialog.
  - Press `Escape` → verify modal closes.
- [ ] **Test 6.2: Mobile Width Layout**
  - Open Chrome DevTools and toggle Device Toolbar (e.g. iPhone 14, 390px).
  - Verify layout stacks vertically without horizontal overflow or clipping.
