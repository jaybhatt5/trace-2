// TRACE - Top Verified News Section (Linear / Vercel SaaS Aesthetic)
// Features In-Line Expanding News Block with Horizontal Sliding Carousel of Other Stories
import React from 'react';
import { FactCheckItem } from '../types';
import { CheckCircle2, ShieldCheck, ArrowUpRight, TrendingUp, Sparkles, LayoutGrid } from 'lucide-react';
import { InlineVerdictDossier } from './InlineVerdictDossier';
import { InlineVerdictSkeleton } from './InlineVerdictSkeleton';
import type { TraceAuthUser } from '../utils/firebase';

interface TopNewsProps {
  items: FactCheckItem[];
  selectedItem?: FactCheckItem | null;
  onSelectItem: (item: FactCheckItem | null) => void;
  currentUser?: TraceAuthUser | null;
  onOpenLoginModal?: () => void;
  isAnalyzing?: boolean;
  analyzingQuery?: string;
}

export const TopNewsSection: React.FC<TopNewsProps> = ({
  items,
  selectedItem,
  onSelectItem,
  currentUser = null,
  onOpenLoginModal,
  isAnalyzing = false,
  analyzingQuery,
}) => {
  const verifiedNews = items.filter(
    (item) => item.verdict === 'VERIFIED_TRUE' || item.truthScore >= 70
  );

  return (
    <section id="top-news-section" className="bg-zinc-50/50 dark:bg-zinc-950/50 py-10 sm:py-14 border-t border-zinc-200 dark:border-zinc-800/80 transition-colors duration-200 scroll-mt-16">
      <div className="max-w-[1680px] w-full mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 mb-6 sm:mb-8 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 text-xs font-medium uppercase tracking-wider mb-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Primary Evidence Registry</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
              Top Verified News
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 text-xs sm:text-sm mt-1 max-w-2xl">
              Claims corroborated against accredited international wire registries, government archives, and peer-reviewed documentation.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {selectedItem && !isAnalyzing && (
              <button
                type="button"
                onClick={() => onSelectItem(null)}
                className="flex items-center gap-1.5 text-xs bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 px-3 py-1.5 rounded-lg font-medium cursor-pointer shadow-xs hover:opacity-90"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Show All in Grid</span>
              </button>
            )}

            <div className="flex items-center gap-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 px-3 py-1.5 rounded-lg shrink-0 shadow-2xs font-mono">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>{verifiedNews.length} Verified Stories on Record</span>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------------- */}
        {/* IN-LINE SKELETON LOADER (ANIMATED IN-PLACE WHILE AI IS AUDITING)    */}
        {/* ------------------------------------------------------------------- */}
        {isAnalyzing && (
          <InlineVerdictSkeleton claimQuery={analyzingQuery} />
        )}

        {/* ------------------------------------------------------------------- */}
        {/* IN-LINE EXPANDED VERDICT BLOCK (EXPANDS IN-PLACE & SLIDES OTHERS)   */}
        {/* ------------------------------------------------------------------- */}
        {!isAnalyzing && selectedItem ? (
          <InlineVerdictDossier
            activeItem={selectedItem}
            allItems={verifiedNews.length > 0 ? verifiedNews : items}
            onSelectOther={(other) => onSelectItem(other)}
            onCollapse={() => onSelectItem(null)}
            currentUser={currentUser}
            onOpenLoginModal={onOpenLoginModal}
          />
        ) : verifiedNews.length === 0 ? (
          /* Empty State */
          <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-10 sm:p-14 text-center text-zinc-500 dark:text-zinc-400">
            <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-3 text-zinc-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">No verified stories currently indexed</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-md mx-auto">
              Submit a headline or URL in the verification console above to initiate real-time AI and wire investigation.
            </p>
          </div>
        ) : (
          /* Standard 4-Column Grid (Click any card to expand in-line & slide others) */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {verifiedNews.map((item) => (
              <article
                key={item.id}
                onClick={() => onSelectItem(item)}
                className="group bg-white dark:bg-zinc-900/80 border border-zinc-200/90 dark:border-zinc-800/80 hover:border-zinc-400 dark:hover:border-zinc-600 rounded-xl overflow-hidden shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  {/* Article Photo */}
                  {item.imageUrl && (
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-950 border-b border-zinc-200/80 dark:border-zinc-800/80">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1000&q=80';
                        }}
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />

                      {/* Truth Score Pill */}
                      <div className="absolute top-2.5 right-2.5 bg-zinc-900/90 dark:bg-zinc-100/95 text-zinc-100 dark:text-zinc-900 font-mono font-bold text-[11px] px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs backdrop-blur-xs">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 dark:text-emerald-600 shrink-0" />
                        <span>{item.truthScore}% True</span>
                      </div>

                      {/* Desk Kicker */}
                      <div className="absolute top-2.5 left-2.5 bg-white/90 dark:bg-zinc-900/90 text-zinc-800 dark:text-zinc-200 border border-zinc-200/80 dark:border-zinc-700/80 text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-md backdrop-blur-xs">
                        {item.category}
                      </div>
                    </div>
                  )}

                  {/* Body Content */}
                  <div className="p-4 sm:p-5">
                    <div className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400 mb-2 font-mono">
                      <span>{item.timestamp}</span>
                      <span>•</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">VERIFIED</span>
                    </div>

                    <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-zinc-700 dark:group-hover:text-zinc-300 transition-colors line-clamp-2 leading-snug">
                      {item.title}
                    </h3>

                    <p className="text-zinc-600 dark:text-zinc-400 text-xs mt-2 line-clamp-2 leading-relaxed">
                      {item.summary}
                    </p>

                    {/* Key Findings */}
                    {item.keyFindings && item.keyFindings.length > 0 && (
                      <div className="mt-3.5 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5">
                          Corroborated Facts
                        </p>
                        <ul className="space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
                          {item.keyFindings.slice(0, 2).map((finding, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-emerald-500 font-bold shrink-0">•</span>
                              <span className="line-clamp-1">{finding}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* Article Footer */}
                <div className="px-4 sm:px-5 py-3 bg-zinc-50/70 dark:bg-zinc-950/60 border-t border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                  <div className="flex items-center gap-1 min-w-0 pr-2">
                    <span className="truncate text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                      {item.verifiedBy}
                    </span>
                  </div>
                  <span className="text-zinc-900 dark:text-zinc-100 font-medium group-hover:text-emerald-600 dark:group-hover:text-emerald-400 flex items-center gap-1 shrink-0 text-xs">
                    Expand In-Line &rarr;
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
