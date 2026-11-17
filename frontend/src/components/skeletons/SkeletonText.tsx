import React from 'react';

interface SkeletonTextProps {
  lines?: number;
  className?: string;
  widths?: string[];
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl';
}

const sizeClasses = {
  xs: 'h-2.5',
  sm: 'h-3.5',
  base: 'h-4',
  lg: 'h-5',
  xl: 'h-6',
};

export const SkeletonText: React.FC<SkeletonTextProps> = ({
  lines = 3,
  className = '',
  widths = ['100%', '92%', '78%'],
  size = 'sm',
}) => {
  return (
    <div className={`space-y-2.5 ${className}`} role="status" aria-label="Loading text...">
      {Array.from({ length: lines }).map((_, i) => {
        const width = widths[i % widths.length] || '100%';
        return (
          <div
            key={i}
            style={{ width }}
            className={`${sizeClasses[size]} rounded-md bg-zinc-200 dark:bg-zinc-800/80 animate-pulse`}
          />
        );
      })}
      <span className="sr-only">Loading text content...</span>
    </div>
  );
};
