import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import newsRouter from "./routes/news.js";
import mediaRouter from "./routes/media.js";
import insightsRouter from "./routes/insights.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { GEMINI_MODELS } from "./services/geminiClient.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    mongoConnected: mongoose.connection.readyState === 1,
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    geminiModels: GEMINI_MODELS,
  });
});

app.use("/api/news", newsRouter);
app.use("/api/media", mediaRouter);
app.use("/api/insights", insightsRouter);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

async function start() {
  if (!process.env.MONGODB_URI) {
    console.warn("MONGODB_URI not set — database features will fail until configured.");
  } else {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log("MongoDB connected");
    } catch (err) {
      console.error("MongoDB connection failed:", err.message);
    }
  }

  app.listen(PORT, () => {
    console.log(`TruthForge backend running on http://localhost:${PORT}`);
  });
}

start();
