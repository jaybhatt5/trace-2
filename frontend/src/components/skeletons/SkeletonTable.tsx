import React from 'react';

interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export const SkeletonTable: React.FC<SkeletonTableProps> = ({
  rows = 5,
  columns = 4,
  className = '',
}) => {
  return (
    <div
      className={`w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 overflow-hidden shadow-xs ${className}`}
      role="status"
    >
      {/* Table Header */}
      <div className="bg-zinc-50 dark:bg-zinc-950/70 border-b border-zinc-200 dark:border-zinc-800 p-3.5 sm:p-4 grid grid-cols-12 gap-3 items-center">
        <div className="col-span-5 h-4 w-32 rounded bg-zinc-200 dark:bg-zinc-800/80 animate-pulse" />
        <div className="col-span-3 h-4 w-20 rounded bg-zinc-200 dark:bg-zinc-800/80 animate-pulse" />
        <div className="col-span-2 h-4 w-16 rounded bg-zinc-200 dark:bg-zinc-800/80 animate-pulse" />
        <div className="col-span-2 h-4 w-16 rounded bg-zinc-200 dark:bg-zinc-800/80 ml-auto animate-pulse" />
      </div>

      {/* Table Rows */}
      <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div key={rIdx} className="p-3.5 sm:p-4 grid grid-cols-12 gap-3 items-center">
            <div className="col-span-5 space-y-1.5">
              <div className="h-4 w-4/5 rounded bg-zinc-200 dark:bg-zinc-800/80 animate-pulse" />
              <div className="h-3 w-1/2 rounded bg-zinc-200 dark:bg-zinc-800/80 animate-pulse" />
            </div>
            <div className="col-span-3">
              <div className="h-5 w-24 rounded-full bg-zinc-200 dark:bg-zinc-800/80 animate-pulse" />
            </div>
            <div className="col-span-2">
              <div className="h-4 w-14 rounded bg-zinc-200 dark:bg-zinc-800/80 animate-pulse" />
            </div>
            <div className="col-span-2 flex justify-end gap-1.5">
              <div className="h-7 w-14 rounded-md bg-zinc-200 dark:bg-zinc-800/80 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
