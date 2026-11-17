// TRACE - Enterprise Photo & Broadcast OCR Verification Desk (Linear / Vercel Aesthetic)
import React, { useState, useReducer, useRef, useEffect } from 'react';
import { NewsMediaFactCheckResult, FactCheckItem } from '../types';
import { mediaCheckReducer } from '../state/machines';
import {
  Camera,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  FileSearch,
  RefreshCw,
  FileText,
  Award,
  Bot,
  Globe,
  Search,
  Copy,
  Check,
  Download,
  Share2,
  ExternalLink,
  Layers,
  Scan
} from 'lucide-react';
import { RunActionButton, type StepItem } from './watermelon/run-action-button';
import { SkeletonResult, AnalysisLoader, type AnalysisStep } from './skeletons';
import { getAuthHeaders } from '../utils/firebase';

const MEDIA_AUDIT_STEPS: StepItem[] = [
  { id: 'ocr', label: 'Extracting On-Screen OCR Chyrons', icon: Camera },
  { id: 'metadata', label: 'Inspecting Visual Artifacts & EXIF', icon: Search },
  { id: 'correlate', label: 'Cross-Checking Global Wires', icon: Globe },
  { id: 'verdict', label: 'Compiling Multimodal Dossier', icon: Award },
];

const OCR_LOADER_STEPS: AnalysisStep[] = [
  { id: 'bilateral', label: 'Bilateral Denoising & Otsu Binarization' },
  { id: 'chyrons', label: 'Detecting Lower-Third Text Contours' },
  { id: 'ocr_engine', label: 'Extracting Glyph Sequences & Chyrons' },
  { id: 'wire_check', label: 'Corroborating Wire Archives' },
];

interface NewsMediaFactCheckerProps {
  onGenerateReport?: (item: FactCheckItem) => void;
}

export const NewsMediaFactChecker: React.FC<NewsMediaFactCheckerProps> = ({ onGenerateReport }) => {
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [userNotes, setUserNotes] = useState<string>('');
  const [state, dispatch] = useReducer(mediaCheckReducer, { status: 'idle' });
  const [hasCopiedText, setHasCopiedText] = useState<boolean>(false);

  const abortRef = useRef<AbortController | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearScheduledTimers = () => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  };

  useEffect(() => {
    return () => {
      clearScheduledTimers();
      abortRef.current?.abort();
    };
  }, []);

  const isAnalyzing = state.status === 'analyzing';
  const analysisStep = state.status === 'analyzing' ? state.stageText : '';
  const loaderStepIdx = state.status === 'analyzing' ? state.loaderStepIdx : 0;
  const errorMessage = state.status === 'error' ? state.message : null;
  const result = state.status === 'complete' ? state.result : null;

  const sampleMediaItems = [
    {
      title: 'Doctored Quarantine Banner',
      type: 'image' as const,
      preview: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=1000&q=80',
      notes: 'Viral breaking news ticker image claiming immediate 30-day quarantine order.'
    },
    {
      title: 'Verified NASA Press Photo',
      type: 'image' as const,
      preview: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?auto=format&fit=crop&w=1000&q=80',
      notes: 'NASA James Webb Space Telescope official astronomical discovery photo.'
    },
    {
      title: 'Altered Newspaper Clipping',
      type: 'image' as const,
      preview: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1000&q=80',
      notes: 'Social media post sharing a scanned newspaper clipping with modified headline.'
    }
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 60 * 1024 * 1024) {
        dispatch({
          type: 'FAIL',
          message: 'File size is too large (max 60MB). Please select a shorter video or smaller photo.',
        });
        return;
      }

      dispatch({ type: 'RESET' });
      setMediaFile(file);
      const isVid = file.type.startsWith('video');
      setMediaType(isVid ? 'video' : 'image');

      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyzeMedia = async (customPreview?: string, customNotes?: string, customType?: 'image' | 'video') => {
    const targetPreview = customPreview || mediaPreview;
    const targetNotes = customNotes !== undefined ? customNotes : userNotes;
    const targetType = customType || mediaType;

    if (!targetPreview && !targetNotes.trim()) return;

    clearScheduledTimers();
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    dispatch({
      type: 'START',
      stageText: '1/4 Binarizing image & locating chyron contours...',
    });

    try {
      timersRef.current.push(
        setTimeout(() => {
          dispatch({
            type: 'SET_STAGE',
            loaderStepIdx: 1,
            stageText: '2/4 Extracting optical glyphs & character strings...',
          });
        }, 500),
        setTimeout(() => {
          dispatch({
            type: 'SET_STAGE',
            loaderStepIdx: 2,
            stageText: '3/4 Cross-referencing international wire registries...',
          });
        }, 1000)
      );

      const authHeaders = await getAuthHeaders();
      const response = await fetch('/api/fact-check-media', {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mediaBase64: targetPreview?.startsWith('data:') ? targetPreview : undefined,
          mediaUrl: !targetPreview?.startsWith('data:') ? targetPreview : undefined,
          mediaType: targetType,
          userNotes: targetNotes.trim(),
        }),
        signal: controller.signal,
      });

      clearScheduledTimers();
      if (controller.signal.aborted) return;

      dispatch({
        type: 'SET_STAGE',
        loaderStepIdx: 3,
        stageText: '4/4 Synthesizing visual integrity & truth index...',
      });

      const responseText = await response.text();
      if (controller.signal.aborted) return;

      let data: any = {};
      try {
        data = JSON.parse(responseText);
      } catch {
        console.error('Non-JSON response received:', responseText.slice(0, 200));
        throw new Error(response.status === 413 ? 'The uploaded file is too large for the payload limits.' : 'Server error occurred during news verification.');
      }

      if (data.success && data.result) {
        dispatch({ type: 'COMPLETE', result: data.result });
      } else {
        dispatch({
          type: 'FAIL',
          message: data.details || data.error || 'Verification failed. Please try again.',
        });
      }
    } catch (err: any) {
      clearScheduledTimers();
      if (err?.name === 'AbortError') return;
      console.error('Error analyzing news media:', err);
      dispatch({
        type: 'FAIL',
        message: err?.message || 'Verification failed. Please try again.',
      });
    }
  };

  const handleCopyOcrText = () => {
    if (!result?.ocrText) return;
    navigator.clipboard.writeText(result.ocrText);
    setHasCopiedText(true);
    setTimeout(() => setHasCopiedText(false), 2000);
  };

  const handleDownloadTxt = () => {
    if (!result) return;
    const content = `TRACE OCR & VERIFICATION DOSSIER\n${'='.repeat(40)}\n\nHeadline: ${result.headlineExtracted}\nVerdict: ${result.verdict}\nTruth Score: ${result.truthScore}%\nVisual Integrity: ${result.visualIntegrityScore}%\n\nEXTRACTED OCR TEXT:\n${result.ocrText}\n\nSUMMARY:\n${result.summary}\n\nDETAILED REASONING:\n${result.detailedReasoning}\n\nKEY EVIDENCE:\n${result.keyEvidence.map((e, i) => `${i + 1}. ${e}`).join('\n')}\n`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trace-ocr-${result.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJson = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trace-ocr-${result.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const convertToFactCheckItem = (res: NewsMediaFactCheckResult): FactCheckItem => ({
    id: res.id,
    title: res.headlineExtracted,
    claim: res.ocrText || res.headlineExtracted,
    verdict: res.verdict,
    truthScore: res.truthScore,
    category: 'World News',
    summary: res.summary,
    explanation: res.detailedReasoning,
    keyFindings: res.keyEvidence,
    sources: res.sources.map(s => ({
      name: s.name,
      credibilityScore: s.credibilityScore,
      type: (s.type as any) || 'Fact Checking Org'
    })),
    timestamp: res.timestamp,
    verifiedBy: 'TRACE Dual-Engine OCR & Vision Sentinel',
    imageUrl: res.mediaUrl,
    sharesCount: 1420,
    tags: ['News Photo Check', 'OCR Verification', 'Visual Forensics']
  });

  return (
    <div className="max-w-[1680px] w-full mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 py-8 sm:py-12 space-y-8 font-sans">
      
      {/* Header Banner */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 font-mono text-xs mb-3">
          <Camera className="w-3.5 h-3.5 shrink-0" />
          <span>Multimodal OCR &amp; Chyron Inspection</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-zinc-950 dark:text-zinc-50 tracking-tight">
          News Photo &amp; Broadcast OCR Desk
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 text-xs sm:text-sm mt-1 max-w-3xl leading-relaxed">
          Extract on-screen television chyrons, scanned news clippings, and viral headlines using computer vision OCR. TRACE audits font kerning, detects altered text banners, and corroborates statements against global wire registries.
        </p>
      </div>

      {/* Main Grid: Upload & Controls + Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        
        {/* Left Column: Upload & Sample Controls (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          
          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-900 dark:text-rose-200">Verification Notice</p>
                <p className="mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}
          
          {/* Sample Presets Card */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-3.5 shadow-xs">
            <h3 className="text-xs font-mono font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span>Benchmark Evidence Samples</span>
            </h3>

            <div className="grid grid-cols-1 gap-2">
              {sampleMediaItems.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setMediaPreview(item.preview);
                    setMediaType(item.type);
                    setUserNotes(item.notes);
                    handleAnalyzeMedia(item.preview, item.notes, item.type);
                  }}
                  className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 flex items-center gap-3 text-left transition-all cursor-pointer group"
                >
                  <img src={item.preview} alt={item.title} className="w-11 h-11 rounded-lg object-cover border border-zinc-200 dark:border-zinc-800 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-500 transition-colors truncate">{item.title}</p>
                    <p className="text-[11px] text-zinc-500 truncate">{item.notes}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Upload Area */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-500">
                Media Upload
              </h3>
              <span className="text-[11px] font-mono text-zinc-500">PNG, JPG, MP4</span>
            </div>

            <div className="relative border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 bg-zinc-50/70 dark:bg-zinc-950/60 rounded-xl p-5 text-center transition-colors cursor-pointer group">
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />

              {mediaPreview ? (
                <div className="space-y-2.5">
                  {mediaType === 'video' ? (
                    <video src={mediaPreview} controls className="max-h-52 mx-auto rounded-lg border border-zinc-200 dark:border-zinc-800" />
                  ) : (
                    <img src={mediaPreview} alt="Preview" className="max-h-52 mx-auto rounded-lg object-contain border border-zinc-200 dark:border-zinc-800 shadow-2xs" />
                  )}
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">Click or drag to replace asset</p>
                </div>
              ) : (
                <div className="space-y-2 py-4">
                  <div className="w-10 h-10 mx-auto rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 flex items-center justify-center">
                    <Camera className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Drop broadcast clipping or image frame here</p>
                  <p className="text-[11px] text-zinc-500">Multimodal OCR extracts chyrons and headline typography</p>
                </div>
              )}
            </div>

            {/* Context Notes */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">Contextual Headline or Claim (Optional):</label>
              <textarea
                rows={3}
                value={userNotes}
                onChange={(e) => setUserNotes(e.target.value)}
                placeholder="e.g. Breaking chyron claims a nationwide banking halt..."
                className="w-full bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600"
              />
            </div>

            {/* Submit Button */}
            <div className="w-full flex justify-end pt-1">
              <RunActionButton
                type="button"
                size="compact"
                onClick={() => handleAnalyzeMedia()}
                disabled={isAnalyzing || (!mediaPreview && !userNotes.trim())}
                isExecuting={isAnalyzing}
                idleLabel="Run OCR &amp; Verification"
                idleIcon={Camera}
                doneLabel="Audit Complete"
                doneIcon={CheckCircle2}
                steps={MEDIA_AUDIT_STEPS}
              />
            </div>
          </div>

        </div>

        {/* Right Column: Fact-Check Result Output (7 Cols) */}
        <div className="lg:col-span-7">
          {isAnalyzing ? (
            <div className="space-y-5">
              <AnalysisLoader
                steps={OCR_LOADER_STEPS}
                activeStepIndex={loaderStepIdx}
                currentMessage={analysisStep}
              />
              <SkeletonResult type="ocr" />
            </div>
          ) : result ? (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 sm:p-7 space-y-6 shadow-xs">
              
              {/* Verdict Header Badge */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-5">
                <div className="space-y-1 min-w-0">
                  <span className="text-[10px] font-mono font-semibold text-zinc-400 uppercase tracking-wider block">
                    Extracted Headline Classification
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-zinc-50 tracking-tight leading-snug">
                    {result.headlineExtracted}
                  </h3>
                </div>

                <div className={`px-3 py-1.5 rounded-full text-xs font-mono font-semibold uppercase flex items-center gap-1.5 shrink-0 ${
                  result.verdict === 'VERIFIED_TRUE'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : result.verdict === 'DEBUNKED_FAKE'
                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                }`}>
                  {result.verdict === 'VERIFIED_TRUE' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                  {result.verdict === 'DEBUNKED_FAKE' && <ShieldCheck className="w-4 h-4 shrink-0" />}
                  {result.verdict === 'MISLEADING' && <AlertTriangle className="w-4 h-4 shrink-0" />}
                  <span>{result.verdict.replace('_', ' ')}</span>
                </div>
              </div>

              {/* Truth & Integrity Score Meters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800/80 space-y-2">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-zinc-500">Truth Score</span>
                    <span className={`font-bold ${result.truthScore > 70 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {result.truthScore} / 100
                    </span>
                  </div>
                  <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${result.truthScore > 70 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                      style={{ width: `${result.truthScore}%` }}
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800/80 space-y-2">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-zinc-500">Visual Integrity Index</span>
                    <span className={`font-bold ${result.visualIntegrityScore > 70 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {result.visualIntegrityScore} / 100
                    </span>
                  </div>
                  <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${result.visualIntegrityScore > 70 ? 'bg-blue-500' : 'bg-amber-500'}`}
                      style={{ width: `${result.visualIntegrityScore}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Formatted OCR Text Box with 1-Click Copy and Export (Phase 5 Requirement) */}
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-500" />
                    <span className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                      Extracted OCR Transcription
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleCopyOcrText}
                      className="px-2.5 py-1 rounded-md text-xs font-mono flex items-center gap-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 transition-colors cursor-pointer"
                      title="Copy to clipboard"
                    >
                      {hasCopiedText ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{hasCopiedText ? 'Copied' : 'Copy'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadTxt}
                      className="px-2.5 py-1 rounded-md text-xs font-mono flex items-center gap-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 transition-colors cursor-pointer"
                      title="Download as TXT"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>.txt</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadJson}
                      className="px-2.5 py-1 rounded-md text-xs font-mono flex items-center gap-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 transition-colors cursor-pointer"
                      title="Export as JSON"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>.json</span>
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-mono text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed max-h-44 overflow-y-auto whitespace-pre-wrap select-all">
                  {result.ocrText}
                </div>
              </div>

              {/* Executive Summary */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block">
                  Executive Verdict Summary
                </span>
                <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-zinc-950/60 p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80">
                  {result.summary}
                </p>
              </div>

              {/* Key Evidence & Observations */}
              <div className="space-y-2">
                <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block">
                  Key Verification Evidence
                </span>
                <ul className="space-y-1.5 text-xs text-zinc-700 dark:text-zinc-300">
                  {result.keyEvidence.map((ev, i) => (
                    <li key={i} className="flex items-start gap-2 p-2 rounded-lg bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200/60 dark:border-zinc-800/60">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                      <span className="leading-relaxed">{ev}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Official Action Bar */}
              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="text-[11px] font-mono text-zinc-500">
                  <span>Audited at {result.timestamp} • TRACE Verification Wire</span>
                </div>
                
                {onGenerateReport && (
                  <button
                    type="button"
                    onClick={() => onGenerateReport(convertToFactCheckItem(result))}
                    className="py-2.5 px-4 rounded-xl bg-zinc-950 hover:bg-zinc-800 dark:bg-zinc-50 dark:hover:bg-zinc-200 text-zinc-50 dark:text-zinc-950 font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                  >
                    <Award className="w-4 h-4 shrink-0" />
                    <span>View Official Certificate Dossier</span>
                  </button>
                )}
              </div>

            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 sm:p-12 text-center text-zinc-500 space-y-3 shadow-xs">
              <Camera className="w-10 h-10 mx-auto text-zinc-400 dark:text-zinc-600" />
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
                OCR Verification Desk Ready
              </h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
                Upload a news photograph, newspaper clipping, or television broadcast frame on the left to extract and cross-verify claims.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
