// Broadsheet masthead and navigation bar
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, LayoutDashboard, CheckCircle, AlertTriangle, Cpu, BarChart3, Search, Camera, Menu, X, ArrowRight, Key, Sun, Moon, Shield, Lock, LogOut, User as UserIcon, Newspaper, Radio, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TraceLogo } from './TraceLogo';

import { type TraceAuthUser } from '../utils/firebase';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onOpenVerifyModal: () => void;
  onVerifyClaim?: (query: string) => void;
  apiKey?: string;
  onOpenApiKeyModal?: () => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  currentUser: TraceAuthUser | null;
  onLogout: () => void;
  onOpenLoginModal: (portal: 'reader' | 'admin', notice?: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  onOpenVerifyModal,
  onVerifyClaim,
  apiKey,
  onOpenApiKeyModal,
  theme = 'light',
  onToggleTheme,
  currentUser,
  onLogout,
  onOpenLoginModal,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  // Track scroll position: when scrolling down, search bar settles into the red box & all 8 tabs settle below it
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Settle in when scrolled past ~75px
      const scrolled = window.scrollY > 75;
      setIsScrolled(scrolled);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isFrontPage = activeTab === 'top-news';
  // On front page: hidden at top (scroll=0) so the hero shines, settles in on scroll
  // On any other desk/tab: always visible so navigation between desks is effortless
  const showNavTabs = !isFrontPage || isScrolled;
  const showNavbarSearch = !isFrontPage || isScrolled;


  // All 8 desks in sequence as usual (Front Page, Live News Wire, Photo & Broadcast Desk, Debunked Hoaxes, Live Wire Dispatch, Deepfake Lab, Writing & NLP Audit, Fact-Check Desk & Stats)
  const navItems = [
    { id: 'top-news', label: 'Front Page', icon: CheckCircle },
    { id: 'live-news', label: 'Live News Wire', icon: Newspaper },
    { id: 'news-media', label: 'Photo & Broadcast Desk', icon: Camera },
    { id: 'busted', label: 'Debunked Hoaxes', icon: AlertTriangle },
    { id: 'recent', label: 'Live Wire Dispatch', icon: Sparkles },
    { id: 'deepfake', label: 'Deepfake Lab', icon: Shield },
    { id: 'ai-analyzer', label: 'Writing & NLP Audit', icon: Cpu },
    { id: 'stats', label: 'Fact-Check Desk & Stats', icon: BarChart3 },
    { id: 'admin', label: 'Admin Dashboard', icon: LayoutDashboard },
  ];

  // Dynamic formatted publication dateline
  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date());

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() && onVerifyClaim) {
      onVerifyClaim(searchQuery.trim());
      setIsMobileSearchOpen(false);
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
      const hero = document.getElementById('hero-banner');
      if (hero) {
        hero.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  // Floating pill bottom navigation items (matching Samsung SmartThings / iOS capsule dock)
  const mobilePillItems = [
    {
      id: 'top-news',
      label: 'Home',
      icon: Home,
      isActive: activeTab === 'top-news' && !isMobileMenuOpen,
      onClick: handleLogoClick,
      hasBadge: false,
    },
    {
      id: 'live-news',
      label: 'Live',
      icon: Radio,
      isActive: activeTab === 'live-news' && !isMobileMenuOpen,
      onClick: () => handleTabSelect('live-news'),
      hasBadge: true,
      badgeColor: 'bg-emerald-500 animate-pulse',
    },
    {
      id: 'verify',
      label: 'Verify',
      icon: Sparkles,
      isActive: false,
      onClick: onOpenVerifyModal,
      hasBadge: false,
    },
    {
      id: 'deepfake',
      label: 'Deepfake',
      icon: Shield,
      isActive: activeTab === 'deepfake' && !isMobileMenuOpen,
      onClick: () => handleTabSelect('deepfake'),
      hasBadge: false,
    },
    {
      id: 'admin',
      label: 'Admin',
      icon: LayoutDashboard,
      isActive: activeTab === 'admin' && !isMobileMenuOpen,
      onClick: () => handleTabSelect('admin'),
      hasBadge: false,
    },
    {
      id: 'menu',
      label: 'Menu',
      icon: Menu,
      isActive: isMobileMenuOpen,
      onClick: () => setIsMobileMenuOpen(true),
      hasBadge: true,
      badgeColor: 'bg-amber-500',
    },
  ];

  return (
    <>
    <header className="sticky top-0 z-40 bg-[#fbfaf8]/98 dark:bg-[#111317]/98 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 shadow-2xs pt-safe transition-colors duration-200 font-sans">
      
      {/* Top Broadsheet Dateline & Utility Ribbon */}
      <div className="border-b border-stone-200 dark:border-stone-800/80 bg-stone-100/60 dark:bg-stone-900/50 py-1 px-3 sm:px-6 lg:px-8 text-[11px] text-stone-600 dark:text-stone-400">
        <div className="max-w-[1680px] w-full mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 flex items-center justify-between gap-2">
          
          {/* Dateline & Edition */}
          <div className="flex items-center gap-2 sm:gap-3 truncate">
            <span className="font-semibold text-stone-800 dark:text-stone-200">{todayFormatted}</span>
            <span className="hidden md:inline text-stone-300 dark:text-stone-700">|</span>
            <span className="hidden md:inline uppercase tracking-widest text-[10px]">Global Digital Edition</span>
            <span className="hidden sm:inline text-stone-300 dark:text-stone-700">|</span>
            <span className="hidden sm:inline font-mono text-[10px] text-stone-500 dark:text-stone-400">TRACE DESK • VOL. V</span>
          </div>

          {/* Right Status Indicator */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-emerald-300/80 dark:border-emerald-800/80 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-[10px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 shrink-0"></span>
              <span className="hidden xs:inline">TRACE Sentinel Active</span>
              <span className="xs:hidden">Live</span>
            </div>

            {currentUser && (
              <button
                type="button"
                onClick={() => handleTabSelect('admin')}
                className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider hover:opacity-85 transition-opacity cursor-pointer ${
                  currentUser.role === 'admin'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                    : 'bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300'
                }`}
                title={currentUser.role === 'admin' ? 'Open Editorial Admin CMS' : 'Reader Clearance'}
              >
                {currentUser.role === 'admin' ? 'Editorial Clearance • Admin' : 'Reader'}
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Main Newspaper Masthead Area */}
      <div className="max-w-[1680px] w-full mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 py-2.5 sm:py-3">
        <div className="flex items-center justify-between gap-3 sm:gap-6">
          
          {/* TRACE Logo & Brand - Click redirects to top-news and scrolls to top */}
          <div onClick={handleLogoClick} className="flex items-center gap-3 cursor-pointer group shrink-0 min-w-0" title="Return to Front Page">
            {/* TRACE Official Crest Badge */}
            <TraceLogo 
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl shrink-0 shadow-2xs transition-transform group-hover:scale-105"
            />
            
            <div className="min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="font-serif font-black text-2xl sm:text-3xl tracking-tight text-stone-900 dark:text-stone-50 uppercase">
                  TRACE
                </span>
                <span className="hidden lg:inline-block font-serif italic text-stone-500 dark:text-stone-400 text-xs">
                  • The Independent Dispatch
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] font-sans font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-widest hidden sm:block truncate">
                Truth Review &amp; Authenticity Checking Engine
              </p>
            </div>
          </div>

          {/* RED LINE LOCATION: The search bar settles into this exact area between Logo and Buttons */}
          <div className="flex-1 max-w-2xl mx-2 sm:mx-4 hidden md:flex items-center min-h-[42px] overflow-hidden">
            <AnimatePresence initial={false}>
              {showNavbarSearch && (
                <motion.form
                  initial={{ opacity: 0, scale: 0.94, y: -8, width: 0 }}
                  animate={{ opacity: 1, scale: 1, y: 0, width: '100%' }}
                  exit={{ opacity: 0, scale: 0.94, y: -8, width: 0 }}
                  transition={{
                    type: 'spring',
                    stiffness: 320,
                    damping: 26,
                    mass: 0.8,
                  }}
                  onSubmit={handleSearchSubmit}
                  className="flex items-center w-full relative"
                >
                  <Search className="w-4 h-4 text-stone-400 dark:text-stone-500 absolute left-3 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search news headline, claim, or URL to investigate with TRACE..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-stone-50 dark:bg-stone-900/90 border border-stone-300 dark:border-stone-700 rounded pl-9 pr-20 py-2 text-xs sm:text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:border-stone-900 dark:focus:border-stone-300 transition-all font-sans"
                  />
                  {searchQuery.trim() && (
                    <button
                      type="submit"
                      className="absolute right-1 px-3 py-1 rounded bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-stone-50 dark:text-stone-900 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Verify
                    </button>
                  )}
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          {/* Right Header CTAs: Verify & Settings */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Mobile Search Toggle */}
            <button
              type="button"
              onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
              className="p-2 rounded bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 md:hidden transition-colors cursor-pointer"
              aria-label="Toggle mobile search"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Mobile Theme Toggle Button */}
            {onToggleTheme && (
              <button
                type="button"
                onClick={onToggleTheme}
                className="p-2 rounded bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 md:hidden transition-colors cursor-pointer"
                aria-label="Toggle theme"
                title="Toggle Theme"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              </button>
            )}

            {/* Submit Claim / Lead Button (Desktop & Tablet) */}
            <button
              onClick={onOpenVerifyModal}
              className="hidden sm:flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-stone-200 text-stone-50 dark:text-stone-950 font-medium text-xs sm:text-sm shadow-2xs transition-all active:scale-95 whitespace-nowrap cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-stone-300 dark:text-stone-700" />
              <span>Submit Claim to Verify</span>
            </button>

            {/* 3-LINE BAR (CONTROLS & SETTINGS DRAWER TOGGLE) */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="hidden md:flex items-center gap-1.5 p-2 px-2.5 sm:px-3 rounded bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 transition-colors shadow-2xs active:scale-95 cursor-pointer"
              aria-label="Open settings and access menu"
              title="Open Settings &amp; Access Menu"
            >
              <Menu className="w-5 h-5" />
              <span className="text-xs font-bold hidden md:inline">Settings</span>
            </button>
          </div>

        </div>

        {/* Collapsible Mobile Search */}
        <AnimatePresence>
          {isMobileSearchOpen && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18 }}
              onSubmit={handleSearchSubmit}
              className="md:hidden pt-2 pb-1 overflow-hidden"
            >
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-stone-400 dark:text-stone-500 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Enter news claim to investigate..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded pl-9 pr-16 py-2 text-xs text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:border-stone-900 dark:focus:border-stone-300 font-sans"
                />
                <button
                  type="submit"
                  disabled={!searchQuery.trim()}
                  className="absolute right-1 px-3 py-1 rounded bg-stone-900 dark:bg-stone-100 text-stone-50 dark:text-stone-900 text-xs font-semibold disabled:opacity-40"
                >
                  Verify
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Broadsheet Section Navigation Bar: All 8 desks in sequence as usual, settles in on scroll */}
        <AnimatePresence initial={false}>
          {showNavTabs && (
            <motion.nav
              initial={{ height: 0, opacity: 0, y: -10, marginTop: 0, paddingTop: 0 }}
              animate={{ height: 'auto', opacity: 1, y: 0, marginTop: 8, paddingTop: 6 }}
              exit={{ height: 0, opacity: 0, y: -10, marginTop: 0, paddingTop: 0 }}
              transition={{
                type: 'spring',
                stiffness: 320,
                damping: 26,
                mass: 0.8,
              }}
              className="hidden md:flex border-t border-stone-200 dark:border-stone-800 items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar -mx-3 px-3 sm:mx-0 sm:px-0 text-xs overflow-hidden"
            >
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabSelect(item.id)}
                    className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-sm whitespace-nowrap transition-colors uppercase tracking-wider text-[11px] sm:text-xs shrink-0 font-medium cursor-pointer ${
                      isActive
                        ? 'text-stone-950 dark:text-stone-50 font-bold'
                        : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-900/60'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeNavTabBorder"
                        className="absolute inset-x-0 bottom-0 h-0.5 bg-stone-900 dark:bg-stone-100"
                        transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                      />
                    )}
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-stone-900 dark:text-stone-100' : 'text-stone-400 dark:text-stone-500'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </motion.nav>
          )}
        </AnimatePresence>

      </div>
    </header>

    {/* 3-LINE BAR (TOP-RIGHT CONTROLS & SETTINGS SLIDE-OVER DRAWER VIA PORTAL) */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isMobileMenuOpen && (
            <div className="fixed inset-0 z-50 flex justify-end">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="fixed inset-0 bg-black/50 backdrop-blur-xs cursor-pointer"
              />

              {/* Slide-over Drawer Panel */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                className="relative w-full max-w-sm sm:max-w-md bg-[#fbfaf8] dark:bg-[#111317] border-l border-stone-300 dark:border-stone-800 shadow-2xl flex flex-col h-screen z-10 overflow-hidden"
              >
              {/* Drawer Masthead Header */}
              <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-100/80 dark:bg-stone-900/80 shrink-0">
                <div onClick={handleLogoClick} className="flex items-center gap-2.5 cursor-pointer">
                  <TraceLogo className="w-8 h-8 rounded-lg shadow-2xs" />
                  <div>
                    <h3 className="font-serif font-black text-sm text-stone-900 dark:text-stone-100 uppercase tracking-tight">
                      TRACE Settings &amp; Access
                    </h3>
                    <p className="text-[10px] text-stone-500 dark:text-stone-400 font-mono">
                      Truth Review &amp; Authenticity Checking Engine
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/80 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* User Authentication Status Card */}
                <div className="p-3.5 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-2">
                    Access &amp; Identity
                  </span>
                  {currentUser ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-stone-200 dark:bg-stone-800 flex items-center justify-center text-stone-700 dark:text-stone-300 text-xs font-bold shrink-0">
                          {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : <UserIcon className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-stone-900 dark:text-stone-100 truncate">
                            {currentUser.displayName || 'Authorized Reader'}
                          </p>
                          <p className="text-[10px] text-stone-500 dark:text-stone-400 truncate">{currentUser.email}</p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                          currentUser.role === 'admin'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        }`}>
                          {currentUser.role === 'admin' ? 'Editorial Clearance' : 'Registered Reader'}
                        </span>

                        <button
                          onClick={() => {
                            setIsMobileMenuOpen(false);
                            onLogout();
                          }}
                          className="text-[11px] text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      <p className="text-xs text-stone-600 dark:text-stone-400">
                        Sign in to submit breaking claims, deepfakes, and audio-visual media for live AI investigation.
                      </p>
                      <div className="flex flex-col gap-1.5 pt-1">
                        <button
                          onClick={() => {
                            setIsMobileMenuOpen(false);
                            onOpenLoginModal('reader');
                          }}
                          className="w-full py-2 px-3 rounded bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-stone-200 text-stone-50 dark:text-stone-900 text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <UserIcon className="w-3.5 h-3.5" />
                          <span>Reader Sign In</span>
                        </button>
                        <button
                          onClick={() => {
                            setIsMobileMenuOpen(false);
                            handleTabSelect('admin');
                          }}
                          className="w-full py-1.5 px-3 rounded border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-300 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>Admin Dashboard &amp; CMS</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Editorial Sections Navigation */}
                <div className="p-3.5 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-2xs space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1">
                    Newsroom Desks &amp; Sections
                  </span>
                  <div className="grid grid-cols-1 gap-1">
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleTabSelect(item.id)}
                          className={`flex items-center justify-between p-2 rounded text-xs transition-colors cursor-pointer ${
                            isActive
                              ? 'bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 font-bold'
                              : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-750'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4 shrink-0" />
                            <span>{item.label}</span>
                          </div>
                          {isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Appearance & API Settings */}
                <div className="p-3.5 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-2xs space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                    Preferences &amp; Engine
                  </span>

                  {/* Dark Mode Toggle */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-stone-700 dark:text-stone-300 font-medium">Display Theme</span>
                    <button
                      onClick={onToggleTheme}
                      className="p-1.5 rounded bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-200 flex items-center gap-1.5 cursor-pointer text-xs font-semibold"
                    >
                      {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
                      <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                    </button>
                  </div>

                  {/* Custom API Key Button */}
                  {onOpenApiKeyModal && (
                    <div className="pt-2 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-medium text-stone-700 dark:text-stone-300 block">Custom Gemini Key</span>
                        <span className="text-[10px] text-stone-400 font-mono">
                          {apiKey ? 'Active • Custom Quota' : 'Using Sentinel Default'}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          onOpenApiKeyModal();
                        }}
                        className="p-1.5 px-2.5 rounded border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-[11px] font-bold cursor-pointer"
                      >
                        Configure
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-3.5 border-t border-stone-200 dark:border-stone-800 bg-stone-100/60 dark:bg-stone-900/60 text-center text-[10px] text-stone-500 font-mono">
                TRACE • Independent Dispatch v5.0 • Standard Wire
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>,
      document.body
    )}
      {/* Floating Pill Mobile Navigation Dock (Samsung SmartThings / iOS Style - Portaled to document.body so it rests at the TRUE bottom of the mobile screen) */}
    {typeof document !== 'undefined' && createPortal(
      <nav
        aria-label="Mobile Navigation Dock"
        className="md:hidden fixed bottom-2.5 sm:bottom-4 inset-x-0 z-50 flex justify-center pointer-events-none px-3 print:hidden"
        style={{
          bottom: 'max(0.625rem, env(safe-area-inset-bottom, 0.625rem))',
        }}
      >
        <div className="pointer-events-auto inline-flex items-center gap-0.5 sm:gap-1 p-1.5 rounded-full bg-[#1c1f24]/95 dark:bg-[#14161a]/95 backdrop-blur-2xl border border-white/10 dark:border-stone-700/60 shadow-[0_12px_36px_rgba(0,0,0,0.5),0_2px_10px_rgba(0,0,0,0.3)] ring-1 ring-black/30">
          {mobilePillItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.isActive;
            return (
              <button
                key={item.id}
                type="button"
                onClick={item.onClick}
                className="relative flex flex-col items-center justify-center py-1 px-2.5 sm:px-3 rounded-full min-w-[46px] select-none transition-transform active:scale-92 cursor-pointer group"
                aria-label={item.label}
              >
                {isActive && (
                  <motion.div
                    layoutId="mobileActiveDockPill"
                    className="absolute inset-0 rounded-full bg-[#343a42] dark:bg-stone-700/80 shadow-xs"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}

                <div className="relative z-10 flex flex-col items-center">
                  <div className="relative">
                    <Icon
                      className={`w-5 h-5 shrink-0 transition-colors ${
                        isActive ? 'text-white' : 'text-stone-400 group-hover:text-stone-200'
                      }`}
                    />
                    {item.hasBadge && (
                      <span
                        className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${
                          item.badgeColor || 'bg-amber-500'
                        } ring-1.5 ring-[#1c1f24]`}
                      />
                    )}
                  </div>
                  <span
                    className={`text-[10px] tracking-tight mt-0.5 leading-none transition-colors ${
                      isActive ? 'font-bold text-white' : 'font-medium text-stone-400 group-hover:text-stone-200'
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </nav>,
      document.body
    )}
  </>
  );
};
