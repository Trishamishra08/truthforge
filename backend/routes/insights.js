import express from "express";
import NewsAnalysis from "../models/NewsAnalysis.js";
import MediaAnalysis from "../models/MediaAnalysis.js";
import { searchNews } from "../services/newsSearch.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/stats", requireAuth, async (req, res) => {
  const mine = { $match: { user: req.user._id } };
  const [newsCount, mediaByType, verdicts, claimTotals] = await Promise.all([
    NewsAnalysis.countDocuments({ user: req.user._id }),
    MediaAnalysis.aggregate([mine, { $group: { _id: "$mediaType", count: { $sum: 1 } } }]),
    NewsAnalysis.aggregate([mine, { $group: { _id: "$verdict", count: { $sum: 1 } } }]),
    NewsAnalysis.aggregate([
      mine,
      { $unwind: "$claims" },
      { $group: { _id: null, claims: { $sum: 1 }, sources: { $sum: { $size: { $ifNull: ["$claims.evidence", []] } } } } },
    ]),
  ]);
  const media = Object.fromEntries(mediaByType.map((m) => [m._id ?? "image", m.count]));
  res.json({
    articlesChecked: newsCount,
    imagesAnalyzed: media.image ?? 0,
    videosAnalyzed: media.video ?? 0,
    claimsChecked: claimTotals[0]?.claims ?? 0,
    sourcesReviewed: claimTotals[0]?.sources ?? 0,
    verdicts: Object.fromEntries(verdicts.filter((v) => v._id).map((v) => [v._id, v.count])),
  });
});

// Aggregates how each publisher's reporting related to claims checked in this app.
// This is usage data, not a credibility rating.
router.get("/sources", requireAuth, async (req, res) => {
  const sources = await NewsAnalysis.aggregate([
    { $match: { user: req.user._id } },
    { $unwind: "$claims" },
    { $unwind: "$claims.evidence" },
    { $match: { "claims.evidence.publisher": { $nin: [null, ""] } } },
    {
      $group: {
        _id: "$claims.evidence.publisher",
        citations: { $sum: 1 },
        supports: { $sum: { $cond: [{ $eq: ["$claims.evidence.relation", "SUPPORTS"] }, 1, 0] } },
        contradicts: { $sum: { $cond: [{ $eq: ["$claims.evidence.relation", "CONTRADICTS"] }, 1, 0] } },
        analyses: { $addToSet: "$_id" },
        lastSeen: { $max: "$createdAt" },
      },
    },
    { $project: { _id: 0, publisher: "$_id", citations: 1, supports: 1, contradicts: 1, analyses: { $size: "$analyses" }, lastSeen: 1 } },
    { $sort: { citations: -1, publisher: 1 } },
    { $limit: 30 },
  ]);
  res.json(sources);
});

const TRENDING_TTL_MS = 15 * 60 * 1000;
let trendingCache = { at: 0, items: [] };

router.get("/trending", async (_req, res) => {
  if (Date.now() - trendingCache.at < TRENDING_TTL_MS && trendingCache.items.length) {
    return res.json({ provider: "Google News RSS", fetchedAt: new Date(trendingCache.at), items: trendingCache.items });
  }
  try {
    const items = await searchNews("fact check when:7d", 12);
    trendingCache = { at: Date.now(), items };
    res.json({ provider: "Google News RSS", fetchedAt: new Date(trendingCache.at), items });
  } catch (err) {
    console.error("Trending fetch failed:", err.message);
    res.status(502).json({ error: "Couldn't load trending fact checks right now. Please try again later." });
  }
});

export default router;
