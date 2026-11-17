import React from 'react';
import { SkeletonText } from './SkeletonText';

interface SkeletonCardProps {
  hasImage?: boolean;
  imageHeight?: string;
  lines?: number;
  className?: string;
  hasHeaderBadge?: boolean;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  hasImage = false,
  imageHeight = 'h-44',
  lines = 3,
  className = '',
  hasHeaderBadge = true,
}) => {
  return (
    <div
      className={`rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 p-4 sm:p-5 shadow-xs overflow-hidden ${className}`}
      role="status"
    >
      {hasImage && (
        <div className={`w-full ${imageHeight} rounded-lg bg-zinc-200 dark:bg-zinc-800/80 mb-4 animate-pulse relative overflow-hidden`}>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
        </div>
      )}

      {hasHeaderBadge && (
        <div className="flex items-center justify-between mb-3.5">
          <div className="h-5 w-24 rounded-full bg-zinc-200 dark:bg-zinc-800/80 animate-pulse" />
          <div className="h-4 w-16 rounded bg-zinc-200 dark:bg-zinc-800/80 animate-pulse" />
        </div>
      )}

      <div className="h-5 w-4/5 rounded-md bg-zinc-200 dark:bg-zinc-800/80 mb-3 animate-pulse" />
      <SkeletonText lines={lines} widths={['100%', '90%', '75%']} />

      <div className="mt-4 pt-3.5 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between">
        <div className="h-4 w-28 rounded bg-zinc-200 dark:bg-zinc-800/80 animate-pulse" />
        <div className="h-7 w-20 rounded-lg bg-zinc-200 dark:bg-zinc-800/80 animate-pulse" />
      </div>
    </div>
  );
};
