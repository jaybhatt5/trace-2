// TRACE - Mobile Glass Pill Bottom Navigation Bar
// Designed to match modern mobile OS glassmorphism (OneUI / iOS Dynamic Island style)
import React, { useState } from 'react';
import {
  Home,
  Shield,
  Sparkles,
  Clock,
  LayoutGrid,
  Camera,
  AlertTriangle,
  Radio,
  Cpu,
  BarChart3,
  LayoutDashboard,
  X,
  Search,
  Sun,
  Moon,
  Key,
  LogOut,
  User as UserIcon,
  ChevronRight,
  ShieldCheck,
  FileText,
  Lock,
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
import { type TraceAuthUser } from '../utils/firebase';

interface MobileBottomPillNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: TraceAuthUser | null;
  onOpenLoginModal: (portal: 'reader' | 'admin', notice?: string) => void;
  onOpenAccountModal?: () => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  onOpenApiKeyModal?: () => void;
  onLogout: () => void;
  onVerifyClaim?: (query: string) => void;
}

export const MobileBottomPillNav: React.FC<MobileBottomPillNavProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onOpenLoginModal,
  onOpenAccountModal,
  theme = 'light',
  onToggleTheme,
  onOpenApiKeyModal,
  onLogout,
  onVerifyClaim,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState('');

  // Primary 4 tabs on the pill bar + 5th is the Menu trigger
  const primaryTabs = [
    { id: 'top-news', label: 'Home', icon: Compass },
    { id: 'deepfake', label: 'Deepfake', icon: ScanFace },
    { id: 'live-news', label: 'Verify', icon: SearchCheck },
    { id: 'history', label: 'History', icon: History },
  ];

  // Secondary tools rendered inside the expanded Glass Menu Drawer
  const secondaryTools = [
    {
      id: 'news-media',
      label: 'Photo & OCR',
      description: 'Image forensics & headline OCR',
      icon: ScanText,
      badge: 'Vision',
    },
    {
      id: 'busted',
      label: 'Debunked',
      description: 'Debunked viral propaganda',
      icon: Flame,
      badge: null,
    },
    {
      id: 'recent',
      label: 'Live Wire',
      description: 'Chronological feed stream',
      icon: Radio,
      badge: 'Realtime',
    },
    {
      id: 'ai-analyzer',
      label: 'AI Writing',
      description: 'Linguistic AI style analysis',
      icon: Bot,
      badge: null,
    },
    {
      id: 'stats',
      label: 'Trends',
      description: 'Accuracy metrics & trends',
      icon: TrendingUp,
      badge: null,
    },
    {
      id: 'admin',
      label: 'CMS Portal',
      description: 'Sentinel master operations',
      icon: LayoutDashboard,
      badge: currentUser?.role === 'admin' ? 'Editor' : 'Admin',
      accent: 'amber',
    },
  ];

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    setIsMenuOpen(false);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (localSearch.trim() && onVerifyClaim) {
      onVerifyClaim(localSearch.trim());
      setLocalSearch('');
      setIsSearchOpen(false);
      setIsMenuOpen(false);
    }
  };

  // Is current tab one of the primary 4 tabs?
  const isSecondaryActive = !primaryTabs.some((t) => t.id === activeTab);

  return (
    <>
      {/* ------------------------------------------------------------------- */}
      {/* FLOATING GLASS PILL BOTTOM BAR (VISIBLE ON MOBILE & TABLET < LG)    */}
      {/* ------------------------------------------------------------------- */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="lg:hidden fixed bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-1.5rem)] max-w-sm sm:max-w-md pointer-events-auto select-none"
      >
        <div className="relative rounded-[28px] sm:rounded-[32px] p-1.5 bg-zinc-950/85 dark:bg-zinc-950/90 text-white backdrop-blur-2xl border border-white/15 dark:border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.55)] ring-1 ring-black/40">
          
          {/* Subtle Top Specular Glass Reflection */}
          <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

          {/* 5-Column Pill Grid */}
          <div className="grid grid-cols-5 gap-1 items-center relative">
            {primaryTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id && !isMenuOpen;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabClick(tab.id)}
                  className={`relative flex flex-col items-center justify-center py-2 px-1 rounded-[22px] min-h-[50px] transition-all duration-200 cursor-pointer ${
                    isActive ? 'text-white' : 'text-zinc-400 hover:text-zinc-200 active:scale-95'
                  }`}
                >
                  {/* Active Capsule Highlight Pill */}
                  {isActive && (
                    <motion.div
                      layoutId="mobilePillActiveHighlight"
                      transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                      className="absolute inset-0 bg-white/15 dark:bg-white/20 rounded-[20px] border border-white/15 shadow-inner"
                    />
                  )}

                  <Icon
                    className={`w-4 h-4 sm:w-4.5 sm:h-4.5 relative z-10 transition-transform ${
                      isActive ? 'scale-105 stroke-[2.2]' : 'stroke-[1.8]'
                    }`}
                  />
                  <span
                    className={`text-[10px] leading-tight mt-1 relative z-10 font-sans tracking-tight ${
                      isActive ? 'font-bold text-white' : 'font-medium text-zinc-400'
                    }`}
                  >
                    {tab.label}
                  </span>
                </button>
              );
            })}

            {/* 5th Column: MENU Trigger with Secondary Indicator Badge */}
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`relative flex flex-col items-center justify-center py-2 px-1 rounded-[22px] min-h-[50px] transition-all duration-200 cursor-pointer ${
                isMenuOpen || isSecondaryActive
                  ? 'text-white'
                  : 'text-zinc-400 hover:text-zinc-200 active:scale-95'
              }`}
            >
              {(isMenuOpen || isSecondaryActive) && (
                <motion.div
                  layoutId="mobilePillActiveHighlight"
                  transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                  className="absolute inset-0 bg-white/15 dark:bg-white/20 rounded-[20px] border border-white/15 shadow-inner"
                />
              )}

              <div className="relative">
                <LayoutGrid
                  className={`w-4 h-4 sm:w-4.5 sm:h-4.5 relative z-10 transition-transform ${
                    isMenuOpen || isSecondaryActive ? 'scale-105 stroke-[2.2]' : 'stroke-[1.8]'
                  }`}
                />
                {/* Active indicator dot if on a secondary tool */}
                {isSecondaryActive && !isMenuOpen && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-zinc-950 animate-pulse" />
                )}
              </div>

              <span
                className={`text-[10px] leading-tight mt-1 relative z-10 font-sans tracking-tight ${
                  isMenuOpen || isSecondaryActive ? 'font-bold text-white' : 'font-medium text-zinc-400'
                }`}
              >
                Menu
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* ------------------------------------------------------------------- */}
      {/* EXPANDED MOBILE GLASS MENU DRAWER (SLIDES UP FROM BOTTOM)           */}
      {/* ------------------------------------------------------------------- */}
      <AnimatePresence>
        {isMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
            />

            {/* Glass Drawer Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 320 }}
              className="relative w-full max-h-[85vh] bg-zinc-950/95 text-zinc-100 backdrop-blur-2xl border-t border-white/15 rounded-t-[32px] shadow-2xl flex flex-col overflow-hidden pb-24 z-10 font-sans"
            >
              {/* Grab Handle */}
              <div className="pt-3 pb-1 flex justify-center shrink-0">
                <div className="w-12 h-1.5 rounded-full bg-zinc-700/80" />
              </div>

              {/* Drawer Top Header */}
              <div className="px-5 py-3 border-b border-zinc-800/80 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <TraceLogo className="w-7 h-7 rounded-lg shadow-sm" />
                  <div>
                    <h3 className="font-bold text-sm text-white">TRACE Sentinel Tools</h3>
                    <p className="text-[10px] text-zinc-400 font-mono">Select a verification desk</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsMenuOpen(false)}
                  className="p-1.5 rounded-full bg-zinc-800/80 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  aria-label="Close menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="overflow-y-auto px-4 py-3 space-y-4 no-scrollbar">
                
                {/* Search Claim Bar */}
                <form onSubmit={handleSearchSubmit} className="relative">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Verify headline, claim, or fact..."
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                    className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl pl-9 pr-14 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                  />
                  <button
                    type="submit"
                    disabled={!localSearch.trim()}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white text-zinc-950 disabled:opacity-30 cursor-pointer"
                  >
                    Verify
                  </button>
                </form>

                {/* Secondary Desks 2-Column Grid */}
                <div>
                  <p className="text-[11px] font-mono font-semibold uppercase tracking-wider text-zinc-400 px-1 mb-2">
                    Verification Suites &amp; Labs
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {secondaryTools.map((tool) => {
                      const Icon = tool.icon;
                      const isActive = activeTab === tool.id;

                      return (
                        <button
                          key={tool.id}
                          type="button"
                          onClick={() => handleTabClick(tool.id)}
                          className={`p-3 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between min-h-[82px] ${
                            isActive
                              ? 'bg-zinc-800/90 border-white/20 text-white shadow-xs'
                              : 'bg-zinc-900/60 border-zinc-800/80 hover:bg-zinc-850/80 text-zinc-300'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <Icon
                              className={`w-4 h-4 ${
                                tool.accent === 'amber'
                                  ? 'text-amber-400'
                                  : isActive
                                  ? 'text-emerald-400'
                                  : 'text-zinc-400'
                              }`}
                            />
                            {tool.badge && (
                              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700/50 uppercase">
                                {tool.badge}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white leading-tight mt-2">
                              {tool.label}
                            </p>
                            <p className="text-[10px] text-zinc-400 line-clamp-1 mt-0.5">
                              {tool.description}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* User Session / Account Row */}
                <div className="pt-2 border-t border-zinc-800/80">
                  {currentUser ? (
                    <div className="bg-zinc-900/70 border border-zinc-800/90 rounded-2xl p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                            {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : 'U'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-xs text-white truncate">
                              {currentUser.displayName || 'Authorized User'}
                            </p>
                            <p className="text-[10px] text-zinc-400 font-mono truncate">
                              {currentUser.email || currentUser.phoneNumber || 'User Session'}
                            </p>
                          </div>
                        </div>

                        <span className="px-2 py-0.5 rounded text-[9px] font-mono font-semibold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shrink-0">
                          {currentUser.role === 'admin' ? 'Master Admin' : 'Reader'}
                        </span>
                      </div>

                      {currentUser.role === 'admin' && (
                        <button
                          type="button"
                          onClick={() => handleTabClick('admin')}
                          className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-rose-500/20 via-amber-500/20 to-transparent border border-rose-500/30 hover:border-rose-500/50 text-xs font-bold text-rose-300 flex items-center justify-between cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <Shield className="w-3.5 h-3.5 text-rose-400" />
                            <span>Sentinel Master Admin Console</span>
                          </div>
                          <span className="text-[10px] font-mono text-amber-400 font-semibold">ENTER &rarr;</span>
                        </button>
                      )}

                      <div className="grid grid-cols-2 gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setIsMenuOpen(false);
                            onOpenAccountModal?.();
                          }}
                          className="py-1.5 px-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-xs font-semibold text-zinc-200 text-center cursor-pointer"
                        >
                          Account &amp; DPDP
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsMenuOpen(false);
                            onLogout();
                          }}
                          className="py-1.5 px-2.5 rounded-xl bg-rose-950/40 border border-rose-900/50 hover:bg-rose-900/50 text-xs font-semibold text-rose-300 text-center flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <LogOut className="w-3 h-3" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-zinc-900/70 border border-zinc-800/90 rounded-2xl p-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold text-white">Join TRACE Network</p>
                        <p className="text-[10px] text-zinc-400">Save private analysis &amp; verify media</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setIsMenuOpen(false);
                            onOpenLoginModal('reader');
                          }}
                          className="py-1.5 px-3 rounded-xl bg-white text-zinc-950 text-xs font-bold shadow-xs cursor-pointer"
                        >
                          Sign In
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsMenuOpen(false);
                            onOpenLoginModal('admin');
                          }}
                          className="p-1.5 rounded-xl bg-zinc-800 border border-zinc-700 text-amber-400 hover:text-white transition-colors cursor-pointer"
                          aria-label="Master Admin Login"
                        >
                          <Lock className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Platform Controls & Quick Toggles */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-800/80 text-xs text-zinc-400">
                  {onToggleTheme && (
                    <button
                      type="button"
                      onClick={onToggleTheme}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:text-white transition-colors cursor-pointer flex-1 justify-center"
                    >
                      {theme === 'dark' ? (
                        <>
                          <Sun className="w-3.5 h-3.5 text-amber-400" />
                          <span>Light Mode</span>
                        </>
                      ) : (
                        <>
                          <Moon className="w-3.5 h-3.5 text-blue-400" />
                          <span>Dark Mode</span>
                        </>
                      )}
                    </button>
                  )}

                  {onOpenApiKeyModal && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenApiKeyModal();
                      }}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:text-white transition-colors cursor-pointer flex-1 justify-center"
                    >
                      <Key className="w-3.5 h-3.5 text-emerald-400" />
                      <span>AI Status</span>
                    </button>
                  )}
                </div>

                {/* Legal Policy Links */}
                <div className="pt-2 flex items-center justify-center gap-4 text-[11px] text-zinc-500 font-medium">
                  <button
                    type="button"
                    onClick={() => handleTabClick('terms')}
                    className="hover:text-zinc-300 underline cursor-pointer"
                  >
                    Terms &amp; Conditions
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => handleTabClick('privacy')}
                    className="hover:text-zinc-300 underline cursor-pointer"
                  >
                    Privacy Policy (DPDP)
                  </button>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
