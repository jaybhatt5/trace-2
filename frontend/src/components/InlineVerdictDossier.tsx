// TRACE - In-Line Expanded Verdict Dossier & Horizontal News Slider
// Un-slopped, professional editorial architecture: expands the news block in-place and slides other news stories
import React, { useRef, useState } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  ExternalLink,
  Copy,
  Check,
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Radio,
  Clock,
  Sparkles,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { motion } from 'motion/react';
import { FactCheckItem, CredibilityVerdict } from '../types';
import { TraceMeter, type TruthChoice } from './TraceMeter';
import type { TraceAuthUser } from '../utils/firebase';

interface InlineVerdictDossierProps {
  activeItem: FactCheckItem;
  allItems: FactCheckItem[];
  onSelectOther: (item: FactCheckItem) => void;
  onCollapse: () => void;
  currentUser: TraceAuthUser | null;
  onOpenLoginModal?: () => void;
}

export const InlineVerdictDossier: React.FC<InlineVerdictDossierProps> = ({
  activeItem,
  allItems,
  onSelectOther,
  onCollapse,
  currentUser,
  onOpenLoginModal,
}) => {
  const [hasCopiedUrl, setHasCopiedUrl] = useState(false);
  const [hasCopiedSummary, setHasCopiedSummary] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  const reportId = activeItem.id || `report-${Date.now()}`;

  // Normalized Verdict Status
  const getVerdictDetails = () => {
    const v = activeItem.compassVerdict || (activeItem.verdict as CredibilityVerdict);
    switch (v) {
      case 'SUPPORTED_BY_EVIDENCE':
      case 'VERIFIED_TRUE' as any:
        return {
          status: 'VERIFIED TRUE',
          badgeClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
          icon: CheckCircle2,
          takeaway: 'Empirical records and accredited wire archives confirm this claim.',
        };
      case 'MOSTLY_TRUE_NEEDS_CONTEXT':
        return {
          status: 'MOSTLY TRUE — CONTEXT NEEDED',
          badgeClass: 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/30',
          icon: Sparkles,
          takeaway: 'The central factual assertion is substantiated, but omitted context alters interpretation.',
        };
      case 'MISLEADING':
        return {
          status: 'MISLEADING FRAMING',
          badgeClass: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30',
          icon: AlertTriangle,
          takeaway: 'Employs selective omission, altered chronology, or unsubstantiated framing.',
        };
      case 'DEBUNKED':
      case 'DEBUNKED_FAKE' as any:
        return {
          status: 'DEBUNKED HOAX / FALSE',
          badgeClass: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30',
          icon: XCircle,
          takeaway: 'Contradicted by direct empirical records and verified primary documentation.',
        };
      case 'UNVERIFIED':
      default:
        return {
          status: 'UNVERIFIED — INSUFFICIENT EVIDENCE',
          badgeClass: 'bg-zinc-500/10 text-zinc-700 dark:text-zinc-400 border-zinc-500/30',
          icon: HelpCircle,
          takeaway: 'Insufficient independent documentation exists to substantiate or disprove this statement.',
        };
    }
  };

  const verdict = getVerdictDetails();
  const VerdictIcon = verdict.icon;

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      const shareUrl = `${window.location.origin}/report/${encodeURIComponent(reportId)}`;
      navigator.clipboard.writeText(shareUrl);
      setHasCopiedUrl(true);
      setTimeout(() => setHasCopiedUrl(false), 2000);
    }
  };

  const handleDownloadJson = () => {
    const blob = new Blob([JSON.stringify(activeItem, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `trace-verdict-${reportId}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const scrollSlider = (direction: 'left' | 'right') => {
    if (sliderRef.current) {
      const amount = direction === 'left' ? -320 : 320;
      sliderRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  const otherStories = allItems.filter((i) => i.id !== activeItem.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 sm:p-7 shadow-lg space-y-6 font-sans mb-10 transition-colors"
    >
      
      {/* ------------------------------------------------------------------- */}
      {/* 1. TOP IN-LINE COMMAND STRIP                                        */}
      {/* ------------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 shrink-0">
            IN-LINE DOSSIER
          </span>
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
              {activeItem.title}
            </h3>
            <p className="text-[10px] text-zinc-500 font-mono truncate">
              ID #TRACE-{reportId.slice(0, 14)} • Verified with Gemini AI &amp; Wire Archives
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          <button
            type="button"
            onClick={handleCopyLink}
            className="p-1.5 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-850 text-xs font-mono text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer flex items-center gap-1.5"
            aria-label="Copy share link"
          >
            {hasCopiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline text-[11px]">{hasCopiedUrl ? 'Copied' : 'Share'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadJson}
            className="p-1.5 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-850 text-xs font-mono text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer flex items-center gap-1.5"
            aria-label="Download JSON archive"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">JSON</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="p-1.5 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-850 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer flex items-center gap-1.5"
            aria-label="Print report"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">Print</span>
          </button>

          <button
            type="button"
            onClick={onCollapse}
            className="p-1.5 px-3 rounded-lg bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900 text-xs font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
          >
            <X className="w-3.5 h-3.5" />
            <span>Show Grid</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* 2. HORIZONTAL SLIDING CAROUSEL OF OTHER STORIES ("SLIDE OTHERS")   */}
      {/* ------------------------------------------------------------------- */}
      {otherStories.length > 0 && (
        <div className="bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-3.5 space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 font-sans">
                Browse Other Stories
              </p>
              <span className="text-[10px] text-zinc-400 font-mono hidden sm:inline">
                (Click to slide &amp; expand verdict)
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => scrollSlider('left')}
                className="p-1 rounded-md border border-zinc-200 dark:border-zinc-800 hover:bg-white dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors cursor-pointer"
                aria-label="Slide left"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => scrollSlider('right')}
                className="p-1 rounded-md border border-zinc-200 dark:border-zinc-800 hover:bg-white dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors cursor-pointer"
                aria-label="Slide right"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Sliding Track */}
          <div
            ref={sliderRef}
            className="flex items-stretch gap-3 overflow-x-auto no-scrollbar scroll-smooth snap-x pb-1"
          >
            {allItems.map((item) => {
              const isCurrent = item.id === activeItem.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectOther(item)}
                  className={`w-56 sm:w-64 shrink-0 p-2.5 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between snap-start ${
                    isCurrent
                      ? 'bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 shadow-md ring-2 ring-emerald-500/50'
                      : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 text-zinc-900 dark:text-zinc-100'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className={`px-1.5 py-0.2 rounded font-semibold uppercase ${
                        isCurrent
                          ? 'bg-zinc-800 text-zinc-200 dark:bg-zinc-200 dark:text-zinc-800'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
                      }`}>
                        {item.category}
                      </span>
                      <span className={`font-bold ${
                        item.truthScore >= 70
                          ? 'text-emerald-500 dark:text-emerald-400'
                          : item.truthScore <= 35
                          ? 'text-rose-500 dark:text-rose-400'
                          : 'text-amber-500 dark:text-amber-400'
                      }`}>
                        {item.truthScore}%
                      </span>
                    </div>

                    <p className="text-xs font-bold line-clamp-2 leading-tight">
                      {item.title}
                    </p>
                  </div>

                  <div className="pt-2 mt-1 border-t border-zinc-200/50 dark:border-zinc-800/50 flex items-center justify-between text-[10px] font-mono opacity-80">
                    <span className="truncate max-w-[120px]">{item.verifiedBy || 'Accredited Wire'}</span>
                    <span className="underline flex items-center gap-0.5">
                      {isCurrent ? 'Viewing' : 'Inspect'} &rarr;
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* 3. BENTO 2-COLUMN VERDICT DOSSIER LAYOUT                             */}
      {/* ------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column (7 of 12 cols): Primary Evidence, Claim & Wire Audit */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Hero Banner & Definitive Verdict Badge */}
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-zinc-50 dark:bg-zinc-900/60">
            {activeItem.imageUrl && (
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800">
                <img
                  src={activeItem.imageUrl}
                  alt={activeItem.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1000&q=80';
                  }}
                />
                
                {/* Definitive Verdict Stamp */}
                <div className="absolute top-3 left-3">
                  <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 backdrop-blur-md shadow-md font-mono font-bold text-xs uppercase tracking-wider ${verdict.badgeClass} bg-white/95 dark:bg-zinc-950/95`}>
                    <VerdictIcon className="w-4 h-4 shrink-0" />
                    <span>{verdict.status}</span>
                  </div>
                </div>

                <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-black/80 text-white backdrop-blur-md text-xs font-mono font-bold">
                  {activeItem.truthScore}% True
                </div>
              </div>
            )}

            <div className="p-4 sm:p-6 space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
                <span>{activeItem.timestamp}</span>
                <span>•</span>
                <span>{activeItem.category}</span>
                <span>•</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  Audited by {activeItem.verifiedBy || 'TRACE Editorial'}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight leading-tight">
                {activeItem.title}
              </h2>

              {/* Takeaway Callout */}
              <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 font-medium leading-relaxed">
                <span className="font-bold font-mono uppercase text-xs text-zinc-400 block mb-1">
                  Editorial Assessment:
                </span>
                {verdict.takeaway}
              </div>
            </div>
          </div>

          {/* Claim Under Scrutiny */}
          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 space-y-2">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-400">
              Claim Under Scrutiny
            </span>
            <blockquote className="text-xs sm:text-sm italic font-serif text-zinc-800 dark:text-zinc-200 pl-3 border-l-2 border-zinc-400 dark:border-zinc-600">
              "{activeItem.claim || activeItem.title}"
            </blockquote>
          </div>

          {/* Executive Summary */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-400">
              Investigative Findings
            </span>
            <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed font-sans">
              {activeItem.summary}
            </p>
          </div>

          {/* Key Findings Checklist */}
          {activeItem.keyFindings && activeItem.keyFindings.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-400">
                Corroborated Points
              </span>
              <ul className="space-y-2 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300">
                {activeItem.keyFindings.map((finding, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{finding}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Accredited Primary Sources Registry */}
          {activeItem.sources && activeItem.sources.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-400">
                Accredited Wire Sources
              </span>
              <div className="flex flex-wrap gap-2">
                {activeItem.sources.map((src, idx) => (
                  <a
                    key={idx}
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-850 text-xs font-medium text-zinc-800 dark:text-zinc-200 transition-colors shadow-2xs"
                  >
                    <span>{src.name}</span>
                    <ExternalLink className="w-3 h-3 text-zinc-400" />
                  </a>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Right Column (5 of 12 cols): Un-slopped Credibility Consensus Gauge */}
        <div className="lg:col-span-5 space-y-4">
          <TraceMeter
            initialScore={activeItem.truthScore}
            initialTotalVotes={1840}
            reportId={reportId}
            currentUser={currentUser}
            onOpenLoginModal={onOpenLoginModal}
            onVoteCast={(newScore) => {
              activeItem.truthScore = newScore;
            }}
          />
        </div>

      </div>

    </motion.div>
  );
};
