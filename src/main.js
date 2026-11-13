import * as webllm from "@mlc-ai/web-llm";

const MODEL = "Qwen2.5-1.5B-Instruct-q4f16_1-MLC";
let engine = null;

const loadBtn = document.getElementById("load");
const askBtn = document.getElementById("ask");
const statusEl = document.getElementById("status");
const outputEl = document.getElementById("output");

const SYSTEM_PROMPT = `You are a study helper for students.
Rules:
- Use ONLY the DOCUMENT given by the student. Do not add facts from your own memory.
- Explain in very simple words and short sentences, like you are talking to a 12-year-old.
- Maximum 6 sentences. Stop after that.
- If the answer is not in the document, say exactly: "This is not in your document."
- Answer in the same language as the document.`;

loadBtn.addEventListener("click", async () => {
  try {
    if (!navigator.gpu) {
      statusEl.textContent = "WebGPU not supported. Use desktop Chrome or Edge.";
      return;
    }
    loadBtn.disabled = true;
    engine = await webllm.CreateMLCEngine(MODEL, {
      initProgressCallback: (p) => (statusEl.textContent = p.text),
    });
    statusEl.textContent = "Model ready";
    askBtn.disabled = false;
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Load error: " + err.message;
    loadBtn.disabled = false;
  }
});

askBtn.addEventListener("click", async () => {
  try {
    const doc = document.getElementById("doc").value.trim();
    const question = document.getElementById("question").value.trim();

    if (!engine) {
      outputEl.textContent = "Load the model first.";
      return;
    }
    if (!doc) {
      outputEl.textContent = "Paste a document first.";
      return;
    }

    const task = question
      ? `Answer this question using the document: ${question}`
      : "Explain the main idea of the document in a very simple way.";

    askBtn.disabled = true;
    outputEl.textContent = "Thinking...";

    const stream = await engine.chat.completions.create({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `DOCUMENT:\n"""\n${doc}\n"""\n\nTASK: ${task}` },
      ],
      temperature: 0.2,
      max_tokens: 300,
      frequency_penalty: 0.3,
      stream: true,
    });

    outputEl.textContent = "";
    for await (const chunk of stream) {
      outputEl.textContent += chunk.choices[0]?.delta?.content || "";
    }
  } catch (err) {
    console.error(err);
    outputEl.textContent = "Error: " + err.message;
  } finally {
    askBtn.disabled = false;
  }
});