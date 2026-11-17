import React from 'react';
import { SkeletonText } from './SkeletonText';

interface SkeletonResultProps {
  type?: 'news' | 'deepfake' | 'ocr' | 'nlp';
  className?: string;
}

export const SkeletonResult: React.FC<SkeletonResultProps> = ({
  type = 'news',
  className = '',
}) => {
  return (
    <div
      className={`rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 p-5 sm:p-6 shadow-xs space-y-6 overflow-hidden ${className}`}
      role="status"
    >
      {/* Top Verdict Banner Placeholder */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-100 dark:border-zinc-800/80">
        <div className="space-y-2.5">
          <div className="h-6 w-40 rounded-full bg-zinc-200 dark:bg-zinc-800/80 animate-pulse" />
          <div className="h-7 w-64 sm:w-80 rounded-md bg-zinc-200 dark:bg-zinc-800/80 animate-pulse" />
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right space-y-1">
            <div className="h-3 w-16 rounded bg-zinc-200 dark:bg-zinc-800/80 ml-auto animate-pulse" />
            <div className="h-8 w-20 rounded-md bg-zinc-200 dark:bg-zinc-800/80 animate-pulse" />
          </div>
          <div className="w-14 h-14 rounded-full border-4 border-zinc-200 dark:border-zinc-800 animate-pulse" />
        </div>
      </div>

      {/* Summary Box Placeholder */}
      <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950/70 p-4 border border-zinc-200/80 dark:border-zinc-800/80 space-y-3">
        <div className="h-3.5 w-32 rounded bg-zinc-200 dark:bg-zinc-800/80 animate-pulse" />
        <SkeletonText lines={3} widths={['100%', '95%', '80%']} />
      </div>

      {/* Detailed Pillars / Evidence Grid */}
      {type === 'deepfake' ? (
        <div className="space-y-3">
          <div className="h-4 w-44 rounded bg-zinc-200 dark:bg-zinc-800/80 animate-pulse" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 space-y-2">
                <div className="h-3 w-20 rounded bg-zinc-200 dark:bg-zinc-800/80 animate-pulse" />
                <div className="h-6 w-12 rounded bg-zinc-200 dark:bg-zinc-800/80 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      ) : type === 'ocr' ? (
        <div className="space-y-3">
          <div className="h-4 w-36 rounded bg-zinc-200 dark:bg-zinc-800/80 animate-pulse" />
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 space-y-2 bg-zinc-50/50 dark:bg-zinc-950/50">
            <SkeletonText lines={5} widths={['100%', '98%', '92%', '85%', '60%']} />
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="h-4 w-36 rounded bg-zinc-200 dark:bg-zinc-800/80 animate-pulse" />
          <div className="space-y-2.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="w-4 h-4 rounded-full bg-zinc-200 dark:bg-zinc-800/80 shrink-0 mt-0.5 animate-pulse" />
                <div className="flex-1 space-y-1">
                  <div className="h-3.5 w-full rounded bg-zinc-200 dark:bg-zinc-800/80 animate-pulse" />
                  <div className="h-3 w-2/3 rounded bg-zinc-200 dark:bg-zinc-800/80 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer / Action row */}
      <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
        <div className="h-4 w-40 rounded bg-zinc-200 dark:bg-zinc-800/80 animate-pulse" />
        <div className="flex items-center gap-2">
          <div className="h-8 w-24 rounded-lg bg-zinc-200 dark:bg-zinc-800/80 animate-pulse" />
          <div className="h-8 w-28 rounded-lg bg-zinc-200 dark:bg-zinc-800/80 animate-pulse" />
        </div>
      </div>
    </div>
  );
};
