const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

let authToken = null;
let onUnauthorized = () => {};

export const setAuthToken = (token) => {
  authToken = token;
};
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};

async function request(path, options = {}) {
  const sentToken = authToken;
  const headers = { ...(options.headers ?? {}), ...(sentToken ? { Authorization: `Bearer ${sentToken}` } : {}) };
  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  } catch {
    throw new Error("Can't reach the TruthForge server. Is the backend running?");
  }
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && sentToken && !path.startsWith("/api/auth/")) onUnauthorized();
    const err = new Error(data.error || `Request failed (HTTP ${res.status})`);
    err.status = res.status;
    err.canRetryWithText = Boolean(data.canRetryWithText);
    throw err;
  }
  return data;
}

const json = (method, body) => ({ method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

export const register = (name, email, password) => request("/api/auth/register", json("POST", { name, email, password }));
export const login = (email, password) => request("/api/auth/login", json("POST", { email, password }));
export const getMe = () => request("/api/users/me");

export const analyzeNews = ({ text, url }) => request("/api/news/analyze", json("POST", url ? { url } : { text }));

export function analyzeMedia(file) {
  const formData = new FormData();
  formData.append("file", file);
  return request("/api/media/analyze", { method: "POST", body: formData });
}

export const listNews = () => request("/api/news");
export const listMedia = () => request("/api/media");
export const getNews = (id) => request(`/api/news/${id}`);
export const getMedia = (id) => request(`/api/media/${id}`);
export const deleteNews = (id) => request(`/api/news/${id}`, { method: "DELETE" });
export const deleteMedia = (id) => request(`/api/media/${id}`, { method: "DELETE" });

export const getStats = () => request("/api/insights/stats");
export const getSources = () => request("/api/insights/sources");
export const getTrending = () => request("/api/insights/trending");
