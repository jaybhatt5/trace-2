import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';

export interface AnalysisStep {
  id: string;
  label: string;
  description?: string;
}

interface AnalysisLoaderProps {
  steps: AnalysisStep[];
  activeStepIndex?: number;
  currentMessage?: string;
  elapsedSeconds?: number;
  className?: string;
  onCancel?: () => void;
}

export const AnalysisLoader: React.FC<AnalysisLoaderProps> = ({
  steps,
  activeStepIndex = 0,
  currentMessage = 'Processing media verification pipeline...',
  className = '',
  onCancel,
}) => {
  const [timer, setTimer] = useState<number>(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const progressPercent = Math.min(
    95,
    Math.round(((activeStepIndex + 0.5) / Math.max(steps.length, 1)) * 100)
  );

  return (
    <div
      className={`rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 p-5 sm:p-6 shadow-xs space-y-5 ${className}`}
      role="status"
    >
      {/* Header with Title and Elapsed Time */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
            Forensic Inference Pipeline
          </h4>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
            Elapsed: {timer}s
          </span>
          {onCancel && (
            <button
              onClick={onCancel}
              className="text-[11px] text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 underline"
            >
              Abort
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 font-mono truncate">
          {currentMessage}
        </p>
      </div>

      {/* Stepper Milestones */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 pt-1">
        {steps.map((step, idx) => {
          const isDone = idx < activeStepIndex;
          const isCurrent = idx === activeStepIndex;
          return (
            <div
              key={step.id}
              className={`p-2.5 rounded-lg border text-left transition-colors flex items-center gap-2 ${
                isDone
                  ? 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400'
                  : isCurrent
                  ? 'border-blue-300 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300'
                  : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-950/30 text-zinc-400 dark:text-zinc-600'
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              ) : isCurrent ? (
                <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin text-blue-600 dark:text-blue-400" />
              ) : (
                <span className="w-3.5 h-3.5 rounded-full border border-zinc-300 dark:border-zinc-700 inline-block shrink-0" />
              )}
              <span className="text-[11px] font-medium truncate">{step.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
