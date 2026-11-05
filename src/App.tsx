// Main application component for TRACE
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FactCheckItem, VerificationStats, DeepfakeAnalysisResult } from './types';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { TopNewsSection } from './components/TopNewsSection';
import { LiveNewsFeed } from './components/LiveNewsFeed';
import { BustedNewsSection } from './components/BustedNewsSection';
import { RecentlyCheckedSection } from './components/RecentlyCheckedSection';
import { DeepfakeDetector } from './components/DeepfakeDetector';
import { AITextAnalyzer } from './components/AITextAnalyzer';
import { DashboardStats } from './components/DashboardStats';
import { NewsMediaFactChecker } from './components/NewsMediaFactChecker';
import { FactCheckModal } from './components/FactCheckModal';
import { ApiKeyModal } from './components/ApiKeyModal';
import { Footer } from './components/Footer';
import { AdminPortal } from './components/AdminPortal';
import { AuthGateway } from './components/AuthGateway';
import { TraceLogo } from './components/TraceLogo';
import {
  subscribeToTraceAuth,
  logoutUser,
  type TraceAuthUser
} from './utils/firebase';

export default function App() {
  // Authentication session state
  const [currentUser, setCurrentUser] = useState<TraceAuthUser | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);

  // Auth Modal state for interactive tools and settings login
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalPortal, setAuthModalPortal] = useState<'reader' | 'admin'>('reader');
  const [authModalNotice, setAuthModalNotice] = useState<string | undefined>(undefined);
  const [pendingTabAfterAuth, setPendingTabAfterAuth] = useState<string | null>(null);

  // Navigation: currently active view tab
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      if (window.location.pathname.startsWith('/admin') || window.location.hash === '#admin') {
        return 'admin';
      }
    }
    return 'top-news';
  });

  // Color theme state: 'light' | 'dark'
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('trace_theme') || localStorage.getItem('truthlens_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
    localStorage.setItem('trace_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Search query state bound to top navbar and hero search
  const [searchQuery, setSearchQuery] = useState<string>('');

  // User-configured Google Gemini API Key
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('trace_gemini_api_key') || localStorage.getItem('truthlens_gemini_api_key') || '';
  });
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState<boolean>(false);

  // Primary list of fact-check articles (populated from backend API)
  const [factCheckItems, setFactCheckItems] = useState<FactCheckItem[]>([]);

  // Platform performance and accuracy stats
  const [stats, setStats] = useState<VerificationStats>({
    totalClaimsChecked: 0,
    fakeNewsBusted: 0,
    deepfakesIntercepted: 0,
    mediaAuditsCompleted: 0,
    accuracyRate: 100,
    categoriesBreakdown: [
      { category: 'Politics', count: 0 },
      { category: 'Health & Science', count: 0 },
      { category: 'World News', count: 0 },
      { category: 'Technology', count: 0 },
      { category: 'Finance', count: 0 }
    ]
  });

  // Modal inspection dialog states
  const [selectedFactCheck, setSelectedFactCheck] = useState<FactCheckItem | null>(null);
  const [selectedDeepfakeResult, setSelectedDeepfakeResult] = useState<DeepfakeAnalysisResult | null>(null);

  // Loading state indicator during AI verification calls
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  // Fetch fact-check feed and platform stats
  const fetchFeed = async () => {
    try {
      const res = await fetch('/api/feed');
      const data = await res.json();
      if (data.items) setFactCheckItems(data.items);
      if (data.stats) setStats(data.stats);
    } catch (err) {
      console.error('Failed to load feed:', err);
    }
  };

  useEffect(() => {
    fetchFeed();

    // Check for direct Report URL access (e.g. /report/:id or #report-:id)
    if (typeof window !== 'undefined') {
      const pathMatch = window.location.pathname.match(/\/report\/([^/?#]+)/);
      const hashMatch = window.location.hash.match(/#report-([^/?#]+)/);
      const reportId = pathMatch ? pathMatch[1] : (hashMatch ? hashMatch[1] : null);

      if (reportId) {
        fetch(`/api/fact-check/${encodeURIComponent(reportId)}`)
          .then((r) => r.json())
          .then((data) => {
            if (data?.success && data?.item) {
              setSelectedFactCheck(data.item);
            }
          })
          .catch((err) => console.warn('[TRACE] Could not load report by URL:', err));
      }
    }

    // Listen to Firebase auth changes & auto-login previous device sessions
    const unsubscribe = subscribeToTraceAuth((user) => {
      setCurrentUser(user);
      setIsAuthChecking(false);
      if (user && user.role === 'admin' && (window.location.hash === '#admin' || window.location.pathname.startsWith('/admin'))) {
        setActiveTab('admin');
      }
    });

    return () => unsubscribe();
  }, []);

  // Handle login success
  const handleLoginSuccess = (user: TraceAuthUser, targetView: 'reader' | 'admin') => {
    setCurrentUser(user);
    setIsAuthModalOpen(false);
    if (pendingTabAfterAuth) {
      setActiveTab(pendingTabAfterAuth);
      setPendingTabAfterAuth(null);
    } else if (targetView === 'admin') {
      setActiveTab('admin');
    } else if (activeTab === 'admin') {
      setActiveTab('top-news');
    }
  };

  // Open login modal
  const handleOpenLoginModal = (targetRole: 'reader' | 'admin' = 'reader') => {
    setAuthModalPortal(targetRole);
    setAuthModalNotice(
      targetRole === 'admin'
        ? 'Restricted Editorial Bureau & CMS Dashboard. Turnstile anti-bot verification required.'
        : undefined
    );
    setIsAuthModalOpen(true);
  };

  // Handle sign out
  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
    setActiveTab('top-news');
  };

  // Update stored API key
  const handleSaveApiKey = (newKey: string) => {
    setApiKey(newKey);
    if (newKey) {
      localStorage.setItem('trace_gemini_api_key', newKey);
    } else {
      localStorage.removeItem('trace_gemini_api_key');
      localStorage.removeItem('truthlens_gemini_api_key');
    }
  };

  // Verify claim with backend API
  const handleVerifyClaim = async (claim: string, url?: string, category?: string) => {
    const query = (claim || url || '').trim();
    if (!query) return;
    setIsAnalyzing(true);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (apiKey) {
        headers['x-gemini-api-key'] = apiKey;
      }

      const response = await fetch('/api/fact-check', {
        method: 'POST',
        headers,
        body: JSON.stringify({ claim, url, category, apiKey }),
      });

      const data = await response.json();
      if (data.success && data.item) {
        setFactCheckItems((prev) => [data.item, ...prev]);
        setSelectedFactCheck(data.item);
        setStats((prev) => ({
          ...prev,
          totalClaimsChecked: prev.totalClaimsChecked + 1,
          fakeNewsBusted: data.item.verdict === 'DEBUNKED_FAKE' ? prev.fakeNewsBusted + 1 : prev.fakeNewsBusted,
        }));
      }
    } catch (err) {
      console.error('Error verifying claim:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Check auth before verifying claim
  const handleVerifyClaimWithAuth = (claim: string, url?: string, category?: string) => {
    if (!currentUser) {
      setAuthModalPortal('reader');
      setAuthModalNotice('Please sign in to submit breaking claims and URLs for live AI verification. Reading published investigations is 100% free.');
      setIsAuthModalOpen(true);
      return;
    }
    handleVerifyClaim(claim, url, category);
  };

  // Handle sample query selection
  const handleSelectSample = (sample: string) => {
    setSearchQuery(sample);
    if (!currentUser) {
      setAuthModalPortal('reader');
      setAuthModalNotice('Please sign in to test live AI claim verification. Reading published investigations is 100% free.');
      setIsAuthModalOpen(true);
      return;
    }
    handleVerifyClaim(sample);
  };

  // Switch active tab and smoothly position at top of viewport
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Handle tab switching with role and auth checks
  const handleRequestTab = (tab: string) => {
    // 1. Free reading desks open to all visitors without login
    if (tab === 'top-news' || tab === 'live-news' || tab === 'busted' || tab === 'recent' || tab === 'stats') {
      handleTabChange(tab);
      return;
    }

    // 2. Admin CMS Desk
    if (tab === 'admin') {
      handleTabChange('admin');
      return;
    }

    // 3. Interactive AI Investigative Desks ('news-media', 'deepfake', 'ai-analyzer')
    if (!currentUser) {
      const toolDescriptions: Record<string, string> = {
        'news-media': 'Photo & Broadcast OCR Fact-Checker (detect AI images, verify news photos & videos)',
        'deepfake': 'Deepfake Computer Vision Lab (4-pillar forensic noise, face landmark & ELA inspection)',
        'ai-analyzer': 'Writing & NLP Forensic Analyzer (perplexity & burstiness AI text detector)',
      };
      setAuthModalPortal('reader');
      setAuthModalNotice(`Please sign in as a reader to use the ${toolDescriptions[tab] || 'AI investigation tool'}. Reading published articles remains 100% free.`);
      setPendingTabAfterAuth(tab);
      setIsAuthModalOpen(true);
      return;
    }

    handleTabChange(tab);
  };

  // Show broadsheet sentinel loading while Firebase auth initializes
  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-[#fbfaf8] dark:bg-[#111317] flex flex-col items-center justify-center p-4 transition-colors">
        <div className="text-center space-y-3">
          <TraceLogo className="w-16 h-16 animate-pulse mx-auto rounded-2xl" />
          <h2 className="font-serif font-black text-2xl text-stone-900 dark:text-stone-100 uppercase tracking-tight">TRACE</h2>
          <p className="text-xs text-stone-500 font-mono">Synchronizing Wire Sentinel Authorization...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fbfaf8] dark:bg-[#111317] text-stone-900 dark:text-stone-100 flex flex-col font-sans selection:bg-stone-900 selection:text-stone-50 dark:selection:bg-stone-100 dark:selection:text-stone-900 transition-colors duration-200">
      
      {/* Newspaper Broadsheet Masthead Header with Top-Right 3-Line Menu */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleRequestTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        apiKey={apiKey}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        onVerifyClaim={(query: string) => handleVerifyClaimWithAuth(query)}
        onOpenVerifyModal={() => {
          if (!currentUser) {
            handleOpenLoginModal('reader');
          } else {
            handleTabChange('top-news');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
        theme={theme}
        onToggleTheme={toggleTheme}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenLoginModal={handleOpenLoginModal}
      />

      {/* Main Tabbed Editorial Views */}
      <main id="main-content-section" className="flex-1 scroll-mt-20 relative z-10 pb-24 md:pb-0">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{
              duration: 0.18,
              ease: [0.25, 1, 0.5, 1],
            }}
            className="w-full"
          >
            {/* Tab 1: Front Page / Top Verified Stories & Overview */}
            {activeTab === 'top-news' && (
              <>
                <HeroBanner
                  onVerify={handleVerifyClaimWithAuth}
                  onSelectSample={handleSelectSample}
                  isAnalyzing={isAnalyzing}
                  setActiveTab={handleRequestTab}
                />
                <LiveNewsFeed onVerifyClaim={handleVerifyClaimWithAuth} isAnalyzing={isAnalyzing} />
                <TopNewsSection items={factCheckItems} onSelectItem={setSelectedFactCheck} />
                <BustedNewsSection items={factCheckItems} onSelectItem={setSelectedFactCheck} />
                <RecentlyCheckedSection items={factCheckItems} onSelectItem={setSelectedFactCheck} searchQuery={searchQuery} />
              </>
            )}

            {/* Tab 1b: Dedicated Live News Wire Feed */}
            {activeTab === 'live-news' && (
              <LiveNewsFeed onVerifyClaim={handleVerifyClaimWithAuth} isAnalyzing={isAnalyzing} />
            )}

            {/* Tab 2: Multimodal Photo & Broadcast Media Verification Desk */}
            {activeTab === 'news-media' && (
              <NewsMediaFactChecker
                apiKey={apiKey}
                onGenerateReport={setSelectedFactCheck}
              />
            )}

            {/* Tab 3: Debunked Fake News & Exposé Desk */}
            {activeTab === 'busted' && (
              <BustedNewsSection items={factCheckItems} onSelectItem={setSelectedFactCheck} />
            )}

            {/* Tab 4: Chronological Live Wire Dispatch Feed */}
            {activeTab === 'recent' && (
              <RecentlyCheckedSection items={factCheckItems} onSelectItem={setSelectedFactCheck} searchQuery={searchQuery} />
            )}

            {/* Tab 5: 4-Pillar Deepfake & Computer Vision Forensic Lab */}
            {activeTab === 'deepfake' && (
              <DeepfakeDetector
                apiKey={apiKey}
                onGenerateReport={(dfResult: DeepfakeAnalysisResult) => {
                  setSelectedDeepfakeResult(dfResult);
                }}
              />
            )}

            {/* Tab 6: Authorship & NLP Linguistic Audit Desk */}
            {activeTab === 'ai-analyzer' && (
              <AITextAnalyzer apiKey={apiKey} />
            )}

            {/* Tab 7: Editorial Analytics, Accuracy Index & Academic Credits */}
            {activeTab === 'stats' && (
              <DashboardStats stats={stats} />
            )}

            {/* Tab 8: TRACE Editorial CMS & Public Site Monitoring Portal */}
            {activeTab === 'admin' && (
              <AdminPortal
                onBackToPublic={() => setActiveTab('top-news')}
                feedItems={factCheckItems}
                onRefreshFeed={fetchFeed}
                currentUser={currentUser}
                onLogout={handleLogout}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Modal Dialog for Verification Audit Certificate */}
      {(selectedFactCheck || selectedDeepfakeResult) && (
        <FactCheckModal
          item={selectedFactCheck}
          deepfakeResult={selectedDeepfakeResult}
          onClose={() => {
            setSelectedFactCheck(null);
            setSelectedDeepfakeResult(null);
          }}
        />
      )}

      {/* Interactive Auth Gateway Modal (Gated AI tools & 3-line settings menu) */}
      {isAuthModalOpen && (
        <AuthGateway
          isModal={true}
          initialPortal={authModalPortal}
          modalNotice={authModalNotice}
          onLoginSuccess={handleLoginSuccess}
          onClose={() => {
            setIsAuthModalOpen(false);
            setPendingTabAfterAuth(null);
          }}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      )}

      {/* Google Gemini API Key Settings Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        apiKey={apiKey}
        onSaveApiKey={handleSaveApiKey}
      />

      {/* Newspaper Colophon & Footer */}
      <div className="relative z-10">
        <Footer />
      </div>

    </div>
  );
}
