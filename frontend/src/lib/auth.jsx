import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import * as api from "../api";

const TOKEN_KEY = "tf-token";
const AuthContext = createContext(null);

function readToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}
function writeToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage blocked: session lasts until the tab closes */
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(() => Boolean(readToken()));
  const [modal, setModal] = useState(null);
  const pending = useRef(null);

  const logout = useCallback(() => {
    writeToken(null);
    api.setAuthToken(null);
    setUser(null);
    pending.current = null;
  }, []);

  useEffect(() => {
    api.setUnauthorizedHandler(() => {
      logout();
      setModal({ mode: "login", reason: "Your session has expired. Please log in again." });
    });
    const token = readToken();
    if (!token) return;
    api.setAuthToken(token);
    api
      .getMe()
      .then(setUser)
      .catch((err) => {
        if (err.status === 401) logout();
      })
      .finally(() => setChecking(false));
  }, [logout]);

  const startSession = ({ token, user: u }) => {
    writeToken(token);
    api.setAuthToken(token);
    setUser(u);
    setModal(null);
    const next = pending.current;
    pending.current = null;
    next?.();
  };

  const value = {
    user,
    checking,
    modal,
    logout,
    openAuth: (mode = "login", reason = null) => setModal({ mode, reason }),
    closeAuth: () => {
      pending.current = null;
      setModal(null);
    },
    login: async (email, password) => startSession(await api.login(email, password)),
    register: async (name, email, password) => startSession(await api.register(name, email, password)),
    /** Run `action` now if logged in, otherwise ask the user to log in and run it afterwards. */
    requireUser: (action, reason) => {
      if (user) return action();
      pending.current = action;
      setModal({ mode: "login", reason });
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
