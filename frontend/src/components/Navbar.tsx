// TRACE - Enterprise SaaS Navigation Bar (Linear / Vercel Aesthetic)
import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  LayoutDashboard,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  BarChart3,
  Search,
  Camera,
  Menu,
  X,
  Key,
  Sun,
  Moon,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Lock,
  LogOut,
  User as UserIcon,
  Newspaper,
  Radio,
  Home,
  Check,
  ChevronRight,
  Activity,
  Layers,
  ArrowRight,
  Clock,
  Settings,
  Download,
  FileText,
  Copy,
  Terminal,
  ScanFace,
  ScanText,
  SearchCheck,
  TrendingUp,
  Bot,
  Flame,
  History,
  Compass,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TraceLogo } from './TraceLogo';
import { type TraceAuthUser, getAuthHeaders } from '../utils/firebase';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onOpenVerifyModal: () => void;
  onVerifyClaim?: (query: string) => void;
  onOpenApiKeyModal?: () => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  currentUser: TraceAuthUser | null;
  onLogout: () => void;
  onOpenLoginModal: (portal: 'reader' | 'admin', notice?: string) => void;
  onOpenAccountModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  onOpenVerifyModal,
  onVerifyClaim,
  onOpenApiKeyModal,
  theme = 'light',
  onToggleTheme,
  currentUser,
  onLogout,
  onOpenLoginModal,
  onOpenAccountModal,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [localAiOnline, setLocalAiOnline] = useState<boolean>(true);
  const [geminiConfigured, setGeminiConfigured] = useState<boolean>(false);
  const [isExportingData, setIsExportingData] = useState<boolean>(false);
  const [hasCopiedEmail, setHasCopiedEmail] = useState<boolean>(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isUserMenuOpen]);

  const handleCopyEmail = () => {
    if (!currentUser?.email) return;
    navigator.clipboard.writeText(currentUser.email);
    setHasCopiedEmail(true);
    setTimeout(() => setHasCopiedEmail(false), 2000);
  };

  const handleExportData = async () => {
    try {
      setIsExportingData(true);
      const headers = await getAuthHeaders();
      const res = await fetch('/api/user/export', { headers });
      if (!res.ok) {
        throw new Error('Failed to export data');
      }
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `trace-archive-${currentUser?.uid || 'user'}-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
      alert('Could not export your data at this time. Please make sure you are signed in.');
    } finally {
      setIsExportingData(false);
    }
  };

  useEffect(() => {
    let active = true;
    fetch('/api/system/status')
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        setLocalAiOnline(Boolean(data?.localAi?.device || data?.success));
        setGeminiConfigured(Boolean(data?.keys?.geminiConfigured));
      })
      .catch(() => {
        if (active) setLocalAiOnline(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const navItems = [
    { id: 'top-news', label: 'Overview', icon: Compass, badge: null },
    { id: 'deepfake', label: 'Deepfake Lab', icon: ScanFace, badge: 'AI' },
    { id: 'news-media', label: 'Photo & OCR', icon: ScanText, badge: null },
    { id: 'live-news', label: 'Verify News', icon: SearchCheck, badge: 'Live' },
    { id: 'ai-analyzer', label: 'AI Writing', icon: Bot, badge: null },
    { id: 'busted', label: 'Debunked', icon: Flame, badge: null },
    { id: 'recent', label: 'Live Wire', icon: Radio, badge: null },
    { id: 'stats', label: 'Trends', icon: TrendingUp, badge: null },
    { id: 'history', label: 'My History', icon: History, badge: currentUser ? 'Private' : null },
    { id: 'admin', label: 'CMS Portal', icon: LayoutDashboard, badge: currentUser?.role === 'admin' ? 'Admin' : null },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() && onVerifyClaim) {
      onVerifyClaim(searchQuery.trim());
      setIsSearchExpanded(false);
      setIsMobileMenuOpen(false);
    }
  };

  const handleTabSelect = (tabId: string) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
  };

  const handleLogoClick = () => {
    setActiveTab('top-news');
    setIsMobileMenuOpen(false);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md transition-colors font-sans">
        {/* Main Navbar Top Row */}
        <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-2 xl:gap-3 2xl:gap-4">
            
            {/* Left Brand Identity */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={handleLogoClick}
                className="flex items-center gap-2.5 text-left focus:outline-none group cursor-pointer"
              >
                <div className="relative">
                  <TraceLogo className="w-8 h-8 rounded-lg shadow-2xs group-hover:scale-105 transition-transform" />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-950" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-base tracking-tight text-zinc-950 dark:text-zinc-50 font-sans">
                      TRACE
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-700/60">
                      v2.4
                    </span>
                  </div>
                  <p className="hidden sm:block text-[10px] text-zinc-400 dark:text-zinc-500 font-mono tracking-tight leading-none mt-0.5">
                    AI Sentinel &amp; Truth Engine
                  </p>
                </div>
              </button>
            </div>

            {/* Desktop Center Navigation Links */}
            <div className="hidden lg:flex items-center flex-1 min-w-0 justify-start xl:justify-center overflow-hidden">
              <nav className="flex items-center gap-1 xl:gap-1.5 max-w-full overflow-x-auto no-scrollbar py-1 px-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabSelect(item.id)}
                      className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                        isActive
                          ? 'text-zinc-950 dark:text-zinc-50 bg-zinc-100/90 dark:bg-zinc-800/90 font-semibold shadow-2xs'
                          : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-100/60 dark:hover:bg-zinc-850/60'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-zinc-950 dark:text-zinc-100' : 'text-zinc-400 dark:text-zinc-500'}`} />
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className={`text-[9px] font-mono px-1 rounded uppercase tracking-wider font-semibold ${
                          item.badge === 'Live'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Right Controls: Search, API Key, Theme, Auth, Mobile Menu */}
            <div className="flex items-center gap-2 shrink-0">
              
              {/* Desktop Quick Search Input */}
              <form onSubmit={handleSearchSubmit} className="hidden md:flex relative items-center">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Verify claim or headline..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-36 xl:w-48 2xl:w-60 bg-zinc-100/80 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg pl-8 pr-12 py-1 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 focus:w-56 2xl:focus:w-72 transition-all font-sans"
                />
                <button
                  type="submit"
                  disabled={!searchQuery.trim()}
                  className="absolute right-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 disabled:opacity-30"
                >
                  Verify
                </button>
              </form>

              {/* Mobile Search Toggle */}
              <button
                type="button"
                onClick={() => setIsSearchExpanded(!isSearchExpanded)}
                className="md:hidden p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                aria-label="Search"
              >
                <Search className="w-4 h-4" />
              </button>

              {/* Theme Toggle Button */}
              {onToggleTheme && (
                <button
                  type="button"
                  onClick={onToggleTheme}
                  className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-850 transition-colors cursor-pointer"
                  aria-label="Toggle theme"
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-700" />}
                </button>
              )}

              {/* User Account / Sign In with Enhanced Functional Menu */}
              {currentUser ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    type="button"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-850 transition-colors cursor-pointer"
                    aria-expanded={isUserMenuOpen}
                    aria-label="User account and control menu"
                  >
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
                      currentUser.role === 'admin'
                        ? 'bg-gradient-to-br from-rose-600 to-amber-500'
                        : 'bg-blue-600'
                    }`}>
                      {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : 'U'}
                    </div>
                    <span className="max-w-[80px] sm:max-w-[120px] truncate text-[11px]">
                      {currentUser.displayName || currentUser.email?.split('@')[0]}
                    </span>
                    {currentUser.role === 'admin' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                    )}
                  </button>

                  {/* Desktop Dropdown Popover */}
                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.97 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-2xl z-50 text-xs font-sans overflow-hidden"
                      >
                        {/* 1. User Identity & Clearance Header */}
                        <div className="p-3.5 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-900/50">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="relative shrink-0">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shadow-xs ${
                                  currentUser.role === 'admin'
                                    ? 'bg-gradient-to-br from-rose-600 via-amber-600 to-amber-500 text-white'
                                    : 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white'
                                }`}>
                                  {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : 'U'}
                                </div>
                                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-950 animate-pulse" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-bold text-xs text-zinc-900 dark:text-zinc-50 truncate">
                                  {currentUser.displayName || (currentUser.role === 'admin' ? 'Master Administrator' : 'Authorized User')}
                                </p>
                                <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                                  <span className="truncate">{currentUser.email || currentUser.phoneNumber || 'User Session'}</span>
                                  {currentUser.email && (
                                    <button
                                      type="button"
                                      onClick={handleCopyEmail}
                                      className="p-0.5 hover:text-zinc-900 dark:hover:text-zinc-200 rounded transition-colors cursor-pointer"
                                      aria-label="Copy account email"
                                    >
                                      {hasCopiedEmail ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1 text-[10px] font-mono">
                            <span className="text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Access Clearance</span>
                            <span className={`px-2 py-0.5 rounded-md font-semibold tracking-wide flex items-center gap-1 ${
                              currentUser.role === 'admin'
                                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            }`}>
                              {currentUser.role === 'admin' ? (
                                <>
                                  <ShieldAlert className="w-3 h-3" />
                                  <span>CLEARANCE 5 • MASTER ADMIN</span>
                                </>
                              ) : (
                                <>
                                  <ShieldCheck className="w-3 h-3" />
                                  <span>CITIZEN INVESTIGATOR</span>
                                </>
                              )}
                            </span>
                          </div>
                        </div>

                        {/* 2. Admin Sentinel Bureau Section */}
                        <div className="p-2 border-b border-zinc-100 dark:border-zinc-800/80">
                          <div className="px-2 py-1 text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center justify-between">
                            <span>Admin Panel &amp; Controls</span>
                            {currentUser.role === 'admin' && (
                              <span className="text-amber-500 font-bold">Unrestricted</span>
                            )}
                          </div>

                          {currentUser.role === 'admin' ? (
                            <div className="space-y-1 mt-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveTab('admin');
                                  setIsUserMenuOpen(false);
                                }}
                                className="w-full text-left p-2 rounded-xl bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-transparent hover:from-rose-500/15 hover:to-amber-500/15 border border-rose-500/20 dark:border-rose-500/30 transition-all flex items-center justify-between group cursor-pointer"
                              >
                                <div className="flex items-center gap-2.5">
                                  <div className="w-7 h-7 rounded-lg bg-rose-500 text-white flex items-center justify-center shadow-xs shrink-0">
                                    <ShieldAlert className="w-4 h-4" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                                      Sentinel Admin Console
                                    </p>
                                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                                      Live telemetry, AI sensitivity &amp; overrides
                                    </p>
                                  </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setActiveTab('admin');
                                  setIsUserMenuOpen(false);
                                }}
                                className="w-full text-left p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-850/80 transition-colors flex items-center gap-2.5 cursor-pointer text-zinc-700 dark:text-zinc-300"
                              >
                                <LayoutDashboard className="w-4 h-4 text-amber-500 shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Editorial CMS &amp; Hoax Bureau</p>
                                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">Curate claims, fact-checks &amp; debunks</p>
                                </div>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  sessionStorage.setItem('trace_admin_default_subtab', 'ledger');
                                  setActiveTab('admin');
                                  window.dispatchEvent(new CustomEvent('trace:open-admin-subtab', { detail: 'ledger' }));
                                  setIsUserMenuOpen(false);
                                }}
                                className="w-full text-left p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-850/80 transition-colors flex items-center gap-2.5 cursor-pointer text-zinc-700 dark:text-zinc-300"
                              >
                                <Terminal className="w-4 h-4 text-emerald-500 shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Live Security &amp; Audit Ledger</p>
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  </div>
                                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">Real-time threat logs, scans &amp; user vaults</p>
                                </div>
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setIsUserMenuOpen(false);
                                onOpenLoginModal('admin', 'Master Administrator authorization required to enter Sentinel Console.');
                              }}
                              className="w-full text-left p-2 mt-1 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-850 transition-colors flex items-center justify-between group cursor-pointer"
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="w-6 h-6 rounded-md bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center shrink-0">
                                  <Lock className="w-3.5 h-3.5" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 group-hover:text-amber-500 transition-colors">
                                    Sentinel Admin Login
                                  </p>
                                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                                    Master operations clearance
                                  </p>
                                </div>
                              </div>
                              <ChevronRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                            </button>
                          )}
                        </div>

                        {/* 3. Personal User Workspace */}
                        <div className="p-2 border-b border-zinc-100 dark:border-zinc-800/80 space-y-0.5">
                          <div className="px-2 py-1 text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                            Personal Workspace
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setActiveTab('history');
                              setIsUserMenuOpen(false);
                            }}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between hover:bg-zinc-100 dark:hover:bg-zinc-850/80 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5">
                              <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                              <span className="text-xs font-medium">My Personal History</span>
                            </div>
                            <span className="text-[9px] font-mono font-semibold uppercase px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">
                              Private
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              onOpenAccountModal?.();
                              setIsUserMenuOpen(false);
                            }}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-850/80 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
                          >
                            <Settings className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                            <span className="text-xs font-medium">Account &amp; Data Privacy</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleExportData}
                            disabled={isExportingData}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between hover:bg-zinc-100 dark:hover:bg-zinc-850/80 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <div className="flex items-center gap-2.5">
                              <Download className={`w-3.5 h-3.5 text-emerald-500 shrink-0 ${isExportingData ? 'animate-bounce' : ''}`} />
                              <span className="text-xs font-medium">
                                {isExportingData ? 'Exporting Archive...' : 'Export My Data (JSON)'}
                              </span>
                            </div>
                            <span className="text-[9px] font-mono text-zinc-400">DPDP Act</span>
                          </button>
                        </div>

                        {/* 4. Preferences, System & Legal Tools */}
                        <div className="p-2 border-b border-zinc-100 dark:border-zinc-800/80 space-y-1">
                          <div className="px-2 py-1 text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                            Preferences &amp; System
                          </div>

                          {onToggleTheme && (
                            <button
                              type="button"
                              onClick={onToggleTheme}
                              className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between hover:bg-zinc-100 dark:hover:bg-zinc-850/80 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
                            >
                              <div className="flex items-center gap-2.5">
                                {theme === 'dark' ? (
                                  <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                ) : (
                                  <Moon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                )}
                                <span className="text-xs font-medium">Theme Mode</span>
                              </div>
                              <span className="text-[10px] font-mono text-zinc-400 capitalize">{theme}</span>
                            </button>
                          )}

                          {onOpenApiKeyModal && (
                            <button
                              type="button"
                              onClick={() => {
                                onOpenApiKeyModal();
                                setIsUserMenuOpen(false);
                              }}
                              className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between hover:bg-zinc-100 dark:hover:bg-zinc-850/80 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
                            >
                              <div className="flex items-center gap-2.5">
                                <Key className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                <span className="text-xs font-medium">AI Forensics &amp; Keys</span>
                              </div>
                              <span className="text-[9px] font-mono text-emerald-500 font-semibold">Ready</span>
                            </button>
                          )}

                          <div className="grid grid-cols-2 gap-1 pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveTab('terms');
                                setIsUserMenuOpen(false);
                              }}
                              className="px-2 py-1 rounded text-[10px] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-center transition-colors cursor-pointer"
                            >
                              Terms of Service
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveTab('privacy');
                                setIsUserMenuOpen(false);
                              }}
                              className="px-2 py-1 rounded text-[10px] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-center transition-colors cursor-pointer"
                            >
                              Privacy Policy
                            </button>
                          </div>
                        </div>

                        {/* 5. Sign Out Footer */}
                        <div className="p-2 bg-zinc-50/70 dark:bg-zinc-900/50">
                          <button
                            type="button"
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              onLogout();
                            }}
                            className="w-full text-left px-2.5 py-2 rounded-xl flex items-center gap-2.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-semibold transition-colors cursor-pointer"
                          >
                            <LogOut className="w-3.5 h-3.5 shrink-0" />
                            <span className="text-xs">Secure Sign Out</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onOpenLoginModal('reader')}
                    className="px-3 py-1.5 rounded-lg bg-zinc-950 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-950 text-xs font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors cursor-pointer shadow-xs"
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenLoginModal('admin', 'Direct clearance access for Master Administrators.')}
                    aria-label="Sentinel Admin Master Clearance Login"
                    className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-amber-500 hover:border-amber-500/40 transition-colors cursor-pointer"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Mobile Drawer Trigger (Superseded on mobile by Floating Glass Pill Nav) */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(true)}
                className="hidden p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-850 transition-colors"
                aria-label="Open menu"
              >
                <Menu className="w-4 h-4" />
              </button>

            </div>

          </div>

          {/* Collapsible Mobile Search Row */}
          <AnimatePresence>
            {isSearchExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="md:hidden overflow-hidden pb-3 pt-1 border-t border-zinc-100 dark:border-zinc-800"
              >
                <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Type headline, claim, or URL..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-400"
                      autoFocus
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!searchQuery.trim()}
                    className="px-3 py-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 text-xs font-semibold disabled:opacity-40 cursor-pointer"
                  >
                    Verify
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* Secondary Strip (Hidden in favor of Mobile Glass Pill) */}
      </header>

      {/* Slide-over Mobile & Tablet Navigation Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
            <div className="fixed inset-0 z-50 flex justify-end">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
              />

              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                className="relative w-full max-w-sm bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col h-screen z-10 overflow-hidden"
              >
                {/* Drawer Header */}
                <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/80 shrink-0">
                  <div onClick={handleLogoClick} className="flex items-center gap-2.5 cursor-pointer">
                    <TraceLogo className="w-8 h-8 rounded-lg shadow-2xs" />
                    <div>
                      <h3 className="font-bold text-sm text-zinc-950 dark:text-zinc-50">
                        TRACE Platform
                      </h3>
                      <p className="text-[10px] text-zinc-500 font-mono">
                        Truth Review &amp; Authenticity Engine
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Drawer Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                  
                  {/* User Profile Card */}
                  <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 space-y-2.5">
                    <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-400 block">
                      Account &amp; Clearance
                    </span>
                    {currentUser ? (
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                            {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : 'U'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 truncate">
                              {currentUser.displayName || 'Authorized Reader'}
                            </p>
                            <p className="text-[10px] text-zinc-500 truncate">{currentUser.email}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setIsMobileMenuOpen(false);
                              setActiveTab('history');
                            }}
                            className="py-1.5 px-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-[11px] font-medium flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Clock className="w-3.5 h-3.5 text-zinc-500" />
                            <span>My History</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsMobileMenuOpen(false);
                              onOpenAccountModal?.();
                            }}
                            className="py-1.5 px-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-[11px] font-medium flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Settings className="w-3.5 h-3.5 text-zinc-500" />
                            <span>Settings</span>
                          </button>
                        </div>

                        <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase ${
                            currentUser.role === 'admin'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          }`}>
                            {currentUser.role === 'admin' ? 'Editorial Clearance' : 'Reader'}
                          </span>

                          <button
                            onClick={() => {
                              setIsMobileMenuOpen(false);
                              onLogout();
                            }}
                            className="text-[11px] text-rose-600 hover:underline flex items-center gap-1 font-medium"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>Sign Out</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">
                          Sign in to submit breaking media and unlock unthrottled deepfake forensic analysis.
                        </p>
                        <button
                          onClick={() => {
                            setIsMobileMenuOpen(false);
                            onOpenLoginModal('reader');
                          }}
                          className="w-full py-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 text-xs font-semibold hover:bg-zinc-800 transition-colors"
                        >
                          Sign In / Register
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Navigation Groups */}
                  <div className="space-y-4">
                    <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-400 block px-1">
                      Platform Desks
                    </span>
                    <div className="space-y-1">
                      {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => handleTabSelect(item.id)}
                            className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-medium transition-colors ${
                              isActive
                                ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-zinc-50 font-semibold'
                                : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <Icon className={`w-4 h-4 ${isActive ? 'text-blue-500' : 'text-zinc-400'}`} />
                              <span>{item.label}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {item.badge && (
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                                  {item.badge}
                                </span>
                              )}
                              <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* System Hardware Status */}
                  <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-400">
                        Local AI Engine
                      </span>
                      <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Online
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-600 dark:text-zinc-400 font-mono">
                      PyTorch 2.14 • OpenCV YuNet • EfficientNet-B0
                    </p>
                  </div>

                </div>

                {/* Drawer Footer */}
                <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80 flex items-center justify-between shrink-0 text-xs text-zinc-500">
                  <div className="flex items-center gap-2">
                    {onToggleTheme && (
                      <button
                        type="button"
                        onClick={onToggleTheme}
                        className="px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-zinc-50 bg-white dark:bg-zinc-900 transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
                      >
                        {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-zinc-700" />}
                        <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenApiKeyModal?.();
                    }}
                    className="hover:text-zinc-900 dark:hover:text-zinc-100 underline text-[11px]"
                  >
                    Backend AI Status
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
    </>
  );
};
