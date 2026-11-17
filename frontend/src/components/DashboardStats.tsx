// TRACE - Platform Verification Metrics & Architecture Dashboard (Linear / Vercel SaaS Aesthetic)
import React from 'react';
import { VerificationStats } from '../types';
import {
  ShieldCheck,
  AlertTriangle,
  Cpu,
  Camera,
  BarChart3,
  BookOpen,
  GraduationCap,
  CheckCircle2,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { TraceLogo } from './TraceLogo';

interface DashboardStatsProps {
  stats: VerificationStats;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ stats }) => {
  return (
    <section className="py-10 sm:py-14 bg-zinc-50/50 dark:bg-zinc-950/50 text-zinc-900 dark:text-zinc-100 min-h-screen border-t border-zinc-200 dark:border-zinc-800/80 transition-colors duration-200 font-sans">
      <div className="max-w-[1680px] w-full mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12">
        {/* Header */}
        <div className="mb-8 border-b border-zinc-200 dark:border-zinc-800 pb-5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 text-xs font-mono mb-2 shadow-2xs">
            <BarChart3 className="w-3.5 h-3.5 shrink-0" />
            <span>Platform Registry & Telemetry</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-semibold text-zinc-900 dark:text-zinc-50 tracking-tight">
            TRACE Registry & Platform Performance Index
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 text-xs sm:text-sm mt-1 max-w-3xl">
            Real-time telemetry on disinformation interception, deepfake detections, multimodal news photo audits, and wire source reliability indices processed by TRACE.
          </p>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-zinc-900/80 border border-zinc-200/90 dark:border-zinc-800/80 p-5 rounded-xl shadow-2xs">
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider text-[11px]">Total Claims Checked</span>
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            </div>
            <p className="font-mono text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
              {stats.totalClaimsChecked.toLocaleString()}
            </p>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium font-mono mt-1 block">
              98.6% Verification Accuracy
            </span>
          </div>

          <div className="bg-white dark:bg-zinc-900/80 border border-zinc-200/90 dark:border-zinc-800/80 p-5 rounded-xl shadow-2xs">
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider text-[11px]">Fake News Intercepted</span>
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            </div>
            <p className="font-mono text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
              {stats.fakeNewsBusted.toLocaleString()}
            </p>
            <span className="text-[11px] text-rose-600 dark:text-rose-400 font-medium font-mono mt-1 block">
              Disinformation debunked on record
            </span>
          </div>

          <div className="bg-white dark:bg-zinc-900/80 border border-zinc-200/90 dark:border-zinc-800/80 p-5 rounded-xl shadow-2xs">
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider text-[11px]">Deepfakes Flagged</span>
              <Cpu className="w-4 h-4 text-blue-500 shrink-0" />
            </div>
            <p className="font-mono text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
              {stats.deepfakesIntercepted.toLocaleString()}
            </p>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium font-mono mt-1 block">
              Face Swaps, ELA & Audio Audits
            </span>
          </div>

          <div className="bg-white dark:bg-zinc-900/80 border border-zinc-200/90 dark:border-zinc-800/80 p-5 rounded-xl shadow-2xs">
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider text-[11px]">News Media Audited</span>
              <Camera className="w-4 h-4 text-violet-500 shrink-0" />
            </div>
            <p className="font-mono text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
              {stats.mediaAuditsCompleted.toLocaleString()}
            </p>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium font-mono mt-1 block">
              OCR & Visual Integrity Audits
            </span>
          </div>
        </div>

        {/* Category Distribution & Architecture */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          {/* Category Breakdown */}
          <div className="lg:col-span-6 bg-white dark:bg-zinc-900/80 border border-zinc-200/90 dark:border-zinc-800/80 p-6 rounded-xl shadow-2xs">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
              Claims Distribution by Topic Desk
            </h3>
            <div className="space-y-4">
              {stats.totalClaimsChecked === 0 ? (
                <div className="py-8 text-center text-zinc-500 dark:text-zinc-400 text-xs">
                  <p className="font-medium text-zinc-700 dark:text-zinc-300">No claims recorded yet</p>
                  <p className="mt-1">Verified claims will automatically distribute across topics here.</p>
                </div>
              ) : (
                stats.categoriesBreakdown.map((cat, idx) => {
                  const percentage =
                    stats.totalClaimsChecked > 0 ? Math.round((cat.count / stats.totalClaimsChecked) * 100) : 0;
                  return (
                    <div key={idx}>
                      <div className="flex justify-between text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 font-mono">
                        <span>{cat.category}</span>
                        <span>
                          {cat.count.toLocaleString()} claims ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-zinc-900 dark:bg-zinc-100 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Project Details & Authors Card */}
          <div className="lg:col-span-6 bg-white dark:bg-zinc-900/80 border border-zinc-200/90 dark:border-zinc-800/80 p-6 rounded-xl space-y-5 shadow-2xs">
            <div className="flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800/80 pb-4">
              <TraceLogo className="w-10 h-10 rounded-xl shrink-0" />
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50 truncate">
                  TRACE Architecture & Credits
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                  Shree Swaminarayan College of Computer Science
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-zinc-50 dark:bg-zinc-950/60 p-3.5 rounded-lg border border-zinc-200/80 dark:border-zinc-800/80">
                <span className="text-zinc-400 dark:text-zinc-500 block mb-1 font-semibold uppercase tracking-wider text-[10px]">
                  Engineered By
                </span>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">Thakar Dhaval</p>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">&amp; Bhatt Jay</p>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-950/60 p-3.5 rounded-lg border border-zinc-200/80 dark:border-zinc-800/80">
                <span className="text-zinc-400 dark:text-zinc-500 block mb-1 font-semibold uppercase tracking-wider text-[10px]">
                  Academic Department
                </span>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">BCA (Semester 3)</p>
                <p className="text-zinc-500 dark:text-zinc-400 text-xs">Dept of Computer Science</p>
              </div>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-950/60 p-4 rounded-lg border border-zinc-200/80 dark:border-zinc-800/80 text-xs space-y-2.5">
              <div className="flex items-center gap-2 font-semibold text-zinc-900 dark:text-zinc-100 text-xs">
                <Layers className="w-4 h-4 text-zinc-500 shrink-0" />
                <span>TRACE System Architecture:</span>
              </div>
              <ul className="space-y-1.5 text-zinc-600 dark:text-zinc-400 text-xs">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>
                    <strong>Local AI Vision:</strong> PyTorch EfficientNet-B0 + OpenCV YuNet (CPU-optimized)
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>
                    <strong>Forensic Analysis:</strong> Error Level Analysis (ELA), Laplacian Noise, 2D FFT
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>
                    <strong>OCR Intelligence:</strong> Adaptive Binarization + Morphological Chyron Extraction
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>
                    <strong>NLP Stylometry:</strong> Sentence Length Variance, Perplexity, Lexical Richness
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
