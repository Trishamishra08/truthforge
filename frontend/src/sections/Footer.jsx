import { ArrowUpRight } from "lucide-react";
import { Logo, Reveal } from "../components/ui";
import { scrollToId } from "../lib/motionPrefs";

const LINKS = [
  ["Product", [["News verification", "verify"], ["AI media detection", "media"], ["Capabilities", "capabilities"]]],
  ["Explore", [["Source explorer", "sources"], ["Trending fact checks", "trending"], ["Saved reports", "reports"]]],
  ["Learn", [["How it works", "how"], ["Back to top", "top"]]],
];

export default function Footer() {
  return (
    <footer className="px-3 pb-3 sm:px-5 sm:pb-5">
      <Reveal className="mx-auto max-w-[1440px] overflow-hidden rounded-[30px] bg-ink px-6 pb-8 pt-14 text-ivory sm:px-10">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_2fr]">
          <div>
            <Logo dark />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/55">
              AI-powered news verification and AI-generated media detection. Verify the story, examine the media, understand the evidence.
            </p>
            <button type="button" onClick={() => scrollToId("verify")}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-lime px-5 py-2.5 text-sm text-ink transition-colors hover:bg-ivory">
              Start verifying <ArrowUpRight className="size-4" />
            </button>
          </div>
          <nav aria-label="Footer" className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {LINKS.map(([heading, items]) => (
              <div key={heading}>
                <p className="text-xs uppercase tracking-[0.16em] text-white/40">{heading}</p>
                <ul className="mt-4 space-y-2.5 text-sm">
                  {items.map(([label, id]) => (
                    <li key={id}>
                      <button type="button" onClick={() => (id === "top" ? window.scrollTo({ top: 0, behavior: "smooth" }) : scrollToId(id))}
                        className="text-white/75 transition-colors hover:text-lime">
                        {label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <p aria-hidden="true" className="mt-16 select-none text-[clamp(3.5rem,15vw,13rem)] leading-[0.8] tracking-[-0.05em] text-white/[0.07]">
          TruthForge
        </p>

        <div className="mt-12 flex flex-wrap justify-between gap-4 border-t border-white/10 pt-6 text-xs text-white/45">
          <p className="max-w-2xl">
            Automated assessments can be wrong. TruthForge shows evidence and uncertainty so you can make the call — it is not a substitute for professional fact-checking or forensic analysis.
          </p>
          <p>Built with React · Express · MongoDB · Gemini</p>
        </div>
      </Reveal>
    </footer>
  );
}
