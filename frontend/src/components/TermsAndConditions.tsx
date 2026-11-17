// TRACE / TruthLens AI - Terms & Conditions
import React from 'react';
import { ShieldCheck, AlertCircle, Scale, FileText, ArrowLeft, Lock, ExternalLink } from 'lucide-react';
import { TraceLogo } from './TraceLogo';

interface TermsAndConditionsProps {
  onBack?: () => void;
}

export const TermsAndConditions: React.FC<TermsAndConditionsProps> = ({ onBack }) => {
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
              Legal Document • Version 2.4
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-950 dark:text-zinc-50 font-sans">
              Terms &amp; Conditions
            </h1>
          </div>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
          Last Updated: November 13, 2026 • Governing Law: Jurisdiction of India (Information Technology Act, 2000)
        </p>
      </div>

      {/* Critical Legal Disclaimer Alert */}
      <div className="mb-8 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 text-xs sm:text-sm space-y-2">
        <div className="flex items-center gap-2 font-bold text-amber-950 dark:text-amber-100">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>IMPORTANT NOTICE: INFORMATIONAL PURPOSE OF AI VERIFICATION RESULTS</span>
        </div>
        <p className="leading-relaxed text-xs">
          TRACE (Truth Review &amp; Authenticity Checking Engine) employs artificial intelligence models, computer vision heuristics, error level analysis (ELA), and automated news wire corroboration. <strong>All analysis verdicts, Credibility Compass assessments, and deepfake detection reports are provided strictly for research, educational, and informational purposes.</strong> AI detection can never offer 100% certainty. Results do not constitute definitive legal proof, judicial evidence, or authoritative journalistic certification. Users must exercise independent judgment before sharing or acting upon any claim.
        </p>
      </div>

      {/* Body Sections */}
      <div className="space-y-8 text-xs sm:text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
        
        {/* Section 1 */}
        <section className="space-y-2.5">
          <h2 className="text-base sm:text-lg font-bold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-mono text-xs">1</span>
            Acceptance of Terms
          </h2>
          <p>
            By accessing, creating an account, or submitting any media, claims, or queries to TRACE (&quot;the Platform&quot;, &quot;we&quot;, &quot;our&quot;), you agree to be bound by these Terms &amp; Conditions and our Privacy Policy. If you do not agree to these terms, you must discontinue using the Platform immediately.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-2.5">
          <h2 className="text-base sm:text-lg font-bold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-mono text-xs">2</span>
            Account Registration &amp; Security
          </h2>
          <p>
            You may register via Google OAuth, Email/Password, or Phone Number OTP. You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized access.
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
            <li>You must provide accurate and verifiable account information.</li>
            <li>You may not impersonate any person, journalist, or entity.</li>
            <li>Users under the age of 18 must have parental or guardian consent.</li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="space-y-2.5">
          <h2 className="text-base sm:text-lg font-bold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-mono text-xs">3</span>
            Acceptable &amp; Prohibited Usage
          </h2>
          <p>
            The Platform is dedicated to combating disinformation and forensic media evaluation. You agree not to:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400">
            <li>Submit illegal, defamatory, non-consensual sexual, abusive, or infringing material.</li>
            <li>Reverse-engineer, bypass rate limits, probe, or conduct automated mass scraping against our APIs without prior authorization.</li>
            <li>Use the detection engine to optimize malicious deepfake generation algorithms to evade detection.</li>
            <li>Misrepresent TRACE analysis scores as absolute proof of innocence or guilt in legal, employment, or academic disciplinary proceedings.</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="space-y-2.5">
          <h2 className="text-base sm:text-lg font-bold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-mono text-xs">4</span>
            AI Verification &amp; Deepfake Detection Limitations
          </h2>
          <p>
            Our multimodal verification pipeline utilizes machine learning algorithms, Google Gemini Multimodal APIs, and local computer vision heuristics (YuNet, Fourier Spectral Analysis, ELA). You acknowledge and agree that:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400">
            <li>
              <strong>Compression &amp; Social Media Artifacts:</strong> Images or videos repeatedly compressed by platforms (WhatsApp, X, Telegram) may exhibit high-frequency noise destruction, causing false positives or inconclusive readings.
            </li>
            <li>
              <strong>Rapidly Evolving Generative Models:</strong> Generative models evolve rapidly; a lack of detected artifacts does not guarantee an asset is authentic.
            </li>
            <li>
              <strong>News Fact-Checking Bounds:</strong> Real-time fact-checks rely on available indexed sources. Inconclusive or unverified results occur when empirical proof is pending.
            </li>
          </ul>
        </section>

        {/* Section 5 */}
        <section className="space-y-2.5">
          <h2 className="text-base sm:text-lg font-bold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-mono text-xs">5</span>
            User-Submitted Content &amp; Intellectual Property
          </h2>
          <p>
            You retain copyright and ownership of the content and media you submit for inspection. By submitting content, you grant TRACE a temporary, non-exclusive license solely to process, analyze, and generate the requested forensic report in volatile memory. <strong>TRACE does not sell, license, or use your uploaded images or videos to train commercial foundation models.</strong>
          </p>
        </section>

        {/* Section 6 */}
        <section className="space-y-2.5">
          <h2 className="text-base sm:text-lg font-bold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-mono text-xs">6</span>
            Third-Party Services &amp; APIs
          </h2>
          <p>
            To deliver real-time news retrieval and multimodal inference, the Platform interfaces with third-party service providers, including Firebase (Google LLC), Google Gemini APIs, and GNews. Your use of these integrated features is subject to the respective terms and privacy policies of those providers.
          </p>
        </section>

        {/* Section 7 */}
        <section className="space-y-2.5">
          <h2 className="text-base sm:text-lg font-bold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-mono text-xs">7</span>
            Suspension &amp; Termination
          </h2>
          <p>
            We reserve the right to suspend or terminate accounts that violate these Terms, engage in automated API abuse, or attempt unauthorized access to other users&apos; private data. You may delete your account and personal history at any time through Account Settings.
          </p>
        </section>

        {/* Section 8 */}
        <section className="space-y-2.5">
          <h2 className="text-base sm:text-lg font-bold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-mono text-xs">8</span>
            Limitation of Liability
          </h2>
          <p>
            To the maximum extent permitted under applicable law, TRACE, its developers, academic affiliates, and contributors shall not be liable for any indirect, incidental, punitive, or consequential damages resulting from the use of, or inability to use, our verification assessments or forensic indicators.
          </p>
        </section>

        {/* Section 9 */}
        <section className="space-y-2.5">
          <h2 className="text-base sm:text-lg font-bold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-mono text-xs">9</span>
            Contact &amp; Grievance Redressal
          </h2>
          <p>
            In accordance with the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021, and DPDP framework:
          </p>
          <div className="p-3 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-mono space-y-1">
            <p><strong>Grievance Officer:</strong> TRACE Compliance Bureau [Configurable Entity]</p>
            <p><strong>Affiliation:</strong> BCA Dept. of Computer Science • SSCCS</p>
            <p><strong>Email:</strong> legal@trace.ai • privacy@trace.ai</p>
            <p><strong>Location:</strong> Gujarat, India</p>
          </div>
        </section>
      </div>
    </div>
  );
};
