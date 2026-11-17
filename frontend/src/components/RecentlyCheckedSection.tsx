// TRACE - Chronological Wire Dispatch Feed (Linear / Vercel SaaS Aesthetic)
import React, { useState } from 'react';
import { FactCheckItem, VerdictType } from '../types';
import { Sparkles, Filter, CheckCircle2, AlertTriangle, HelpCircle, ArrowRight, ShieldCheck } from 'lucide-react';

interface RecentlyCheckedProps {
  /** All available fact-check items in the feed */
  items: FactCheckItem[];
  /** Callback when user clicks a claim row to open detailed audit modal */
  onSelectItem: (item: FactCheckItem) => void;
  /** Active global search query passed down from App state */
  searchQuery: string;
}

export const RecentlyCheckedSection: React.FC<RecentlyCheckedProps> = ({
  items,
  onSelectItem,
  searchQuery,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedVerdict, setSelectedVerdict] = useState<string>('ALL');

  const filteredItems = items.filter((item) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchClaim = item.claim.toLowerCase().includes(q);
      const matchSummary = item.summary.toLowerCase().includes(q);
      if (!matchTitle && !matchClaim && !matchSummary) return false;
    }

    if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
      return false;
    }

    if (selectedVerdict !== 'ALL') {
      if (selectedVerdict === 'VERIFIED_TRUE') {
        if (item.verdict !== 'VERIFIED_TRUE' && item.verdict !== 'SUPPORTED_BY_EVIDENCE') return false;
      } else if (selectedVerdict === 'DEBUNKED_FAKE') {
        if (item.verdict !== 'DEBUNKED_FAKE' && item.verdict !== 'DEBUNKED') return false;
      } else if (selectedVerdict === 'MISLEADING') {
        if (item.verdict !== 'MISLEADING') return false;
      } else if (selectedVerdict === 'CONTEXT_NEEDED') {
        if (item.verdict !== 'MOSTLY_TRUE_NEEDS_CONTEXT' && item.verdict !== 'UNVERIFIED') return false;
      } else if (item.verdict !== selectedVerdict) {
        return false;
      }
    }

    return true;
  });

  const getVerdictBadge = (verdict: VerdictType | string, score: number) => {
    switch (verdict) {
      case 'SUPPORTED_BY_EVIDENCE':
      case 'VERIFIED_TRUE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-mono font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 uppercase tracking-wider shrink-0">
            <CheckCircle2 className="w-3 h-3 shrink-0" /> Supported By Evidence
          </span>
        );
      case 'MOSTLY_TRUE_NEEDS_CONTEXT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-mono font-semibold bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/80 uppercase tracking-wider shrink-0">
            <CheckCircle2 className="w-3 h-3 shrink-0" /> Mostly True (Needs Context)
          </span>
        );
      case 'DEBUNKED':
      case 'DEBUNKED_FAKE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-mono font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/80 uppercase tracking-wider shrink-0">
            <AlertTriangle className="w-3 h-3 shrink-0" /> Debunked False
          </span>
        );
      case 'MISLEADING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-mono font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80 uppercase tracking-wider shrink-0">
            <AlertTriangle className="w-3 h-3 shrink-0" /> Misleading Narrative
          </span>
        );
      case 'UNVERIFIED':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-mono font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 uppercase tracking-wider shrink-0">
            <HelpCircle className="w-3 h-3 shrink-0" /> Inconclusive / Unverified
          </span>
        );
    }
  };

  return (
    <section className="bg-zinc-50/50 dark:bg-zinc-950/50 text-zinc-900 dark:text-zinc-100 py-10 sm:py-14 border-t border-zinc-200 dark:border-zinc-800/80 transition-colors duration-200">
      <div className="max-w-[1680px] w-full mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 mb-6 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 text-xs font-medium uppercase tracking-wider mb-1.5">
              <Sparkles className="w-4 h-4 text-zinc-700 dark:text-zinc-300 shrink-0" />
              <span>Live Wire Dispatch • Chronological Feed</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
              Recently Checked Claims
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 text-xs sm:text-sm mt-1">
              Latest viral claims, breaking statements, and multimedia submissions processed through TRACE.
            </p>
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0">
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 mr-1">
              <Filter className="w-3.5 h-3.5 shrink-0" />
              <span>Filter:</span>
            </div>

            {/* Verdict Filter */}
            <select
              value={selectedVerdict}
              onChange={(e) => setSelectedVerdict(e.target.value)}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-hidden focus:border-zinc-400 dark:focus:border-zinc-600 uppercase tracking-wider text-[11px] shadow-2xs font-mono"
            >
              <option value="ALL">All Verdicts</option>
              <option value="VERIFIED_TRUE">Supported / True</option>
              <option value="DEBUNKED_FAKE">Debunked / False</option>
              <option value="MISLEADING">Misleading</option>
              <option value="CONTEXT_NEEDED">Needs Context / Inconclusive</option>
            </select>

            {/* Desk Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-hidden focus:border-zinc-400 dark:focus:border-zinc-600 uppercase tracking-wider text-[11px] shadow-2xs font-mono"
            >
              <option value="ALL">All Desks</option>
              <option value="Politics">Politics</option>
              <option value="Health & Science">Health & Science</option>
              <option value="Technology">Technology</option>
              <option value="World News">World News</option>
              <option value="Finance">Finance</option>
            </select>
          </div>
        </div>

        {/* List of Claims */}
        {filteredItems.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-10 sm:p-14 text-center text-zinc-500 dark:text-zinc-400">
            <p className="text-sm font-medium">
              {items.length === 0
                ? 'No claims logged on the wire yet. Verify your first headline above to start the record.'
                : 'No claims match your filter criteria.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectItem(item)}
                className="group bg-white dark:bg-zinc-900/80 border border-zinc-200/90 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 rounded-xl p-4 sm:p-5 transition-all duration-200 shadow-2xs hover:shadow-xs cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5 sm:gap-4 flex-1 min-w-0">
                  {item.imageUrl && (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          item.verdict === 'DEBUNKED_FAKE'
                            ? 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80'
                            : 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80';
                      }}
                      className="w-16 h-12 sm:w-20 sm:h-14 md:w-24 md:h-16 rounded-lg object-cover border border-zinc-200/80 dark:border-zinc-800/80 shrink-0 hidden xs:block"
                      referrerPolicy="no-referrer"
                    />
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      {getVerdictBadge(item.verdict, item.truthScore)}
                      <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-md shrink-0">
                        {item.category}
                      </span>
                      <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-mono">• {item.timestamp}</span>
                    </div>

                    <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-zinc-600 dark:text-zinc-400 text-xs mt-1 line-clamp-2 leading-relaxed">
                      {item.summary}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0 w-full md:w-auto justify-between md:justify-end pt-3 md:pt-0 border-t md:border-t-0 border-zinc-100 dark:border-zinc-800/80">
                  <div className="text-left md:text-right text-xs text-zinc-500 dark:text-zinc-400 min-w-0 font-mono">
                    <p className="font-medium text-zinc-700 dark:text-zinc-300 text-[11px]">
                      {item.sources ? item.sources.length : 1} Sources Cross-Checked
                    </p>
                    <p className="text-[10px] text-zinc-400 truncate max-w-[160px]">{item.verifiedBy}</p>
                  </div>

                  <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 group-hover:bg-zinc-900 dark:group-hover:bg-zinc-100 group-hover:text-white dark:group-hover:text-zinc-900 flex items-center justify-center transition-colors shrink-0">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
