// TRACE - In-Line Verdict Skeleton Loader
// Replaces the blocking modal popup with a sleek, in-place skeleton matching the exact Bento dossier layout
import React from 'react';
import { Sparkles, Radio, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

interface InlineVerdictSkeletonProps {
  claimQuery?: string;
}

export const InlineVerdictSkeleton: React.FC<InlineVerdictSkeletonProps> = ({ claimQuery }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 sm:p-7 shadow-lg space-y-6 font-sans mb-10 overflow-hidden relative"
      role="status"
      aria-label="Analyzing claim with AI and accredited wire registries"
    >
      {/* Top Shimmer Progress Bar */}
      <div className="absolute top-0 inset-x-0 h-1 bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-emerald-500 via-sky-500 to-emerald-500 animate-[shimmer_1.5s_infinite] w-full" />
      </div>

      {/* 1. Header Bar Placeholder */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 shrink-0">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span>AI INVESTIGATION IN PROGRESS</span>
          </div>

          <div className="min-w-0">
            <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
              Correlating with accredited wires (Reuters, AP, PIB, BBC)...
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="h-7 w-20 rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          <div className="h-7 w-16 rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
        </div>
      </div>

      {/* 2. Active Query Headline Callout */}
      {claimQuery && (
        <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-semibold block">
            Evaluating Claim
          </span>
          <p className="text-xs sm:text-sm font-serif italic text-zinc-800 dark:text-zinc-200 line-clamp-2">
            "{claimQuery}"
          </p>
        </div>
      )}

      {/* 3. Sliding Stories Placeholder Strip */}
      <div className="bg-zinc-50/60 dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-zinc-800/60 rounded-2xl p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="h-3 w-40 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          <div className="flex gap-1.5">
            <div className="h-5 w-5 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            <div className="h-5 w-5 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          </div>
        </div>
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="w-56 sm:w-64 shrink-0 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-2"
            >
              <div className="flex justify-between">
                <div className="h-3 w-14 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                <div className="h-3 w-8 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
              </div>
              <div className="h-4 w-full rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
              <div className="h-3 w-2/3 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* 4. 2-Column Bento Skeleton Layout (Matches InlineVerdictDossier exactly) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column (7 cols): Photo & Findings Placeholder */}
        <div className="lg:col-span-7 space-y-5">
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-zinc-50 dark:bg-zinc-900/60">
            {/* Aspect 16/9 Image Skeleton */}
            <div className="relative aspect-[16/9] w-full bg-zinc-200 dark:bg-zinc-800/80 animate-pulse flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-zinc-400/40 animate-pulse" />
              <div className="absolute top-3 left-3 h-7 w-32 rounded-xl bg-zinc-300 dark:bg-zinc-700 animate-pulse" />
              <div className="absolute bottom-3 right-3 h-6 w-16 rounded-lg bg-zinc-300 dark:bg-zinc-700 animate-pulse" />
            </div>

            <div className="p-4 sm:p-6 space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-3 w-20 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                <div className="h-3 w-14 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                <div className="h-3 w-32 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
              </div>

              <div className="space-y-1.5">
                <div className="h-6 w-full rounded-md bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                <div className="h-6 w-3/4 rounded-md bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
              </div>

              {/* Assessment Callout Skeleton */}
              <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
                <div className="h-3 w-28 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                <div className="h-3.5 w-full rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                <div className="h-3.5 w-4/5 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Evidence Checklist Skeleton */}
          <div className="space-y-2.5 pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <div className="h-3 w-32 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <div className="w-4 h-4 rounded-full bg-zinc-200 dark:bg-zinc-800 shrink-0 mt-0.5 animate-pulse" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3.5 w-full rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                    <div className="h-3.5 w-2/3 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Source Pills Skeleton */}
          <div className="flex gap-2 pt-2">
            <div className="h-8 w-24 rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            <div className="h-8 w-28 rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            <div className="h-8 w-20 rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          </div>
        </div>

        {/* Right Column (5 cols): Consensus Gauge Skeleton */}
        <div className="lg:col-span-5 space-y-4">
          <div className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="h-4 w-36 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
              <div className="h-3 w-20 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            </div>

            {/* Arc Speedometer Skeleton Placeholder */}
            <div className="flex flex-col items-center py-2 space-y-3">
              <div className="w-44 h-24 rounded-t-full border-8 border-zinc-200 dark:border-zinc-800 border-b-0 animate-pulse flex items-end justify-center pb-2">
                <div className="h-7 w-16 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
              </div>
              <div className="grid grid-cols-4 gap-1.5 w-full pt-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800/60 animate-pulse" />
                ))}
              </div>
            </div>

            {/* Form Skeleton */}
            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 space-y-2.5">
              <div className="h-3 w-28 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
              <div className="h-7 w-full rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
              <div className="h-12 w-full rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
              <div className="flex justify-end">
                <div className="h-7 w-24 rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
              </div>
            </div>
          </div>
        </div>

      </div>

    </motion.div>
  );
};
