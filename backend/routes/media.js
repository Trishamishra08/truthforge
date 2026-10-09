import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import { getGeminiClient, generateWithFallback, extractJson, describeGeminiError } from "../services/geminiClient.js";
import MediaAnalysis, { MEDIA_CATEGORY_VALUES } from "../models/MediaAnalysis.js";

const router = express.Router();

const IMAGE_MAX = 5 * 1024 * 1024;
// Inline Gemini requests cap at 20MB and base64 adds ~33%.
const VIDEO_MAX = 14 * 1024 * 1024;

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: VIDEO_MAX, files: 1 } });

// Detect the real format from file signature bytes, not the client-declared MIME type.
function sniffMedia(buf) {
  const hex = (start, len) => buf.subarray(start, start + len).toString("hex");
  const ascii = (start, len) => buf.subarray(start, start + len).toString("latin1");
  if (hex(0, 3) === "ffd8ff") return { mediaType: "image", mimeType: "image/jpeg" };
  if (hex(0, 8) === "89504e470d0a1a0a") return { mediaType: "image", mimeType: "image/png" };
  if (ascii(0, 4) === "RIFF" && ascii(8, 4) === "WEBP") return { mediaType: "image", mimeType: "image/webp" };
  if (ascii(4, 4) === "ftyp") {
    const brand = ascii(8, 4);
    return { mediaType: "video", mimeType: brand.startsWith("qt") ? "video/quicktime" : "video/mp4" };
  }
  if (hex(0, 4) === "1a45dfa3") return { mediaType: "video", mimeType: "video/webm" };
  return null;
}

const SIGNALS = {
  image: "unnatural textures, inconsistent lighting/shadows, distorted hands/text/edges, overly smooth or uniform skin, diffusion-model artifact patterns, inconsistent reflections",
  video: "temporal flicker or morphing between frames, unnatural blinking or facial motion, mismatched lip movement, warping around face/hair edges, inconsistent lighting across frames, physics that doesn't hold up, diffusion-style texture artifacts",
};

const PROMPT = (mediaType) => `You are an AI-generated media detection assistant. Examine the attached ${mediaType} for visual signals associated with AI generation or digital manipulation (${SIGNALS[mediaType]}).

Return ONLY a JSON object, no markdown fences:
{
  "category": "one of LIKELY_AI_GENERATED | LIKELY_AUTHENTIC | POSSIBLY_MANIPULATED | INCONCLUSIVE",
  "explanation": "2-4 sentences summarizing why you chose this category and how certain you are",
  "observations": ["short specific visual observation${mediaType === "video" ? " with an approximate timestamp like 0:03" : ""}", "..."],
  "limitations": "1-2 sentences on why this assessment is not definitive proof"
}

Rules:
- 2 to 5 observations, each describing something you actually see.
- Use INCONCLUSIVE when signals are mixed or the ${mediaType} lacks enough detail to judge.
- Never claim certainty, and never claim a real person created or endorsed the content.
- category must be exactly one of: ${MEDIA_CATEGORY_VALUES.join(", ")}.`;

const BASE_LIMITATION =
  "AI-generated media detection is probabilistic. Compression, editing, new generation methods, and unfamiliar media can reduce accuracy. This result is an automated assessment by a general multimodal model, not a dedicated forensic classifier, and is not definitive proof of authenticity or fabrication.";

router.post("/analyze", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Please upload an image (JPEG, PNG, WebP up to 5MB) or a video (MP4, MOV, WebM up to 14MB)." });
  }

  const detected = sniffMedia(req.file.buffer);
  if (!detected) {
    return res.status(400).json({ error: "Unsupported or corrupted file. Use JPEG, PNG, WebP, MP4, MOV, or WebM." });
  }
  if (detected.mediaType === "image" && req.file.size > IMAGE_MAX) {
    return res.status(400).json({ error: "Image too large. Maximum size is 5MB." });
  }

  if (!getGeminiClient()) {
    return res.status(503).json({ error: "AI provider unavailable: GEMINI_API_KEY is not configured on the server." });
  }

  try {
    const { text, modelName } = await generateWithFallback(
      [PROMPT(detected.mediaType), { inlineData: { mimeType: detected.mimeType, data: req.file.buffer.toString("base64") } }],
      { timeout: detected.mediaType === "video" ? 120000 : 90000 }
    );
    const parsed = extractJson(text);

    const analysis = await MediaAnalysis.create({
      mediaType: detected.mediaType,
      fileName: req.file.originalname,
      mimeType: detected.mimeType,
      sizeBytes: req.file.size,
      category: MEDIA_CATEGORY_VALUES.includes(parsed.category) ? parsed.category : "INCONCLUSIVE",
      explanation: parsed.explanation || "No explanation returned.",
      observations: Array.isArray(parsed.observations) ? parsed.observations.filter((o) => typeof o === "string").slice(0, 5) : [],
      modelName,
      limitations: [parsed.limitations, BASE_LIMITATION,
        detected.mediaType === "video" ? "Video is assessed visually from sampled frames; synthetic voice and audio manipulation are not evaluated." : null,
      ].filter(Boolean).join(" "),
    });

    res.status(201).json(analysis);
  } catch (err) {
    console.error("Media analysis failed:", err.message);
    res.status(502).json({ error: describeGeminiError(err) });
  }
});

router.get("/", async (_req, res) => {
  const analyses = await MediaAnalysis.find()
    .select("mediaType fileName category createdAt")
    .sort({ createdAt: -1 })
    .limit(50);
  res.json(analyses);
});

router.get("/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: "Report not found." });
  const analysis = await MediaAnalysis.findById(req.params.id);
  if (!analysis) return res.status(404).json({ error: "Report not found." });
  res.json(analysis);
});

router.delete("/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: "Report not found." });
  const deleted = await MediaAnalysis.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ error: "Report not found." });
  res.status(204).end();
});

export default router;
