// TRACE - Debunked Claims & Hoaxes Section (Linear / Vercel SaaS Aesthetic)
import React from 'react';
import { FactCheckItem } from '../types';
import { AlertTriangle, ShieldAlert, XCircle, ArrowUpRight, Flame, Info } from 'lucide-react';

interface BustedNewsProps {
  items: FactCheckItem[];
  onSelectItem: (item: FactCheckItem) => void;
}

export const BustedNewsSection: React.FC<BustedNewsProps> = ({ items, onSelectItem }) => {
  const bustedNews = items.filter(
    (item) => item.verdict === 'DEBUNKED_FAKE' || item.verdict === 'MISLEADING' || item.truthScore < 40
  );

  return (
    <section className="bg-zinc-50/70 dark:bg-zinc-950/70 border-t border-zinc-200 dark:border-zinc-800/80 py-10 sm:py-14 transition-colors duration-200">
      <div className="max-w-[1680px] w-full mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 mb-6 sm:mb-8 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 text-xs font-medium uppercase tracking-wider mb-1.5">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Disinformation Registry</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
              Debunked Claims & Viral Hoaxes
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 text-xs sm:text-sm mt-1 max-w-2xl">
              Fabricated quotes, synthetic media, and coordinated viral falsehoods intercepted and disproven by TRACE.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 px-3 py-1.5 rounded-lg self-start sm:self-auto shrink-0 font-mono">
            <Flame className="w-3.5 h-3.5 shrink-0 text-rose-500" />
            <span>{bustedNews.length} Hoaxes Disproven on Record</span>
          </div>
        </div>

        {/* Busted Items Grid */}
        {bustedNews.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-10 sm:p-14 text-center text-zinc-500 dark:text-zinc-400">
            <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-3 text-zinc-400">
              <XCircle className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">No debunked hoaxes currently logged</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-md mx-auto">
              Any claims verified as fake or manipulated with cross-source documentation will populate here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {bustedNews.map((item) => (
              <article
                key={item.id}
                onClick={() => onSelectItem(item)}
                className="group bg-white dark:bg-zinc-900/80 border border-zinc-200/90 dark:border-zinc-800/80 hover:border-rose-300 dark:hover:border-rose-800/60 rounded-xl overflow-hidden shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  {/* Photo Header */}
                  {item.imageUrl && (
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-950 border-b border-zinc-200/80 dark:border-zinc-800/80">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=1000&q=80';
                        }}
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300"
                        referrerPolicy="no-referrer"
                      />

                      {/* Truth Score Badge */}
                      <div className="absolute top-2.5 right-2.5 bg-rose-600/95 text-white font-mono font-bold text-[11px] px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs backdrop-blur-xs">
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        <span>{item.truthScore}% True</span>
                      </div>

                      {/* Verdict Stamp */}
                      <div className="absolute top-2.5 left-2.5 bg-white/95 dark:bg-zinc-900/95 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/80 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md backdrop-blur-xs">
                        {item.verdict === 'DEBUNKED_FAKE' ? 'DEBUNKED FAKE' : 'MISLEADING'}
                      </div>
                    </div>
                  )}

                  {/* Body Content */}
                  <div className="p-4 sm:p-5">
                    <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 mb-2 font-mono">
                      <span>{item.timestamp}</span>
                      <span>{item.sharesCount ? item.sharesCount.toLocaleString() : 'Viral'} Shares</span>
                    </div>

                    <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors line-clamp-2 leading-snug">
                      {item.title}
                    </h3>

                    {/* Ground Truth Box */}
                    <div className="mt-3 p-3 rounded-lg bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 text-xs text-zinc-800 dark:text-zinc-200">
                      <div className="font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-1 mb-1 text-[11px] uppercase tracking-wider">
                        <Info className="w-3.5 h-3.5 shrink-0" />
                        <span>The Facts:</span>
                      </div>
                      <p className="line-clamp-2 leading-relaxed">{item.summary}</p>
                    </div>

                    {/* Key Debunk Findings */}
                    {item.keyFindings && item.keyFindings.length > 0 && (
                      <div className="mt-3.5 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5">
                          Disproven Contradictions
                        </p>
                        <ul className="space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
                          {item.keyFindings.slice(0, 2).map((finding, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-rose-500 font-bold shrink-0">✕</span>
                              <span className="line-clamp-1">{finding}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer details */}
                <div className="px-4 sm:px-5 py-3 bg-zinc-50/70 dark:bg-zinc-950/60 border-t border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                  <span className="truncate max-w-[150px] font-mono text-[11px]">
                    Desk: <strong className="text-zinc-700 dark:text-zinc-300 font-medium">{item.category}</strong>
                  </span>
                  <span className="text-rose-600 dark:text-rose-400 font-medium group-hover:underline flex items-center gap-1 shrink-0 text-xs">
                    Read Exposé <ArrowUpRight className="w-3.5 h-3.5" />
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
