import React from 'react';
import {
  BarChart3,
  AlertTriangle,
  ShieldAlert,
  Users,
  Cpu,
  Zap,
  Layers,
} from 'lucide-react';
import { OverviewStatsResponse } from '../../types';

interface AdminTelemetryTabProps {
  systemData: OverviewStatsResponse | null;
  diagnosticPing: any;
  isPinging: boolean;
  onRunDiagnosticPing: () => Promise<void>;
}

export const AdminTelemetryTab: React.FC<AdminTelemetryTabProps> = ({
  systemData,
  diagnosticPing,
  isPinging,
  onRunDiagnosticPing,
}) => {
  const stats = systemData?.stats;
  const sys = systemData?.system;

  return (
    <div className="space-y-6">
      {/* Real KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 flex items-center justify-between">
            <span>Total Claims Checked</span>
            <BarChart3 className="w-4 h-4 text-rose-400" />
          </span>
          <p className="text-2xl sm:text-3xl font-bold font-mono text-zinc-50">
            {stats ? stats.totalClaimsChecked : 0}
          </p>
          <p className="text-[11px] text-zinc-500 font-mono">
            {stats?.totalUserScans ?? 0} user scans + {stats?.editorialArticlesCount ?? 0} editorial
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 flex items-center justify-between">
            <span>Fake News Busted</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </span>
          <p className="text-2xl sm:text-3xl font-bold font-mono text-rose-400">
            {stats ? stats.fakeNewsBusted : 0}
          </p>
          <p className="text-[11px] text-zinc-500 font-mono">
            Verified hoaxes &amp; disinformation exposed
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 flex items-center justify-between">
            <span>Deepfakes Intercepted</span>
            <ShieldAlert className="w-4 h-4 text-purple-400" />
          </span>
          <p className="text-2xl sm:text-3xl font-bold font-mono text-purple-400">
            {stats ? stats.deepfakesIntercepted : 0}
          </p>
          <p className="text-[11px] text-zinc-500 font-mono">
            PyTorch YuNet &amp; ELA forensic scans
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 flex items-center justify-between">
            <span>Registered Users</span>
            <Users className="w-4 h-4 text-blue-400" />
          </span>
          <p className="text-2xl sm:text-3xl font-bold font-mono text-blue-400">
            {stats ? stats.userAccountsCount : 0}
          </p>
          <p className="text-[11px] text-zinc-500 font-mono">
            Isolated encrypted account vaults
          </p>
        </div>
      </div>

      {/* Hardware & Live Resource Telemetry */}
      {sys && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Node Process & Memory */}
          <div className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-400" />
                Runtime Process Health
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400">
                STABLE
              </span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between text-zinc-400">
                <span>Node.js Version</span>
                <span className="text-zinc-200">{sys.nodeVersion}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>OS Platform</span>
                <span className="text-zinc-200">{sys.platform}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Active CPU Cores</span>
                <span className="text-zinc-200">{sys.cpuCount} Cores</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Process Uptime</span>
                <span className="text-emerald-400 font-bold">{sys.uptimeFormatted}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-800 space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-zinc-400">Heap Memory Used</span>
                <span className="text-zinc-200 font-bold">
                  {sys.memoryHeapUsedMb} / {sys.memoryHeapTotalMb} MB
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{
                    width: `${Math.min(
                      100,
                      (sys.memoryHeapUsedMb / sys.memoryHeapTotalMb) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* AI Engines Connectivity Status */}
          <div className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Inference Gateways
              </span>
              <button
                type="button"
                onClick={onRunDiagnosticPing}
                disabled={isPinging}
                className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[11px] font-mono text-zinc-200 transition-colors cursor-pointer"
              >
                {isPinging ? 'Pinging...' : 'Test Latency'}
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-850 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-zinc-200">Local PyTorch / YuNet</p>
                  <p className="text-[10px] text-zinc-500">Computer Vision &amp; ELA Fast Worker</p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400">
                  {systemData?.engines.localAiStatus}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-850 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-zinc-200">Google Gemini API Gateway</p>
                  <p className="text-[10px] text-zinc-500">Gemini 2.5 Flash / 3.7 Multimodal</p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400">
                  {systemData?.engines.geminiStatus}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-850 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-zinc-200">Live Wire Dispatch</p>
                  <p className="text-[10px] text-zinc-500">Global Accredited Wire News Registry</p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400">
                  {systemData?.engines.gnewsStatus}
                </span>
              </div>
            </div>

            {diagnosticPing && (
              <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-[10px] font-mono space-y-1 text-zinc-400">
                <p className="text-zinc-300 font-semibold">Live Roundtrip Latencies:</p>
                <p>
                  • Local AI Engine:{' '}
                  <strong className="text-emerald-400">{diagnosticPing.localAi?.latencyMs}ms</strong>
                </p>
                <p>
                  • Gemini Gateway:{' '}
                  <strong className="text-emerald-400">{diagnosticPing.gemini?.latencyMs}ms</strong>
                </p>
                <p>
                  • Editorial Datastore:{' '}
                  <strong className="text-emerald-400">{diagnosticPing.editorialDb?.latencyMs}ms</strong>
                </p>
              </div>
            )}
          </div>

          {/* Categories & Desk Distribution */}
          <div className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-4">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" />
              Investigation Categories Breakdown
            </span>

            <div className="space-y-2.5 pt-1">
              {stats?.categoriesBreakdown?.map((cat) => (
                <div key={cat.category} className="space-y-1 font-mono text-xs">
                  <div className="flex justify-between text-zinc-400">
                    <span>{cat.category}</span>
                    <span className="text-zinc-200">{cat.count}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{
                        width: `${Math.min(
                          100,
                          stats.totalClaimsChecked > 0
                            ? (cat.count / stats.totalClaimsChecked) * 100
                            : 0
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
