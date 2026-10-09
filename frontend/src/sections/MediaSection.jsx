import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CircleAlert, Clock, Image as ImageIcon, LoaderCircle, ScanSearch, TriangleAlert, Upload, Video, X } from "lucide-react";
import DarkPanel from "../components/DarkPanel";
import { MediaBadge, SectionHeading, formatDate, staggerChild, staggerParent } from "../components/ui";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];
const IMAGE_MAX = 5 * 1024 * 1024;
const VIDEO_MAX = 14 * 1024 * 1024;

const WARNING =
  "AI-generated media detection is probabilistic. Compression, editing, new generation methods, and unfamiliar media can reduce accuracy. This result is an automated assessment, not definitive proof of authenticity or fabrication.";

const formatBytes = (n) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`);
const formatDuration = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;

function validate(file) {
  if (IMAGE_TYPES.includes(file.type)) {
    return file.size > IMAGE_MAX ? "Image is larger than 5 MB." : null;
  }
  if (VIDEO_TYPES.includes(file.type)) {
    return file.size > VIDEO_MAX ? "Video is larger than 14 MB. Trim it to a short clip and try again." : null;
  }
  return "Unsupported format. Use JPEG, PNG or WebP images, or MP4, MOV or WebM videos.";
}

/** Pull "0:03"-style timestamps from the model's observations and grab those frames locally. */
async function captureFrames(src, observations) {
  const stamps = [];
  for (const [i, o] of observations.entries()) {
    const m = o.match(/(\d{1,2}):(\d{2})/);
    if (m) stamps.push({ t: Number(m[1]) * 60 + Number(m[2]), note: o, i });
  }
  if (!stamps.length) return [];
  const video = document.createElement("video");
  video.src = src;
  video.muted = true;
  video.preload = "auto";
  await new Promise((res, rej) => {
    video.onloadeddata = res;
    video.onerror = rej;
  });
  const canvas = document.createElement("canvas");
  const scale = 240 / video.videoWidth;
  canvas.width = 240;
  canvas.height = Math.round(video.videoHeight * scale);
  const ctx = canvas.getContext("2d");
  const frames = [];
  for (const s of stamps.slice(0, 4)) {
    video.currentTime = Math.min(s.t, Math.max(0, video.duration - 0.05));
    await Promise.race([
      new Promise((res) => (video.onseeked = res)),
      new Promise((res) => setTimeout(res, 1500)),
    ]);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    frames.push({ ...s, img: canvas.toDataURL("image/jpeg", 0.75) });
  }
  return frames;
}

export default function MediaSection({ onAnalyze, loading, error, result, fromHistory, onClear }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [meta, setMeta] = useState(null);
  const [localError, setLocalError] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [frames, setFrames] = useState([]);

  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  useEffect(() => {
    if (!fromHistory) return;
    setFile(null);
    setPreview(null);
    setMeta(null);
    setLocalError(null);
    if (inputRef.current) inputRef.current.value = "";
  }, [fromHistory, result]);

  useEffect(() => {
    setFrames([]);
    if (!result || result.mediaType !== "video" || !preview || !file) return;
    let cancelled = false;
    captureFrames(preview, result.observations ?? [])
      .then((f) => !cancelled && setFrames(f))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [result, preview, file]);

  const pick = (f) => {
    if (!f) return;
    const problem = validate(f);
    setLocalError(problem);
    onClear();
    if (problem) {
      setFile(null);
      setPreview(null);
      return;
    }
    setFile(f);
    setMeta(null);
    setPreview(URL.createObjectURL(f));
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setMeta(null);
    setLocalError(null);
    onClear();
    if (inputRef.current) inputRef.current.value = "";
  };

  const isVideo = file && VIDEO_TYPES.includes(file.type);
  const shownError = localError || error?.message;

  return (
    <DarkPanel id="media" labelledBy="media-title">
      <SectionHeading dark id="media-title" eyebrow="AI media detection" title={<>Inspect<br />the Media.</>}>
        Upload an image or a short video. TruthForge screens it for visual signs of AI generation or manipulation and tells you what it saw — and how unsure it is.
      </SectionHeading>

      <div className="mt-10 grid gap-5 lg:grid-cols-2">
        <div>
          <label
            htmlFor="media-input"
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); pick(e.dataTransfer.files[0]); }}
            className={`relative flex min-h-[320px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[22px] border border-dashed p-6 text-center transition-colors ${dragging ? "border-lime bg-lime/10" : "border-white/30 hover:border-white/60"}`}
          >
            <input id="media-input" ref={inputRef} type="file" className="sr-only"
              accept={[...IMAGE_TYPES, ...VIDEO_TYPES].join(",")} onChange={(e) => pick(e.target.files[0])} />
            {preview ? (
              isVideo ? (
                <video src={preview} controls muted playsInline className="max-h-[300px] w-full rounded-xl bg-black object-contain"
                  onLoadedMetadata={(e) => setMeta({ duration: e.target.duration, w: e.target.videoWidth, h: e.target.videoHeight })} />
              ) : (
                <img src={preview} alt="Selected upload preview" className="max-h-[300px] rounded-xl object-contain"
                  onLoad={(e) => setMeta({ w: e.target.naturalWidth, h: e.target.naturalHeight })} />
              )
            ) : (
              <>
                <span className="grid size-14 place-items-center rounded-full border border-white/25"><Upload className="size-5" /></span>
                <p className="mt-4 text-lg">Drop an image or video here</p>
                <p className="mt-1 text-sm text-white/50">or <span className="underline underline-offset-2">browse files</span></p>
                <p className="mt-6 text-xs text-white/40">JPEG · PNG · WebP up to 5 MB &nbsp;/&nbsp; MP4 · MOV · WebM up to 14 MB</p>
              </>
            )}
          </label>

          {file && (
            <div className="mt-3 flex items-center gap-3 rounded-2xl border border-white/15 px-4 py-3 text-sm">
              {isVideo ? <Video className="size-4 text-lime" /> : <ImageIcon className="size-4 text-lime" />}
              <span className="min-w-0 flex-1">
                <span className="block truncate">{file.name}</span>
                <span className="text-xs text-white/50">
                  {formatBytes(file.size)}
                  {meta?.w ? ` · ${meta.w}×${meta.h}` : ""}
                  {meta?.duration ? ` · ${formatDuration(meta.duration)}` : ""}
                </span>
              </span>
              <button type="button" onClick={reset} aria-label="Remove file" className="rounded-full p-1.5 text-white/60 hover:bg-white/10 hover:text-white">
                <X className="size-4" />
              </button>
            </div>
          )}

          <AnimatePresence>
            {shownError && (
              <motion.p role="alert" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                className="mt-3 flex items-start gap-2 rounded-2xl border border-ember/50 bg-ember/15 p-3 text-sm">
                <TriangleAlert className="mt-0.5 size-4 shrink-0 text-ember" /> {shownError}
              </motion.p>
            )}
          </AnimatePresence>

          <motion.button type="button" disabled={!file || loading} whileTap={{ scale: 0.97 }} onClick={() => onAnalyze(file)}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-lime px-6 py-3 text-sm text-ink transition-colors hover:bg-ivory disabled:cursor-not-allowed disabled:opacity-40">
            {loading ? <LoaderCircle className="size-4 animate-spin" /> : <ScanSearch className="size-4" />}
            {loading ? (isVideo ? "Analyzing video…" : "Analyzing image…") : "Analyze media"}
          </motion.button>
        </div>

        <div className="min-h-[320px] rounded-[22px] border border-white/15 p-6" aria-live="polite">
          {loading ? (
            <div className="space-y-4" aria-busy="true">
              <div className="skeleton-dark h-10 w-56 rounded-full" />
              <div className="skeleton-dark h-24 rounded-2xl" />
              <div className="skeleton-dark h-32 rounded-2xl" />
              <p className="text-xs text-white/40">{isVideo ? "Videos take longer — the model reviews sampled frames. Up to about a minute." : "Usually 5–30 seconds."}</p>
            </div>
          ) : result ? (
            <motion.div variants={staggerParent} initial="hidden" animate="show" className="space-y-5">
              <motion.div variants={staggerChild} className="rounded-2xl bg-lime p-5 text-ink">
                <p className="text-xs uppercase tracking-[0.16em] text-ink/60">{result.mediaType === "video" ? "Video" : "Image"} assessment</p>
                <div className="mt-2"><MediaBadge category={result.category} size="lg" /></div>
                <p className="mt-3 text-sm leading-relaxed">{result.explanation}</p>
              </motion.div>

              {result.observations?.length > 0 && (
                <motion.div variants={staggerChild}>
                  <p className="mb-2 text-xs uppercase tracking-[0.16em] text-white/50">What the model observed</p>
                  <ul className="space-y-2 text-sm text-white/80">
                    {result.observations.map((o, i) => (
                      <li key={i} className="flex gap-3"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-lime" />{o}</li>
                    ))}
                  </ul>
                </motion.div>
              )}

              {frames.length > 0 && (
                <motion.div variants={staggerChild}>
                  <p className="mb-2 text-xs uppercase tracking-[0.16em] text-white/50">Frames referenced</p>
                  <div className="no-scrollbar flex gap-3 overflow-x-auto">
                    {frames.map((f) => (
                      <figure key={f.i} className="w-40 shrink-0">
                        <img src={f.img} alt={`Frame at ${formatDuration(f.t)}`} className="rounded-lg border border-white/15" />
                        <figcaption className="mt-1 text-[11px] text-white/50">{formatDuration(f.t)}</figcaption>
                      </figure>
                    ))}
                  </div>
                </motion.div>
              )}

              {!file && (
                <motion.p variants={staggerChild} className="text-xs text-white/45">
                  Opened from saved reports. The original file isn't stored — TruthForge keeps only the analysis.
                </motion.p>
              )}

              <motion.dl variants={staggerChild} className="grid grid-cols-2 gap-3 border-t border-white/10 pt-4 text-xs">
                <div><dt className="text-white/45">File</dt><dd className="mt-0.5 truncate">{result.fileName}</dd></div>
                <div><dt className="text-white/45">Model</dt><dd className="mt-0.5">{result.modelName || "Gemini"} (general multimodal)</dd></div>
                <div className="col-span-2 flex items-center gap-1.5 text-white/55"><Clock className="size-3.5" /> Analyzed {formatDate(result.createdAt, true)}</div>
              </motion.dl>

              <motion.div variants={staggerChild} className="flex gap-3 rounded-2xl border border-white/15 p-4 text-xs leading-relaxed text-white/60">
                <CircleAlert className="mt-0.5 size-4 shrink-0 text-lime" />
                <p><strong className="font-medium text-ivory">{WARNING}</strong> {result.limitations}</p>
              </motion.div>
            </motion.div>
          ) : (
            <div className="flex h-full min-h-[270px] flex-col justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-white/50">Results appear here</p>
                <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/60">
                  You'll get one of four outcomes — Likely AI-generated, Likely authentic, Possibly manipulated, or Inconclusive — with the specific visual signals behind it.
                </p>
              </div>
              <p className="text-xs leading-relaxed text-white/40">
                Privacy: uploads are processed in memory and sent to the AI model for analysis. TruthForge does not store the file — only the resulting report.
              </p>
            </div>
          )}
        </div>
      </div>
    </DarkPanel>
  );
}
