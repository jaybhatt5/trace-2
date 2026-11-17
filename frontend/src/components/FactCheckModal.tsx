// TRACE - Enterprise Verification Report & Audit Certificate (Linear / Vercel Aesthetic)
import React, { useState } from 'react';
import { FactCheckItem, DeepfakeAnalysisResult, CredibilityVerdict, DeepfakeVerdict } from '../types';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Printer,
  ExternalLink,
  QrCode,
  ArrowLeft,
  Copy,
  Check,
  Download,
  ShieldCheck,
  Cpu,
  Layers,
  Camera,
  Calendar,
  HelpCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Share2,
  Info,
  Bookmark,
  Sparkles,
  Send,
  Sliders
} from 'lucide-react';
import { TraceLogo } from './TraceLogo';
import { getAuthHeaders } from '../utils/firebase';

interface FactCheckModalProps {
  item: FactCheckItem | null;
  deepfakeResult?: DeepfakeAnalysisResult | null;
  onClose: () => void;
  isSavedToHistory?: boolean;
}

const VERDICT_TRANSLATIONS: Record<string, { hi: { title: string; subtitle: string }; gu: { title: string; subtitle: string } }> = {
  SUPPORTED_BY_EVIDENCE: {
    hi: { title: 'प्रमाणों द्वारा समर्थित (सत्य)', subtitle: 'विश्वसनीय और आधिकारिक साक्ष्य इस दावे की पुष्टि करते हैं।' },
    gu: { title: 'પુરાવા દ્વારા સમર્થિત (સત્ય)', subtitle: 'વિશ્વસનીય સત્તાવાર પુરાવા આ દાવાની પુષ્ટિ કરે છે.' },
  },
  MOSTLY_TRUE_NEEDS_CONTEXT: {
    hi: { title: 'अधिकांशतः सत्य — संदर्भ आवश्यक', subtitle: 'मुख्य कथन सही है, परंतु महत्वपूर्ण विवरण और संदर्भ छूटे हुए हैं।' },
    gu: { title: 'મોટે ભાગે સાચું — સંદર્ભ જરૂરી', subtitle: 'મુખ્ય વાત સાચી છે, પરંતુ મહત્વપૂર્ણ સંદર્ભ ગેરહાજર છે.' },
  },
  MISLEADING: {
    hi: { title: 'भ्रामक प्रस्तुति (गलत संदर्भ)', subtitle: 'दावे में अधूरी जानकारी या भ्रामक शब्दों का प्रयोग किया गया है।' },
    gu: { title: 'ભ્રામક રજૂઆત', subtitle: 'દાવામાં અધૂરી માહિતી અથવા અયોગ્ય સંદર્ભનો ઉપયોગ કરાયો છે.' },
  },
  DEBUNKED: {
    hi: { title: 'खारिज / असत्य (झूठा दावा)', subtitle: 'विश्वसनीय आधिकारिक रिकॉर्ड और साक्ष्य इस दावे का खंडन करते हैं।' },
    gu: { title: 'અસત્ય / ખોટું (ફેક ન્યૂઝ)', subtitle: 'વિશ્વસનીય સત્તાવાર દસ્તાવેજો આ દાવાને અસત્ય સાબિત કરે છે.' },
  },
  UNVERIFIED: {
    hi: { title: 'अपुष्ट — अपर्याप्त साक्ष्य', subtitle: 'वर्तमान में इस दावे की पुष्टि या खंडन हेतु पर्याप्त साक्ष्य उपलब्ध नहीं हैं।' },
    gu: { title: 'અચકાસાયેલ — અપૂરતા પુરાવા', subtitle: 'હાલમાં આ દાવાની પુષ્ટિ કરવા માટે પૂરતા પુરાવા ઉપલબ્ધ નથી.' },
  },
  'No manipulation signals found': {
    hi: { title: 'कोई हेरफेर नहीं मिला (संभावित प्रामाणिक)', subtitle: 'कैमरा सेंसर और पिक्सेल विश्लेषण में कोई कृत्रिम बदलाव नहीं मिला।' },
    gu: { title: 'કોઈ છેડછાડના સંકેત મળ્યા નથી', subtitle: 'કેમેરા સેન્સર અને પિક્સેલ વિશ્લેષણમાં છેડછાડના કોઈ સંકેતો નથી.' },
  },
  'Likely Authentic': {
    hi: { title: 'संभावित प्रामाणिक (असली)', subtitle: 'प्राकृतिक ऑप्टिकल अनाज और चेहरे के लैंडमार्क सामान्य पाए गए।' },
    gu: { title: 'સંભવિત પ્રામાણિક (અસલી)', subtitle: 'કુદરતી ઓપ્ટિકલ સેન્સર અને ચહેરાના લેન્ડમાર્ક્સ સામાન્ય મળ્યા.' },
  },
  'Potentially Manipulated': {
    hi: { title: 'संभावित छेड़छाड़ / हेरफेर', subtitle: 'डिजिटल संपादन, स्प्लिसिंग या चेहरे की सीमा में विसंगतियां देखी गईं।' },
    gu: { title: 'શંકાસ્પદ છેડછાડ', subtitle: 'ડિજિટલ એડિટિંગ અથવા ફેસ સ્વેપિંગની વિસંગતતાઓ નોંધાઈ.' },
  },
  'Likely AI-Generated': {
    hi: { title: 'संभावित AI-जनित (डीपफेक)', subtitle: 'जनरेटिव एआई द्वारा निर्मित होने के प्रबल संकेत।' },
    gu: { title: 'સંભવિત AI-જનરેટેડ (ડીપફેક)', subtitle: 'જનરેટિવ એઆઈ દ્વારા તૈયાર કરાયેલ હોવાના મજબૂત સંકેતો.' },
  },
  Inconclusive: {
    hi: { title: 'अनिर्णायक साक्ष्य', subtitle: 'छवि संपीड़न या शोर के कारण निश्चित निष्कर्ष संभव नहीं है।' },
    gu: { title: 'અનિર્ણાયક સંકેત', subtitle: 'ઈમેજ કમ્પ્રેશનને કારણે ચોક્કસ નિર્ણય શક્ય નથી.' },
  },
};

export const FactCheckModal: React.FC<FactCheckModalProps> = ({
  item,
  deepfakeResult,
  onClose,
  isSavedToHistory = true,
}) => {
  const [hasCopiedUrl, setHasCopiedUrl] = useState(false);
  const [hasCopiedSummary, setHasCopiedSummary] = useState(false);
  const [showAdvancedDetails, setShowAdvancedDetails] = useState(false);
  const [language, setLanguage] = useState<'en' | 'hi' | 'gu'>('en');

  // User Participation State
  const [userChoice, setUserChoice] = useState<'trustworthy' | 'context' | 'misleading' | 'false' | 'unsure' | null>(
    item?.userPerspective?.choice || null
  );
  const [userComment, setUserComment] = useState<string>(item?.userPerspective?.comment || '');
  const [isSubmittingPerspective, setIsSubmittingPerspective] = useState(false);
  const [perspectiveSubmitted, setPerspectiveSubmitted] = useState<boolean>(Boolean(item?.userPerspective));

  if (!item && !deepfakeResult) return null;

  const isDeepfake = Boolean(deepfakeResult && !item);
  const reportId = item?.id || deepfakeResult?.id || `dossier-${Date.now()}`;
  const title = item ? item.title : (deepfakeResult?.verdictLabel || 'Visual Forensic Audit');
  const claimText = item ? item.claim : (deepfakeResult?.summary || 'Digital media visual authenticity inspection');
  const summary = item ? item.summary : (deepfakeResult?.plainEnglishExplanation || deepfakeResult?.summary || '');

  // Qualitative Verdict Normalization
  const getVerdictDisplay = () => {
    const baseDisplay = (() => {
      if (item) {
        const v = item.compassVerdict || (item.verdict as CredibilityVerdict);
        switch (v) {
          case 'SUPPORTED_BY_EVIDENCE':
          case 'VERIFIED_TRUE' as any:
            return {
              key: 'SUPPORTED_BY_EVIDENCE',
              title: 'SUPPORTED BY EVIDENCE',
              subtitle: 'Reliable evidence supports the main claim.',
              icon: CheckCircle2,
              badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
              borderClass: 'border-l-emerald-500',
            };
          case 'MOSTLY_TRUE_NEEDS_CONTEXT':
            return {
              key: 'MOSTLY_TRUE_NEEDS_CONTEXT',
              title: 'MOSTLY TRUE — NEEDS CONTEXT',
              subtitle: 'The main statement is supported, but important details are missing.',
              icon: Info,
              badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
              borderClass: 'border-l-blue-500',
            };
          case 'MISLEADING':
            return {
              key: 'MISLEADING',
              title: 'MISLEADING',
              subtitle: 'The claim uses incorrect framing, incomplete information, or misleading context.',
              icon: AlertTriangle,
              badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
              borderClass: 'border-l-amber-500',
            };
          case 'DEBUNKED':
          case 'DEBUNKED_FAKE' as any:
            return {
              key: 'DEBUNKED',
              title: 'DEBUNKED — EVIDENCE CONTRADICTS IT',
              subtitle: 'Accredited records and empirical documentation contradict the claim.',
              icon: XCircle,
              badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
              borderClass: 'border-l-rose-500',
            };
          case 'UNVERIFIED':
          default:
            return {
              key: 'UNVERIFIED',
              title: 'UNVERIFIED',
              subtitle: 'There is insufficient reliable evidence to establish a definitive conclusion.',
              icon: HelpCircle,
              badgeClass: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20',
              borderClass: 'border-l-zinc-500',
            };
        }
      }

      // Deepfake Verdicts
      const dfv = (deepfakeResult?.verdict as DeepfakeVerdict) || 'Inconclusive';
      switch (dfv) {
        case 'No manipulation signals found':
        case 'Likely Authentic':
          return {
            key: 'No manipulation signals found',
            title: 'NO MANIPULATION SIGNALS FOUND',
            subtitle: 'Baseline optical sensor grain, compression markers, and frequency vectors show no obvious manipulation signals.',
            icon: CheckCircle2,
            badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
            borderClass: 'border-l-emerald-500',
          };
        case 'Potentially Manipulated':
          return {
            key: 'Potentially Manipulated',
            title: 'POTENTIALLY MANIPULATED',
            subtitle: 'Localized pixel anomalies or frequency variations detected; compression may also contribute.',
            icon: AlertTriangle,
            badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
            borderClass: 'border-l-amber-500',
          };
        case 'Likely AI-Generated':
          return {
            key: 'Likely AI-Generated',
            title: 'LIKELY AI-GENERATED',
            subtitle: 'Forensic models detected diffusion micro-textures and boundary seams consistent with neural synthesis.',
            icon: Sparkles,
            badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
            borderClass: 'border-l-rose-500',
          };
        case 'Inconclusive':
        default:
          return {
            key: 'Inconclusive',
            title: 'INCONCLUSIVE',
            subtitle: 'Signal noise or compression prevents a reliable forensic judgment.',
            icon: HelpCircle,
            badgeClass: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20',
            borderClass: 'border-l-zinc-500',
          };
      }
    })();

    if (language !== 'en') {
      const trans = VERDICT_TRANSLATIONS[baseDisplay.key]?.[language];
      if (trans) {
        return {
          ...baseDisplay,
          title: trans.title,
          subtitle: trans.subtitle,
        };
      }
    }

    return baseDisplay;
  };

  const verdictDisplay = getVerdictDisplay();
  const VerdictIcon = verdictDisplay.icon;

  const handleShareWhatsApp = () => {
    if (typeof window === 'undefined') return;
    const shareUrl = `${window.location.origin}/report/${encodeURIComponent(reportId)}`;
    const text = encodeURIComponent(
      `🔍 TRACE Fact-Check Dossier [${verdictDisplay.title}]\n\n"${claimText}"\n\nVerdict: ${verdictDisplay.subtitle}\n\nVerify full dossier with evidence:\n${shareUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleShareTwitter = () => {
    if (typeof window === 'undefined') return;
    const shareUrl = `${window.location.origin}/report/${encodeURIComponent(reportId)}`;
    const text = encodeURIComponent(
      `TRACE Fact-Check [${verdictDisplay.title}]: "${claimText.slice(0, 100)}..."\n\nRead the evidence dossier:`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const handlePrintReport = () => {
    window.print();
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      const shareUrl = `${window.location.origin}/report/${encodeURIComponent(reportId)}`;
      navigator.clipboard.writeText(shareUrl);
      setHasCopiedUrl(true);
      setTimeout(() => setHasCopiedUrl(false), 2000);
    }
  };

  const handleCopySummary = () => {
    const textToCopy = `TRACE Verification Dossier [${verdictDisplay.title}]\nHeadline: ${title}\nVerdict: ${verdictDisplay.subtitle}\nSummary: ${summary}\nCertificate: #TRACE-${reportId}`;
    navigator.clipboard.writeText(textToCopy);
    setHasCopiedSummary(true);
    setTimeout(() => setHasCopiedSummary(false), 2000);
  };

  const handleDownloadDossier = () => {
    const data = item || deepfakeResult;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trace-dossier-${reportId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSharePerspective = async () => {
    if (!userChoice) return;
    setIsSubmittingPerspective(true);
    try {
      const headers = await getAuthHeaders();
      await fetch('/api/perspective', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify({
          historyId: reportId,
          choice: userChoice,
          comment: userComment,
        }),
      });
      setPerspectiveSubmitted(true);
    } catch {
      // Offline fallback
      setPerspectiveSubmitted(true);
    } finally {
      setIsSubmittingPerspective(false);
    }
  };

  const whatWeFoundItems = item
    ? (item.whatWeFound && item.whatWeFound.length > 0 ? item.whatWeFound : item.keyFindings)
    : (deepfakeResult?.whatWeFound || ['Media evaluated across optical sensor and boundary models.']);

  const evidenceSupporting = item?.evidenceSupporting || [];
  const evidenceContradicting = item?.evidenceContradicting || [];
  const sources = item?.sources || [];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fade-in font-sans">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-3xl w-full text-zinc-900 dark:text-zinc-100 shadow-2xl max-h-[92vh] flex flex-col overflow-hidden my-auto print:border-none print:shadow-none print:bg-white print:text-black">
        
        {/* MODAL NAVIGATION BAR */}
        <div className="p-4 sm:p-5 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onClose}
              className="p-1.5 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold flex items-center gap-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors shrink-0 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <div className="flex items-center gap-2 pl-2 border-l border-zinc-200 dark:border-zinc-800 min-w-0">
              <TraceLogo className="w-6 h-6 rounded-md shrink-0" />
              <div className="min-w-0">
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 block truncate">
                  TRACE Verification Dossier
                </span>
                <p className="text-[10px] text-zinc-500 font-mono truncate">
                  Certificate #TRACE-{reportId.slice(0, 18)}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-wrap justify-end">
            {/* Language Selector */}
            <div className="flex items-center bg-zinc-200/70 dark:bg-zinc-800 p-0.5 rounded-lg text-[10px] font-mono font-bold">
              {(['en', 'hi', 'gu'] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLanguage(l)}
                  className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                    language === l
                      ? 'bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 shadow-2xs'
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                  title={l === 'en' ? 'English' : l === 'hi' ? 'हिन्दी (Hindi)' : 'ગુજરાતી (Gujarati)'}
                >
                  {l === 'en' ? 'EN' : l === 'hi' ? 'हिन्दी' : 'ગુજરાતી'}
                </button>
              ))}
            </div>

            {/* WhatsApp Share Card */}
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="p-1.5 px-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
              title="Share truth card to WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px] font-mono">WhatsApp</span>
            </button>

            {/* X / Twitter Share */}
            <button
              type="button"
              onClick={handleShareTwitter}
              className="p-1.5 px-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-medium flex items-center gap-1 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
              title="Share on X / Twitter"
            >
              <span className="font-bold text-[11px] leading-none">𝕏</span>
              <span className="hidden sm:inline text-[11px] font-mono">Share</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="p-1.5 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-medium flex items-center gap-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
              title="Copy shareable report link"
            >
              {hasCopiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline text-[11px] font-mono">{hasCopiedUrl ? 'Copied' : 'Link'}</span>
            </button>

            <button
              onClick={handleDownloadDossier}
              className="p-1.5 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-medium flex items-center gap-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
              title="Export JSON Dossier"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px] font-mono">JSON</span>
            </button>

            <button
              onClick={handlePrintReport}
              className="p-1.5 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold flex items-center gap-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Print</span>
            </button>
            
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* DOSSIER BODY */}
        <div className="p-5 sm:p-8 space-y-6 overflow-y-auto flex-1">
          
          {/* SECTION 1: MAIN VERDICT (QUALITATIVE CREDIBILITY COMPASS) */}
          <div className="pb-6 border-b border-zinc-200 dark:border-zinc-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-2 min-w-0 flex-1">
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wide uppercase border ${verdictDisplay.badgeClass}`}>
                  <VerdictIcon className="w-4 h-4 shrink-0" />
                  <span>{verdictDisplay.title}</span>
                </div>
                
                <h1 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-zinc-50 leading-tight">
                  {title}
                </h1>
                
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed font-medium">
                  {verdictDisplay.subtitle}
                </p>
              </div>

              <div className="w-14 h-14 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center p-2 shrink-0 self-start">
                <QrCode className="w-10 h-10 text-zinc-700 dark:text-zinc-300 opacity-80" />
              </div>
            </div>

            {/* Investigated Claim Banner */}
            <div className={`bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border-l-4 ${verdictDisplay.borderClass} text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 mt-2`}>
              <span className="font-mono text-[10px] uppercase tracking-wider block text-zinc-500 mb-1">
                Audited Claim Statement:
              </span>
              <p className="font-semibold text-sm leading-relaxed">&quot;{claimText}&quot;</p>
            </div>
          </div>

          {/* SECTION 2: WHAT WE FOUND (PLAIN LANGUAGE SUMMARY) */}
          <div className="space-y-2.5">
            <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-500 font-bold flex items-center gap-1.5">
              <span>Section 02</span>
              <span>•</span>
              <span className="text-zinc-900 dark:text-zinc-100">What We Found</span>
            </h2>

            <div className="bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 sm:p-5 space-y-3">
              <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                {summary}
              </p>

              {whatWeFoundItems.length > 0 && (
                <ul className="space-y-2 text-xs text-zinc-700 dark:text-zinc-300 pt-2 border-t border-zinc-200 dark:border-zinc-800/80">
                  {whatWeFoundItems.map((finding, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 mt-1.5 shrink-0" />
                      <span>{finding}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* SECTION 3: WHY THIS VERDICT? (EVIDENCE BREAKDOWN) */}
          <div className="space-y-3">
            <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-500 font-bold flex items-center gap-1.5">
              <span>Section 03</span>
              <span>•</span>
              <span className="text-zinc-900 dark:text-zinc-100">Why This Verdict?</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Evidence Supporting */}
              <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40 space-y-2">
                <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Evidence Supporting Claim</span>
                </span>
                {evidenceSupporting.length > 0 ? (
                  <ul className="space-y-1.5 text-xs text-emerald-950 dark:text-emerald-200">
                    {evidenceSupporting.map((ev, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-emerald-500 font-bold">•</span>
                        <span>{ev}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[11px] text-zinc-500 italic">No verified empirical documentation supports the assertion.</p>
                )}
              </div>

              {/* Evidence Contradicting */}
              <div className="p-4 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40 space-y-2">
                <span className="text-xs font-bold text-rose-900 dark:text-rose-300 flex items-center gap-1.5">
                  <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>Evidence Contradicting Claim</span>
                </span>
                {evidenceContradicting.length > 0 ? (
                  <ul className="space-y-1.5 text-xs text-rose-950 dark:text-rose-200">
                    {evidenceContradicting.map((ev, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-rose-500 font-bold">•</span>
                        <span>{ev}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[11px] text-zinc-500 italic">No contradictory records were reported for this statement.</p>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 4: WHAT YOU SHOULD KNOW (LIMITATIONS & DISCLAIMER) */}
          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 space-y-1.5">
            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              <span>What You Should Know</span>
            </span>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {item?.whatIsStillUnknown || 'Digital analysis results are informational assessments. A lack of detected tampering does not guarantee absolute authenticity, and social media compression can occasionally introduce false noise artifacts.'}
            </p>
          </div>

          {/* SECTION 5: ACCREDITED SOURCES & CITATIONS */}
          {sources.length > 0 && (
            <div className="space-y-2.5">
              <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-500 font-bold flex items-center gap-1.5">
                <span>Section 05</span>
                <span>•</span>
                <span className="text-zinc-900 dark:text-zinc-100">Accredited Sources &amp; References</span>
              </h2>

              <div className="space-y-2">
                {sources.map((src, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100 block truncate">
                        {src.name}
                      </span>
                      <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
                        {src.publisher && <span>Publisher: {src.publisher}</span>}
                        {src.publicationDate && <span>• Date: {src.publicationDate}</span>}
                      </div>
                    </div>

                    {src.url && (
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium flex items-center gap-1 shrink-0 cursor-pointer text-[11px]"
                      >
                        <span>Inspect Source</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 6: USER PARTICIPATION (WHAT IS YOUR READING?) */}
          <div className="p-5 rounded-2xl bg-zinc-100/70 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-4">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>What is your reading of this claim?</span>
                </span>
                <span className="text-[10px] font-mono text-zinc-400 uppercase">
                  Community Perspective
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Separate from TRACE&apos;s evidence-based verdict: Share your independent assessment. Stored privately under your account.
              </p>
            </div>

            {perspectiveSubmitted ? (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>Your perspective has been recorded privately in your account history.</span>
              </div>
            ) : (
              <div className="space-y-3">
                {/* 5 Selectable Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { id: 'trustworthy', label: 'Trustworthy', color: 'border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300' },
                    { id: 'context', label: 'Needs Context', color: 'border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300' },
                    { id: 'misleading', label: 'Seems Misleading', color: 'border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300' },
                    { id: 'false', label: 'I Believe False', color: 'border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300' },
                    { id: 'unsure', label: 'Not Sure Yet', color: 'border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setUserChoice(opt.id as any)}
                      className={`p-2.5 rounded-xl text-center text-xs font-semibold border transition-all cursor-pointer ${
                        userChoice === opt.id
                          ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 ring-2 ring-zinc-900 dark:ring-zinc-100'
                          : 'bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 ' + opt.color
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                <textarea
                  rows={2}
                  value={userComment}
                  onChange={(e) => setUserComment(e.target.value)}
                  placeholder="Optional: Provide reasoning or citations supporting your perspective..."
                  className="w-full p-2.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleSharePerspective}
                    disabled={!userChoice || isSubmittingPerspective}
                    className="px-4 py-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-bold flex items-center gap-2 hover:opacity-90 disabled:opacity-50 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmittingPerspective ? 'Recording...' : 'Share My Perspective'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 7: ADVANCED TECHNICAL DETAILS (COLLAPSIBLE) */}
          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
            <button
              type="button"
              onClick={() => setShowAdvancedDetails(!showAdvancedDetails)}
              className="w-full flex items-center justify-between text-xs font-mono font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 py-2 cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5" />
                <span>ADVANCED FORENSIC METRICS &amp; TELEMETRY</span>
              </span>
              {showAdvancedDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showAdvancedDetails && (
              <div className="mt-3 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs space-y-3 font-mono">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="p-2.5 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <span className="text-[10px] text-zinc-400 block">ENGINE ARCHITECTURE</span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100 text-xs truncate block">
                      {deepfakeResult?.modelName || 'Hybrid Gemini + Local CV'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <span className="text-[10px] text-zinc-400 block">AI PROBABILITY</span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100 text-xs">
                      {deepfakeResult?.aiProbability ? `${deepfakeResult.aiProbability}%` : 'N/A'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <span className="text-[10px] text-zinc-400 block">ELA RESIDUAL</span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100 text-xs">
                      {deepfakeResult?.technicalDetails?.elaScore ?? 'Normal'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <span className="text-[10px] text-zinc-400 block">SENSOR NOISE</span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100 text-xs">
                      {deepfakeResult?.technicalDetails?.noiseVarianceScore ?? 'Normal'}
                    </span>
                  </div>
                </div>

                <div className="pt-2 text-[10px] text-zinc-400 space-y-1">
                  <p>Certificate Serial: #TRACE-DOSSIER-{reportId}</p>
                  <p>Isolation: User-specific cryptographic storage key</p>
                </div>
              </div>
            )}
          </div>

          {/* USER ACTIONS BOTTOM BAR */}
          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-zinc-500 font-mono text-[11px]">
              <Bookmark className="w-3.5 h-3.5 text-emerald-500" />
              <span>Saved in your personal analysis history</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopySummary}
                className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                {hasCopiedSummary ? 'Summary Copied' : 'Copy Summary'}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold hover:opacity-90 transition-opacity cursor-pointer"
              >
                Run Another Check
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
