import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import DarkPanel from "../components/DarkPanel";
import { NotchCard, SectionHeading, TiltCard } from "../components/ui";
import { ImageScanArt, NewsStackArt, ReportsArt, SourcesArt, TrendingArt, VideoArt } from "../components/Illustrations";
import { scrollToId } from "../lib/motionPrefs";

const CAPABILITIES = [
  { title: "News claim verification", target: "verify", Art: NewsStackArt,
    body: "Paste text or a URL. Each factual claim is searched against live news coverage and labelled Supported, Contradicted, Conflicting, Needs evidence or Unverifiable — with the links." },
  { title: "AI-generated image detection", target: "media", Art: ImageScanArt,
    body: "Upload a JPEG, PNG or WebP. The model looks for diffusion artifacts, broken hands and text, lighting that doesn't add up, and explains what it found." },
  { title: "Deepfake video check", target: "media", Art: VideoArt,
    body: "Upload a short clip. Sampled frames are screened for morphing, unnatural facial motion and edge warping, with timestamps you can inspect." },
  { title: "Source explorer", target: "sources", Art: SourcesArt,
    body: "See which publishers keep showing up in your checks, and how often their reporting supported or contradicted the claims you tested." },
  { title: "Trending fact checks", target: "trending", Art: TrendingArt,
    body: "A live feed of fact-check reporting from the past week, pulled from Google News, so you can see what's being debunked right now." },
  { title: "Saved reports", target: "reports", Art: ReportsArt,
    body: "Every analysis is saved. Search, filter, reopen or delete your past news and media reports at any time." },
];

export default function CapabilitiesSection() {
  const [active, setActive] = useState(0);

  return (
    <DarkPanel id="capabilities" labelledBy="cap-title">
      <SectionHeading dark id="cap-title" eyebrow="Capabilities" title={<>How Can<br />TruthForge Help?</>}>
        Two engines — news verification and AI media detection — plus the tools around them for exploring evidence and keeping a record.
      </SectionHeading>

      <ul className="no-scrollbar -mx-5 mt-10 flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto px-5 pb-2 sm:-mx-10 sm:scroll-px-10 sm:px-10 lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0">
        {CAPABILITIES.map((c, i) => {
          const on = active === i;
          return (
            <li key={c.title} className="w-[78%] shrink-0 snap-start sm:w-[46%] lg:w-auto">
              <TiltCard className="h-full">
                <NotchCard index={i + 1} active={on} className="h-full">
                  <button
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onFocus={() => setActive(i)}
                    onClick={() => (on ? scrollToId(c.target) : setActive(i))}
                    aria-expanded={on}
                    className={`group relative flex h-[300px] w-full flex-col overflow-hidden rounded-[18px] rounded-tl-none p-5 text-left transition-colors duration-500 ${on ? "bg-lime text-ink" : "text-ivory"}`}
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      {on ? (
                        <motion.div key="on" className="flex h-full flex-col" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35 }}>
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-lg leading-tight">{c.title}</p>
                            <div className="size-14 shrink-0"><c.Art /></div>
                          </div>
                          <p className="mt-4 text-sm leading-relaxed text-ink/75">{c.body}</p>
                          <span className="mt-auto inline-flex items-center gap-2 text-sm">
                            <span className="grid size-5 place-items-center rounded-full bg-ink text-lime"><ArrowRight className="size-3" /></span>
                            Open {c.title.toLowerCase()}
                          </span>
                        </motion.div>
                      ) : (
                        <motion.div key="off" className="flex h-full flex-col items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                          <div className="mt-4 h-36 w-40 transition-transform duration-500 group-hover:scale-105"><c.Art /></div>
                          <p className="mt-auto text-center text-lg leading-tight">{c.title}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>
                </NotchCard>
              </TiltCard>
            </li>
          );
        })}
      </ul>
    </DarkPanel>
  );
}
