import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useCanHover, useMotionPrefs } from "../lib/motionPrefs";

const EASE = [0.22, 1, 0.36, 1];

export function Logo({ dark = false }) {
  return (
    <span className={`inline-flex items-center gap-2 font-medium tracking-tight ${dark ? "text-ivory" : "text-ink"}`}>
      <svg viewBox="0 0 32 32" className="size-6" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill={dark ? "#f6f3ee" : "#121212"} />
        <path d="M5 16s4-7 11-7 11 7 11 7-4 7-11 7S5 16 5 16Z" fill="none" stroke={dark ? "#121212" : "#f6f3ee"} strokeWidth="2" />
        <circle cx="16" cy="16" r="4.2" fill="#2f55ff" />
        <circle cx="17.4" cy="14.6" r="1.2" fill="#dcf44a" />
      </svg>
      TRUTHFORGE
    </span>
  );
}

export function Reveal({ children, delay = 0, y = 28, className = "", as = "div" }) {
  const Comp = motion[as];
  return (
    <Comp
      className={className}
      initial={{ opacity: 0, y, scale: 0.985 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: 0.8, ease: EASE, delay }}
    >
      {children}
    </Comp>
  );
}

export const staggerParent = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
export const staggerChild = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

export function SectionHeading({ eyebrow, title, children, dark = false, id }) {
  return (
    <div className="grid gap-6 md:grid-cols-[1.2fr_1fr] md:items-end">
      <div>
        {eyebrow && (
          <p className={`mb-3 text-xs uppercase tracking-[0.18em] ${dark ? "text-white/50" : "text-ink/50"}`}>{eyebrow}</p>
        )}
        <h2 id={id} className={`text-4xl leading-[1.02] tracking-tight sm:text-5xl md:text-6xl ${dark ? "text-ivory" : "text-ink"}`}>
          {title}
        </h2>
      </div>
      {children && <div className={`max-w-md text-sm leading-relaxed ${dark ? "text-white/60" : "text-ink/60"}`}>{children}</div>}
      <div className={`col-span-full h-px ${dark ? "bg-white/15" : "bg-ink/15"}`} />
    </div>
  );
}

/** Outlined card with the "/ 01" notched tab from the reference design. */
export function NotchCard({ index, children, className = "", dark = true, active = false }) {
  const border = dark ? (active ? "border-lime" : "border-white/25") : "border-ink/20";
  const tabBg = dark ? "bg-ink" : "bg-ivory";
  return (
    <div className={`relative pt-7 ${className}`}>
      <span className={`absolute left-0 top-0 z-10 h-8 rounded-tl-[18px] rounded-tr-[14px] border-l border-t border-r ${border} ${tabBg} px-3 pt-1.5 text-[11px] ${dark ? "text-white/70" : "text-ink/60"}`}>
        / {String(index).padStart(2, "0")}
      </span>
      <div className={`relative h-full rounded-[18px] rounded-tl-none border ${border} transition-colors duration-300`}>{children}</div>
    </div>
  );
}

export function TiltCard({ children, className = "", max = 8 }) {
  const ref = useRef(null);
  const canHover = useCanHover();
  const { motionOn } = useMotionPrefs();
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const rx = useSpring(useTransform(py, [0, 1], [max, -max]), { stiffness: 180, damping: 18 });
  const ry = useSpring(useTransform(px, [0, 1], [-max, max]), { stiffness: 180, damping: 18 });
  const enabled = canHover && motionOn;

  return (
    <motion.div
      ref={ref}
      className={className}
      style={enabled ? { rotateX: rx, rotateY: ry, transformPerspective: 900 } : undefined}
      whileHover={enabled ? { y: -6 } : undefined}
      onPointerMove={(e) => {
        if (!enabled) return;
        const r = ref.current.getBoundingClientRect();
        px.set((e.clientX - r.left) / r.width);
        py.set((e.clientY - r.top) / r.height);
      }}
      onPointerLeave={() => {
        px.set(0.5);
        py.set(0.5);
      }}
    >
      {children}
    </motion.div>
  );
}

const CLAIM_STATUS = {
  SUPPORTED: { label: "Supported", cls: "bg-volt text-white" },
  CONTRADICTED: { label: "Contradicted", cls: "bg-ember text-white" },
  INSUFFICIENT_EVIDENCE: { label: "Needs evidence", cls: "bg-ink/8 text-ink border border-ink/20" },
  CONFLICTING_EVIDENCE: { label: "Conflicting reports", cls: "bg-lime text-ink" },
  UNVERIFIABLE: { label: "Unverifiable", cls: "bg-transparent text-ink/70 border border-dashed border-ink/40" },
};

const MEDIA_CATEGORY = {
  LIKELY_AI_GENERATED: { label: "Likely AI-generated", cls: "bg-ember text-white" },
  LIKELY_AUTHENTIC: { label: "Likely authentic", cls: "bg-volt text-white" },
  POSSIBLY_MANIPULATED: { label: "Possibly manipulated", cls: "bg-lime text-ink" },
  INCONCLUSIVE: { label: "Inconclusive", cls: "bg-white/10 text-ivory border border-white/30" },
};

export const VERDICTS = {
  LIKELY_TRUE: { label: "Likely True", tone: "volt", blurb: "Claims hold up against current reporting." },
  MOSTLY_TRUE: { label: "Mostly True", tone: "volt", blurb: "Some claims confirmed, none contradicted." },
  MISLEADING: { label: "Misleading", tone: "ember", blurb: "Accurate and false claims are mixed together." },
  LIKELY_FAKE: { label: "Likely False", tone: "ember", blurb: "Claims are contradicted, none are supported." },
  DISPUTED: { label: "Disputed", tone: "lime", blurb: "Sources disagree with each other." },
  UNVERIFIED: { label: "Unverified", tone: "neutral", blurb: "Nothing could be confirmed or disproved yet." },
};

export function ClaimBadge({ status }) {
  const s = CLAIM_STATUS[status] ?? { label: status, cls: "bg-ink/10" };
  return <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${s.cls}`}>{s.label}</span>;
}

export function MediaBadge({ category, size = "sm" }) {
  const s = MEDIA_CATEGORY[category] ?? { label: category, cls: "bg-white/10" };
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${size === "lg" ? "px-4 py-1.5 text-sm" : "px-2.5 py-1 text-[11px]"} ${s.cls}`}>
      {s.label}
    </span>
  );
}

export function VerdictBadge({ verdict }) {
  const v = VERDICTS[verdict] ?? VERDICTS.UNVERIFIED;
  const tone = { volt: "bg-volt text-white", ember: "bg-ember text-white", lime: "bg-lime text-ink", neutral: "bg-ink/8 text-ink border border-ink/20" }[v.tone];
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${tone}`}>{v.label}</span>;
}

export const formatDate = (d, withTime = false) =>
  d
    ? new Date(d).toLocaleString(undefined, withTime
        ? { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }
        : { day: "numeric", month: "short", year: "numeric" })
    : null;

export function Pill({ children, className = "", ...props }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
