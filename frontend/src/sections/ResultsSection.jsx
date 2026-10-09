import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, CircleAlert, Clock, FileText, Globe, Info } from "lucide-react";
import { ClaimBadge, VERDICTS, formatDate, staggerChild, staggerParent } from "../components/ui";

const TONE = {
  volt: { card: "bg-volt text-white", sub: "text-white/75" },
  ember: { card: "bg-ember text-white", sub: "text-white/80" },
  lime: { card: "bg-lime text-ink", sub: "text-ink/70" },
  neutral: { card: "bg-ink text-ivory", sub: "text-white/65" },
};

const RELATIONS = [
  ["SUPPORTS", "Supporting", "bg-volt"],
  ["CONTRADICTS", "Contradicting", "bg-ember"],
  ["RELATED", "Other coverage found", "bg-ink/25"],
];

function Skeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.6fr]" aria-busy="true" aria-label="Loading results">
      <div className="skeleton h-64 rounded-[22px]" />
      <div className="space-y-3">
        <div className="skeleton h-24 rounded-[22px]" />
        {[0, 1, 2].map((i) => <div key={i} className="skeleton h-32 rounded-[22px]" style={{ animationDelay: `${i * 0.15}s` }} />)}
      </div>
    </div>
  );
}

function Evidence({ items }) {
  if (!items?.length) return <p className="mt-3 text-xs text-ink/50">No news coverage was found for this claim. That alone doesn't make it false.</p>;
  return (
    <div className="mt-4 space-y-3">
      {RELATIONS.map(([rel, label, dot]) => {
        const group = items.filter((e) => e.relation === rel);
        if (!group.length) return null;
        return (
          <div key={rel}>
            <p className="mb-1.5 flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-ink/50">
              <span className={`size-1.5 rounded-full ${dot}`} /> {label} · {group.length}
            </p>
            <ul className="divide-y divide-ink/8 rounded-2xl border border-ink/10 bg-ivory/60">
              {group.map((e, i) => (
                <li key={i}>
                  <a href={e.url} target="_blank" rel="noopener noreferrer" className="group flex items-start gap-3 px-3 py-2.5 transition-colors hover:bg-white">
                    <Globe className="mt-0.5 size-4 shrink-0 text-ink/35" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm leading-snug group-hover:underline">{e.title}</span>
                      <span className="mt-0.5 block text-[11px] text-ink/50">
                        {e.publisher || "Unknown publisher"}
                        {e.publishedAt && ` · ${formatDate(e.publishedAt)}`}
                      </span>
                    </span>
                    <ArrowUpRight className="size-4 shrink-0 text-ink/35 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

export default function ResultsSection({ loading, result }) {
  const visible = loading || result;
  const v = result ? VERDICTS[result.verdict] ?? VERDICTS.UNVERIFIED : null;
  const tone = v ? TONE[v.tone] : null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.section
          id="results"
          aria-live="polite"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-[1440px] scroll-mt-6 px-4 py-20 sm:px-10"
        >
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-3 text-xs uppercase tracking-[0.18em] text-ink/50">Verification results</p>
              <h2 className="text-4xl leading-[1.02] tracking-tight sm:text-5xl">{loading ? "Checking the claims…" : result.title || "Your report"}</h2>
            </div>
            {result && !loading && (
              <p className="flex items-center gap-2 text-sm text-ink/55">
                <Clock className="size-4" /> Analyzed {formatDate(result.createdAt, true)}
              </p>
            )}
          </div>

          {loading ? (
            <Skeleton />
          ) : (
            <div className="grid gap-4 lg:grid-cols-[1fr_1.6fr]">
              <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, rotateX: 20 }}
                  animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                  transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                  className={`relative overflow-hidden rounded-[22px] p-6 ${tone.card}`}
                  style={{ transformPerspective: 900 }}
                >
                  <p className={`text-xs uppercase tracking-[0.18em] ${tone.sub}`}>Overall assessment</p>
                  <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.7 }}
                    className="mt-2 text-5xl leading-none tracking-tight sm:text-6xl">
                    {v.label}
                  </motion.p>
                  <p className={`mt-4 text-sm leading-relaxed ${tone.sub}`}>{result.verdictReason}</p>
                  <p className={`mt-4 border-t border-current/20 pt-3 text-[11px] ${tone.sub}`}>
                    Derived from the claim statuses by fixed rules — not a score and not proof.
                  </p>
                </motion.div>

                {result.contentNotice && (
                  <div className="flex gap-3 rounded-[22px] border border-ink/15 bg-lime/70 p-4 text-sm">
                    <Info className="mt-0.5 size-4 shrink-0" />
                    <p><strong className="font-medium">Fictional or test content detected.</strong> {result.contentNotice}</p>
                  </div>
                )}

                <div className="rounded-[22px] border border-ink/12 bg-white p-5">
                  <p className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-ink/50"><FileText className="size-3.5" /> Summary</p>
                  <p className="mt-3 text-[15px] leading-relaxed text-ink/80">{result.summary}</p>
                  <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-ink/10 pt-4 text-xs">
                    <div><dt className="text-ink/45">Input</dt><dd className="mt-0.5">{result.inputType === "url" ? "Article URL" : "Pasted text"}</dd></div>
                    <div><dt className="text-ink/45">Evidence</dt><dd className="mt-0.5">{result.evidenceAvailable ? result.evidenceProvider : "Unavailable"}</dd></div>
                    {result.modelName && <div className="col-span-2"><dt className="text-ink/45">AI model</dt><dd className="mt-0.5">{result.modelName}</dd></div>}
                    {result.publisher && <div><dt className="text-ink/45">Publisher</dt><dd className="mt-0.5">{result.publisher}</dd></div>}
                    {result.publishedAt && <div><dt className="text-ink/45">Published</dt><dd className="mt-0.5">{formatDate(result.publishedAt)}</dd></div>}
                    {result.sourceUrl && (
                      <div className="col-span-2"><dt className="text-ink/45">Source</dt>
                        <dd className="mt-0.5 truncate"><a href={result.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-volt underline-offset-2 hover:underline">{result.sourceUrl}</a></dd>
                      </div>
                    )}
                  </dl>
                </div>

                <div className="flex gap-3 rounded-[22px] border border-ink/12 p-4 text-xs leading-relaxed text-ink/60">
                  <CircleAlert className="mt-0.5 size-4 shrink-0" />
                  <p><strong className="font-medium text-ink">Limitations.</strong> {result.limitations}</p>
                </div>
              </div>

              <motion.ol variants={staggerParent} initial="hidden" animate="show" className="space-y-3" aria-label="Key claims and evidence">
                <motion.li variants={staggerChild} className="flex flex-wrap gap-2 pb-1">
                  {Object.entries(result.claims.reduce((a, c) => ({ ...a, [c.status]: (a[c.status] ?? 0) + 1 }), {})).map(([s, n]) => (
                    <span key={s} className="inline-flex items-center gap-1.5"><ClaimBadge status={s} /><span className="text-xs text-ink/50">×{n}</span></span>
                  ))}
                </motion.li>
                {result.claims.length === 0 && (
                  <motion.li variants={staggerChild} className="rounded-[22px] border border-ink/12 bg-white p-6 text-sm text-ink/60">
                    No checkable factual claims were found in this text.
                  </motion.li>
                )}
                {result.claims.map((c, i) => (
                  <motion.li key={i} variants={staggerChild} className="rounded-[22px] border border-ink/12 bg-white p-5">
                    <div className="flex items-start gap-4">
                      <span className="grid size-8 shrink-0 place-items-center rounded-full border border-ink/15 text-xs tabular-nums">{i + 1}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <p className="text-[15px] leading-snug">{c.text}</p>
                          <ClaimBadge status={c.status} />
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-ink/65">{c.explanation}</p>
                        <Evidence items={c.evidence} />
                      </div>
                    </div>
                  </motion.li>
                ))}
              </motion.ol>
            </div>
          )}
        </motion.section>
      )}
    </AnimatePresence>
  );
}
