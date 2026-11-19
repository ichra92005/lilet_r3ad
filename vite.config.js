import { defineConfig } from "vite";

export default defineConfig({
  build: {
    // WebLLM's lazily loaded browser runtime is about 5.9 MB; the entry bundle stays small.
    chunkSizeWarningLimit: 6000,
  },
});
