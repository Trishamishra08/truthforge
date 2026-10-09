import { Component, Suspense, lazy, useRef, useState } from "react";
import { AnimatePresence, motion, useScroll, useTransform } from "motion/react";
import { ArrowRight, FileText, Link2, LoaderCircle, Menu, Sparkles, TriangleAlert, X } from "lucide-react";
import { Logo, VERDICTS } from "../components/ui";
import { scrollToId, useMotionPrefs } from "../lib/motionPrefs";

const Hero3D = lazy(() => import("../components/Hero3D"));

const NAV = [
  { id: "verify", label: "News Verification" },
  { id: "media", label: "AI Media Detection" },
  { id: "sources", label: "Fact Check Explorer" },
  { id: "reports", label: "Saved Reports" },
  { id: "how", label: "How It Works" },
];

const DEMO_TEXT =
  "Mumbai: In this fictional test scenario, veteran actor Nana Patekar is announced as the surprise guest in an upcoming Marathi film project. The production team is expected to reveal further details about the storyline and cast.";

const MAX_CHARS = 50000;

class WebGLBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function StaticHeroArt() {
  return (
    <svg viewBox="0 0 400 320" className="h-full w-full" aria-hidden="true">
      {["#ff7a1a", "#cfcac2", "#1d1d1d", "#dcf44a", "#e9e6e1", "#ffffff"].map((c, i) => (
        <path key={c} d={`M40 ${210 - i * 18} C 120 ${170 - i * 18}, 220 ${250 - i * 18}, 360 ${190 - i * 18} L 340 ${230 - i * 18} C 220 ${290 - i * 18}, 120 ${210 - i * 18}, 60 ${250 - i * 18} Z`} fill={c} stroke="#00000014" />
      ))}
      <circle cx="210" cy="90" r="46" fill="#dfe6ff" stroke="#c9ccd2" strokeWidth="12" />
      <circle cx="210" cy="90" r="16" fill="#2f55ff" />
    </svg>
  );
}

function HeadlineIcon() {
  return (
    <svg viewBox="0 0 48 48" className="mr-3 inline-block size-[0.78em] -translate-y-[0.06em] align-middle" aria-hidden="true">
      <rect x="6" y="26" width="36" height="12" rx="4" fill="#ff7a1a" />
      <rect x="6" y="17" width="36" height="12" rx="4" fill="#f3d9c3" stroke="#121212" strokeWidth="1.5" />
      <rect x="6" y="8" width="36" height="12" rx="4" fill="#fff" stroke="#121212" strokeWidth="1.5" />
      <path d="M20 14l3 3 6-6" stroke="#2f55ff" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const headlineLines = [["Know"], ["icon", "What's"], ["True."]];

function GlancePanel({ loading, result, stats }) {
  const claims = result?.claims ?? [];
  const counts = claims.reduce((acc, c) => ({ ...acc, [c.status]: (acc[c.status] ?? 0) + 1 }), {});
  const sources = claims.reduce((n, c) => n + (c.evidence?.length ?? 0), 0);
  const publishers = new Set(claims.flatMap((c) => (c.evidence ?? []).map((e) => e.publisher).filter(Boolean))).size;
  const segments = [
    ["SUPPORTED", "#2f55ff"],
    ["CONTRADICTED", "#ff7a1a"],
    ["CONFLICTING_EVIDENCE", "#dcf44a"],
    ["INSUFFICIENT_EVIDENCE", "#b9b4ac"],
    ["UNVERIFIABLE", "#dcd7cf"],
  ];
  const total = claims.length || 1;
  let offset = 0;
  const C = 2 * Math.PI * 42;

  const tiles = result
    ? [["Claims found", claims.length], ["Sources checked", sources], ["Publishers", publishers]]
    : [["Articles checked", stats?.articlesChecked], ["Claims checked", stats?.claimsChecked], ["Sources reviewed", stats?.sourcesReviewed]];

  const stages = ["Reading the article", "Extracting claims", "Searching live news", "Weighing evidence"];

  return (
    <div className="flex h-full flex-col rounded-[22px] border border-ink/12 bg-white/70 p-5 backdrop-blur">
      <p className="text-xs uppercase tracking-[0.16em] text-ink/50">Verification at a glance</p>
      <div className="mt-4 flex items-center gap-5">
        <svg viewBox="0 0 100 100" className="size-24 shrink-0 -rotate-90" role="img" aria-label={result ? "Distribution of claim statuses" : "No report yet"}>
          <circle cx="50" cy="50" r="42" fill="none" stroke="#ece6dd" strokeWidth="10" />
          {result &&
            segments.map(([key, color]) => {
              const len = ((counts[key] ?? 0) / total) * C;
              const el = len > 0 && (
                <motion.circle
                  key={key}
                  cx="50" cy="50" r="42" fill="none" stroke={color} strokeWidth="10"
                  strokeDasharray={`${len} ${C - len}`}
                  initial={{ strokeDashoffset: C }}
                  animate={{ strokeDashoffset: -offset }}
                  transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                />
              );
              offset += len;
              return el;
            })}
          {loading && (
            <motion.circle cx="50" cy="50" r="42" fill="none" stroke="#2f55ff" strokeWidth="10" strokeDasharray={`${C * 0.22} ${C}`}
              animate={{ rotate: 360 }} style={{ originX: "50px", originY: "50px" }} transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }} />
          )}
        </svg>
        <div className="min-w-0">
          <AnimatePresence mode="wait">
            <motion.div key={loading ? "l" : result ? result._id : "idle"} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <p className="text-lg leading-tight">
                {loading ? "Analyzing…" : result ? VERDICTS[result.verdict]?.label ?? "Done" : "Ready to analyze"}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-ink/60">
                {loading
                  ? "This usually takes 20–60 seconds on the free AI tier."
                  : result
                    ? result.verdictReason
                    : "Paste an article or a URL. TruthForge extracts claims and checks them against live news coverage."}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {loading ? (
        <ul className="mt-5 space-y-2 text-sm">
          {stages.map((s, i) => (
            <li key={s} className="flex items-center gap-3 text-ink/70">
              <span className="animate-pulse-dot size-2 rounded-full bg-volt" style={{ animationDelay: `${i * 0.2}s` }} />
              {s}
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-5 grid grid-cols-3 gap-2">
          {tiles.map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-ink/10 bg-ivory px-3 py-3">
              <p className="text-2xl tabular-nums">{value ?? "–"}</p>
              <p className="mt-0.5 text-[11px] leading-tight text-ink/55">{label}</p>
            </div>
          ))}
        </div>
      )}
      <p className="mt-auto pt-4 text-[11px] text-ink/45">{result ? "From this report" : loading ? "Live pipeline" : "All-time, from your saved reports"}</p>
    </div>
  );
}

export default function HeroSection({ onAnalyze, loading, error, result, stats }) {
  const frameRef = useRef(null);
  const textareaRef = useRef(null);
  const { motionOn, userEnabled, setUserEnabled } = useMotionPrefs();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mode, setMode] = useState("text");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const isDemo = text === DEMO_TEXT;

  const { scrollYProgress } = useScroll({ target: frameRef, offset: ["start start", "end start"] });
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.9]);
  const rotateX = useTransform(scrollYProgress, [0, 1], [0, 10]);
  const opacity = useTransform(scrollYProgress, [0.6, 1], [1, 0.4]);

  const canSubmit = !loading && (mode === "url" ? url.trim().length > 0 : text.trim().length >= 50);

  const submit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    onAnalyze(mode === "url" ? { url: url.trim() } : { text: text.trim() });
  };

  const go = (id) => {
    setMenuOpen(false);
    if (id === "verify") {
      scrollToId("verify");
      setTimeout(() => textareaRef.current?.focus({ preventScroll: true }), 500);
    } else scrollToId(id);
  };

  const word = {
    hidden: { opacity: 0, y: "60%", rotateX: -40 },
    show: (i) => ({ opacity: 1, y: "0%", rotateX: 0, transition: { duration: 0.9, delay: 0.15 + i * 0.09, ease: [0.22, 1, 0.36, 1] } }),
  };
  let wordIndex = 0;

  return (
    <header className="relative overflow-x-clip px-2 pt-3 sm:px-3 sm:pt-4 lg:px-4" style={{ perspective: 1400 }}>
      <motion.div
        ref={frameRef}
        style={motionOn ? { scale, rotateX, opacity, transformOrigin: "50% 0%" } : undefined}
        className="relative w-full rounded-[30px] bg-ink p-2.5 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.45)]"
      >
        {/* Top bar on the black frame */}
        <div className="relative flex h-12 items-center justify-between px-3">
          <a href="#top" className="z-10" aria-label="TruthForge home">
            <Logo dark />
          </a>

          <nav aria-label="Primary" className="absolute left-[180px] top-0 hidden h-[58px] rounded-t-[20px] bg-ivory px-3 pt-2.5 lg:block">
            <span className="inv-corner inv-corner--ivory-tl bottom-[10px] -left-[18px]" />
            <span className="inv-corner inv-corner--ivory-tr bottom-[10px] -right-[18px]" />
            <ul className="flex items-center gap-1 rounded-full border border-ink/80 px-1.5 py-1">
              {NAV.map((n) => (
                <li key={n.id}>
                  <button type="button" onClick={() => go(n.id)} className="rounded-full px-3 py-1 text-[13px] text-ink/80 transition-colors hover:bg-ink hover:text-ivory">
                    {n.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div className="z-10 flex items-center gap-2">
            <button type="button" onClick={() => go("media")} className="hidden rounded-full border border-white/40 px-4 py-1.5 text-[13px] text-ivory transition-colors hover:bg-white/10 sm:inline-flex lg:hidden xl:inline-flex">
              Analyze media
            </button>
            <button type="button" onClick={() => go("verify")} className="inline-flex items-center gap-2 rounded-full border border-white/40 px-3 py-1.5 text-[13px] text-ivory transition-colors hover:bg-ivory hover:text-ink">
              <span className="grid size-4 place-items-center rounded-full bg-ivory text-ink"><ArrowRight className="size-3" /></span>
              Verify news
            </button>
            <button type="button" className="rounded-full p-2 text-ivory lg:hidden" aria-expanded={menuOpen} aria-label="Menu" onClick={() => setMenuOpen((v) => !v)}>
              {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden px-3 lg:hidden">
              {NAV.map((n) => (
                <li key={n.id}>
                  <button type="button" onClick={() => go(n.id)} className="w-full border-t border-white/10 py-3 text-left text-sm text-ivory">
                    {n.label}
                  </button>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>

        {/* Ivory panel */}
        <div id="top" className="relative overflow-hidden rounded-[22px] bg-gradient-to-b from-ivory via-ivory to-peach/70">
          <div className="animate-drift pointer-events-none absolute -right-32 top-10 size-[520px] rounded-full bg-[radial-gradient(circle,rgba(255,170,110,0.35),transparent_65%)]" />
          <div className="animate-drift pointer-events-none absolute -left-40 bottom-0 size-[480px] rounded-full bg-[radial-gradient(circle,rgba(47,85,255,0.12),transparent_65%)]" style={{ animationDelay: "-6s" }} />
          <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.35]" aria-hidden="true">
            <defs>
              <pattern id="nodes" width="140" height="140" patternUnits="userSpaceOnUse">
                <path d="M10 20 L80 60 L130 30 M80 60 L60 125 L130 110" stroke="#121212" strokeOpacity="0.08" fill="none" />
                {[[10, 20], [80, 60], [130, 30], [60, 125], [130, 110]].map(([x, y]) => (
                  <circle key={`${x}${y}`} cx={x} cy={y} r="2" fill="#121212" fillOpacity="0.15" />
                ))}
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#nodes)" />
          </svg>

          <div className="relative grid grid-cols-[minmax(0,1fr)] gap-6 px-6 pb-8 pt-10 sm:px-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:px-16 lg:pt-16">
            <div className="min-w-0">
              <h1 className="text-[clamp(2.9rem,6.6vw,6rem)] font-normal leading-[0.95] tracking-[-0.035em]" style={{ perspective: 600 }}>
                {headlineLines.map((line, li) => (
                  <span key={li} className="block overflow-hidden pb-[0.06em]">
                    {line.map((w) => {
                      const i = wordIndex++;
                      return (
                        <motion.span key={w} custom={i} variants={word} initial="hidden" animate="show" className="inline-block origin-bottom">
                          {w === "icon" ? <HeadlineIcon /> : w}
                          {w !== "icon" && " "}
                        </motion.span>
                      );
                    })}
                  </span>
                ))}
              </h1>

              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.8 }} className="mt-8 max-w-md">
                <button type="button" onClick={() => go("verify")} className="group inline-flex items-center gap-2 text-sm">
                  <span className="grid size-5 place-items-center rounded-full bg-ink text-ivory transition-transform group-hover:translate-x-1"><ArrowRight className="size-3" /></span>
                  Start verifying
                </button>
                <div className="mt-3 h-px w-full bg-ink/20" />
                <p className="mt-3 text-base">Verify claims. Inspect media. Explore evidence.</p>
                <p className="mt-1 text-sm leading-relaxed text-ink/60">
                  TruthForge checks news claims against live coverage and screens images and videos for signs of AI generation — showing you the evidence, not just a label.
                </p>
              </motion.div>
            </div>

            <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3, duration: 1.2, ease: [0.22, 1, 0.36, 1] }} className="relative h-[300px] min-w-0 overflow-hidden sm:h-[380px] lg:h-[460px]">
              <WebGLBoundary fallback={<StaticHeroArt />}>
                <Suspense fallback={<StaticHeroArt />}>
                  <Hero3D />
                </Suspense>
              </WebGLBoundary>
            </motion.div>
          </div>

          {/* Verification form + glance panel */}
          <div id="verify" className="relative grid scroll-mt-6 gap-4 px-4 pb-20 sm:px-12 lg:grid-cols-[1.6fr_1fr] lg:px-16">
            <motion.form
              onSubmit={submit}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.75, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden rounded-[22px] border border-ink/15 bg-white shadow-[0_24px_60px_-30px_rgba(18,18,18,0.35)]"
              aria-labelledby="verify-title"
            >
              <div className="flex items-center gap-3 border-b border-ink/10 px-4 py-3">
                <span className="flex gap-1.5" aria-hidden="true">
                  <span className="size-2.5 rounded-full bg-ember" />
                  <span className="size-2.5 rounded-full bg-lime" />
                  <span className="size-2.5 rounded-full bg-volt" />
                </span>
                <span className="flex-1 truncate rounded-full bg-ivory px-3 py-1 text-xs text-ink/50">truthforge://verify/news</span>
                {isDemo && <span className="hidden rounded-full bg-lime px-2.5 py-1 text-[11px] sm:inline">Demo content — fictional test data</span>}
              </div>

              <div className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 id="verify-title" className="text-lg tracking-tight">News verification</h2>
                  <div role="tablist" aria-label="Input type" className="inline-flex rounded-full border border-ink/15 p-1 text-sm">
                    {[["text", "Paste text", FileText], ["url", "Article URL", Link2]].map(([m, label, Icon]) => (
                      <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => setMode(m)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 transition-colors ${mode === m ? "bg-ink text-ivory" : "text-ink/70 hover:text-ink"}`}>
                        <Icon className="size-3.5" /> {label}
                      </button>
                    ))}
                  </div>
                </div>

                <AnimatePresence mode="wait" initial={false}>
                  {mode === "text" ? (
                    <motion.div key="text" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mt-4">
                      <label htmlFor="article-text" className="sr-only">Article text</label>
                      <textarea
                        id="article-text"
                        ref={textareaRef}
                        value={text}
                        maxLength={MAX_CHARS}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Paste a news article's text here (at least 50 characters)…"
                        className="h-44 w-full resize-y rounded-2xl border border-ink/15 bg-ivory/60 p-4 text-[15px] leading-relaxed outline-none transition-colors focus:border-volt focus:bg-white"
                      />
                      <div className="mt-1 flex justify-between text-[11px] text-ink/45">
                        <span>{text.trim().length > 0 && text.trim().length < 50 ? `${50 - text.trim().length} more characters needed` : ""}</span>
                        <span className="tabular-nums">{text.length.toLocaleString()}/{MAX_CHARS.toLocaleString()}</span>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div key="url" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mt-4">
                      <label htmlFor="article-url" className="sr-only">Article URL</label>
                      <div className="flex items-center gap-2 rounded-2xl border border-ink/15 bg-ivory/60 px-4 py-3 focus-within:border-volt focus-within:bg-white">
                        <Link2 className="size-4 text-ink/40" />
                        <input id="article-url" type="url" inputMode="url" value={url} onChange={(e) => setUrl(e.target.value)}
                          placeholder="https://www.example.com/news/article" className="w-full bg-transparent text-[15px] outline-none" />
                      </div>
                      <p className="mt-2 text-xs text-ink/50">Works with most public news pages. Paywalled or JavaScript-only sites may not extract — paste the text instead.</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {error && (
                    <motion.div role="alert" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                      className="mt-3 flex items-start gap-2 rounded-2xl border border-ember/40 bg-ember/10 p-3 text-sm text-ink">
                      <TriangleAlert className="mt-0.5 size-4 shrink-0 text-ember" />
                      <div className="flex-1">
                        {error.message}
                        {error.canRetryWithText && mode === "url" && (
                          <button type="button" onClick={() => setMode("text")} className="ml-2 underline underline-offset-2">Paste text instead</button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
                  <button type="button" onClick={() => { setMode("text"); setText(DEMO_TEXT); }}
                    className="inline-flex items-center gap-2 rounded-full border border-ink/20 px-4 py-2.5 text-sm transition-colors hover:border-ink">
                    <FileText className="size-4" /> Load demo article
                  </button>
                  <motion.button type="submit" disabled={!canSubmit} whileTap={{ scale: 0.97 }}
                    className="group inline-flex items-center gap-2 rounded-full bg-volt px-5 py-2.5 text-sm text-white shadow-[0_10px_30px_-10px_rgba(47,85,255,0.8)] transition-colors hover:bg-ink disabled:cursor-not-allowed disabled:opacity-40">
                    {loading ? <LoaderCircle className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                    {loading ? "Analyzing…" : "Analyze news"}
                    {!loading && <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />}
                  </motion.button>
                </div>
              </div>
            </motion.form>

            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}>
              <GlancePanel loading={loading} result={result} stats={stats} />
            </motion.div>
          </div>

          {/* Bottom-right notch: motion toggle (the reference's "Crazy mode") */}
          <div className="absolute bottom-0 right-0 flex items-center gap-2 rounded-tl-[20px] bg-ink py-2.5 pl-4 pr-2 text-[11px] text-ivory">
            <span className="inv-corner inv-corner--ink-tl -top-[18px] right-0" />
            <span className="inv-corner inv-corner--ink-tl bottom-0 -left-[18px]" />
            Motion
            <div role="group" aria-label="Animations" className="flex rounded-full border border-white/30 p-0.5">
              {[["On", true], ["Off", false]].map(([label, val]) => (
                <button key={label} type="button" aria-pressed={userEnabled === val} onClick={() => setUserEnabled(val)}
                  className={`rounded-full px-2.5 py-0.5 transition-colors ${userEnabled === val ? "bg-ivory text-ink" : "text-ivory/70"}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </header>
  );
}
