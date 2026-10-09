import dns from "node:dns";
import net from "node:net";
import { Agent, fetch } from "undici";
import { JSDOM, VirtualConsole } from "jsdom";
import { Readability } from "@mozilla/readability";

const MAX_BYTES = 3 * 1024 * 1024;
const MAX_REDIRECTS = 3;

export class ArticleFetchError extends Error {}

function isPrivateAddress(address) {
  if (net.isIPv4(address)) {
    const [a, b] = address.split(".").map(Number);
    return (
      a === 0 || a === 10 || a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a >= 224
    );
  }
  const v6 = address.toLowerCase();
  if (v6.startsWith("::ffff:")) return isPrivateAddress(v6.slice(7));
  return v6 === "::" || v6 === "::1" || v6.startsWith("fc") || v6.startsWith("fd") || v6.startsWith("fe80");
}

// Validating inside the connect-time lookup covers redirects and DNS rebinding,
// since every connection re-resolves through here.
function safeLookup(hostname, options, callback) {
  dns.lookup(hostname, { ...options, all: true }, (err, addresses) => {
    if (err) return callback(err);
    const blocked = addresses.find((a) => isPrivateAddress(a.address));
    if (blocked) return callback(new ArticleFetchError("This URL points to a private or internal network address and cannot be fetched."));
    if (options.all) return callback(null, addresses);
    callback(null, addresses[0].address, addresses[0].family);
  });
}

const agent = new Agent({ connect: { lookup: safeLookup, timeout: 8000 }, headersTimeout: 10000, bodyTimeout: 10000 });

function parseHttpUrl(raw) {
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new ArticleFetchError("That doesn't look like a valid URL.");
  }
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new ArticleFetchError("Only http and https URLs are supported.");
  }
  if (net.isIP(url.hostname.replace(/^\[|\]$/g, "")) && isPrivateAddress(url.hostname.replace(/^\[|\]$/g, ""))) {
    throw new ArticleFetchError("This URL points to a private or internal network address and cannot be fetched.");
  }
  return url;
}

async function readLimited(res) {
  const chunks = [];
  let total = 0;
  for await (const chunk of res.body) {
    total += chunk.length;
    if (total > MAX_BYTES) throw new ArticleFetchError("The page is too large to process (over 3MB).");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

export async function fetchArticle(rawUrl) {
  let url = parseHttpUrl(rawUrl);
  let res;
  for (let hop = 0; ; hop++) {
    try {
      res = await fetch(url, {
        dispatcher: agent,
        redirect: "manual",
        signal: AbortSignal.timeout(15000),
        headers: { "User-Agent": "Mozilla/5.0 (TruthForge article fetcher)", Accept: "text/html" },
      });
    } catch (err) {
      for (let e = err; e; e = e.cause) {
        if (e instanceof ArticleFetchError) throw e;
      }
      throw new ArticleFetchError("Could not reach that website. It may be down or blocking automated access.");
    }
    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      if (hop >= MAX_REDIRECTS) throw new ArticleFetchError("Too many redirects.");
      await res.body?.cancel();
      url = parseHttpUrl(new URL(res.headers.get("location"), url).toString());
      continue;
    }
    break;
  }

  if (!res.ok) throw new ArticleFetchError(`The website responded with HTTP ${res.status}. Try pasting the article text instead.`);
  if (!(res.headers.get("content-type") || "").includes("html")) {
    throw new ArticleFetchError("That URL is not a web page. Try pasting the article text instead.");
  }

  const html = await readLimited(res);
  const dom = new JSDOM(html, { url: url.toString(), virtualConsole: new VirtualConsole() });
  const doc = dom.window.document;
  const meta = (sel) => doc.querySelector(sel)?.getAttribute("content")?.trim() || null;
  const canonical = doc.querySelector('link[rel="canonical"]')?.getAttribute("href") || null;
  const article = new Readability(doc).parse();
  dom.window.close();

  const text = article?.textContent?.replace(/\s+/g, " ").trim() ?? "";
  if (text.length < 200) {
    throw new ArticleFetchError("Couldn't find enough article text on that page (it may need a login or load content with JavaScript). Paste the article text instead.");
  }

  return {
    text,
    title: article.title || meta('meta[property="og:title"]'),
    publisher: article.siteName || meta('meta[property="og:site_name"]') || url.hostname.replace(/^www\./, ""),
    publishedAt: article.publishedTime || meta('meta[property="article:published_time"]'),
    canonicalUrl: canonical ? new URL(canonical, url).toString() : url.toString(),
  };
}
