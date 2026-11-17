// TRACE - Verification Loading Animation & Radar Scanning Overlay
// Provides engaging, real-time forensic scanning feedback when a claim is verified
import React, { useState, useEffect } from 'react';
import {
  Globe,
  Radio,
  Search,
  Sparkles,
  ShieldCheck,
  Cpu,
  Layers,
  Database,
  CheckCircle2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TraceLogo } from './TraceLogo';

interface VerificationLoadingOverlayProps {
  isVerifying: boolean;
  claimQuery?: string;
}

const PHASES = [
  {
    title: 'Connecting to Global Wire Registries',
    desc: 'Polling Reuters, AP, BBC, Press Trust of India & GNews v4 syndication...',
    icon: Globe,
    progressRange: [0, 25],
  },
  {
    title: 'Cross-Referencing Semantic Entities',
    desc: 'Auditing quotes, dates, numerical claims & institutional records...',
    icon: Search,
    progressRange: [25, 55],
  },
  {
    title: 'Linguistic Bias & Manipulation Audit',
    desc: 'Checking for sensationalism, synthetic diffusion artifacts & framing distortion...',
    icon: Cpu,
    progressRange: [55, 80],
  },
  {
    title: 'Calibrating TRACE Truth Meter',
    desc: 'Synthesizing evidence-backed confidence score & Bento Verification Dossier...',
    icon: Sparkles,
    progressRange: [80, 100],
  },
];

export const VerificationLoadingOverlay: React.FC<VerificationLoadingOverlayProps> = ({
  isVerifying,
  claimQuery,
}) => {
  const [progress, setProgress] = useState(12);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);

  useEffect(() => {
    if (!isVerifying) {
      setProgress(12);
      setCurrentPhaseIndex(0);
      return;
    }

    // Realistic progress animation timer that accelerates through the stages
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 94) return 94; // Hold near finish until API responds
        const increment = Math.max(1, Math.floor(Math.random() * 6) + 3);
        const next = Math.min(94, prev + increment);

        if (next < 28) setCurrentPhaseIndex(0);
        else if (next < 58) setCurrentPhaseIndex(1);
        else if (next < 82) setCurrentPhaseIndex(2);
        else setCurrentPhaseIndex(3);

        return next;
      });
    }, 280);

    return () => clearInterval(interval);
  }, [isVerifying]);

  if (!isVerifying) return null;

  const currentPhase = PHASES[currentPhaseIndex];
  const CurrentIcon = currentPhase.icon;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md font-sans selection:bg-purple-600 selection:text-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -12 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative max-w-lg w-full bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden text-center space-y-6"
        >
          {/* Background Ambient Glow */}
          <div className="absolute -top-24 -left-24 w-60 h-60 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />

          {/* Top Brand Identity */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-900 relative z-10">
            <div className="flex items-center gap-2">
              <TraceLogo className="w-6 h-6 rounded-md shadow-xs" />
              <span className="font-bold text-xs tracking-wider uppercase text-zinc-300 font-mono">
                TRACE Sentinel AI Pipeline
              </span>
            </div>
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-mono font-bold text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Audit Active
            </span>
          </div>

          {/* Central Sonar / Radar Scanner Visual */}
          <div className="relative w-28 h-28 mx-auto flex items-center justify-center my-2">
            {/* Pulsing Sonar Waves */}
            <span className="absolute inset-0 rounded-full border border-purple-500/30 animate-ping opacity-60" />
            <span className="absolute -inset-3 rounded-full border border-emerald-500/20 animate-pulse" />
            <span className="absolute -inset-6 rounded-full border border-white/5" />

            {/* Central Holographic Icon */}
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-purple-900/60 to-zinc-900 border border-purple-500/40 flex items-center justify-center shadow-lg shadow-purple-900/40">
              <CurrentIcon className="w-8 h-8 text-purple-300 animate-pulse" />
            </div>
          </div>

          {/* Claim Highlight Banner */}
          {claimQuery && (
            <div className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 text-left space-y-1">
              <span className="text-[10px] font-mono font-semibold uppercase text-zinc-500 tracking-wider">
                Investigating Claim
              </span>
              <p className="text-xs sm:text-sm font-serif font-bold text-zinc-200 line-clamp-2 italic">
                "{claimQuery}"
              </p>
            </div>
          )}

          {/* Progress Bar & Percentage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-400 font-medium">{currentPhase.title}</span>
              <span className="font-bold text-purple-400">{progress}%</span>
            </div>

            <div className="w-full h-2 rounded-full bg-zinc-900 border border-zinc-800 overflow-hidden relative">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-600 via-indigo-500 to-emerald-400 rounded-full"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              />
            </div>

            <p className="text-[11px] text-zinc-500 font-sans leading-relaxed min-h-[32px]">
              {currentPhase.desc}
            </p>
          </div>

          {/* Pipeline Checklist */}
          <div className="grid grid-cols-2 gap-2 text-left pt-2 border-t border-zinc-900">
            {PHASES.map((p, idx) => {
              const isDone = progress >= p.progressRange[1];
              const isCurrent = currentPhaseIndex === idx;

              return (
                <div
                  key={idx}
                  className={`p-2 rounded-xl border text-[11px] font-mono flex items-center gap-2 transition-colors ${
                    isDone
                      ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-400'
                      : isCurrent
                      ? 'border-purple-500/40 bg-purple-950/30 text-purple-200'
                      : 'border-zinc-850 bg-zinc-900/40 text-zinc-500'
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        isCurrent ? 'bg-purple-400 animate-ping' : 'bg-zinc-600'
                      }`}
                    />
                  )}
                  <span className="truncate">{p.title.split(' ')[0]} {p.title.split(' ')[1]}</span>
                </div>
              );
            })}
          </div>

          {/* Footer Transparency Badge */}
          <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono text-zinc-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Multi-Source Corroboration • Zero Hallucination Mode</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
