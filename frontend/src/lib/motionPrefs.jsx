import { createContext, useContext, useEffect, useState } from "react";
import { MotionConfig, useReducedMotion } from "motion/react";

const MotionPrefsContext = createContext({ motionOn: true, userEnabled: true, setUserEnabled: () => {} });

function readStoredPref() {
  try {
    return localStorage.getItem("tf-motion") !== "off";
  } catch {
    return true;
  }
}

export function MotionPrefsProvider({ children }) {
  const prefersReduced = useReducedMotion();
  const [userEnabled, setUserEnabledState] = useState(readStoredPref);
  const motionOn = userEnabled && !prefersReduced;

  const setUserEnabled = (value) => {
    setUserEnabledState(value);
    try {
      localStorage.setItem("tf-motion", value ? "on" : "off");
    } catch {
      /* storage unavailable; preference lasts for this visit only */
    }
  };

  useEffect(() => {
    document.documentElement.classList.toggle("motion-off", !motionOn);
  }, [motionOn]);

  return (
    <MotionPrefsContext.Provider value={{ motionOn, userEnabled, setUserEnabled }}>
      <MotionConfig reducedMotion={motionOn ? "never" : "always"}>{children}</MotionConfig>
    </MotionPrefsContext.Provider>
  );
}

export const useMotionPrefs = () => useContext(MotionPrefsContext);

export function useCanHover() {
  const query = "(hover: hover) and (pointer: fine)";
  const [canHover, setCanHover] = useState(() => typeof window !== "undefined" && window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setCanHover(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return canHover;
}

export function scrollToId(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}
