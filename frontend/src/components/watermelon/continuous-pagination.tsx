'use client';

import React, { useState, type FC, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

/* --- Types --- */
export interface ContinuousPaginationProps {
  totalPages?: number;
  defaultPage?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  className?: string;
  disabled?: boolean;
  isLoading?: boolean;
}

interface PageButtonProps {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  ariaLabel: string;
}

const PageButton: FC<PageButtonProps> = ({ children, onClick, disabled, ariaLabel }) => {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`h-9 w-9 sm:h-11 sm:w-11 rounded-xl flex items-center justify-center transition-colors cursor-pointer border shadow-xs backdrop-blur-md ${
        disabled
          ? 'opacity-30 cursor-not-allowed border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-600 bg-zinc-100/60 dark:bg-zinc-900/40'
          : 'border-zinc-200/90 dark:border-zinc-800/90 bg-white/95 dark:bg-zinc-900/90 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
      }`}
      whileHover={!disabled ? { scale: 1.05, y: -1 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
    >
      {children}
    </motion.button>
  );
};

/* --- Main ContinuousPagination Component --- */
export const ContinuousPagination: FC<ContinuousPaginationProps> = ({
  totalPages = 5,
  defaultPage = 1,
  currentPage: controlledPage,
  onPageChange,
  className = '',
  disabled = false,
  isLoading = false,
}) => {
  const [internalPage, setInternalPage] = useState<number>(defaultPage);

  const active = controlledPage !== undefined ? controlledPage : internalPage;

  const paginate = (page: number) => {
    if (disabled || isLoading) return;
    if (page < 1 || page > totalPages) return;
    if (page === active) return;

    if (controlledPage === undefined) {
      setInternalPage(page);
    }
    if (onPageChange) {
      onPageChange(page);
    }
  };

  return (
    <nav
      role="navigation"
      aria-label="Wire Pagination"
      className={`flex items-center justify-center gap-1.5 sm:gap-2 text-sm select-none ${className}`}
    >
      {/* Previous Page Button */}
      <PageButton
        onClick={() => paginate(active - 1)}
        disabled={disabled || active <= 1 || isLoading}
        ariaLabel="Previous page"
      >
        <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
      </PageButton>

      {/* Numerical Page Buttons */}
      <div className="relative flex items-center gap-1.5 sm:gap-2">
        {Array.from({ length: totalPages }).map((_, i) => {
          const page = i + 1;
          const isActive = page === active;

          return (
            <motion.button
              key={page}
              type="button"
              onClick={() => paginate(page)}
              disabled={disabled || (isLoading && isActive)}
              aria-label={`Page ${page}`}
              aria-current={isActive ? 'page' : undefined}
              className={`relative z-10 h-9 w-9 sm:h-11 sm:w-11 rounded-xl flex items-center justify-center text-xs sm:text-sm font-mono font-medium transition-colors cursor-pointer border shadow-xs ${
                isActive
                  ? 'border-transparent text-white'
                  : 'border-zinc-200/90 dark:border-zinc-800/90 bg-white/95 dark:bg-zinc-900/90 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100'
              }`}
              whileHover={
                !isActive && !disabled
                  ? {
                      y: -1.5,
                      scale: 1.04,
                    }
                  : {}
              }
              whileTap={!disabled ? { scale: 0.95 } : {}}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              {/* 3D Dynamic Active State with Shimmer */}
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    layoutId="continuous-pagination-active-bg"
                    className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none"
                    initial={{ scale: 0.92, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.92, opacity: 0 }}
                    transition={{
                      type: 'spring',
                      stiffness: 260,
                      damping: 24,
                      mass: 0.8,
                    }}
                  >
                    {/* Dark & Light mode 3D gradient matching TRACE Linear/Vercel aesthetic */}
                    <div
                      className="absolute inset-0 rounded-xl"
                      style={{
                        background:
                          'linear-gradient(145deg, #27272a 0%, #18181b 50%, #09090b 100%)',
                        border: '1px solid rgba(255, 255, 255, 0.18)',
                        boxShadow: `
                          0 4px 14px -2px rgba(0, 0, 0, 0.35),
                          inset 0 1px 1px 0 rgba(255, 255, 255, 0.25)
                        `,
                      }}
                    />

                    {/* Dynamic continuous shimmer sweep */}
                    <motion.div
                      className="absolute -inset-full skew-x-12"
                      style={{
                        background:
                          'linear-gradient(135deg, transparent 0%, rgba(255, 255, 255, 0.22) 50%, transparent 100%)',
                      }}
                      animate={{ x: ['-100%', '200%'] }}
                      transition={{
                        duration: 2.6,
                        repeat: Infinity,
                        repeatDelay: 3.2,
                        ease: 'easeInOut',
                      }}
                    />

                    {/* 3D Depth Inner Bottom Shadow */}
                    <span
                      className="absolute inset-0 rounded-[inherit] pointer-events-none"
                      style={{
                        boxShadow: 'inset 0 -2px 5px 0 rgba(0, 0, 0, 0.55)',
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Page Number or Loading Indicator */}
              <span className="relative z-10 flex items-center justify-center font-bold">
                {isActive && isLoading ? (
                  <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin text-white" />
                ) : (
                  <span>{page}</span>
                )}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Next Page Button */}
      <PageButton
        onClick={() => paginate(active + 1)}
        disabled={disabled || active >= totalPages || isLoading}
        ariaLabel="Next page"
      >
        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
      </PageButton>
    </nav>
  );
};

/* --- Demo Component for Testing / Preview --- */
export const ContinuousPaginationDemo: FC = () => {
  return (
    <div className="flex items-center justify-center p-6 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
      <ContinuousPagination totalPages={5} defaultPage={2} />
    </div>
  );
};

export default ContinuousPagination;
