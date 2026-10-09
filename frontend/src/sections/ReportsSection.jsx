import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { FileText, Image as ImageIcon, LoaderCircle, Search, Trash2, Video } from "lucide-react";
import { MediaBadge, Reveal, SectionHeading, VerdictBadge, formatDate } from "../components/ui";
import { scrollToId } from "../lib/motionPrefs";

const FILTERS = [["all", "All"], ["news", "News"], ["image", "Images"], ["video", "Videos"]];

function StatTile({ label, value, Icon }) {
  return (
    <div className="flex items-center gap-4 rounded-[22px] border border-ink/12 bg-white p-4">
      <span className="grid size-10 place-items-center rounded-full bg-ivory"><Icon className="size-4" /></span>
      <div>
        <p className="text-2xl tabular-nums">{value ?? "–"}</p>
        <p className="text-xs text-ink/55">{label}</p>
      </div>
    </div>
  );
}

export default function ReportsSection({ news, media, stats, error, onOpen, onDelete }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [confirming, setConfirming] = useState(null);
  const [busy, setBusy] = useState(null);

  const rows = useMemo(() => {
    const all = [
      ...(news ?? []).map((n) => ({ kind: "news", id: n._id, title: n.title || n.sourceUrl || "Untitled article", sub: n.publisher, date: n.createdAt, verdict: n.verdict })),
      ...(media ?? []).map((m) => ({ kind: m.mediaType ?? "image", id: m._id, title: m.fileName, date: m.createdAt, category: m.category })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date));
    const q = query.trim().toLowerCase();
    return all.filter((r) => (filter === "all" || r.kind === filter) && (!q || `${r.title} ${r.sub ?? ""}`.toLowerCase().includes(q)));
  }, [news, media, query, filter]);

  const loading = news === null || media === null;

  const remove = async (row) => {
    setBusy(row.id);
    try {
      await onDelete(row);
    } finally {
      setBusy(null);
      setConfirming(null);
    }
  };

  return (
    <section id="reports" aria-labelledby="reports-title" className="mx-auto max-w-[1440px] scroll-mt-6 px-4 py-24 sm:px-10">
      <SectionHeading id="reports-title" eyebrow="History" title={<>Saved<br />Reports.</>}>
        Every analysis you run is saved to the database. Reopen a report to see its full evidence, or delete the ones you don't need.
      </SectionHeading>

      <Reveal className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Articles checked" value={stats?.articlesChecked} Icon={FileText} />
        <StatTile label="Claims checked" value={stats?.claimsChecked} Icon={Search} />
        <StatTile label="Images analyzed" value={stats?.imagesAnalyzed} Icon={ImageIcon} />
        <StatTile label="Videos analyzed" value={stats?.videosAnalyzed} Icon={Video} />
      </Reveal>

      <Reveal delay={0.1} className="mt-6 rounded-[22px] border border-ink/12 bg-white">
        <div className="flex flex-wrap items-center gap-3 border-b border-ink/10 p-4">
          <label className="flex min-w-[220px] flex-1 items-center gap-2 rounded-full border border-ink/15 px-4 py-2 focus-within:border-volt">
            <Search className="size-4 text-ink/40" />
            <span className="sr-only">Search reports</span>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by title, publisher or file name" className="w-full bg-transparent text-sm outline-none" />
          </label>
          <div role="tablist" aria-label="Filter reports" className="flex rounded-full border border-ink/15 p-1 text-sm">
            {FILTERS.map(([key, label]) => (
              <button key={key} type="button" role="tab" aria-selected={filter === key} onClick={() => setFilter(key)}
                className={`rounded-full px-3 py-1 transition-colors ${filter === key ? "bg-ink text-ivory" : "text-ink/65 hover:text-ink"}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {error ? (
          <p className="p-6 text-sm text-ink/60">Couldn't load reports: {error}</p>
        ) : loading ? (
          <div className="space-y-2 p-4">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-14 rounded-2xl" />)}</div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-lg">{query || filter !== "all" ? "No reports match." : "No reports yet."}</p>
            <p className="mt-1 text-sm text-ink/55">{query || filter !== "all" ? "Try a different search or filter." : "Your news and media analyses will be listed here."}</p>
            {!query && filter === "all" && (
              <div className="mt-5 flex justify-center gap-3">
                <button type="button" onClick={() => scrollToId("verify")} className="rounded-full bg-ink px-4 py-2 text-sm text-ivory">Verify news</button>
                <button type="button" onClick={() => scrollToId("media")} className="rounded-full border border-ink/20 px-4 py-2 text-sm">Analyze media</button>
              </div>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-ink/8">
            <AnimatePresence initial={false}>
              {rows.map((r) => {
                const Icon = r.kind === "news" ? FileText : r.kind === "video" ? Video : ImageIcon;
                return (
                  <motion.li key={r.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, height: 0 }} className="flex flex-wrap items-center gap-3 px-4 py-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-ivory"><Icon className="size-4" /></span>
                    <button type="button" onClick={() => onOpen(r)} className="min-w-0 flex-1 text-left">
                      <span className="block truncate text-sm hover:underline">{r.title}</span>
                      <span className="text-xs text-ink/50">{r.sub ? `${r.sub} · ` : ""}{formatDate(r.date, true)}</span>
                    </button>
                    {r.kind === "news" ? (r.verdict ? <VerdictBadge verdict={r.verdict} /> : null) : (
                      <span className="rounded-full bg-ink p-0.5"><MediaBadge category={r.category} /></span>
                    )}
                    {confirming === r.id ? (
                      <span className="flex items-center gap-2 text-xs">
                        Delete?
                        <button type="button" disabled={busy === r.id} onClick={() => remove(r)} className="inline-flex items-center gap-1 rounded-full bg-ember px-3 py-1 text-white">
                          {busy === r.id && <LoaderCircle className="size-3 animate-spin" />} Yes
                        </button>
                        <button type="button" onClick={() => setConfirming(null)} className="rounded-full border border-ink/20 px-3 py-1">No</button>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <button type="button" onClick={() => onOpen(r)} className="rounded-full border border-ink/15 px-3 py-1 text-xs hover:border-ink">Open</button>
                        <button type="button" onClick={() => setConfirming(r.id)} aria-label={`Delete ${r.title}`} className="rounded-full p-2 text-ink/45 hover:bg-ember/10 hover:text-ember">
                          <Trash2 className="size-4" />
                        </button>
                      </span>
                    )}
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        )}
      </Reveal>
    </section>
  );
}
