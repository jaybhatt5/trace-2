// TRACE - Hero Console & Feature Architecture (Linear / Vercel Aesthetic)
import React, { useState } from 'react';
import {
  Search,
  Link as LinkIcon,
  FileText,
  Image as ImageIcon,
  Bot,
  CheckCircle2,
  ShieldAlert,
  Camera,
  Globe,
  Shield,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Cpu,
  Layers,
  Lock,
  Zap,
  Activity,
  ScanFace,
  ScanText,
  SearchCheck,
} from 'lucide-react';
import { RunActionButton, type StepItem } from './watermelon/run-action-button';

interface HeroBannerProps {
  onVerify: (claim: string, url?: string, category?: string) => void;
  onSelectSample: (sample: string) => void;
  isAnalyzing: boolean;
  setActiveTab: (tab: string) => void;
}

const HERO_INVESTIGATION_STEPS: StepItem[] = [
  { id: 'parse', label: 'Parsing Claim Semantics', icon: Search },
  { id: 'wires', label: 'Cross-Checking Global Wire Registries', icon: Globe },
  { id: 'evidence', label: 'Corroborating Primary Documentation', icon: ShieldCheck },
  { id: 'verdict', label: 'Synthesizing Forensic Truth Score', icon: Sparkles },
];

export const HeroBanner: React.FC<HeroBannerProps> = ({
  onVerify,
  onSelectSample,
  isAnalyzing,
  setActiveTab,
}) => {
  const [claimInput, setClaimInput] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('General');
  const [mode, setMode] = useState<'claim' | 'url' | 'deepfake' | 'aitext' | 'newsmedia'>('claim');

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'claim' && claimInput.trim()) {
      onVerify(claimInput.trim(), undefined, selectedCategory);
    } else if (mode === 'url' && urlInput.trim()) {
      onVerify(claimInput.trim() || 'Link content verification', urlInput.trim(), selectedCategory);
    }
  };

  const sampleClaims = [
    { label: 'WHO announces global mandatory digital health passports in 2026', type: 'Debunked' },
    { label: 'NASA Webb telescope discovers alien megastructure around Tabby Star', type: 'Science' },
    { label: 'Viral video shows President declaring national cryptocurrency reserve', type: 'Deepfake' },
    { label: 'Global renewable energy output hit record 30% milestone', type: 'Verified' },
  ];

  const modeButtons = [
    { id: 'claim' as const, label: 'News Claim', icon: FileText, tab: 'top-news' },
    { id: 'url' as const, label: 'Article URL', icon: LinkIcon, tab: 'top-news' },
    { id: 'deepfake' as const, label: 'Deepfake Lab', icon: ScanFace, tab: 'deepfake' },
    { id: 'newsmedia' as const, label: 'Photo & OCR', icon: ScanText, tab: 'news-media' },
    { id: 'aitext' as const, label: 'AI Writing', icon: Bot, tab: 'ai-analyzer' },
  ];

  const featurePillars = [
    {
      title: 'News Verification',
      desc: 'Corroborates breaking claims against accredited wire archives and peer-reviewed primary sources.',
      tab: 'live-news',
      icon: Globe,
      badge: 'Real-time Wires'
    },
    {
      title: 'Local Deepfake Detection',
      desc: 'PyTorch EfficientNet & OpenCV YuNet detect synthetic face swaps, ELA disparities, and frame jitter.',
      tab: 'deepfake',
      icon: ScanFace,
      badge: '100% Local Inference'
    },
    {
      title: 'Photo & Broadcast OCR',
      desc: 'Extracts lower-third chyrons, audits font kerning inconsistencies, and exposes doctored graphics.',
      tab: 'news-media',
      icon: ScanText,
      badge: 'Chyron Extraction'
    },
    {
      title: 'Zero-Retention Privacy',
      desc: 'Media is processed strictly in temporary volatile memory and never permanently stored or shared.',
      tab: 'stats',
      icon: Lock,
      badge: 'Privacy Protected'
    }
  ];

  return (
    <section id="hero-banner" className="bg-zinc-50/70 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 py-12 sm:py-16 md:py-20 border-b border-zinc-200 dark:border-zinc-850 font-sans transition-colors">
      <div className="max-w-[1680px] 2xl:max-w-[1800px] w-full mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 text-center">
        
        {/* Kicker Tag */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 text-xs font-mono mb-5 shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          <span>TRACE Multi-Pillar Verification Engine</span>
        </div>

        {/* Primary Headline */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-zinc-950 dark:text-zinc-50 max-w-4xl mx-auto leading-[1.12]">
          Investigate breaking news claims, viral media &amp; deepfakes.
        </h1>

        <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base max-w-2xl mx-auto mt-4 leading-relaxed font-normal">
          Cross-reference breaking headlines, articles, viral photos, and video media against international wire registries, local neural models, and computer vision forensics.
        </p>

        {/* Segmented Mode Selector */}
        <div className="inline-flex flex-wrap items-center justify-center p-1 bg-zinc-200/60 dark:bg-zinc-900 rounded-xl gap-1 mt-8 mb-5 border border-zinc-300/70 dark:border-zinc-800 max-w-full">
          {modeButtons.map((btn) => {
            const Icon = btn.icon;
            const isSelected = mode === btn.id;
            return (
              <button
                key={btn.id}
                type="button"
                onClick={() => {
                  setMode(btn.id);
                  if (btn.tab !== 'top-news' || btn.id === 'claim') {
                    setActiveTab(btn.tab);
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-zinc-50 shadow-xs font-semibold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-blue-500' : 'text-zinc-400'}`} />
                <span>{btn.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search Console Form */}
        <form onSubmit={handleFormSubmit} className="max-w-3xl mx-auto bg-white dark:bg-zinc-900 p-2 sm:p-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all">
          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
            
            {mode === 'url' ? (
              <div className="relative flex-1 min-w-0">
                <LinkIcon className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  placeholder="Paste article URL (e.g. https://reuters.com/world/...)"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-9 pr-3 py-2.5 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600"
                />
              </div>
            ) : (
              <div className="relative flex-1 min-w-0">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Enter headline, statement, or breaking claim to verify..."
                  value={claimInput}
                  onChange={(e) => setClaimInput(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-9 pr-3 py-2.5 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600"
                />
              </div>
            )}

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-zinc-50 dark:bg-zinc-950/80 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-zinc-400 shrink-0 font-medium"
            >
              <option value="General">All Topics</option>
              <option value="Politics">Politics</option>
              <option value="Health & Science">Health &amp; Science</option>
              <option value="Technology">Technology</option>
              <option value="World News">World News</option>
              <option value="Finance">Finance</option>
            </select>

            {/* Action Submit Button */}
            <div className="w-full sm:w-auto flex justify-center shrink-0">
              <RunActionButton
                type="submit"
                size="compact"
                disabled={isAnalyzing || (!claimInput.trim() && !urlInput.trim())}
                isExecuting={isAnalyzing}
                idleLabel="Verify Claim"
                idleIcon={Search}
                doneLabel="Verdict Ready"
                doneIcon={CheckCircle2}
                steps={HERO_INVESTIGATION_STEPS}
              />
            </div>
          </div>
        </form>

        {/* Quick Sample Leads */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5 text-xs text-zinc-500">
          <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-400 mr-1">Sample Leads:</span>
          {sampleClaims.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setClaimInput(sample.label);
                onSelectSample(sample.label);
              }}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors flex items-center gap-1.5 text-[11px] cursor-pointer shadow-2xs"
            >
              {sample.type === 'Verified' && <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />}
              {sample.type === 'Debunked' && <ShieldAlert className="w-3 h-3 text-rose-500 shrink-0" />}
              {sample.type === 'Deepfake' && <ScanFace className="w-3 h-3 text-blue-500 shrink-0" />}
              <span className="truncate max-w-[200px] sm:max-w-none">{sample.label}</span>
            </button>
          ))}
        </div>

        {/* Feature Overview Cards Grid (Phase 2.C Requirement) */}
        <div className="mt-14 sm:mt-18 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
          {featurePillars.map((p, idx) => {
            const Icon = p.icon;
            return (
              <div
                key={idx}
                onClick={() => setActiveTab(p.tab)}
                className="group p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/70 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-800 dark:text-zinc-200 group-hover:scale-105 transition-transform">
                      <Icon className="w-4 h-4 text-blue-500" />
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 font-semibold">
                      {p.badge}
                    </span>
                  </div>
                  <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 mb-1 group-hover:text-blue-500 transition-colors">
                    {p.title}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    {p.desc}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                  <span>Open Tool</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
