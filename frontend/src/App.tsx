// Main application component for TRACE
import React, { useState, useEffect, useReducer } from 'react';
import {
  appNavigationReducer,
  type TraceTab,
  type ClaimVerificationState,
  type InspectionModalState,
} from './state/machines';
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
import { BentoVerdictModal } from './components/BentoVerdictModal';
import { ApiKeyModal } from './components/ApiKeyModal';
import { Footer } from './components/Footer';
import { AdminPortal } from './components/AdminPortal';
import { AuthGateway } from './components/AuthGateway';
import { MyHistory } from './components/MyHistory';
import { TermsAndConditions } from './components/TermsAndConditions';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { AccountSettingsModal } from './components/AccountSettingsModal';
import { MobileBottomPillNav } from './components/MobileBottomPillNav';
import { TraceLogo } from './components/TraceLogo';
import {
  subscribeToTraceAuth,
  logoutUser,
  getCachedUserSession,
  getAuthHeaders,
  setupInactivityMonitor,
  type TraceAuthUser
} from './utils/firebase';
import { Clock, ShieldAlert, AlertTriangle } from 'lucide-react';

export default function App() {
  // Authentication session state initialized synchronously from cached session
  const [currentUser, setCurrentUser] = useState<TraceAuthUser | null>(() => getCachedUserSession());
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(false);

  // Account Settings Modal state
  const [isAccountModalOpen, setIsAccountModalOpen] = useState<boolean>(false);

  // Session Inactivity Expiry Warning State
  const [sessionExpiryWarning, setSessionExpiryWarning] = useState<boolean>(false);

  // Explicit navigation & auth-gate state machine
  const [navState, dispatchNav] = useReducer(
    appNavigationReducer,
    undefined,
    (): { activeTab: TraceTab; authGate: { open: false } } => {
      if (typeof window !== 'undefined') {
        const hash = window.location.hash;
        const path = window.location.pathname;
        if (path.startsWith('/admin') || hash === '#admin') {
          return { activeTab: 'admin', authGate: { open: false } };
        }
        if (path.startsWith('/terms') || hash === '#terms') {
          return { activeTab: 'terms', authGate: { open: false } };
        }
        if (path.startsWith('/privacy') || hash === '#privacy') {
          return { activeTab: 'privacy', authGate: { open: false } };
        }
        if (path.startsWith('/history') || hash === '#history') {
          return { activeTab: 'history', authGate: { open: false } };
        }
      }
      return { activeTab: 'top-news', authGate: { open: false } };
    }
  );
  const activeTab = navState.activeTab;
  const setActiveTab = (tab: string) =>
    dispatchNav({ type: 'SELECT_TAB', tab: tab as TraceTab });

  // Color theme state: 'light' | 'dark' — Light mode is default
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const userPref = localStorage.getItem('trace_theme_preference');
    if (userPref === 'dark' || userPref === 'light') return userPref;
    return 'light'; // Light mode is default
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
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('trace_theme_preference', next);
      return next;
    });
  };

  // Search query state bound to top navbar and hero search
  const [searchQuery, setSearchQuery] = useState<string>('');

  // User-configured Google Gemini API Key
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

  // Mutually exclusive inspection dialog state machine
  const [inspectionModal, setInspectionModal] = useState<InspectionModalState>(null);
  const [expandedFactCheck, setExpandedFactCheck] = useState<FactCheckItem | null>(null);
  const selectedFactCheck = inspectionModal?.kind === 'fact-check' ? inspectionModal.item : null;
  const selectedDeepfakeResult = inspectionModal?.kind === 'deepfake' ? inspectionModal.result : null;

  const handleSelectFactCheck = (item: FactCheckItem | null) => {
    setExpandedFactCheck(item);
    setInspectionModal(null);
    if (item) {
      if (activeTab !== 'top-news') {
        dispatchNav({ type: 'SELECT_TAB', tab: 'top-news' });
      }
      setTimeout(() => {
        const el = document.getElementById('top-news-section');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 120);
    }
  };

  const setSelectedFactCheck = (item: FactCheckItem | null) => {
    handleSelectFactCheck(item);
  };
  const setSelectedDeepfakeResult = (result: DeepfakeAnalysisResult | null) =>
    setInspectionModal(result ? { kind: 'deepfake', result } : null);

  // Explicit claim verification state machine
  const [claimState, setClaimState] = useState<ClaimVerificationState>({ status: 'idle' });
  const isAnalyzing = claimState.status === 'verifying';

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

  // Listen to hash changes for deep linking (#terms, #privacy, #history, etc.)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (
        [
          'top-news',
          'live-news',
          'news-media',
          'busted',
          'recent',
          'deepfake',
          'ai-analyzer',
          'stats',
          'admin',
          'history',
          'terms',
          'privacy',
        ].includes(hash)
      ) {
        handleRequestTab(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [currentUser]);

  // Session Inactivity Monitor
  useEffect(() => {
    if (!currentUser) return;
    const cleanup = setupInactivityMonitor({
      timeoutMinutes: 25,
      warningSecondsBeforeTimeout: 60,
      onWarning: () => setSessionExpiryWarning(true),
      onLogout: () => {
        setSessionExpiryWarning(false);
        handleLogout();
      },
    });
    return () => cleanup();
  }, [currentUser]);

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
    dispatchNav({ type: 'AUTH_COMPLETED', role: targetView });
  };

  // Open login modal
  const handleOpenLoginModal = (targetRole: 'reader' | 'admin' = 'reader') => {
    dispatchNav({
      type: 'OPEN_AUTH_GATE',
      portal: targetRole,
      notice:
        targetRole === 'admin'
          ? 'Restricted Editorial Bureau & CMS Dashboard. Secure administrator authentication required.'
          : undefined,
    });
  };

  // Handle sign out
  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
    dispatchNav({ type: 'SELECT_TAB', tab: 'top-news' });
  };

  // Verify claim with backend API
  const handleVerifyClaim = async (claim: string, url?: string, category?: string) => {
    const query = (claim || url || '').trim();
    if (!query) return;
    setClaimState({ status: 'verifying', query });
    setExpandedFactCheck(null);
    if (activeTab !== 'top-news') {
      dispatchNav({ type: 'SELECT_TAB', tab: 'top-news' });
    }
    setTimeout(() => {
      const el = document.getElementById('top-news-section');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    try {
      const authHeaders = await getAuthHeaders();
      const response = await fetch('/api/fact-check', {
        method: 'POST',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ claim, url, category }),
      });

      const data = await response.json();
      if (data.success && data.item) {
        setFactCheckItems((prev) => [data.item, ...prev]);
        setClaimState({ status: 'success', item: data.item });
        setExpandedFactCheck(data.item);
        setInspectionModal(null);
        if (activeTab !== 'top-news') {
          dispatchNav({ type: 'SELECT_TAB', tab: 'top-news' });
        }
        setTimeout(() => {
          const el = document.getElementById('top-news-section');
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
        setStats((prev) => ({
          ...prev,
          totalClaimsChecked: prev.totalClaimsChecked + 1,
          fakeNewsBusted: data.item.verdict === 'DEBUNKED' || data.item.verdict === 'DEBUNKED_FAKE' ? prev.fakeNewsBusted + 1 : prev.fakeNewsBusted,
        }));
      } else {
        setClaimState({
          status: 'error',
          message: data.error || data.details || 'Claim verification failed.',
        });
      }
    } catch (err: any) {
      console.error('Error verifying claim:', err);
      setClaimState({
        status: 'error',
        message: err?.message || 'Unable to verify claim right now.',
      });
    }
  };

  // Check auth before verifying claim
  const handleVerifyClaimWithAuth = (claim: string, url?: string, category?: string) => {
    if (!currentUser) {
      dispatchNav({
        type: 'OPEN_AUTH_GATE',
        portal: 'reader',
        notice: 'Please sign in to submit breaking claims and URLs for live AI verification. Reading published investigations is 100% free.',
      });
      return;
    }
    handleVerifyClaim(claim, url, category);
  };

  // Handle sample query selection
  const handleSelectSample = (sample: string) => {
    setSearchQuery(sample);
    if (!currentUser) {
      dispatchNav({
        type: 'OPEN_AUTH_GATE',
        portal: 'reader',
        notice: 'Please sign in to test live AI claim verification. Reading published investigations is 100% free.',
      });
      return;
    }
    handleVerifyClaim(sample);
  };

  // Switch active tab and smoothly position at top of viewport
  const handleTabChange = (tab: string) => {
    dispatchNav({ type: 'SELECT_TAB', tab: tab as TraceTab });
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Handle tab switching with role and auth checks
  const handleRequestTab = (tab: string) => {
    // 1. Free reading desks open to all visitors without login
    if (
      tab === 'top-news' ||
      tab === 'live-news' ||
      tab === 'busted' ||
      tab === 'recent' ||
      tab === 'stats' ||
      tab === 'terms' ||
      tab === 'privacy'
    ) {
      handleTabChange(tab);
      return;
    }

    // 2. Admin CMS Desk
    if (tab === 'admin') {
      handleTabChange('admin');
      return;
    }

    // 3. Personal User History
    if (tab === 'history') {
      if (!currentUser) {
        dispatchNav({
          type: 'OPEN_AUTH_GATE',
          portal: 'reader',
          notice: 'Please sign in to access your private verification history and data logs.',
          pendingTab: 'history',
        });
        return;
      }
      handleTabChange('history');
      return;
    }

    // 4. Interactive AI Investigative Desks ('news-media', 'deepfake', 'ai-analyzer')
    if (!currentUser) {
      const toolDescriptions: Record<string, string> = {
        'news-media': 'Photo & Broadcast OCR Fact-Checker (detect AI images, verify news photos & videos)',
        'deepfake': 'Deepfake Computer Vision Lab (4-pillar forensic noise, face landmark & ELA inspection)',
        'ai-analyzer': 'Writing & NLP Forensic Analyzer (perplexity & burstiness AI text detector)',
      };
      dispatchNav({
        type: 'OPEN_AUTH_GATE',
        portal: 'reader',
        notice: `Please sign in as a reader to use the ${toolDescriptions[tab] || 'AI investigation tool'}. Reading published articles remains 100% free.`,
        pendingTab: tab as TraceTab,
      });
      return;
    }

    handleTabChange(tab);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 flex flex-col font-sans selection:bg-zinc-900 selection:text-white dark:selection:bg-zinc-100 dark:selection:text-zinc-900 transition-colors duration-200">
      
      {/* Enterprise Linear/Vercel Aesthetic Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleRequestTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
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
        onOpenAccountModal={() => setIsAccountModalOpen(true)}
      />

      {/* Floating Glass Pill Navigation Bar for Mobile (< lg viewport) */}
      <MobileBottomPillNav
        activeTab={activeTab}
        setActiveTab={handleRequestTab}
        currentUser={currentUser}
        onOpenLoginModal={handleOpenLoginModal}
        onOpenAccountModal={() => setIsAccountModalOpen(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        onLogout={handleLogout}
        onVerifyClaim={(query: string) => handleVerifyClaimWithAuth(query)}
      />

      {/* Main Tabbed Editorial Views */}
      <main id="main-content-section" className="flex-1 scroll-mt-20 relative z-10 pb-32 sm:pb-36 lg:pb-12">
        {claimState.status === 'error' && (
          <div className="max-w-4xl mx-auto px-4 pt-4">
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs flex items-center justify-between gap-3">
              <span>{claimState.message}</span>
              <button
                type="button"
                onClick={() => setClaimState({ status: 'idle' })}
                className="font-semibold underline shrink-0 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
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
                <TopNewsSection
                  items={factCheckItems}
                  selectedItem={expandedFactCheck}
                  onSelectItem={handleSelectFactCheck}
                  currentUser={currentUser}
                  onOpenLoginModal={() => handleOpenLoginModal('reader')}
                  isAnalyzing={isAnalyzing}
                  analyzingQuery={claimState.status === 'verifying' ? claimState.query : undefined}
                />
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
                onGenerateReport={(dfResult: DeepfakeAnalysisResult) => {
                  setSelectedDeepfakeResult(dfResult);
                }}
              />
            )}

            {/* Tab 6: Authorship & NLP Linguistic Audit Desk */}
            {activeTab === 'ai-analyzer' && (
              <AITextAnalyzer />
            )}

            {/* Tab 7: Personal Activity & Verification History */}
            {activeTab === 'history' && (
              <MyHistory
                onSelectItem={setSelectedFactCheck}
                onSelectDeepfake={setSelectedDeepfakeResult}
              />
            )}

            {/* Tab 8: Terms & Conditions */}
            {activeTab === 'terms' && (
              <TermsAndConditions
                onBack={() => handleRequestTab('top-news')}
              />
            )}

            {/* Tab 9: Privacy Policy (DPDP Act) */}
            {activeTab === 'privacy' && (
              <PrivacyPolicy
                onBack={() => handleRequestTab('top-news')}
              />
            )}

            {/* Tab 10: Editorial Analytics, Accuracy Index & Academic Credits */}
            {activeTab === 'stats' && (
              <DashboardStats stats={stats} />
            )}

            {/* Tab 11: TRACE Editorial CMS & Public Site Monitoring Portal */}
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


      {/* Forensic Deepfake Inspection Dossier (Only for computer vision lab audits) */}
      {inspectionModal && inspectionModal.kind === 'deepfake' && (
        <BentoVerdictModal
          item={null}
          deepfakeResult={selectedDeepfakeResult}
          onClose={() => setInspectionModal(null)}
          currentUser={currentUser}
          onOpenLoginModal={() => handleOpenLoginModal('reader')}
          relatedFeed={factCheckItems}
          onSelectRelated={(related) => handleSelectFactCheck(related)}
        />
      )}

      {/* Interactive Auth Gateway Modal (Google, Email, Phone OTP) */}
      {navState.authGate.open && (
        <AuthGateway
          isModal={true}
          initialPortal={navState.authGate.portal}
          modalNotice={navState.authGate.notice}
          onLoginSuccess={handleLoginSuccess}
          onClose={() => dispatchNav({ type: 'CLOSE_AUTH_GATE' })}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      )}

      {/* Account Settings & DPDP Privacy Modal */}
      <AccountSettingsModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        currentUser={currentUser}
        onLogout={handleLogout}
        onNavigateToTerms={() => {
          setIsAccountModalOpen(false);
          handleRequestTab('terms');
        }}
        onNavigateToPrivacy={() => {
          setIsAccountModalOpen(false);
          handleRequestTab('privacy');
        }}
      />

      {/* Inactivity Session Expiry Warning Modal */}
      {sessionExpiryWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans">
          <div className="bg-white dark:bg-zinc-900 border border-amber-300 dark:border-amber-700/80 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-semibold text-base text-zinc-900 dark:text-zinc-100">
                Session Inactivity Warning
              </h3>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Your session has been inactive for 24 minutes. For security and protection against unauthorized access, your session will automatically terminate in 60 seconds.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleLogout}
                className="px-3.5 py-2 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Sign Out Now
              </button>
              <button
                type="button"
                onClick={() => setSessionExpiryWarning(false)}
                className="px-4 py-2 rounded-xl bg-zinc-950 dark:bg-zinc-50 text-white dark:text-zinc-950 text-xs font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shadow-xs"
              >
                Stay Signed In
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backend AI & Security Status Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
      />

      {/* Newspaper Colophon & Footer */}
      <div className="relative z-10">
        <Footer onNavigate={(tab) => handleRequestTab(tab)} />
      </div>

    </div>
  );
}
