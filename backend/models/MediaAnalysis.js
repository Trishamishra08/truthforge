import mongoose from "mongoose";

const MEDIA_CATEGORIES = [
  "LIKELY_AI_GENERATED",
  "LIKELY_AUTHENTIC",
  "POSSIBLY_MANIPULATED",
  "INCONCLUSIVE",
];

const mediaAnalysisSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
  mediaType: { type: String, enum: ["image", "video"], required: true, default: "image" },
  fileName: { type: String, required: true },
  mimeType: { type: String, required: true },
  sizeBytes: { type: Number },
  category: { type: String, enum: MEDIA_CATEGORIES, required: true },
  explanation: { type: String, required: true },
  observations: { type: [String], default: [] },
  modelName: { type: String },
  limitations: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export const MEDIA_CATEGORY_VALUES = MEDIA_CATEGORIES;
export default mongoose.model("MediaAnalysis", mediaAnalysisSchema);
