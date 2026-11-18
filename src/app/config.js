/**
 * src/app/config.js
 * Single source of truth for all constants.
 * No logic here — only plain values.
 */

/** WebLLM model identifier. Used by engine.js and status chip. */
export const MODEL_ID = "Qwen2.5-1.5B-Instruct-q4f16_1-MLC";

/** localStorage key for the saved course. */
export const STORAGE_KEY_COURSE = "lilet_r3ad_course";

/** localStorage key for learning progress. */
export const STORAGE_KEY_PROGRESS = "lilet_r3ad_progress";

/** localStorage key for per-section generated content cache. */
export const STORAGE_KEY_GENERATED = "lilet_r3ad_generated";

/**
 * Schema version. Bump when the Course or Progress shape changes.
 * store.js uses this to detect old data and migrate it.
 */
export const SCHEMA_VERSION = 2;

/** Section size targets (characters) for the structure-aware splitter. */
export const SECTION_TARGET_CHARS  = 1500;
export const SECTION_MAX_CHARS     = 2400;
export const SECTION_MIN_CHARS     = 500;

/** Maximum document context (chars) sent to the model in one prompt. */
export const CONTEXT_LIMIT_CHARS = 3000;

/** How many recent chat exchanges to include in history (each = 1 user + 1 assistant). */
export const CHAT_HISTORY_EXCHANGES = 2;

/** Model generation settings passed to engine.generate(). */
export const GENERATION_SETTINGS = {
  temperature:       0.2,
  max_tokens:        300,
  frequency_penalty: 0.3,
};
