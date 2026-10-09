# TruthForge 👁️

AI-powered news verification and AI-generated media detection. MERN stack (MongoDB Atlas, Express, React, Node) with Google Gemini.

## Features

### 1. News verification
Paste article text **or an article URL** →
1. **Article extraction** (URL mode) — the page is fetched safely and the main text, title, publisher, date and canonical URL are extracted with Mozilla Readability.
2. Gemini summarizes the article, extracts up to 5 factual claims (each with a search query), and flags text that describes itself as fiction/satire/test.
3. Each claim is searched on **Google News RSS** (free, no key) — headline, publisher, date, link.
4. Gemini labels each claim `SUPPORTED`, `CONTRADICTED`, `INSUFFICIENT_EVIDENCE`, `CONFLICTING_EVIDENCE` or `UNVERIFIABLE`, citing only retrieved results (ids it didn't receive are discarded).
5. An **overall verdict** — Likely True, Mostly True, Misleading, Likely False, Disputed, Unverified — is computed from claim statuses by fixed rules in `backend/services/verdict.js` (not by the AI), so it is explainable.

### 2. AI media detection
Upload an **image** (JPEG/PNG/WebP ≤ 5 MB) or a **short video** (MP4/MOV/WebM ≤ 14 MB). The real format is detected from file signature bytes, not the declared type. Gemini returns a category — Likely AI-generated, Likely authentic, Possibly manipulated, Inconclusive — plus specific observations. For videos, observations carry timestamps and the frontend grabs those frames locally so you can inspect them. Files are processed in memory and **not stored**; only the report is saved.

### Accounts (JWT)
Register / log in with email + password (bcrypt-hashed, cost 12). The server issues a JWT (7-day expiry) that the frontend sends as `Authorization: Bearer <token>`. Every news and media report is stored with its owner; all list/open/delete/stats queries are filtered by the user taken from the verified token (never from request data), and another user's report returns 404. Login/register are rate-limited (20 attempts / 15 min per IP). Trending fact checks stay public. The first account registered inherits reports created before accounts existed.

### 3. Supporting tools (all backed by real data)
- **Source explorer** — publishers that appeared in your checks, with counts of supporting / contradicting / other results (usage counts, *not* credibility scores).
- **Trending fact checks** — live Google News "fact check" stories from the last 7 days (cached 15 min).
- **Saved reports** — search, filter, reopen and delete news and media reports; real usage stats.

## Architecture
```
React (Vite, Tailwind, Motion, Three.js)
        │ REST
        ▼
Express (Node) ──▶ Google Gemini API (model fallback chain)
   │        └────▶ Google News RSS (evidence + trending)
   │        └────▶ Public news sites (URL extraction, SSRF-guarded)
   ▼
MongoDB Atlas
```

## Setup
1. **MongoDB Atlas**: free cluster → Database Access (user) → Network Access (your IP, or `0.0.0.0/0` for Render) → copy the connection string.
2. **Gemini key**: https://aistudio.google.com/apikey
3. Backend:
   ```
   cd backend
   cp ../.env.example .env      # fill in MONGODB_URI and GEMINI_API_KEY
   npm install
   npm run dev                  # http://localhost:5000
   ```
4. Frontend:
   ```
   cd frontend
   npm install
   npm run dev                  # http://localhost:5173
   ```
   For a deployed backend set `VITE_API_URL=https://your-backend.onrender.com`.

`GET /api/health` shows whether Mongo and Gemini are configured and which models are in the fallback chain.

### Gemini free-tier quota
The free tier allows only **~20 requests per day per model**. A news check uses 2 requests, an image/video check uses 1. `GEMINI_MODELS` lists several models; when one hits its quota (HTTP 429) or is retired (404), the next is used automatically and skipped until its quota resets. The model actually used is saved in each report.

## API
All endpoints except `/api/auth/*`, `/api/health` and `/api/insights/trending` require `Authorization: Bearer <token>`.

| Method | Endpoint | Notes |
|---|---|---|
| POST | `/api/auth/register` | `{ name, email, password }` → `{ token, user }` |
| POST | `/api/auth/login` | `{ email, password }` → `{ token, user }` |
| GET / PUT | `/api/users/me` | current user / update `{ name }` |
| POST | `/api/news/analyze` | JSON `{ "text": "..." }` (≥ 50 chars) **or** `{ "url": "https://..." }` |
| GET | `/api/news`, `/api/news/:id` | list (summary fields) / full report |
| DELETE | `/api/news/:id` | |
| POST | `/api/media/analyze` | multipart, field `file` |
| GET | `/api/media`, `/api/media/:id` | |
| DELETE | `/api/media/:id` | |
| GET | `/api/insights/stats` | counts of articles, claims, sources, images, videos, verdicts |
| GET | `/api/insights/sources` | publisher aggregation from saved reports |
| GET | `/api/insights/trending` | live fact-check headlines |

## Security notes
- URL fetching only allows http/https, checks every resolved IP at connect time (blocks loopback, private, link-local, CGNAT, multicast — covers redirects and DNS rebinding), max 3 redirects, 3 MB response cap, timeouts.
- Uploads: signature-based type detection, size limits, in-memory only, never written to disk or executed.
- Secrets live in `backend/.env` (gitignored). Passwords are bcrypt-hashed; JWTs are signed with `JWT_SECRET`.

## Design
Single-page, motion-designed UI: ivory/peach background, black "browser frame" with notched corners, Inter Tight type, lime/orange/electric-blue accents. Three.js hero (floating news sheets, magnifying glass, shield, mouse parallax), scroll-linked frame tilt, ivory → near-black → ivory background transitions, notched capability cards with lime hover, publisher marquee, horizontal trending cards, skeleton loading. A **Motion On/Off** toggle (and the OS reduced-motion setting) disables animation; 3D tilt and parallax are off on touch devices; the 3D scene pauses when off-screen and falls back to a static illustration if WebGL is unavailable.

## Known limitations (state these in the viva)
- Evidence is **news headlines only**; full articles aren't read, so a true claim can come back `INSUFFICIENT_EVIDENCE`.
- Media detection uses a **general multimodal LLM**, not a dedicated benchmarked forensic classifier; its output is a heuristic, not a calibrated probability. Audio/voice is not assessed.
- Free-tier Gemini: ~20 requests/day/model and 10–60 s response times.
- Gemini's built-in Google Search grounding isn't used — it has no free-tier quota.
- URL extraction fails on paywalled or JavaScript-only pages (the UI offers "paste text instead").


## Future work
PDF export, a dedicated AI-image detection model (e.g. a Hugging Face classifier in a Python microservice), full-article evidence reading, Google Fact Check Tools API.
