/**
 * src/core/json-guard.js
 * Safely extract, validate, and optionally repair JSON from model output.
 *
 * Usage:
 *   const result = await jsonGuard(rawText, mySchema, repairFn);
 *
 * repairFn is called with the raw text and should return a new messages array
 * for a repair prompt, or null to skip repair.
 */

/**
 * Extract the first JSON value from a string.
 * Handles markdown fences: ```json ... ``` and bare JSON.
 * @param {string} text
 * @returns {unknown} Parsed JSON value
 */
export function extractJSON(text) {
  if (!text) throw new SyntaxError("Empty text");

  // Try to strip markdown fences
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced ? fenced[1] : text).trim();

  // Find first { or [
  const start = candidate.search(/[[{]/);
  if (start === -1) throw new SyntaxError("No JSON object or array found");

  // Find the matching closing bracket by counting depth
  const open  = candidate[start];
  const close = open === "[" ? "]" : "}";
  let depth = 0;
  let end   = -1;
  for (let i = start; i < candidate.length; i++) {
    if (candidate[i] === open)  depth++;
    if (candidate[i] === close) depth--;
    if (depth === 0) { end = i; break; }
  }
  if (end === -1) throw new SyntaxError("Unclosed JSON structure");

  return JSON.parse(candidate.slice(start, end + 1));
}

/**
 * Validate a parsed value against a simple schema.
 * Schema: { type: "array"|"object", items?: schema, properties?: {key: schema}, required?: [key] }
 *
 * @param {unknown} value
 * @param {object} schema
 * @returns {boolean}
 */
export function validateJSON(value, schema) {
  if (!schema) return true;
  if (schema.type === "array") {
    if (!Array.isArray(value)) return false;
    if (schema.items) return value.every((item) => validateJSON(item, schema.items));
    return true;
  }
  if (schema.type === "object") {
    if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
    if (schema.required) {
      for (const key of schema.required) {
        if (!(key in value)) return false;
      }
    }
    if (schema.properties) {
      for (const [key, subSchema] of Object.entries(schema.properties)) {
        if (key in value && !validateJSON(value[key], subSchema)) return false;
      }
    }
    return true;
  }
  if (schema.type === "string")  return typeof value === "string";
  if (schema.type === "number")  return typeof value === "number";
  if (schema.type === "boolean") return typeof value === "boolean";
  return true;
}

/**
 * Try to extract and validate JSON.  On failure, optionally retry once.
 *
 * @param {string} rawText   – raw model output
 * @param {object|null} schema – validation schema (or null to skip)
 * @param {Function|null} onRetry – async (rawText) => newRawText for one repair attempt
 * @returns {Promise<{ok:boolean, value:unknown|null, error:string|null}>}
 */
export async function jsonGuard(rawText, schema = null, onRetry = null) {
  // First attempt
  try {
    const value = extractJSON(rawText);
    if (!schema || validateJSON(value, schema)) return { ok: true, value, error: null };
    throw new Error("Schema validation failed");
  } catch (err) {
    if (!onRetry) {
      return { ok: false, value: null, error: err.message };
    }
  }

  // One repair attempt
  try {
    const repaired = await onRetry(rawText);
    const value = extractJSON(repaired);
    if (!schema || validateJSON(value, schema)) return { ok: true, value, error: null };
    throw new Error("Schema validation failed after repair");
  } catch (err) {
    return { ok: false, value: null, error: err.message };
  }
}
