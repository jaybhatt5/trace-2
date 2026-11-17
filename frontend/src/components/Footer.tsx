// TRACE - Enterprise SaaS Platform Footer (Linear / Vercel Aesthetic)
import React from 'react';
import { TraceLogo } from './TraceLogo';
import { ShieldCheck, Cpu, Lock, Globe, ArrowUpRight, Heart, FileText, Shield, Clock } from 'lucide-react';

interface FooterProps {
  onNavigate?: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const handleLinkClick = (e: React.MouseEvent, tab: string) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate(tab);
    } else {
      window.location.hash = `#${tab}`;
    }
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs py-12 px-4 sm:px-6 lg:px-8 pb-28 md:pb-12 transition-colors duration-200 font-sans">
      <div className="max-w-[1680px] w-full mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-10">
          {/* Brand & Mission */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <TraceLogo className="w-8 h-8 rounded-lg shrink-0" />
              <div className="flex items-center gap-2">
                <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-base tracking-tight">
                  TRACE
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/80">
                  v2.4 Enterprise
                </span>
              </div>
            </div>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs leading-relaxed max-w-sm">
              AI-Powered News Verification &amp; Multimodal Deepfake Detection Engine. Protecting information integrity through local computer vision and accredited wire corroboration.
            </p>
            <div className="flex items-center gap-4 text-[11px] text-zinc-500 font-mono pt-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Local AI Engine Active
              </span>
              <span>•</span>
              <span>DPDP Act 2023 Compliant</span>
            </div>
          </div>

          {/* Verification Desks */}
          <div className="space-y-2.5">
            <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider font-mono">
              Verification Desks
            </p>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href="#top-news"
                  onClick={(e) => handleLinkClick(e, 'top-news')}
                  className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                >
                  Top Verified Stories
                </a>
              </li>
              <li>
                <a
                  href="#live-news"
                  onClick={(e) => handleLinkClick(e, 'live-news')}
                  className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                >
                  Live Wire Dispatch
                </a>
              </li>
              <li>
                <a
                  href="#busted"
                  onClick={(e) => handleLinkClick(e, 'busted')}
                  className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                >
                  Debunked Exposé Registry
                </a>
              </li>
              <li>
                <a
                  href="#recent"
                  onClick={(e) => handleLinkClick(e, 'recent')}
                  className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                >
                  Chronological Record
                </a>
              </li>
              <li>
                <a
                  href="#stats"
                  onClick={(e) => handleLinkClick(e, 'stats')}
                  className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                >
                  Platform Telemetry &amp; Index
                </a>
              </li>
            </ul>
          </div>

          {/* Forensic AI Tools & Personal History */}
          <div className="space-y-2.5">
            <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider font-mono">
              Tools &amp; Personal Space
            </p>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href="#deepfake"
                  onClick={(e) => handleLinkClick(e, 'deepfake')}
                  className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>Deepfake Computer Vision</span>
                </a>
              </li>
              <li>
                <a
                  href="#news-media"
                  onClick={(e) => handleLinkClick(e, 'news-media')}
                  className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                >
                  Broadcast OCR &amp; Photos
                </a>
              </li>
              <li>
                <a
                  href="#ai-analyzer"
                  onClick={(e) => handleLinkClick(e, 'ai-analyzer')}
                  className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                >
                  Stylometric NLP Audit
                </a>
              </li>
              <li>
                <a
                  href="#history"
                  onClick={(e) => handleLinkClick(e, 'history')}
                  className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors font-medium flex items-center gap-1.5 cursor-pointer text-zinc-800 dark:text-zinc-200"
                >
                  <Clock className="w-3.5 h-3.5 text-zinc-400" />
                  <span>My Personal History</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Legal, Privacy & Compliance */}
          <div className="space-y-2.5">
            <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider font-mono">
              Legal &amp; Privacy
            </p>
            <ul className="space-y-2 text-xs text-zinc-500 dark:text-zinc-400">
              <li>
                <a
                  href="#terms"
                  onClick={(e) => handleLinkClick(e, 'terms')}
                  className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors flex items-center gap-1.5 cursor-pointer text-zinc-700 dark:text-zinc-300"
                >
                  <FileText className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span>Terms &amp; Conditions</span>
                </a>
              </li>
              <li>
                <a
                  href="#privacy"
                  onClick={(e) => handleLinkClick(e, 'privacy')}
                  className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors flex items-center gap-1.5 cursor-pointer text-zinc-700 dark:text-zinc-300"
                >
                  <Shield className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span>Privacy Policy (DPDP Act)</span>
                </a>
              </li>
              <li className="flex items-start gap-1.5 pt-1 text-[11px]">
                <Lock className="w-3.5 h-3.5 text-zinc-400 mt-0.5 shrink-0" />
                <span>Uploaded media processed in memory and purged immediately. Zero retention by default.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar & Academic Credits */}
        <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-zinc-500 dark:text-zinc-400">
          <div className="flex flex-wrap items-center gap-2">
            <span>&copy; {new Date().getFullYear()} TRACE Platform.</span>
            <span>•</span>
            <span>
              Engineered by <strong className="text-zinc-800 dark:text-zinc-200 font-medium">Thakar Dhaval</strong> &amp; <strong className="text-zinc-800 dark:text-zinc-200 font-medium">Bhatt Jay</strong>
            </span>
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span>BCA Sem 3 • SSCCS</span>
            <span>•</span>
            <span>Google Gemini Multimodal Assisted</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
