import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, type Transition } from 'motion/react';
import { Zap, CheckCircle2, X } from 'lucide-react';

export interface StepItem {
  id: number | string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface RunActionButtonProps {
  steps?: StepItem[];
  idleLabel?: string;
  idleIcon?: React.ComponentType<{ className?: string }>;
  doneLabel?: string;
  doneIcon?: React.ComponentType<{ className?: string }>;
  isExecuting?: boolean;
  disabled?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>;
  onReset?: () => void;
  type?: 'button' | 'submit';
  size?: 'sm' | 'md' | 'lg' | 'compact';
  className?: string;
  stepIntervalMs?: number;
}

function AnimatedText({
  text,
  className = '',
  delayStep = 0.012,
}: {
  text: string;
  className?: string;
  delayStep?: number;
}) {
  const chars = text.split('');

  return (
    <span className={`inline-flex min-w-0 max-w-full truncate ${className}`}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={text}
          className="inline-flex min-w-0 truncate"
          style={{ willChange: 'transform' }}
        >
          {chars.map((char, i) => (
            <motion.span
              key={i}
              initial={{
                y: 8,
                opacity: 0,
                scale: 0.6,
                filter: 'blur(2px)',
              }}
              animate={{
                y: 0,
                opacity: 1,
                scale: 1,
                filter: 'blur(0px)',
              }}
              exit={{
                y: -8,
                opacity: 0,
                scale: 0.6,
                filter: 'blur(2px)',
              }}
              transition={{
                type: 'spring',
                stiffness: 260,
                damping: 18,
                mass: 1.1,
                delay: i * delayStep,
              }}
              style={{
                display: 'inline-block',
                whiteSpace: char === ' ' ? 'pre' : undefined,
              }}
            >
              {char}
            </motion.span>
          ))}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

const spring: Transition = {
  type: 'spring',
  stiffness: 260,
  damping: 22,
  mass: 0.8,
};

const DEFAULT_STEPS: StepItem[] = [
  { id: 1, label: 'Initializing Pipeline', icon: Zap },
  { id: 2, label: 'Analyzing Data Tokens', icon: Zap },
  { id: 3, label: 'Running Forensic Model', icon: Zap },
  { id: 4, label: 'Generating Final Report', icon: Zap },
];

export const RunActionButton: React.FC<RunActionButtonProps> = ({
  steps = DEFAULT_STEPS,
  idleLabel = 'Run Action',
  idleIcon: IdleIcon = Zap,
  doneLabel = 'Action Complete',
  doneIcon: DoneIcon = CheckCircle2,
  isExecuting,
  disabled = false,
  onClick,
  onReset,
  type = 'button',
  size = 'md',
  className = '',
  stepIntervalMs = 950,
}) => {
  const [internalStatus, setInternalStatus] = useState<'idle' | 'running' | 'done'>('idle');
  const [currentStep, setCurrentStep] = useState(0);
  const wasExecutingRef = useRef(false);

  // Sync external isExecuting prop if provided
  useEffect(() => {
    if (isExecuting !== undefined) {
      if (isExecuting) {
        setInternalStatus('running');
        setCurrentStep(0);
        wasExecutingRef.current = true;
      } else if (wasExecutingRef.current) {
        // Transition from running -> done
        wasExecutingRef.current = false;
        setInternalStatus('done');
        const timeout = setTimeout(() => {
          setInternalStatus('idle');
          setCurrentStep(0);
          onReset?.();
        }, 1800);
        return () => clearTimeout(timeout);
      }
    }
  }, [isExecuting, onReset]);

  // Handle step progression while running
  useEffect(() => {
    if (internalStatus !== 'running' || steps.length === 0) return;

    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1;
        }
        // If not externally controlled, complete automatically after last step
        if (isExecuting === undefined) {
          setInternalStatus('done');
        }
        return prev;
      });
    }, stepIntervalMs);

    return () => clearInterval(interval);
  }, [internalStatus, steps.length, isExecuting, stepIntervalMs]);

  // Handle done timeout if internally controlled
  useEffect(() => {
    if (internalStatus === 'done' && isExecuting === undefined) {
      const timeout = setTimeout(() => {
        setInternalStatus('idle');
        setCurrentStep(0);
        onReset?.();
      }, 1800);
      return () => clearTimeout(timeout);
    }
  }, [internalStatus, isExecuting, onReset]);

  const handleStart = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || internalStatus === 'running') {
      e.preventDefault();
      return;
    }

    if (onClick) {
      const result = onClick(e);
      if (result instanceof Promise) {
        setInternalStatus('running');
        setCurrentStep(0);
        try {
          await result;
          setInternalStatus('done');
        } catch {
          setInternalStatus('idle');
        }
        return;
      }
    }

    if (isExecuting === undefined) {
      setInternalStatus('running');
      setCurrentStep(0);
    }
  };

  const handleManualReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setInternalStatus('idle');
    setCurrentStep(0);
    onReset?.();
  };

  const status = internalStatus;
  const activeStep = steps[currentStep] || steps[0] || DEFAULT_STEPS[0];
  const StepIcon = activeStep?.icon || Zap;

  // Size variations
  const isCompact = size === 'compact' || size === 'sm';
  const heightClass = isCompact ? 'h-[40px] sm:h-[44px]' : 'h-[50px] sm:h-[56px]';
  const iconSizeClass = isCompact ? 'h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0' : 'h-4 w-4 sm:h-5 sm:w-5 shrink-0';
  const textClass = isCompact ? 'text-[11px] sm:text-xs font-semibold' : 'text-xs sm:text-sm font-bold uppercase tracking-wider';

  // Responsive morphing container widths - fully adaptive, never clipping
  const containerWidths = {
    idle: 'max-w-max w-auto',
    running: 'w-full max-w-[360px] min-w-0',
    done: 'max-w-max w-auto',
  };

  return (
    <div className={`inline-flex items-center justify-center max-w-full min-w-0 ${className}`}>
      <motion.div
        layout
        transition={spring}
        className={`relative flex ${heightClass} items-center justify-between overflow-hidden rounded-full transition-all duration-300 ${containerWidths[status]} ${
          status === 'running'
            ? 'border-2 border-dashed border-stone-400 dark:border-stone-500 bg-stone-100/90 dark:bg-stone-800 shadow-inner px-2'
            : status === 'done'
            ? 'border-2 border-emerald-500/80 bg-emerald-50 dark:bg-emerald-950/60 shadow-xs'
            : disabled
            ? 'border-2 border-transparent bg-stone-200 dark:bg-stone-800 opacity-55 cursor-not-allowed'
            : 'border-2 border-transparent bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white shadow-2xs'
        }`}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {/* IDLE STATE */}
          {status === 'idle' && (
            <motion.button
              key="idle"
              type={type}
              onClick={handleStart}
              disabled={disabled}
              initial={{ opacity: 0, scale: 0.9, filter: 'blur(3px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.9, filter: 'blur(3px)' }}
              transition={spring}
              className={`flex flex-1 items-center justify-center gap-1.5 sm:gap-2 rounded-full px-4 sm:px-5 py-2 sm:py-2.5 whitespace-nowrap select-none cursor-pointer disabled:cursor-not-allowed ${
                disabled
                  ? 'text-stone-500 dark:text-stone-400'
                  : 'text-stone-50 dark:text-stone-900'
              }`}
            >
              <IdleIcon className={iconSizeClass} />
              <AnimatedText text={idleLabel} className={textClass} />
            </motion.button>
          )}

          {/* RUNNING STATE */}
          {status === 'running' && (
            <motion.div
              key="running"
              initial={{ opacity: 0, scale: 0.9, filter: 'blur(3px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.9, filter: 'blur(3px)' }}
              transition={spring}
              className="flex flex-1 items-center justify-between gap-2 px-2 sm:px-3 w-full min-w-0 overflow-hidden select-none"
            >
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 overflow-hidden">
                <AnimatePresence mode="popLayout">
                  <motion.div
                    key={activeStep?.id ?? currentStep}
                    initial={{ opacity: 0, scale: 0.4, rotate: -20, filter: 'blur(3px)' }}
                    animate={{ opacity: 1, scale: 1, rotate: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, scale: 0.4, rotate: 20, filter: 'blur(3px)' }}
                    transition={spring}
                    className="p-1 rounded-full bg-stone-200 dark:bg-stone-700 shrink-0 text-stone-900 dark:text-stone-100"
                  >
                    <StepIcon className={iconSizeClass} />
                  </motion.div>
                </AnimatePresence>

                <div className="min-w-0 flex-1 overflow-hidden">
                  <AnimatedText
                    text={activeStep?.label || 'Processing...'}
                    className={`${textClass} text-stone-800 dark:text-stone-200 truncate`}
                  />
                </div>
              </div>

              {/* Step indicator pills */}
              <div className="hidden xs:flex items-center gap-1 shrink-0 ml-1">
                {steps.map((st, i) => (
                  <span
                    key={st.id || i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === currentStep
                        ? 'w-2.5 sm:w-3 bg-stone-900 dark:bg-stone-100'
                        : i < currentStep
                        ? 'w-1.5 bg-emerald-500'
                        : 'w-1.5 bg-stone-300 dark:bg-stone-700'
                    }`}
                  />
                ))}
              </div>

              {/* Close / Cancel Button */}
              {onReset && (
                <motion.button
                  type="button"
                  onClick={handleManualReset}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={spring}
                  title="Cancel Execution"
                  className="rounded-full bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 p-1 text-stone-600 dark:text-stone-300 transition-colors shrink-0 cursor-pointer"
                >
                  <X className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                </motion.button>
              )}
            </motion.div>
          )}

          {/* DONE STATE */}
          {status === 'done' && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.9, filter: 'blur(3px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.9, filter: 'blur(3px)' }}
              transition={spring}
              className="flex flex-1 items-center justify-center gap-1.5 sm:gap-2 rounded-full px-4 sm:px-5 py-2 sm:py-2.5 whitespace-nowrap select-none text-emerald-800 dark:text-emerald-300"
            >
              <DoneIcon className={`${iconSizeClass} text-emerald-600 dark:text-emerald-400`} />
              <AnimatedText
                text={doneLabel}
                className={`${textClass} font-bold text-emerald-800 dark:text-emerald-300`}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
