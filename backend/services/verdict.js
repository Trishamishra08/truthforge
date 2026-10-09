export const VERDICTS = [
  "LIKELY_TRUE",
  "MOSTLY_TRUE",
  "MISLEADING",
  "LIKELY_FAKE",
  "DISPUTED",
  "UNVERIFIED",
];

export function computeVerdict(claims) {
  const count = (s) => claims.filter((c) => c.status === s).length;
  const supported = count("SUPPORTED");
  const contradicted = count("CONTRADICTED");
  const conflicting = count("CONFLICTING_EVIDENCE");
  const total = claims.length;

  if (total === 0) {
    return { verdict: "UNVERIFIED", reason: "No checkable factual claims were found in the text." };
  }
  if (contradicted > 0 && supported === 0) {
    return { verdict: "LIKELY_FAKE", reason: `${contradicted} of ${total} claims are contradicted by evidence and none are supported.` };
  }
  if (contradicted > 0) {
    return { verdict: "MISLEADING", reason: `${supported} claim(s) are supported but ${contradicted} are contradicted — the article mixes accurate and false information.` };
  }
  if (conflicting > 0) {
    return { verdict: "DISPUTED", reason: `${conflicting} claim(s) have conflicting evidence between sources.` };
  }
  if (supported === total) {
    return { verdict: "LIKELY_TRUE", reason: `All ${total} claims are supported by the evidence found.` };
  }
  if (supported > 0) {
    return { verdict: "MOSTLY_TRUE", reason: `${supported} of ${total} claims are supported; the rest could not be confirmed, and none are contradicted.` };
  }
  return { verdict: "UNVERIFIED", reason: "None of the claims could be confirmed or disproved with the evidence found. This does not mean the article is false." };
}
