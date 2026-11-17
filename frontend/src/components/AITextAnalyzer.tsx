// TRACE - Enterprise AI Text Authorship & Linguistic Forensics (Linear / Vercel Aesthetic)
import React, { useState, useRef, useEffect } from 'react';
import { AITextAnalysisResult } from '../types';
import type { TextAuditState } from '../state/machines';
import {
  Cpu,
  Bot,
  Sparkles,
  FileText,
  Zap,
  RefreshCw,
  Layers,
  CheckCircle2,
  ShieldCheck,
  Activity,
  Copy,
  Check,
  Download,
  Info,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { RunActionButton, type StepItem } from './watermelon/run-action-button';
import { SkeletonResult, AnalysisLoader, type AnalysisStep } from './skeletons';

const AI_TEXT_AUDIT_STEPS: StepItem[] = [
  { id: 'tokens', label: 'Extracting N-Gram Tokens & Lengths', icon: FileText },
  { id: 'perplexity', label: 'Computing Perplexity Index', icon: Cpu },
  { id: 'burstiness', label: 'Evaluating Cadence Burstiness (CV)', icon: Activity },
  { id: 'fingerprint', label: 'Matching LLM Formulaic Signatures', icon: Bot },
  { id: 'verdict', label: 'Authorship Probability Synthesized', icon: ShieldCheck },
];

const NLP_LOADER_STEPS: AnalysisStep[] = [
  { id: 'tokenize', label: 'Tokenizing & Sentence Segmentation' },
  { id: 'cv', label: 'Computing Sentence Variance & Burstiness' },
  { id: 'cliche', label: 'Screening Formulaic Cliché Tokens' },
  { id: 'synthesis', label: 'Synthesizing Authorship Probability' },
];

interface AITextAnalyzerProps {}

export const AITextAnalyzer: React.FC<AITextAnalyzerProps> = () => {
  const [inputText, setInputText] = useState<string>('');
  const [auditState, setAuditState] = useState<TextAuditState>({ status: 'idle' });
  const [hasCopied, setHasCopied] = useState<boolean>(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const isAnalyzing = auditState.status === 'analyzing';
  const analysisResult = auditState.status === 'complete' ? auditState.result : null;
  const errorMessage = auditState.status === 'error' ? auditState.message : null;

  const sampleTexts = [
    {
      title: 'ChatGPT Essay',
      content: `In conclusion, renewable energy sources represent a paramount milestone in combating climate change. Harnessing solar and wind power enables societies to foster sustainable development while significantly mitigating greenhouse gas emissions. Furthermore, policy makers must prioritize green infrastructure investments to facilitate seamless integration.`
    },
    {
      title: 'Claude/Gemini Abstract',
      content: `To delve into the multifaceted implications of quantum cryptography, one must examine the delicate interplay between entanglement fidelity and decoherence mitigation. Crucially, this paradigm fosters robust security architectures across distributed ledger networks.`
    },
    {
      title: 'Human Conversational',
      content: `I caught the 5 AM red-eye out of Mumbai yesterday. The rain was pounding against the tarmac, delay after delay. Honestly, nobody had any clue what was going on until the captain finally hopped on the mic at 3 AM and told us we were good to go.`
    },
    {
      title: 'Scientific Abstract',
      content: `We measured dielectric breakdown voltages across twelve synthetic graphene polymer samples under cryogenic thermal cycles. Experimental data revealed an exponential deviation from classical Arrhenius rate law predictions at temperatures below 40 Kelvin.`
    }
  ];

  const handleAnalyze = async () => {
    if (!inputText.trim() || inputText.length < 15) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setAuditState({ status: 'analyzing' });
    try {
      const response = await fetch('/api/analyze-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText }),
        signal: controller.signal,
      });

      const responseText = await response.text();
      if (controller.signal.aborted) return;

      let data: any = {};
      try {
        data = JSON.parse(responseText);
      } catch {
        console.error('Non-JSON response in AITextAnalyzer:', responseText.slice(0, 150));
        setAuditState({
          status: 'error',
          message: 'Server returned an unexpected response during NLP analysis.',
        });
        return;
      }

      if (data.success && data.result) {
        setAuditState({ status: 'complete', result: data.result });
      } else {
        setAuditState({
          status: 'error',
          message: data.error || data.details || 'NLP analysis did not return a valid verdict.',
        });
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      console.error('Text analysis error:', err);
      setAuditState({
        status: 'error',
        message: err?.message || 'Unable to reach NLP forensic engine.',
      });
    }
  };

  const handleCopyReport = () => {
    if (!analysisResult) return;
    const text = `TRACE NLP LINGUISTIC AUDIT\n${'='.repeat(40)}\nPredicted Author: ${analysisResult.predictedModel}\nAI Likelihood: ${analysisResult.aiScore}%\nHuman Probability: ${analysisResult.humanScore}%\nPerplexity Index: ${analysisResult.perplexityScore}/100\nBurstiness Index: ${analysisResult.burstinessScore}/100\n\nSummary:\n${analysisResult.summaryExplanation}\n`;
    navigator.clipboard.writeText(text);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  return (
    <section className="bg-zinc-50/60 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 py-8 sm:py-12 min-h-screen border-t border-zinc-200 dark:border-zinc-800 transition-colors font-sans">
      <div className="max-w-[1680px] w-full mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12">
        
        {/* Header */}
        <div className="mb-8 border-b border-zinc-200 dark:border-zinc-800 pb-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 font-mono text-xs mb-3">
            <Cpu className="w-3.5 h-3.5 shrink-0" />
            <span>Local NLP Linguistic Forensics</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-zinc-950 dark:text-zinc-50 tracking-tight">
            AI Content &amp; Linguistic Authorship Desk
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 text-xs sm:text-sm mt-1 max-w-3xl leading-relaxed">
            Audit whether an article, press release, or viral social post was generated by an LLM (ChatGPT, Claude, Gemini) or an organic human writer using token perplexity, sentence cadence burstiness, and formulaic cliché detection.
          </p>
        </div>

        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          
          {/* Left Column: Input Box & Methodology */}
          <div className="lg:col-span-6 space-y-5">
            
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-blue-500" />
                  <span>Input Passage ({inputText.length} chars, ~{inputText.split(/\s+/).filter(Boolean).length} words)</span>
                </label>
                
                {/* Sample Presets */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {sampleTexts.map((st, idx) => (
                    <button
                      key={idx}
                      onClick={() => setInputText(st.content)}
                      className="bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 text-[11px] px-2.5 py-0.5 rounded-lg font-medium transition-colors cursor-pointer"
                      title={st.title}
                    >
                      {st.title.split(' ')[0]} {st.title.includes('Human') ? '👤' : '🤖'}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                rows={8}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste news draft, article passage, or social post here to inspect authorship..."
                className="w-full bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 font-mono resize-y min-h-[160px] leading-relaxed"
              />

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                <span className="text-[11px] text-zinc-500 font-mono">Minimum 15 characters required</span>
                
                <RunActionButton
                  type="button"
                  size="compact"
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || inputText.length < 15}
                  isExecuting={isAnalyzing}
                  idleLabel="Audit Authorship"
                  idleIcon={Zap}
                  doneLabel="Linguistic Audit Done"
                  doneIcon={CheckCircle2}
                  steps={AI_TEXT_AUDIT_STEPS}
                />
              </div>
            </div>

            {/* Methodology Box */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 text-xs text-zinc-600 dark:text-zinc-400 space-y-3 shadow-xs">
              <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs uppercase tracking-wider font-mono flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span>Forensic Linguistic Principles</span>
              </h4>
              <p className="leading-relaxed">
                <strong className="text-zinc-900 dark:text-zinc-200 font-medium">Perplexity:</strong> Measures lexical unpredictability. Professional human journalists use diverse vocabularies and irregular phrase lengths, whereas generative models select high-probability tokens.
              </p>
              <p className="leading-relaxed">
                <strong className="text-zinc-900 dark:text-zinc-200 font-medium">Burstiness:</strong> Evaluates sentence-length coefficient of variation. Organic writers alternate between punchy short declarations and layered subordinate clauses; LLM writing maintains monotonous cadence.
              </p>
            </div>

          </div>

          {/* Right Column: Forensic Output or Skeleton Loading */}
          <div className="lg:col-span-6 space-y-5">
            {isAnalyzing ? (
              <div className="space-y-5">
                <AnalysisLoader
                  steps={NLP_LOADER_STEPS}
                  activeStepIndex={1}
                  currentMessage="Analyzing sentence length variance and cliché tokens..."
                />
                <SkeletonResult type="nlp" />
              </div>
            ) : errorMessage ? (
              <div className="bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-2xl p-6 text-center space-y-2 shadow-xs">
                <AlertTriangle className="w-8 h-8 mx-auto text-rose-500" />
                <h3 className="font-semibold text-rose-900 dark:text-rose-200 text-sm">NLP Audit Failed</h3>
                <p className="text-xs text-rose-700 dark:text-rose-300 max-w-sm mx-auto leading-relaxed">{errorMessage}</p>
              </div>
            ) : !analysisResult ? (
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 sm:p-12 text-center text-zinc-500 space-y-3 shadow-xs">
                <Bot className="w-10 h-10 mx-auto text-zinc-400 dark:text-zinc-600" />
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">Awaiting Text Passage</h3>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
                  Paste an article, quote, or draft on the left, then click <strong>"Audit Authorship"</strong> to calculate perplexity, burstiness, and predicted LLM fingerprint.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Score Card */}
                <div className={`p-5 sm:p-6 rounded-2xl border shadow-xs space-y-4 ${
                  analysisResult.aiScore >= 65
                    ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60 text-rose-950 dark:text-rose-100'
                    : analysisResult.aiScore >= 40
                    ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60 text-amber-950 dark:text-amber-100'
                    : 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60 text-emerald-950 dark:text-emerald-100'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-500">
                      Authorship Classification
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold uppercase ${
                      analysisResult.aiScore >= 65
                        ? 'bg-rose-500 text-white'
                        : analysisResult.aiScore >= 40
                        ? 'bg-amber-500 text-zinc-950'
                        : 'bg-emerald-600 text-white'
                    }`}>
                      {analysisResult.aiScore >= 65 ? 'AI Synthetic Text' : (analysisResult.aiScore >= 40 ? 'Hybrid / Assisted' : 'Organic Human Author')}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-950 dark:text-zinc-50">
                      {analysisResult.aiScore}%
                    </span>
                    <span className="text-xs font-mono text-zinc-500">
                      AI Likelihood ({analysisResult.humanScore}% Human Probability)
                    </span>
                  </div>

                  {/* Dual Gauge Bar */}
                  <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden flex">
                    <div className="bg-rose-500 h-full transition-all duration-700" style={{ width: `${analysisResult.aiScore}%` }} />
                    <div className="bg-emerald-500 h-full transition-all duration-700" style={{ width: `${analysisResult.humanScore}%` }} />
                  </div>

                  <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 font-mono">
                    <Bot className="w-4 h-4 text-blue-500 shrink-0" />
                    <span>Predicted Signature: {analysisResult.predictedModel}</span>
                  </p>

                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-sans">
                    {analysisResult.summaryExplanation}
                  </p>
                </div>

                {/* Metrics Gauges */}
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-xs space-y-1">
                    <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider block">Perplexity Index</span>
                    <p className="text-2xl font-black text-zinc-950 dark:text-zinc-50">{analysisResult.perplexityScore} / 100</p>
                    <span className="text-[10px] text-zinc-400 font-mono block">Lower = Predictable syntax</span>
                  </div>

                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-xs space-y-1">
                    <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider block">Burstiness Index</span>
                    <p className="text-2xl font-black text-zinc-950 dark:text-zinc-50">{analysisResult.burstinessScore} / 100</p>
                    <span className="text-[10px] text-zinc-400 font-mono block">Lower = Uniform sentence rhythm</span>
                  </div>
                </div>

                {/* Sentence Level Breakdown */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-3.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5 text-blue-500" />
                      <span>Sentence-by-Sentence Breakdown</span>
                    </h3>
                    
                    <button
                      type="button"
                      onClick={handleCopyReport}
                      className="px-2 py-1 rounded-md text-xs font-mono flex items-center gap-1 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                    >
                      {hasCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{hasCopied ? 'Copied' : 'Copy Report'}</span>
                    </button>
                  </div>

                  <div className="space-y-2 text-xs">
                    {analysisResult.highlightedSentences.map((sent, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border leading-relaxed ${
                          sent.aiLikelihood === 'High'
                            ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 text-zinc-900 dark:text-zinc-100'
                            : sent.aiLikelihood === 'Medium'
                            ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 text-zinc-900 dark:text-zinc-100'
                            : 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-zinc-900 dark:text-zinc-100'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1 text-[10px] font-mono">
                          <span className={`font-semibold uppercase ${
                            sent.aiLikelihood === 'High' ? 'text-rose-600 dark:text-rose-400' : sent.aiLikelihood === 'Medium' ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                          }`}>
                            AI Likelihood: {sent.aiLikelihood}
                          </span>
                          <span className="text-zinc-400 truncate">{sent.reason}</span>
                        </div>
                        <p className="font-mono text-xs text-zinc-800 dark:text-zinc-200 break-words">"{sent.text}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </section>
  );
};
