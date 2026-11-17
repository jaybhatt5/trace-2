'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'motion/react';
import { Search, X } from 'lucide-react';

/* ---------- Types ---------- */
export interface Category {
  id: string;
  label: string;
  icon: React.ReactNode;
  activeColor: string;
  activeTextColor: string;
}

export interface MorphingDiscoveryBarProps {
  categories: Category[];
  className?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onSearchSubmit?: (value: string) => void;
  activeCategoryId?: string;
  onCategoryChange?: (id: string) => void;
  placeholder?: string;
}

/* ---------- Motion Settings ---------- */
const transition = {
  type: 'spring',
  bounce: 0.3,
  duration: 0.7,
} as const;

export const MorphingDiscoveryBar: React.FC<MorphingDiscoveryBarProps> = ({
  categories,
  className = '',
  searchValue: controlledSearchValue,
  onSearchChange,
  onSearchSubmit,
  activeCategoryId,
  onCategoryChange,
  placeholder = 'Search live wire dispatches...',
}) => {
  const [isSearching, setIsSearching] = useState(Boolean(controlledSearchValue));
  const [internalSearchValue, setInternalSearchValue] = useState(controlledSearchValue || '');
  const [internalActiveTab, setInternalActiveTab] = useState(categories[0]?.id);
  const inputRef = useRef<HTMLInputElement>(null);

  const searchValue = controlledSearchValue !== undefined ? controlledSearchValue : internalSearchValue;
  const activeTab = activeCategoryId !== undefined ? activeCategoryId : internalActiveTab;

  useEffect(() => {
    if (controlledSearchValue !== undefined) {
      setInternalSearchValue(controlledSearchValue);
      if (controlledSearchValue && !isSearching) {
        setIsSearching(true);
      }
    }
  }, [controlledSearchValue]);

  useEffect(() => {
    if (isSearching) {
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [isSearching]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSearchSubmit?.(searchValue);
    }
    if (e.key === 'Escape') {
      setIsSearching(false);
      setInternalSearchValue('');
      onSearchChange?.('');
      onSearchSubmit?.('');
    }
  };

  const handleClose = () => {
    setIsSearching(false);
    setInternalSearchValue('');
    onSearchChange?.('');
    onSearchSubmit?.('');
  };

  return (
    <div
      className={`flex w-full flex-col items-center justify-center bg-transparent transition-colors duration-500 ${className}`}
    >
      <div className="flex h-16 w-full max-w-full items-center justify-center">
        <LayoutGroup>
          <motion.div
            layout
            transition={transition}
            className="flex max-w-full items-center gap-1.5 rounded-[32px] p-1 backdrop-blur-md sm:gap-2.5 sm:p-1.5"
          >
            {/* SEARCH COMPONENT */}
            <motion.div
              layout
              style={{ borderRadius: 28 }}
              transition={transition}
              className={`relative flex items-center overflow-hidden border shadow-sm transition-colors ${
                isSearching
                  ? 'h-11 sm:h-12 w-[calc(100vw-80px)] sm:w-[480px] md:w-[600px] max-w-full'
                  : 'h-11 w-11 sm:h-12 sm:w-12'
              } border-neutral-200 bg-white dark:border-stone-700 dark:bg-stone-900`}
            >
              <div className="flex h-full w-full items-center justify-center px-3 sm:px-4">
                <motion.div
                  layout="position"
                  transition={transition}
                  onClick={() => {
                    if (isSearching && searchValue) {
                      onSearchSubmit?.(searchValue);
                    } else if (!isSearching) {
                      setIsSearching(true);
                    }
                  }}
                  className="cursor-pointer shrink-0"
                >
                  <Search
                    size={18}
                    strokeWidth={2.5}
                    className="shrink-0 text-neutral-800 transition-colors dark:text-stone-200"
                  />
                </motion.div>

                <AnimatePresence mode="wait">
                  {isSearching && (
                    <motion.input
                      key="search-input"
                      ref={inputRef}
                      initial={{
                        opacity: 0,
                        scaleX: 0.6,
                        scaleY: 0.8,
                        filter: 'blur(4px)',
                        transformOrigin: 'left center',
                      }}
                      animate={{
                        opacity: 1,
                        scaleX: 1,
                        scaleY: 1,
                        filter: 'blur(0px)',
                      }}
                      exit={{
                        opacity: 0,
                        scaleX: 0.6,
                        scaleY: 0.8,
                        filter: 'blur(4px)',
                      }}
                      transition={{ duration: 0.15 }}
                      placeholder={placeholder}
                      className="ml-2 w-full border-none bg-transparent text-xs font-medium text-neutral-900 outline-none placeholder:text-neutral-400 sm:text-sm dark:text-white dark:placeholder:text-neutral-500"
                      value={searchValue}
                      onChange={(e) => {
                        setInternalSearchValue(e.target.value);
                        onSearchChange?.(e.target.value);
                      }}
                      onKeyDown={handleKeyDown}
                    />
                  )}
                </AnimatePresence>

                {!isSearching && (
                  <motion.button
                    layoutId="search-click-overlay"
                    className="absolute inset-0 z-10 h-full w-full cursor-pointer"
                    onClick={() => setIsSearching(true)}
                    title="Open live wire search"
                  />
                )}
              </div>
            </motion.div>

            {/* CATEGORIES */}
            <AnimatePresence mode="popLayout">
              {!isSearching ? (
                <motion.div
                  key="categories-list"
                  layout
                  initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
                  transition={transition}
                  className="flex items-center gap-1 overflow-x-auto rounded-full border border-neutral-200 bg-white p-1 dark:border-stone-700 dark:bg-stone-900 w-full max-w-full no-scrollbar"
                >
                  {categories.map((cat) => {
                    const isActive = activeTab === cat.id;

                    return (
                      <motion.button
                        key={cat.id}
                        layout
                        onClick={() => {
                          setInternalActiveTab(cat.id);
                          onCategoryChange?.(cat.id);
                        }}
                        className="relative z-0 flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-bold tracking-tight whitespace-nowrap transition-colors sm:gap-2 sm:px-4 sm:py-2 sm:text-sm cursor-pointer"
                        style={{
                          color: undefined,
                        }}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="pill-bg"
                            className="absolute inset-0 z-[-1] rounded-full shadow-xs border border-transparent dark:border-stone-700 bg-[var(--active-bg)] dark:!bg-stone-800"
                            style={
                              {
                                '--active-bg': cat.activeColor,
                              } as React.CSSProperties
                            }
                            transition={transition}
                          />
                        )}
                        <span className="relative z-10 shrink-0">
                          {cat.icon}
                        </span>
                        <span
                          className={`relative z-10 transition-colors ${
                            isActive
                              ? 'text-[var(--active-text)] dark:!text-stone-100 font-bold'
                              : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100'
                          }`}
                          style={
                            isActive
                              ? ({ '--active-text': cat.activeTextColor } as React.CSSProperties)
                              : undefined
                          }
                        >
                          {cat.label}
                        </span>
                      </motion.button>
                    );
                  })}
                </motion.div>
              ) : (
                <motion.button
                  key="close-action"
                  layout
                  initial={{
                    width: 100,
                    x: -40,
                    scaleX: 1.2,
                    scaleY: 0.8,
                    opacity: 0,
                    filter: 'blur(6px)',
                    transformOrigin: 'left center',
                  }}
                  animate={{
                    width: 48,
                    x: 0,
                    scaleX: 1,
                    scaleY: 1,
                    opacity: 1,
                    filter: 'blur(0px)',
                  }}
                  exit={{
                    width: 100,
                    x: -40,
                    scaleX: 1.2,
                    scaleY: 0.8,
                    opacity: 0,
                    filter: 'blur(6px)',
                  }}
                  transition={transition}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleClose}
                  title="Close search"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-800 shadow-sm transition-colors sm:h-12 sm:w-12 dark:border-stone-700 dark:bg-stone-900 dark:text-white cursor-pointer"
                >
                  <X size={18} strokeWidth={2.5} />
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        </LayoutGroup>
      </div>
    </div>
  );
};

export default MorphingDiscoveryBar;
