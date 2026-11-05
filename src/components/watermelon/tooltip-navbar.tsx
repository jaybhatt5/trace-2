'use client';

import React, { useRef, useState, useEffect, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CommandIcon,
  MessageCircle,
  Inbox,
  Circle,
  Crosshair,
  Download,
  Menu,
} from 'lucide-react';

export type TooltipItem = {
  icon: ReactNode;
  label: string;
  labelHasKeyword?: (string | ReactNode)[] | false;
  hasBadge?: boolean;
  onClick?: () => void;
  isActive?: boolean;
};

export interface TooltipNavbarProps {
  items: TooltipItem[];
  tooltipDelay?: number; // in ms
  className?: string;
}

export const TooltipNavbar: React.FC<TooltipNavbarProps> = ({
  items,
  tooltipDelay = 150,
  className = '',
}) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [coords, setCoords] = useState({ clipPath: '', translateX: 0 });

  const measureRefs = useRef<(HTMLDivElement | null)[]>([]);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const [isEntering, setIsEntering] = useState(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const calculatePosition = (index: number) => {
    const activeLabel = measureRefs.current[index];
    const activeIcon = buttonRefs.current[index];

    if (!activeLabel || !activeIcon) return null;

    const labelLeft = activeLabel.offsetLeft;
    const labelWidth = activeLabel.offsetWidth;
    const labelCenter = labelLeft + labelWidth / 2;

    const iconLeft = activeIcon.offsetLeft;
    const iconWidth = activeIcon.offsetWidth;
    const iconCenter = iconLeft + iconWidth / 2;

    const totalWidth = measureRefs.current.reduce(
      (acc, el) => acc + (el?.offsetWidth || 0),
      0,
    );

    if (totalWidth === 0) return null;

    const cLeft = (labelLeft / totalWidth) * 100;
    const cRight = 100 - ((labelLeft + labelWidth) / totalWidth) * 100;

    return {
      clipPath: `inset(0 ${cRight}% 0 ${cLeft}% round 8px)`,
      translateX: iconCenter - labelCenter,
    };
  };

  const handleMouseEnter = (index: number) => {
    const newCoords = calculatePosition(index);
    if (!newCoords) return;

    if (activeIndex === null) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setIsEntering(true);

      timeoutRef.current = setTimeout(() => {
        setCoords(newCoords);
        setActiveIndex(index);
      }, tooltipDelay);
    } else {
      setCoords(newCoords);
      setActiveIndex(index);
    }
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveIndex(null);
    setCoords({ clipPath: '', translateX: 0 });
    setIsEntering(true);
  };

  const handleItemClick = (index: number, item: TooltipItem) => {
    const newCoords = calculatePosition(index);
    if (newCoords) {
      setCoords(newCoords);
      setActiveIndex(index);
      setIsEntering(false);

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setActiveIndex(null);
      }, 1600);
    }

    item.onClick?.();
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center justify-center">
        <div className="relative text-white" onMouseLeave={handleMouseLeave}>
          
          {/* Animated Morphing Tooltip */}
          <AnimatePresence>
            {activeIndex !== null && coords.clipPath !== '' && (
              <motion.div
                className="absolute bottom-16 left-0 pointer-events-none z-50"
                initial={{ opacity: 0, y: 6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.96 }}
                transition={{ duration: 0.16 }}
              >
                <motion.div
                  className="flex bg-stone-900/95 dark:bg-stone-800/95 border border-stone-800 dark:border-stone-700 shadow-xl backdrop-blur-md rounded-lg"
                  animate={{
                    clipPath: coords.clipPath,
                    x: coords.translateX,
                  }}
                  transition={{
                    type: 'spring',
                    bounce: 0,
                    duration: isEntering ? 0 : 0.35,
                  }}
                  onUpdate={() => {
                    if (isEntering) {
                      setIsEntering(false);
                    }
                  }}
                >
                  <div className="inline-flex h-8 items-center justify-center">
                    {items.map((item, index) => (
                      <div
                        key={`real-${index}`}
                        className="flex items-center justify-center gap-1 px-2.5 text-xs font-semibold whitespace-nowrap"
                      >
                        <span className="text-stone-100 dark:text-stone-50">{item.label}</span>
                        {item.hasBadge && (
                          <div className="flex items-center gap-0.5 text-white/50">
                            <span className="flex items-center justify-center rounded-sm border border-white/20 p-0.5">
                              <CommandIcon className="size-2.5 text-emerald-400" />
                            </span>
                          </div>
                        )}
                        {item.labelHasKeyword && (
                          <div className="flex items-center gap-0.5 text-white/50">
                            {item.labelHasKeyword.map((key, i) => (
                              <span
                                key={i}
                                className="flex items-center justify-center rounded-sm border border-white/20 px-1 text-[10px] tabular-nums font-mono text-stone-300"
                              >
                                {key}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Bottom Dock Bar */}
          <div className="z-40 inline-flex items-center justify-center rounded-full bg-stone-900/95 dark:bg-stone-900/95 p-1.5 sm:p-2 backdrop-blur-md border border-stone-800/90 dark:border-stone-700/80 shadow-2xl">
            {items.map((item, index) => {
              const isActive = Boolean(item.isActive);
              return (
                <button
                  key={index}
                  type="button"
                  onMouseEnter={() => handleMouseEnter(index)}
                  onClick={() => handleItemClick(index, item)}
                  ref={(el) => {
                    buttonRefs.current[index] = el;
                  }}
                  className={`relative flex cursor-pointer items-center justify-center rounded-full transition-all duration-200 active:scale-95 ${
                    isActive
                      ? 'bg-white/20 dark:bg-white/25 text-white shadow-inner font-bold'
                      : 'text-stone-300 hover:text-white hover:bg-white/10 dark:text-stone-300 dark:hover:text-white dark:hover:bg-white/10'
                  }`}
                  title={item.label}
                  aria-label={item.label}
                >
                  <div className="flex size-9 sm:size-10 items-center justify-center p-2">
                    {item.icon}
                  </div>
                  {/* Active indicator dot */}
                  {isActive && (
                    <span className="absolute bottom-1 w-1 h-1 rounded-full bg-emerald-400 shadow-2xs" />
                  )}
                  {/* Subtle notification badge dot */}
                  {item.hasBadge && !isActive && (
                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  )}
                  <span className="sr-only">{item.label}</span>
                </button>
              );
            })}
          </div>

        </div>
      </div>

      {/* Hidden container for accurate width measurement */}
      <div className="pointer-events-none absolute bottom-0 left-0 flex h-0 overflow-hidden whitespace-nowrap opacity-0">
        {items.map((item, index) => (
          <div
            key={`measure-${index}`}
            ref={(el) => {
              measureRefs.current[index] = el;
            }}
            className="flex items-center justify-center gap-1 px-2.5 text-xs font-semibold whitespace-nowrap"
          >
            <span>{item.label}</span>
            {item.hasBadge && (
              <div className="flex items-center gap-0.5 text-white/50">
                <span className="flex items-center justify-center rounded-sm border border-white/20 p-0.5">
                  <CommandIcon className="size-2.5 text-neutral-500" />
                </span>
              </div>
            )}
            {item.labelHasKeyword && (
              <div className="flex items-center gap-0.5 text-white/50">
                {item.labelHasKeyword.map((key, i) => (
                  <span
                    key={i}
                    className="flex items-center justify-center rounded-sm border border-white/20 px-1 text-[10px] tabular-nums font-mono"
                  >
                    {typeof key === 'string' ? key : '⌘'}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

/* ---------- Demo Component Matching Request ---------- */
const DEMO_ITEMS: TooltipItem[] = [
  {
    icon: <MessageCircle className="h-full w-full" />,
    label: 'Comment',
    labelHasKeyword: ['C'],
    hasBadge: false,
  },
  {
    icon: <Inbox className="h-full w-full" />,
    label: 'Inbox',
    labelHasKeyword: ['I'],
    hasBadge: true,
  },
  {
    icon: <Circle className="h-full w-full" />,
    label: 'Record',
    labelHasKeyword: ['R'],
    hasBadge: false,
  },
  {
    icon: <Crosshair className="h-full w-full" />,
    label: 'Focus Mode',
    labelHasKeyword: ['F'],
    hasBadge: false,
  },
  {
    icon: <Download className="h-full w-full" />,
    label: 'Share',
    labelHasKeyword: ['S'],
    hasBadge: false,
  },
  {
    icon: <Menu className="h-full w-full" />,
    label: 'Menu',
    labelHasKeyword: ['M'],
    hasBadge: false,
  },
];

export function TooltipNavbarDemo() {
  return <TooltipNavbar items={DEMO_ITEMS} />;
}

export default TooltipNavbar;
