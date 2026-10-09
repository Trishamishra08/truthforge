import { GoogleGenerativeAI } from "@google/generative-ai";

const DEFAULT_MODELS = ["gemini-3.8-flash", "gemini-3.7-flash", "gemini-3.6-flash", "gemini-3.5-flash", "gemini-3.5-flash-lite"];

export const GEMINI_MODELS = (process.env.GEMINI_MODELS || "")
  .split(",")
  .map((m) => m.trim())
  .filter(Boolean);
if (GEMINI_MODELS.length === 0) GEMINI_MODELS.push(...DEFAULT_MODELS);

let client = null;
// model name -> timestamp until which it should be skipped (quota exhausted / retired)
const unavailableUntil = new Map();

export function getGeminiClient() {
  if (!process.env.GEMINI_API_KEY) return null;
  if (!client) client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return client;
}

function retryDelayMs(err) {
  const info = err.errorDetails?.find((d) => d.retryDelay);
  const seconds = info ? parseFloat(info.retryDelay) : NaN;
  return Number.isFinite(seconds) ? seconds * 1000 : 60_000;
}

/**
 * Free-tier quotas are per model, so on a quota (429) or retired-model (404) error
 * we move to the next configured model. Other errors are real failures and are thrown.
 */
export async function generateWithFallback(parts, { timeout = 90000 } = {}) {
  const genAI = getGeminiClient();
  if (!genAI) {
    const err = new Error("GEMINI_API_KEY is not configured");
    err.code = "NO_KEY";
    throw err;
  }
  let lastErr;
  const now = Date.now();
  const candidates = GEMINI_MODELS.filter((m) => (unavailableUntil.get(m) ?? 0) <= now);
  for (const modelName of candidates.length ? candidates : GEMINI_MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName }, { timeout });
      const result = await model.generateContent(parts);
      return { text: result.response.text(), modelName };
    } catch (err) {
      lastErr = err;
      if (err.status === 429) {
        unavailableUntil.set(modelName, Date.now() + retryDelayMs(err));
        console.warn(`Gemini model ${modelName} hit its quota; trying the next model.`);
        continue;
      }
      if (err.status === 404) {
        unavailableUntil.set(modelName, Date.now() + 24 * 3600 * 1000);
        console.warn(`Gemini model ${modelName} is unavailable; trying the next model.`);
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

export function describeGeminiError(err) {
  if (err.status === 429) {
    return "All configured Gemini models have reached their free-tier limits. Please wait and retry later.";
  }
  if (/abort|timeout|timed out/i.test(err.message ?? "")) {
    return "The AI model took too long to respond. Please retry — free-tier response times vary.";
  }
  return "AI analysis failed. The model may be unavailable or returned an unparseable response. Please retry.";
}

export function extractJson(rawText) {
  const match = rawText.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error("Model response did not contain valid JSON");
  }
  return JSON.parse(match[0]);
}
