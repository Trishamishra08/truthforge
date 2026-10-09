const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

async function request(path, options) {
  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, options);
  } catch {
    throw new Error("Can't reach the TruthForge server. Is the backend running?");
  }
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Request failed (HTTP ${res.status})`);
    err.canRetryWithText = Boolean(data.canRetryWithText);
    throw err;
  }
  return data;
}

export const analyzeNews = ({ text, url }) =>
  request("/api/news/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(url ? { url } : { text }),
  });

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
