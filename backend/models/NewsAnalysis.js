import mongoose from "mongoose";
import { VERDICTS } from "../services/verdict.js";

const CLAIM_STATUSES = [
  "SUPPORTED",
  "CONTRADICTED",
  "INSUFFICIENT_EVIDENCE",
  "CONFLICTING_EVIDENCE",
  "UNVERIFIABLE",
];

const evidenceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    publisher: { type: String },
    url: { type: String, required: true },
    publishedAt: { type: Date },
    relation: { type: String, enum: ["SUPPORTS", "CONTRADICTS", "RELATED"], required: true },
  },
  { _id: false }
);

const claimSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    searchQuery: { type: String },
    status: { type: String, enum: CLAIM_STATUSES, required: true },
    explanation: { type: String, required: true },
    evidence: { type: [evidenceSchema], default: [] },
  },
  { _id: false }
);

const newsAnalysisSchema = new mongoose.Schema({
  inputType: { type: String, enum: ["text", "url"], default: "text" },
  sourceUrl: { type: String },
  publisher: { type: String },
  publishedAt: { type: Date },
  articleText: { type: String, required: true },
  title: { type: String },
  contentNotice: { type: String },
  summary: { type: String, required: true },
  claims: { type: [claimSchema], default: [] },
  verdict: { type: String, enum: VERDICTS, required: true },
  verdictReason: { type: String, required: true },
  evidenceProvider: { type: String },
  evidenceAvailable: { type: Boolean, default: false },
  modelName: { type: String },
  limitations: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export const CLAIM_STATUS_VALUES = CLAIM_STATUSES;
export default mongoose.model("NewsAnalysis", newsAnalysisSchema);
