import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Eye, EyeOff, LoaderCircle, TriangleAlert, X } from "lucide-react";
import { Logo } from "./ui";
import { useAuth } from "../lib/auth";

function Field({ id, label, ...props }) {
  return (
    <label htmlFor={id} className="block">
      <span className="mb-1.5 block text-xs text-ink/60">{label}</span>
      <input id={id} {...props}
        className="w-full rounded-2xl border border-ink/15 bg-white px-4 py-3 text-[15px] outline-none transition-colors focus:border-volt" />
    </label>
  );
}

function AuthForm({ initialMode, reason }) {
  const { login, register, closeAuth } = useAuth();
  const [mode, setMode] = useState(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const firstInput = useRef(null);
  const isRegister = mode === "register";

  useEffect(() => {
    firstInput.current?.focus();
  }, [mode]);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (isRegister && name.trim().length < 2) return setError("Please enter your name.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    setBusy(true);
    try {
      if (isRegister) await register(name.trim(), email.trim(), password);
      else await login(email.trim(), password);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-title"
      initial={{ opacity: 0, y: 30, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.98, transition: { duration: 0.15 } }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-full max-w-md rounded-[28px] bg-ink p-2.5 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.6)]"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between px-3 py-2.5">
        <Logo dark />
        <button type="button" onClick={closeAuth} aria-label="Close" className="rounded-full p-1.5 text-ivory/70 hover:bg-white/10 hover:text-ivory">
          <X className="size-5" />
        </button>
      </div>
      <form onSubmit={submit} className="rounded-[20px] bg-gradient-to-b from-ivory to-peach/60 p-6 sm:p-8" noValidate>
        <h2 id="auth-title" className="text-4xl leading-none tracking-tight">{isRegister ? "Create your account." : "Welcome back."}</h2>
        <p className="mt-3 text-sm text-ink/60">
          {reason || (isRegister ? "Your news and media reports are saved privately to your account." : "Log in to verify news, inspect media and see your saved reports.")}
        </p>

        <div className="mt-6 space-y-3">
          {isRegister && (
            <Field id="auth-name" label="Name" ref={firstInput} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
          )}
          <Field id="auth-email" label="Email" type="email" ref={isRegister ? undefined : firstInput} autoComplete="email" inputMode="email"
            value={email} onChange={(e) => setEmail(e.target.value)} />
          <div className="relative">
            <Field id="auth-password" label="Password" type={showPw ? "text" : "password"} autoComplete={isRegister ? "new-password" : "current-password"}
              value={password} onChange={(e) => setPassword(e.target.value)} maxLength={128} />
            <button type="button" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? "Hide password" : "Show password"}
              className="absolute bottom-2.5 right-3 rounded-full p-1 text-ink/45 hover:text-ink">
              {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {isRegister && <p className="text-[11px] text-ink/50">At least 8 characters.</p>}
        </div>

        <AnimatePresence>
          {error && (
            <motion.p role="alert" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="mt-4 flex items-start gap-2 rounded-2xl border border-ember/40 bg-ember/10 p-3 text-sm">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-ember" /> {error}
            </motion.p>
          )}
        </AnimatePresence>

        <button type="submit" disabled={busy}
          className="group mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-volt px-5 py-3 text-sm text-white transition-colors hover:bg-ink disabled:opacity-60">
          {busy ? <LoaderCircle className="size-4 animate-spin" /> : null}
          {isRegister ? "Create account" : "Log in"}
          {!busy && <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />}
        </button>

        <p className="mt-5 text-center text-sm text-ink/60">
          {isRegister ? "Already have an account?" : "New to TruthForge?"}{" "}
          <button type="button" onClick={() => { setMode(isRegister ? "login" : "register"); setError(null); }} className="text-ink underline underline-offset-2">
            {isRegister ? "Log in" : "Create an account"}
          </button>
        </p>
      </form>
    </motion.div>
  );
}

export default function AuthModal() {
  const { modal, closeAuth } = useAuth();

  useEffect(() => {
    if (!modal) return;
    const onKey = (e) => e.key === "Escape" && closeAuth();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [modal, closeAuth]);

  return (
    <AnimatePresence>
      {modal && (
        <motion.div
          key="auth"
          className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-ink/60 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.15 } }}
          onClick={closeAuth}
        >
          <AuthForm key={modal.mode + (modal.reason ?? "")} initialMode={modal.mode} reason={modal.reason} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
