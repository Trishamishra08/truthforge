import express from "express";
import mongoose from "mongoose";
import { getGeminiClient, generateWithFallback, extractJson, describeGeminiError } from "../services/geminiClient.js";
import { searchNews, EVIDENCE_PROVIDER } from "../services/newsSearch.js";
import { computeVerdict } from "../services/verdict.js";
import { fetchArticle, ArticleFetchError } from "../services/articleFetcher.js";
import NewsAnalysis, { CLAIM_STATUS_VALUES } from "../models/NewsAnalysis.js";

const router = express.Router();

const today = () => new Date().toISOString().slice(0, 10);

const EXTRACT_PROMPT = (articleText) => `You are a news analysis assistant. Today's date is ${today()}.

Article text:
"""
${articleText}
"""

Return ONLY a JSON object, no markdown fences:
{
  "title": "short title for the article, or null",
  "summary": "3-5 sentence summary preserving key names, dates, numbers. Do not add facts not in the text.",
  "claims": [
    { "text": "one specific checkable factual claim from the article", "searchQuery": "a short news search query (3-8 words) to find reporting on this claim" }
  ],
  "contentNotice": "if the text itself says it is fiction, satire, a test, a demo or a hypothetical scenario, say so in one sentence; otherwise null"
}

Rules: at most 5 of the most important factual claims. Skip opinions, predictions and commentary. Merge duplicate claims.`;

const VERIFY_PROMPT = (claimsWithEvidence) => `You are a careful fact-checker. Today's date is ${today()}.
For each claim below you are given news search results (headline, publisher, date) retrieved just now. You only see headlines, not full articles.

${claimsWithEvidence}

Return ONLY a JSON object, no markdown fences:
{
  "results": [
    {
      "claimIndex": 0,
      "status": "SUPPORTED | CONTRADICTED | INSUFFICIENT_EVIDENCE | CONFLICTING_EVIDENCE | UNVERIFIABLE",
      "explanation": "2-3 sentences. Cite evidence by its id like [c0e1]. State uncertainty honestly.",
      "supportingIds": ["c0e1"],
      "contradictingIds": []
    }
  ],
  "limitations": "1-2 sentences on the limitations of this check"
}

Rules:
- SUPPORTED only if the headlines clearly back the claim. CONTRADICTED only if they clearly conflict with it, or if it contradicts well-established facts.
- Recent events may only exist in the search results — trust dated reporting from established publishers over your own memory.
- No results or irrelevant results do NOT mean the claim is false: use INSUFFICIENT_EVIDENCE.
- Use UNVERIFIABLE for claims that cannot be checked at all (e.g. explicitly fictional, private, or vague).
- Only use ids that appear above. Never invent sources.`;

function formatEvidenceBlock(claims) {
  return claims
    .map((claim, i) => {
      const lines = claim.evidence.length
        ? claim.evidence
            .map((e, j) => `  [c${i}e${j}] "${e.title}" — ${e.publisher ?? "unknown publisher"}, ${e.publishedAt ? e.publishedAt.toISOString().slice(0, 10) : "date unknown"}`)
            .join("\n")
        : "  (no search results found)";
      return `Claim ${i}: ${claim.text}\nSearch results:\n${lines}`;
    })
    .join("\n\n");
}

const MAX_CHARS = 50000;

router.post("/analyze", async (req, res) => {
  const { text, url } = req.body ?? {};
  const hasUrl = typeof url === "string" && url.trim().length > 0;

  if (!hasUrl && (!text || typeof text !== "string" || text.trim().length < 50)) {
    return res.status(400).json({ error: "Please provide article text of at least 50 characters, or a news article URL." });
  }

  if (!getGeminiClient()) {
    return res.status(503).json({ error: "AI provider unavailable: GEMINI_API_KEY is not configured on the server." });
  }
  const modelsUsed = new Set();
  const ask = async (prompt) => {
    const { text: out, modelName } = await generateWithFallback(prompt);
    modelsUsed.add(modelName);
    return extractJson(out);
  };

  let article = { text: typeof text === "string" ? text.trim() : "" };
  if (hasUrl) {
    try {
      article = await fetchArticle(url.trim());
    } catch (err) {
      if (err instanceof ArticleFetchError) return res.status(422).json({ error: err.message, canRetryWithText: true });
      console.error("Article fetch failed:", err);
      return res.status(422).json({ error: "Could not extract an article from that URL. Paste the article text instead.", canRetryWithText: true });
    }
  }
  const truncated = article.text.length > MAX_CHARS;
  const articleText = truncated ? article.text.slice(0, MAX_CHARS) : article.text;

  try {
    const extracted = await ask(EXTRACT_PROMPT(articleText));
    const rawClaims = Array.isArray(extracted.claims) ? extracted.claims.filter((c) => c?.text).slice(0, 5) : [];

    let searchFailures = 0;
    const claims = await Promise.all(
      rawClaims.map(async (c) => {
        let evidence = [];
        try {
          evidence = await searchNews(c.searchQuery || c.text);
        } catch (err) {
          searchFailures++;
          console.error("Evidence search failed:", err.message);
        }
        return { text: c.text, searchQuery: c.searchQuery, evidence };
      })
    );
    const evidenceAvailable = claims.length > 0 && searchFailures < claims.length;

    let limitations = null;
    if (claims.length > 0) {
      const verified = await ask(VERIFY_PROMPT(formatEvidenceBlock(claims)));
      const results = Array.isArray(verified.results) ? verified.results : [];
      limitations = verified.limitations;

      claims.forEach((claim, i) => {
        const r = results.find((x) => x.claimIndex === i) ?? {};
        claim.status = CLAIM_STATUS_VALUES.includes(r.status) ? r.status : "INSUFFICIENT_EVIDENCE";
        claim.explanation = r.explanation || "The model did not return an explanation for this claim.";
        const supports = new Set(r.supportingIds ?? []);
        const contradicts = new Set(r.contradictingIds ?? []);
        claim.evidence = claim.evidence.map((e, j) => ({
          ...e,
          relation: contradicts.has(`c${i}e${j}`) ? "CONTRADICTS" : supports.has(`c${i}e${j}`) ? "SUPPORTS" : "RELATED",
        }));
      });
    }

    const { verdict, reason } = computeVerdict(claims);

    const publishedAt = article.publishedAt ? new Date(article.publishedAt) : null;
    const analysis = await NewsAnalysis.create({
      user: req.user._id,
      inputType: hasUrl ? "url" : "text",
      sourceUrl: hasUrl ? article.canonicalUrl : null,
      publisher: article.publisher || null,
      publishedAt: publishedAt && !isNaN(publishedAt) ? publishedAt : null,
      articleText,
      title: article.title || extracted.title || null,
      contentNotice: extracted.contentNotice || null,
      summary: extracted.summary || "Summary unavailable.",
      claims,
      verdict,
      verdictReason: reason,
      evidenceProvider: EVIDENCE_PROVIDER,
      evidenceAvailable,
      modelName: [...modelsUsed].join(", "),
      limitations: [
        limitations,
        evidenceAvailable ? null : "News search was unavailable, so claims were judged without live evidence.",
        truncated ? `The article was longer than ${MAX_CHARS} characters; only the first ${MAX_CHARS} were analyzed.` : null,
        "Evidence is limited to news headlines; full articles were not read. The overall verdict is derived from claim statuses by fixed rules and is not proof.",
      ].filter(Boolean).join(" "),
    });

    res.status(201).json(analysis);
  } catch (err) {
    console.error("News analysis failed:", err.message);
    res.status(502).json({ error: describeGeminiError(err) });
  }
});

router.get("/", async (req, res) => {
  const analyses = await NewsAnalysis.find({ user: req.user._id })
    .select("title publisher sourceUrl inputType verdict createdAt claims.status")
    .sort({ createdAt: -1 })
    .limit(50);
  res.json(analyses);
});

// Reports owned by someone else return 404, so their existence isn't revealed.
router.get("/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: "Report not found." });
  const analysis = await NewsAnalysis.findOne({ _id: req.params.id, user: req.user._id });
  if (!analysis) return res.status(404).json({ error: "Report not found." });
  res.json(analysis);
});

router.delete("/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: "Report not found." });
  const deleted = await NewsAnalysis.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!deleted) return res.status(404).json({ error: "Report not found." });
  res.status(204).end();
});

export default router;
