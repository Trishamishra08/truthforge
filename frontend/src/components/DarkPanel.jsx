import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { useMotionPrefs } from "../lib/motionPrefs";

/** Black rounded section that tilts up into place as it scrolls in, like the reference. */
export default function DarkPanel({ id, children, className = "", labelledBy }) {
  const ref = useRef(null);
  const { motionOn } = useMotionPrefs();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "start 25%"] });
  const rotateX = useTransform(scrollYProgress, [0, 1], [14, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.9, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [60, 0]);

  return (
    <div className="overflow-x-clip px-3 sm:px-5" style={{ perspective: 1600 }}>
      <motion.section
        ref={ref}
        id={id}
        aria-labelledby={labelledBy}
        style={motionOn ? { rotateX, scale, y, transformOrigin: "50% 0%" } : undefined}
        className={`mx-auto max-w-[1440px] scroll-mt-6 rounded-[30px] bg-ink px-5 py-16 text-ivory sm:px-10 sm:py-20 ${className}`}
      >
        {children}
      </motion.section>
    </div>
  );
}
