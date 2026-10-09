import { motion } from "motion/react";
import { Globe } from "lucide-react";
import DarkPanel from "../components/DarkPanel";
import { SectionHeading, formatDate, staggerChild, staggerParent } from "../components/ui";
import { scrollToId } from "../lib/motionPrefs";

function Tile({ s }) {
  return (
    <li className="flex h-24 w-64 shrink-0 flex-col justify-center rounded-2xl border border-white/20 px-5 transition-colors hover:border-lime">
      <p className="flex items-center gap-2 truncate text-[15px]"><Globe className="size-4 shrink-0 text-white/40" />{s.publisher}</p>
      <p className="mt-1 text-xs text-white/50">
        {s.citations} result{s.citations === 1 ? "" : "s"} · <span className="text-[#8fa4ff]">{s.supports} supporting</span> · <span className="text-ember">{s.contradicts} contradicting</span>
      </p>
    </li>
  );
}

export default function SourcesSection({ sources, error }) {
  const list = sources ?? [];
  const max = Math.max(1, ...list.map((s) => s.citations));
  const loop = list.length >= 4;

  return (
    <DarkPanel id="sources" labelledBy="sources-title">
      <SectionHeading dark id="sources-title" eyebrow="Fact check explorer" title={<>Sources in<br />Your Checks.</>}>
        Every publisher whose reporting turned up while verifying your claims. These are counts from your own reports — how coverage related to the claims you tested — not a credibility rating.
      </SectionHeading>

      {error ? (
        <p className="mt-10 text-sm text-white/60">Couldn't load sources: {error}</p>
      ) : sources === null ? (
        <div className="mt-10 flex gap-4 overflow-hidden">{[0, 1, 2, 3].map((i) => <div key={i} className="skeleton-dark h-24 w-64 shrink-0 rounded-2xl" />)}</div>
      ) : list.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-white/20 p-8 text-center">
          <p className="text-lg">No sources yet.</p>
          <p className="mt-1 text-sm text-white/50">Run a news check and the publishers it finds will appear here.</p>
          <button type="button" onClick={() => scrollToId("verify")} className="mt-5 rounded-full border border-white/30 px-4 py-2 text-sm hover:bg-white/10">Verify an article</button>
        </div>
      ) : (
        <>
          <div className="relative mt-10 overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
            <ul className={`flex w-max gap-4 ${loop ? "animate-marquee" : ""}`} aria-label="Publishers found in your checks">
              {(loop ? [...list, ...list] : list).map((s, i) => (
                <Tile key={`${s.publisher}-${i}`} s={s} />
              ))}
            </ul>
          </div>

          <motion.ul variants={staggerParent} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-10%" }} className="mt-10 grid gap-x-10 gap-y-4 md:grid-cols-2">
            {list.slice(0, 10).map((s) => (
              <motion.li key={s.publisher} variants={staggerChild}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="truncate">{s.publisher}</span>
                  <span className="shrink-0 text-xs text-white/45">in {s.analyses} report{s.analyses === 1 ? "" : "s"} · last {formatDate(s.lastSeen)}</span>
                </div>
                <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-white/10" role="img"
                  aria-label={`${s.supports} supporting, ${s.contradicts} contradicting, ${s.citations - s.supports - s.contradicts} other of ${s.citations} results`}>
                  <motion.span className="bg-volt" initial={{ width: 0 }} whileInView={{ width: `${(s.supports / max) * 100}%` }} viewport={{ once: true }} transition={{ duration: 0.9 }} />
                  <motion.span className="bg-ember" initial={{ width: 0 }} whileInView={{ width: `${(s.contradicts / max) * 100}%` }} viewport={{ once: true }} transition={{ duration: 0.9, delay: 0.1 }} />
                  <motion.span className="bg-white/35" initial={{ width: 0 }} whileInView={{ width: `${((s.citations - s.supports - s.contradicts) / max) * 100}%` }} viewport={{ once: true }} transition={{ duration: 0.9, delay: 0.2 }} />
                </div>
              </motion.li>
            ))}
          </motion.ul>
          <p className="mt-6 flex flex-wrap gap-4 text-xs text-white/50">
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-volt" /> Supporting</span>
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-ember" /> Contradicting</span>
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-white/35" /> Other coverage</span>
          </p>
        </>
      )}
    </DarkPanel>
  );
}
