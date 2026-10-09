export function errorHandler(err, _req, res, _next) {
  console.error(err);
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ error: "File too large. Images can be up to 5MB and videos up to 14MB." });
  }
  if (err.code === 11000) {
    return res.status(409).json({ error: "An account with this email already exists. Please log in." });
  }
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Malformed request body." });
  }
  if (err.type === "entity.too.large") {
    return res.status(400).json({ error: "Article text is too long." });
  }
  res.status(500).json({ error: "Unexpected server error." });
}
