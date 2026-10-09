import { useRef } from "react";
import { motion } from "motion/react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Flame, RotateCcw } from "lucide-react";
import { SectionHeading, TiltCard, formatDate, staggerChild, staggerParent } from "../components/ui";

export default function TrendingSection({ data, error, onRetry }) {
  const scroller = useRef(null);
  const scrollBy = (dir) => scroller.current?.scrollBy({ left: dir * scroller.current.clientWidth * 0.8, behavior: "smooth" });

  return (
    <section id="trending" aria-labelledby="trending-title" className="mx-auto max-w-[1440px] scroll-mt-6 px-4 py-24 sm:px-10">
      <SectionHeading id="trending-title" eyebrow="Live feed" title={<>Trending<br />Fact Checks.</>}>
        Fact-check reporting published in the last 7 days, pulled live from Google News and refreshed every 15 minutes. Open any story to read the original.
      </SectionHeading>

      <div className="mt-8 flex items-center justify-between gap-4">
        <p className="text-xs text-ink/50">
          {data ? `Source: ${data.provider} · updated ${formatDate(data.fetchedAt, true)}` : error ? "" : "Loading the latest fact checks…"}
        </p>
        <div className="flex gap-2">
          {[[-1, ArrowLeft, "Previous"], [1, ArrowRight, "Next"]].map(([d, Icon, label]) => (
            <button key={label} type="button" aria-label={label} onClick={() => scrollBy(d)}
              className="grid size-10 place-items-center rounded-full border border-ink/20 transition-colors hover:bg-ink hover:text-ivory">
              <Icon className="size-4" />
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div className="mt-6 flex items-center gap-4 rounded-[22px] border border-ink/15 p-6 text-sm">
          <p className="flex-1 text-ink/70">{error}</p>
          <button type="button" onClick={onRetry} className="inline-flex items-center gap-2 rounded-full border border-ink/20 px-4 py-2 hover:border-ink">
            <RotateCcw className="size-4" /> Retry
          </button>
        </div>
      ) : (
        <motion.ul
          ref={scroller}
          variants={staggerParent}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-10%" }}
          className="no-scrollbar -mx-4 mt-6 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-4 sm:-mx-10 sm:scroll-px-10 sm:px-10"
        >
          {(data?.items ?? Array.from({ length: 4 })).map((item, i) => (
            <motion.li key={item?.url ?? i} variants={staggerChild} className="w-[82%] shrink-0 snap-start sm:w-[340px]">
              {item ? (
                <TiltCard max={5} className="h-full">
                  <a href={item.url} target="_blank" rel="noopener noreferrer"
                    className={`group flex h-[230px] flex-col rounded-[22px] border p-5 transition-colors ${i === 0 ? "border-ink bg-ink text-ivory" : "border-ink/15 bg-white hover:border-ink"}`}>
                    <div className="flex items-center justify-between text-xs">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ${i === 0 ? "bg-lime text-ink" : "bg-ivory"}`}>
                        <Flame className="size-3.5" /> {i === 0 ? "Most recent" : "Fact check"}
                      </span>
                      <ArrowUpRight className="size-4 opacity-50 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </div>
                    <p className="mt-4 line-clamp-4 text-lg leading-snug">{item.title}</p>
                    <p className={`mt-auto text-xs ${i === 0 ? "text-white/55" : "text-ink/50"}`}>
                      {item.publisher || "Unknown publisher"}{item.publishedAt && ` · ${formatDate(item.publishedAt)}`}
                    </p>
                  </a>
                </TiltCard>
              ) : (
                <div className="skeleton h-[230px] rounded-[22px]" />
              )}
            </motion.li>
          ))}
        </motion.ul>
      )}
    </section>
  );
}
