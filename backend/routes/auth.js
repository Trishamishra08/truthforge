import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import NewsAnalysis from "../models/NewsAnalysis.js";
import MediaAnalysis from "../models/MediaAnalysis.js";
import { rateLimit, signToken } from "../middleware/auth.js";

const router = express.Router();
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate({ name, email, password }, registering) {
  if (registering && (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 60)) {
    return "Name must be between 2 and 60 characters.";
  }
  if (typeof email !== "string" || !EMAIL_RE.test(email.trim())) return "Please enter a valid email address.";
  if (typeof password !== "string" || password.length < 8) return "Password must be at least 8 characters.";
  if (password.length > 128) return "Password is too long.";
  return null;
}

router.post("/register", limiter, async (req, res) => {
  const { name, email, password } = req.body ?? {};
  const problem = validate({ name, email, password }, true);
  if (problem) return res.status(400).json({ error: problem });

  if (await User.exists({ email: email.trim().toLowerCase() })) {
    return res.status(409).json({ error: "An account with this email already exists. Please log in." });
  }

  const isFirstUser = (await User.estimatedDocumentCount()) === 0;
  const user = await User.create({
    name: name.trim(),
    email: email.trim(),
    passwordHash: await bcrypt.hash(password, 12),
  });

  // Reports created before accounts existed belong to the project owner, who registers first.
  if (isFirstUser) {
    const orphan = { $or: [{ user: { $exists: false } }, { user: null }] };
    await Promise.all([
      NewsAnalysis.updateMany(orphan, { $set: { user: user._id } }),
      MediaAnalysis.updateMany(orphan, { $set: { user: user._id } }),
    ]);
  }

  res.status(201).json({ token: signToken(user), user });
});

router.post("/login", limiter, async (req, res) => {
  const { email, password } = req.body ?? {};
  const problem = validate({ email, password }, false);
  if (problem) return res.status(400).json({ error: problem });

  const user = await User.findOne({ email: email.trim().toLowerCase() });
  const ok = user && (await bcrypt.compare(password, user.passwordHash));
  if (!ok) return res.status(401).json({ error: "Incorrect email or password." });

  res.json({ token: signToken(user), user });
});

export default router;
