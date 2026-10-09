import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import * as api from "./api";
import { MotionPrefsProvider, scrollToId } from "./lib/motionPrefs";
import HeroSection from "./sections/HeroSection";
import ResultsSection from "./sections/ResultsSection";
import MediaSection from "./sections/MediaSection";
import CapabilitiesSection from "./sections/CapabilitiesSection";
import SourcesSection from "./sections/SourcesSection";
import TrendingSection from "./sections/TrendingSection";
import ReportsSection from "./sections/ReportsSection";
import HowItWorks from "./sections/HowItWorks";
import Footer from "./sections/Footer";

const scrollSoon = (id) => setTimeout(() => scrollToId(id), 80);

function Page() {
  const darkGroup = useRef(null);
  const { scrollYProgress } = useScroll({ target: darkGroup, offset: ["start 75%", "end 25%"] });
  const background = useTransform(scrollYProgress, [0, 0.06, 0.94, 1], ["#efe8df", "#0a0a0a", "#0a0a0a", "#efe8df"]);

  const [news, setNews] = useState({ loading: false, error: null, result: null });
  const [media, setMedia] = useState({ loading: false, error: null, result: null, fromHistory: false });

  const [stats, setStats] = useState(null);
  const [sources, setSources] = useState(null);
  const [sourcesError, setSourcesError] = useState(null);
  const [trending, setTrending] = useState(null);
  const [trendingError, setTrendingError] = useState(null);
  const [history, setHistory] = useState({ news: null, media: null, error: null });

  const refresh = useCallback(() => {
    api.getStats().then(setStats).catch(() => {});
    api.getSources().then((s) => { setSources(s); setSourcesError(null); }).catch((e) => setSourcesError(e.message));
    Promise.all([api.listNews(), api.listMedia()])
      .then(([n, m]) => setHistory({ news: n, media: m, error: null }))
      .catch((e) => setHistory({ news: [], media: [], error: e.message }));
  }, []);

  const loadTrending = useCallback(() => {
    setTrendingError(null);
    api.getTrending().then(setTrending).catch((e) => setTrendingError(e.message));
  }, []);

  useEffect(() => {
    refresh();
    loadTrending();
  }, [refresh, loadTrending]);

  const analyzeNews = async (input) => {
    setNews({ loading: true, error: null, result: null });
    scrollSoon("results");
    try {
      const result = await api.analyzeNews(input);
      setNews({ loading: false, error: null, result });
      refresh();
    } catch (error) {
      setNews({ loading: false, error, result: null });
      scrollSoon("verify");
    }
  };

  const analyzeMedia = async (file) => {
    setMedia({ loading: true, error: null, result: null, fromHistory: false });
    try {
      const result = await api.analyzeMedia(file);
      setMedia({ loading: false, error: null, result, fromHistory: false });
      refresh();
    } catch (error) {
      setMedia({ loading: false, error, result: null, fromHistory: false });
    }
  };

  const openReport = async (row) => {
    try {
      if (row.kind === "news") {
        setNews({ loading: false, error: null, result: await api.getNews(row.id) });
        scrollSoon("results");
      } else {
        setMedia({ loading: false, error: null, result: await api.getMedia(row.id), fromHistory: true });
        scrollSoon("media");
      }
    } catch (e) {
      setHistory((h) => ({ ...h, error: e.message }));
    }
  };

  const deleteReport = async (row) => {
    await (row.kind === "news" ? api.deleteNews(row.id) : api.deleteMedia(row.id));
    if (news.result?._id === row.id) setNews((s) => ({ ...s, result: null }));
    if (media.result?._id === row.id) setMedia((s) => ({ ...s, result: null }));
    refresh();
  };

  return (
    <>
      <motion.div aria-hidden="true" className="fixed inset-0 -z-10" style={{ backgroundColor: background }} />
      <a href="#verify" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-ivory">
        Skip to news verification
      </a>

      <HeroSection onAnalyze={analyzeNews} loading={news.loading} error={news.error} result={news.result} stats={stats} />

      <main>
        <ResultsSection loading={news.loading} result={news.result} />

        <div ref={darkGroup} className="space-y-6 py-10">
          <MediaSection
            onAnalyze={analyzeMedia}
            loading={media.loading}
            error={media.error}
            result={media.result}
            fromHistory={media.fromHistory}
            onClear={() => setMedia({ loading: false, error: null, result: null, fromHistory: false })}
          />
          <CapabilitiesSection />
          <SourcesSection sources={sources} error={sourcesError} />
        </div>

        <TrendingSection data={trending} error={trendingError} onRetry={loadTrending} />
        <ReportsSection news={history.news} media={history.media} stats={stats} error={history.error} onOpen={openReport} onDelete={deleteReport} />
        <HowItWorks />
      </main>

      <Footer />
    </>
  );
}

export default function App() {
  return (
    <MotionPrefsProvider>
      <Page />
    </MotionPrefsProvider>
  );
}
