import React, { useState, useEffect } from 'react';
import {
  X,
  Key,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Cpu,
  Newspaper,
  Database,
  RefreshCw,
} from 'lucide-react';
import type { EngineStatusCheckState } from '../state/machines';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: (status: SystemKeySummary) => void;
}

export interface SystemKeySummary {
  geminiConfigured: boolean;
  gnewsConfigured: boolean;
  firebaseConfigured: boolean;
  localAiOnline: boolean;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  onStatusChange,
}) => {
  const [sysStatus, setSysStatus] = useState<SystemKeySummary>({
    geminiConfigured: false,
    gnewsConfigured: false,
    firebaseConfigured: false,
    localAiOnline: false,
  });
  const [checkState, setCheckState] = useState<EngineStatusCheckState>({ status: 'idle' });

  const loadSystemStatus = async () => {
    try {
      const res = await fetch('/api/system/status');
      const data = await res.json();
      if (data?.keys) {
        const next: SystemKeySummary = {
          geminiConfigured: Boolean(data.keys.geminiConfigured),
          gnewsConfigured: Boolean(data.keys.gnewsConfigured),
          firebaseConfigured: Boolean(data.keys.firebaseConfigured),
          localAiOnline: Boolean(data.localAi?.status === 'online'),
        };
        setSysStatus(next);
        onStatusChange?.(next);
      }
    } catch {
      // keep current state on transient failure
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    setCheckState({ status: 'idle' });
    loadSystemStatus();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestBackendGateway = async () => {
    setCheckState({ status: 'checking' });
    try {
      const res = await fetch('/api/verify-api-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.valid) {
        setCheckState({ status: 'verified', message: data.message });
      } else {
        setCheckState({ status: 'error', message: data.error || 'Backend Gemini gateway check failed.' });
      }
      await loadSystemStatus();
    } catch (err: any) {
      setCheckState({
        status: 'error',
        message: err?.message || 'Unable to reach backend gateway.',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden text-zinc-900 dark:text-zinc-100">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/70 dark:bg-zinc-950/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-950 dark:text-zinc-50">
                Backend AI &amp; Security Status
              </h2>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                All API keys are secured exclusively on the backend server
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Zero-Exposure Notice */}
          <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 flex items-start gap-2.5 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold text-emerald-900 dark:text-emerald-200">
                Zero Client-Side Secret Exposure
              </p>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300/90 leading-relaxed">
                API keys live strictly inside <code className="font-mono">.env</code> on the backend. Browsers never store or transmit raw credentials.
              </p>
            </div>
          </div>

          {/* Backend Service Readiness Matrix */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 font-semibold">
                Configured Backend Connectors
              </span>
              <button
                type="button"
                onClick={loadSystemStatus}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                Refresh
              </button>
            </div>

            <div className="divide-y divide-zinc-200 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden text-xs">
              <div className="px-3.5 py-2.5 flex items-center justify-between bg-white dark:bg-zinc-900">
                <div className="flex items-center gap-2">
                  <Key className="w-3.5 h-3.5 text-zinc-500" />
                  <span className="font-medium">Gemini Multimodal Gateway</span>
                </div>
                <span className={`font-mono text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  sysStatus.geminiConfigured
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                }`}>
                  {sysStatus.geminiConfigured ? 'Configured (.env)' : 'Not Set'}
                </span>
              </div>

              <div className="px-3.5 py-2.5 flex items-center justify-between bg-white dark:bg-zinc-900">
                <div className="flex items-center gap-2">
                  <Cpu className="w-3.5 h-3.5 text-zinc-500" />
                  <span className="font-medium">Local PyTorch + OpenCV Engine</span>
                </div>
                <span className={`font-mono text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  sysStatus.localAiOnline
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                    : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                }`}>
                  {sysStatus.localAiOnline ? 'HTTP Port 5001' : 'On-Demand CLI'}
                </span>
              </div>

              <div className="px-3.5 py-2.5 flex items-center justify-between bg-white dark:bg-zinc-900">
                <div className="flex items-center gap-2">
                  <Newspaper className="w-3.5 h-3.5 text-zinc-500" />
                  <span className="font-medium">GNews Syndication Wire</span>
                </div>
                <span className={`font-mono text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  sysStatus.gnewsConfigured
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                    : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                }`}>
                  {sysStatus.gnewsConfigured ? 'Configured (.env)' : 'Archive Mode'}
                </span>
              </div>

              <div className="px-3.5 py-2.5 flex items-center justify-between bg-white dark:bg-zinc-900">
                <div className="flex items-center gap-2">
                  <Database className="w-3.5 h-3.5 text-zinc-500" />
                  <span className="font-medium">Firebase Identity Gateway</span>
                </div>
                <span className={`font-mono text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  sysStatus.firebaseConfigured
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                }`}>
                  {sysStatus.firebaseConfigured ? 'Backend Active' : 'Disabled'}
                </span>
              </div>
            </div>
          </div>

          {/* Gateway Connectivity Result */}
          {checkState.status === 'verified' && (
            <div className="p-3 rounded-xl text-xs flex items-start gap-2 border bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{checkState.message}</span>
            </div>
          )}

          {checkState.status === 'error' && (
            <div className="p-3 rounded-xl text-xs flex items-start gap-2 border bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{checkState.message}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={handleTestBackendGateway}
              disabled={checkState.status === 'checking' || !sysStatus.geminiConfigured}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 inline-flex items-center gap-1.5 cursor-pointer"
            >
              {checkState.status === 'checking' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Testing Gateway...</span>
                </>
              ) : (
                <span>Test Gemini Gateway</span>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
