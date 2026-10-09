import { XMLParser } from "fast-xml-parser";

export const EVIDENCE_PROVIDER = "Google News RSS";

const parser = new XMLParser({ ignoreAttributes: false });

export async function searchNews(query, limit = 5) {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-IN&gl=IN&ceid=IN:en`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`News search failed with HTTP ${res.status}`);

  const feed = parser.parse(await res.text());
  let items = feed?.rss?.channel?.item ?? [];
  if (!Array.isArray(items)) items = [items];

  return items.slice(0, limit).map((item) => {
    const publisher = typeof item.source === "object" ? item.source["#text"] : item.source;
    const title = String(item.title ?? "");
    return {
      // Google News appends " - Publisher" to every title.
      title: publisher && title.endsWith(` - ${publisher}`)
        ? title.slice(0, -(publisher.length + 3))
        : title,
      publisher: publisher || null,
      url: item.link,
      publishedAt: item.pubDate ? new Date(item.pubDate) : null,
    };
  });
}
