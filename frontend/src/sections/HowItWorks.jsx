import { motion } from "motion/react";
import { NotchCard, SectionHeading, staggerChild, staggerParent } from "../components/ui";

const STEPS = [
  { title: "Input", body: "Paste article text, drop in a news URL, or upload an image or short video." },
  { title: "AI analysis", body: "Gemini summarizes the article and pulls out up to five checkable factual claims — or inspects the media for visual signs of generation." },
  { title: "Find evidence", body: "Each claim is searched against live Google News coverage. The model can only cite results it was actually given." },
  { title: "Clear result", body: "Claim-by-claim statuses with links, plus an overall verdict computed by fixed, explainable rules — and the limitations, stated plainly." },
];

export default function HowItWorks() {
  return (
    <section id="how" aria-labelledby="how-title" className="mx-auto max-w-[1440px] scroll-mt-6 px-4 py-24 sm:px-10">
      <SectionHeading id="how-title" eyebrow="Process" title={<>How TruthForge<br />Works.</>}>
        A transparent four-step pipeline. TruthForge never presents a guess as a fact: no evidence means "needs evidence", not "false".
      </SectionHeading>

      <motion.ol variants={staggerParent} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-10%" }} className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((s, i) => (
          <motion.li key={s.title} variants={staggerChild}>
            <NotchCard index={i + 1} dark={false} className="h-full">
              <div className="flex h-full min-h-[220px] flex-col rounded-[18px] rounded-tl-none bg-white/60 p-5">
                <span className={`grid size-11 place-items-center rounded-full text-sm ${i === 3 ? "bg-lime" : i === 0 ? "bg-ink text-ivory" : "border border-ink/20"}`}>{i + 1}</span>
                <p className="mt-6 text-xl tracking-tight">{s.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-ink/60">{s.body}</p>
              </div>
            </NotchCard>
          </motion.li>
        ))}
      </motion.ol>
    </section>
  );
}
