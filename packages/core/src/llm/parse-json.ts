/** Strip markdown code fences (```json ... ```) then JSON.parse. */
const parseJSON = (raw: string): Record<string, unknown> => {
  const trimmed = raw.trim();
  const stripped = trimmed.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  return JSON.parse(stripped);
};

export { parseJSON };
