// TRACE / TruthLens AI - Privacy Policy
import React from 'react';
import { ShieldCheck, Lock, Eye, Download, Trash2, ArrowLeft, Database, Globe } from 'lucide-react';
import { TraceLogo } from './TraceLogo';

interface PrivacyPolicyProps {
  onBack?: () => void;
}

export const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onBack }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 font-sans text-zinc-900 dark:text-zinc-100">
      {/* Top Header */}
      <div className="mb-8 pb-6 border-b border-zinc-200 dark:border-zinc-800">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </button>
        )}
        <div className="flex items-center gap-3 mb-3">
          <TraceLogo className="w-9 h-9 rounded-xl shadow-xs" />
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold block">
              Privacy &amp; Data Protection • Version 2.4
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-950 dark:text-zinc-50 font-sans">
              Privacy Policy
            </h1>
          </div>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
          Last Updated: November 13, 2026 • Compliance Framework: Digital Personal Data Protection Act (DPDPA), India &amp; Global Standards
        </p>
      </div>

      {/* Privacy Highlights Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1">
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
            <Lock className="w-4 h-4 shrink-0" />
            <span>Isolated Personal History</span>
          </div>
          <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Your verification scans are saved to your private account (<code className="font-mono text-[10px]">users/&#123;uid&#125;/history</code>) and never exposed publicly.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1">
          <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-bold text-xs">
            <Eye className="w-4 h-4 shrink-0" />
            <span>Zero Media Retention</span>
          </div>
          <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Uploaded images and video frames are processed in volatile memory and purged immediately after forensic scoring.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1">
          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold text-xs">
            <Download className="w-4 h-4 shrink-0" />
            <span>Full Data Portability</span>
          </div>
          <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Export your complete personal history as JSON or permanently purge your account at any time in one click.
          </p>
        </div>
      </div>

      {/* Body Sections */}
      <div className="space-y-8 text-xs sm:text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
        
        {/* Section 1 */}
        <section className="space-y-2.5">
          <h2 className="text-base sm:text-lg font-bold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-mono text-xs">1</span>
            Information We Collect
          </h2>
          <p>
            TRACE collects only the minimum necessary information to provide secure verification tools and preserve your personal analysis record:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400">
            <li>
              <strong>Account Information:</strong> When you register via Google OAuth, Email/Password, or Phone Number OTP, Firebase processes your email address, phone number (E.164 format), display name, and unique authentication identifier (UID).
            </li>
            <li>
              <strong>Personal Analysis History:</strong> When you run fact-checks, deepfake scans, or OCR media audits while logged in, the analysis metadata (verdict, claim text, summary, key evidence, and timestamps) is saved under your private account record.
            </li>
            <li>
              <strong>Technical &amp; Rate-Limiting Telemetry:</strong> Anonymized client IP addresses and user-agent strings are processed in memory solely to enforce rate limits and defend against automated denial-of-service attacks.
            </li>
          </ul>
        </section>

        {/* Section 2 */}
        <section className="space-y-2.5">
          <h2 className="text-base sm:text-lg font-bold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-mono text-xs">2</span>
            Uploaded Media Handling &amp; Retention Policy
          </h2>
          <p>
            When you upload photos, screenshots, or video clips to the Deepfake Computer Vision Lab or Photo &amp; OCR Verification Desk:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400">
            <li>
              <strong>In-Memory Processing:</strong> Raw base64 image and video frames are held transiently in server memory during algorithmic computation.
            </li>
            <li>
              <strong>Zero Long-Term Storage:</strong> We do not store original raw photo or video base64 payloads in persistent database records. Once analysis is complete, original media bytes are discarded.
            </li>
            <li>
              <strong>Private History Metadata:</strong> Your personal history saves only the forensic outcome, detected features, and verdict summary—never your original multi-megabyte media files.
            </li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="space-y-2.5">
          <h2 className="text-base sm:text-lg font-bold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-mono text-xs">3</span>
            How We Process Data &amp; Third-Party Integrations
          </h2>
          <p>
            In order to conduct real-time verification and authentication, TRACE transmits data to the following vetted infrastructure partners:
          </p>
          <div className="space-y-2">
            <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <span className="font-bold text-zinc-900 dark:text-zinc-100 block mb-0.5">Google Firebase (Google LLC)</span>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Powers user authentication (OAuth, Email, and SMS Phone OTP via Firebase Phone Auth) and cloud database synchronization.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <span className="font-bold text-zinc-900 dark:text-zinc-100 block mb-0.5">Google Gemini Multimodal API (Google LLC)</span>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                When you initiate news claim verification or deepfake visual audits, text queries and sampled keyframes are securely transmitted to Google Gemini models under enterprise API terms (which stipulate that submitted data is not used for model training).
              </p>
            </div>
            <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <span className="font-bold text-zinc-900 dark:text-zinc-100 block mb-0.5">GNews API</span>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Retrieves live public wire headlines by category or keyword search. No user personal data is shared with GNews.
              </p>
            </div>
          </div>
        </section>

        {/* Section 4 */}
        <section className="space-y-2.5">
          <h2 className="text-base sm:text-lg font-bold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-mono text-xs">4</span>
            Data Privacy Rights (Digital Personal Data Protection Act, 2023)
          </h2>
          <p>
            In compliance with the Indian Digital Personal Data Protection Act (DPDPA), 2023, and international privacy standards, you are entitled to:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400">
            <li>
              <strong>Right to Access &amp; Summary:</strong> Inspect all personal analysis history records stored under your account.
            </li>
            <li>
              <strong>Right to Data Portability (Export):</strong> Download a complete JSON export of your personal history directly from Account Settings.
            </li>
            <li>
              <strong>Right to Erasure (Delete Data &amp; Account):</strong> Delete individual history entries, clear your entire history, or permanently delete your account and all associated records.
            </li>
            <li>
              <strong>Right to Grievance Redressal:</strong> Submit inquiries or complaints to our designated Grievance Officer.
            </li>
          </ul>
        </section>

        {/* Section 5 */}
        <section className="space-y-2.5">
          <h2 className="text-base sm:text-lg font-bold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-mono text-xs">5</span>
            Security Architecture &amp; Data Isolation
          </h2>
          <p>
            We enforce defense-in-depth security principles across all layers:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400">
            <li><strong>Strict Database Rules:</strong> User A can never access or modify User B&apos;s history. User ownership is verified via server-side Firebase ID tokens.</li>
            <li><strong>No Local Privilege Escalation:</strong> Administrative permissions are derived strictly from server-side claims, never from client-side state or localStorage.</li>
            <li><strong>Encrypted Transport:</strong> All API communication is secured via TLS 1.3 / SSL 256-bit encryption.</li>
          </ul>
        </section>

        {/* Section 6 */}
        <section className="space-y-2.5">
          <h2 className="text-base sm:text-lg font-bold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-mono text-xs">6</span>
            Cookies &amp; Local Storage
          </h2>
          <p>
            TRACE does not use third-party tracking or advertising cookies. Browser local storage is utilized strictly for essential operational preferences:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
            <li><code className="font-mono">trace_theme_preference</code>: Preserves your Dark/Light theme selection.</li>
            <li>Firebase Session State: Retains your authenticated login state when &quot;Remember Me&quot; is selected.</li>
          </ul>
        </section>

        {/* Section 7 */}
        <section className="space-y-2.5">
          <h2 className="text-base sm:text-lg font-bold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-mono text-xs">7</span>
            Data Protection Officer &amp; Contact
          </h2>
          <div className="p-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-mono space-y-1">
            <p><strong>Data Protection Officer:</strong> TRACE Privacy &amp; Data Security Desk</p>
            <p><strong>Department:</strong> BCA Dept. of Computer Science • SSCCS</p>
            <p><strong>Inquiries &amp; Deletion Requests:</strong> privacy@trace.ai</p>
            <p><strong>Mailing Address:</strong> [Configurable Institution Address Placeholder, Gujarat, India]</p>
          </div>
        </section>
      </div>
    </div>
  );
};
