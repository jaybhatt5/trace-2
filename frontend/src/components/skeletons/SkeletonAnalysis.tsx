import React from 'react';
import { SkeletonImage } from './SkeletonImage';
import { SkeletonText } from './SkeletonText';

interface SkeletonAnalysisProps {
  mediaType?: 'image' | 'video';
  className?: string;
  stageMessage?: string;
}

export const SkeletonAnalysis: React.FC<SkeletonAnalysisProps> = ({
  mediaType = 'image',
  className = '',
  stageMessage = 'Performing Local Neural Inspection...',
}) => {
  return (
    <div className={`space-y-6 ${className}`} role="status">
      {/* Top Media Preview Scanner */}
      <SkeletonImage mediaType={mediaType} height="h-64 sm:h-80" showScanningBeam={true} />

      {/* Progress & Micro-status indicator */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 p-4 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-mono text-zinc-600 dark:text-zinc-400 font-medium flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping inline-block" />
            {stageMessage}
          </span>
          <span className="font-mono text-zinc-500 text-[11px] animate-pulse">Running CPU Inference...</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500 rounded-full animate-[progress_1.8s_ease-in-out_infinite]" />
        </div>
      </div>

      {/* Video Suspicious Frames Track (if video) */}
      {mediaType === 'video' && (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-4 w-48 rounded bg-zinc-200 dark:bg-zinc-800/80 animate-pulse" />
            <div className="h-3 w-20 rounded bg-zinc-200 dark:bg-zinc-800/80 animate-pulse" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 overflow-x-auto pb-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-2 space-y-2 bg-zinc-50 dark:bg-zinc-950/50">
                <div className="w-full h-20 rounded bg-zinc-200 dark:bg-zinc-800/80 animate-pulse" />
                <div className="h-3 w-14 rounded bg-zinc-200 dark:bg-zinc-800/80 animate-pulse" />
                <div className="h-2 w-full rounded bg-zinc-200 dark:bg-zinc-800/80 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skeleton Verdict & Forensic Pillars */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800/80">
          <div className="space-y-2">
            <div className="h-6 w-36 rounded-full bg-zinc-200 dark:bg-zinc-800/80 animate-pulse" />
            <div className="h-7 w-64 rounded-md bg-zinc-200 dark:bg-zinc-800/80 animate-pulse" />
          </div>
          <div className="flex items-center gap-3">
            <div className="space-y-1 text-right">
              <div className="h-3 w-16 rounded bg-zinc-200 dark:bg-zinc-800/80 ml-auto animate-pulse" />
              <div className="h-8 w-20 rounded-md bg-zinc-200 dark:bg-zinc-800/80 animate-pulse" />
            </div>
          </div>
        </div>

        {/* 4 Multi-Pillar Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 space-y-2">
              <div className="h-3.5 w-24 rounded bg-zinc-200 dark:bg-zinc-800/80 animate-pulse" />
              <div className="h-6 w-14 rounded bg-zinc-200 dark:bg-zinc-800/80 animate-pulse" />
              <div className="h-2 w-full rounded bg-zinc-200 dark:bg-zinc-800/80 animate-pulse" />
            </div>
          ))}
        </div>

        {/* Technical Summary */}
        <div className="space-y-2 pt-2">
          <div className="h-4 w-40 rounded bg-zinc-200 dark:bg-zinc-800/80 animate-pulse" />
          <SkeletonText lines={2} widths={['100%', '85%']} />
        </div>
      </div>
    </div>
  );
};
