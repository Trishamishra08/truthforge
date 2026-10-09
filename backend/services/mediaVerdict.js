// Thresholds on the forensic model's sigmoid score. Between them the model is treated as unsure.
export const AI_THRESHOLD = 0.85;
export const REAL_THRESHOLD = 0.15;

const forensicCall = (score) => (score >= AI_THRESHOLD ? "AI" : score <= REAL_THRESHOLD ? "REAL" : "UNSURE");
const geminiCall = (category) =>
  ({ LIKELY_AI_GENERATED: "AI", LIKELY_AUTHENTIC: "REAL", POSSIBLY_MANIPULATED: "MANIPULATED" })[category] ?? "UNSURE";

const pct = (s) => `${Math.round(s * 100)}%`;

/**
 * Combines the general multimodal model (Gemini) with the dedicated forensic classifier using
 * fixed agreement rules, so the final category is explainable. Either input may be missing.
 */
export function combineMediaVerdict(geminiCategory, forensicScore) {
  const hasGemini = Boolean(geminiCategory);
  const hasForensic = typeof forensicScore === "number";

  if (!hasForensic) {
    return { category: geminiCategory ?? "INCONCLUSIVE", reason: "Based on the multimodal model only; the dedicated detector was not used for this file." };
  }
  const f = forensicCall(forensicScore);
  if (!hasGemini) {
    const category = f === "AI" ? "LIKELY_AI_GENERATED" : f === "REAL" ? "LIKELY_AUTHENTIC" : "INCONCLUSIVE";
    return { category, reason: `Based on the dedicated detector only (score ${pct(forensicScore)}); the multimodal model was unavailable.` };
  }

  const g = geminiCall(geminiCategory);
  if (f === "UNSURE") return { category: geminiCategory, reason: `The dedicated detector was unsure (score ${pct(forensicScore)}), so the multimodal model's assessment is used.` };
  if (g === "UNSURE") {
    return { category: f === "AI" ? "LIKELY_AI_GENERATED" : "LIKELY_AUTHENTIC", reason: `The multimodal model was inconclusive; the dedicated detector was confident (score ${pct(forensicScore)}).` };
  }
  if (g === f) {
    return { category: geminiCategory, reason: `Both detectors agree (dedicated detector score ${pct(forensicScore)}).` };
  }
  if (g === "MANIPULATED") {
    return f === "AI"
      ? { category: "LIKELY_AI_GENERATED", reason: `The multimodal model saw signs of manipulation and the dedicated detector scored it ${pct(forensicScore)} AI-generated.` }
      : { category: "POSSIBLY_MANIPULATED", reason: "The dedicated detector found no signs of AI generation, but it does not check for manual editing, which the multimodal model flagged." };
  }
  return { category: "INCONCLUSIVE", reason: `The two detectors disagree (multimodal model: ${g === "AI" ? "AI-generated" : "authentic"}; dedicated detector score ${pct(forensicScore)}).` };
}
