// Tolerant JSON extraction for LLM output — the "repair" half of strict grading.
// Weaker/open models sometimes wrap JSON in ```fences``` or add a stray sentence;
// a raw JSON.parse then throws. These helpers strip fences and grab the first
// balanced object/array so a well-formed payload survives minor framing noise.

/** Extract the first JSON object from an LLM response, or null if none parses. */
export function extractJsonObject<T = Record<string, unknown>>(text: string): T | null {
  if (!text) return null;
  const cleaned = text.replace(/```(?:json)?/gi, "");
  const match = cleaned.match(/\{[\s\S]*\}/);
  const candidate = match ? match[0] : cleaned.trim();
  try {
    return JSON.parse(candidate) as T;
  } catch {
    return null;
  }
}

/** Extract the first JSON array from an LLM response, or null if none parses. */
export function extractJsonArray<T = unknown>(text: string): T[] | null {
  if (!text) return null;
  const cleaned = text.replace(/```(?:json)?/gi, "");
  const match = cleaned.match(/\[[\s\S]*\]/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]);
    return Array.isArray(parsed) ? (parsed as T[]) : null;
  } catch {
    return null;
  }
}
