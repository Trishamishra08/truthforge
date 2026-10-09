import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/User.js";

const TOKEN_TTL = "7d";

let secret = process.env.JWT_SECRET;
if (!secret) {
  secret = crypto.randomBytes(48).toString("hex");
  console.warn("JWT_SECRET not set — using a temporary secret. Users will be logged out whenever the server restarts.");
}

export const signToken = (user) => jwt.sign({ sub: user._id.toString() }, secret, { expiresIn: TOKEN_TTL });

/** Identity always comes from the verified token, never from request data. */
export async function requireAuth(req, res, next) {
  const header = req.get("Authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Please log in to continue." });

  let payload;
  try {
    payload = jwt.verify(token, secret);
  } catch {
    return res.status(401).json({ error: "Your session has expired. Please log in again." });
  }
  if (!mongoose.isValidObjectId(payload.sub)) return res.status(401).json({ error: "Invalid session. Please log in again." });

  const user = await User.findById(payload.sub);
  if (!user) return res.status(401).json({ error: "Account not found. Please log in again." });
  req.user = user;
  next();
}

/** Small in-memory limiter for login/register to slow down password guessing. */
export function rateLimit({ windowMs, max }) {
  const hits = new Map();
  return (req, res, next) => {
    const now = Date.now();
    const entry = hits.get(req.ip);
    if (!entry || now > entry.reset) {
      hits.set(req.ip, { count: 1, reset: now + windowMs });
      return next();
    }
    if (++entry.count > max) {
      const minutes = Math.ceil((entry.reset - now) / 60000);
      return res.status(429).json({ error: `Too many attempts. Please try again in ${minutes} minute${minutes === 1 ? "" : "s"}.` });
    }
    next();
  };
}
