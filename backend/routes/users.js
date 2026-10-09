import express from "express";

const router = express.Router();

router.get("/me", (req, res) => res.json(req.user));

router.put("/me", async (req, res) => {
  const { name } = req.body ?? {};
  if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 60) {
    return res.status(400).json({ error: "Name must be between 2 and 60 characters." });
  }
  req.user.name = name.trim();
  await req.user.save();
  res.json(req.user);
});

export default router;
