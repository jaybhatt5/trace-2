import React, { useState } from 'react';
import {
  Terminal,
  ShieldAlert,
  AlertTriangle,
  Users,
  Search,
  Radio,
  RefreshCw,
  Download,
  Trash2,
  Lock,
  X,
  Info,
} from 'lucide-react';
import { AuditLogEntry, OverviewStatsResponse } from '../../types';

interface AdminAuditLedgerTabProps {
  systemData: OverviewStatsResponse | null;
  auditLogs: AuditLogEntry[];
  isAutoRefreshLogs: boolean;
  setIsAutoRefreshLogs: (val: boolean) => void;
  fetchAuditLogs: () => Promise<void>;
  onExportLogs: () => void;
  onClearLogs: () => Promise<void>;
}

export const AdminAuditLedgerTab: React.FC<AdminAuditLedgerTabProps> = ({
  systemData,
  auditLogs,
  isAutoRefreshLogs,
  setIsAutoRefreshLogs,
  fetchAuditLogs,
  onExportLogs,
  onClearLogs,
}) => {
  const [logSeverityFilter, setLogSeverityFilter] = useState<'all' | 'info' | 'warn' | 'security'>('all');
  const [logSearch, setLogSearch] = useState('');
  const [userVaultSearch, setUserVaultSearch] = useState('');

  const securityCount = auditLogs.filter((l) => l.severity === 'security').length;
  const warnCount = auditLogs.filter((l) => l.severity === 'warn').length;

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSeverity = logSeverityFilter === 'all' || log.severity === logSeverityFilter;
    const query = logSearch.trim().toLowerCase();
    const matchesSearch =
      !query ||
      log.action.toLowerCase().includes(query) ||
      log.actor.toLowerCase().includes(query) ||
      log.details.toLowerCase().includes(query) ||
      Boolean(log.ip && log.ip.includes(query));
    return matchesSeverity && matchesSearch;
  });

  const filteredUsers = (systemData?.recentUsers ?? []).filter((u) => {
    if (!userVaultSearch.trim()) return true;
    return u.uid.toLowerCase().includes(userVaultSearch.trim().toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Top KPI Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-mono mb-1">
            <span>TOTAL LOGGED EVENTS</span>
            <Terminal className="w-3.5 h-3.5 text-zinc-400" />
          </div>
          <p className="text-2xl font-black text-white font-mono">{auditLogs.length}</p>
          <p className="text-[10px] text-zinc-500 mt-1 font-mono">Rolling memory buffer (max 250)</p>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800">
          <div className="flex items-center justify-between text-rose-400 text-xs font-mono mb-1">
            <span>SECURITY FLAGS</span>
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <p className="text-2xl font-black text-rose-400 font-mono">{securityCount}</p>
          <p className="text-[10px] text-zinc-500 mt-1 font-mono">Failed logins &amp; auth violations</p>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800">
          <div className="flex items-center justify-between text-amber-400 text-xs font-mono mb-1">
            <span>SYSTEM WARNINGS</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-400 font-mono">{warnCount}</p>
          <p className="text-[10px] text-zinc-500 mt-1 font-mono">Config overrides &amp; maintenance</p>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800">
          <div className="flex items-center justify-between text-blue-400 text-xs font-mono mb-1">
            <span>USER VAULTS</span>
            <Users className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <p className="text-2xl font-black text-blue-400 font-mono">
            {systemData?.recentUsers?.length ?? 0}
          </p>
          <p className="text-[10px] text-zinc-500 mt-1 font-mono">Isolated personal histories</p>
        </div>
      </div>

      {/* Main Content Grid: User Vaults Left + Live Ledger Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Registered Accounts & Compliance Vault */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                Active User Vaults ({systemData?.recentUsers?.length ?? 0})
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Zero-Retention
              </span>
            </div>

            {/* Search User Vaults */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Filter user ID / hash..."
                value={userVaultSearch}
                onChange={(e) => setUserVaultSearch(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 font-mono"
              />
            </div>

            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-6 text-zinc-500 text-xs">
                  {userVaultSearch ? 'No user vaults match query.' : 'No active user sessions recorded.'}
                </div>
              ) : (
                filteredUsers.map((u) => (
                  <div
                    key={u.uid}
                    className="p-3 rounded-xl bg-zinc-950 border border-zinc-850 flex items-center justify-between text-xs font-mono hover:border-zinc-700 transition-colors"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                        <p className="text-zinc-200 font-semibold truncate max-w-[140px] sm:max-w-[180px]">
                          {u.uid}
                        </p>
                      </div>
                      <p className="text-[10px] text-zinc-500 mt-0.5 pl-3">
                        Last: {u.lastActive ? new Date(u.lastActive).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-850 text-zinc-300 border border-zinc-700 shrink-0">
                      {u.itemCount} scans
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* DPDP Compliance Card */}
          <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-mono font-semibold text-emerald-400">
              <Lock className="w-3.5 h-3.5" />
              <span>DPDP Act 2023 Architecture</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
              All citizen verification scans are partitioned by distinct UUID vaults. No queries are
              ever cross-pollinated or sold. Administrators have zero access to read private user
              vaults without explicit customer cryptographic consent.
            </p>
            <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[10px] font-mono text-zinc-500">
              <span>Ledger Storage: In-Memory / Ephemeral</span>
              <span className="text-emerald-500 font-bold">Compliant</span>
            </div>
          </div>
        </div>

        {/* Right Column: Live Security & Administrative Ledger */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-4">
          {/* Ledger Header & Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                Live Security &amp; Audit Ledger
              </span>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-zinc-800 text-[10px] font-mono text-zinc-400">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isAutoRefreshLogs ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'
                  }`}
                />
                <span>{isAutoRefreshLogs ? 'STREAMING (4s)' : 'PAUSED'}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setIsAutoRefreshLogs(!isAutoRefreshLogs)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors flex items-center gap-1 cursor-pointer border ${
                  isAutoRefreshLogs
                    ? 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
                    : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-zinc-300'
                }`}
                title="Toggle 4-second auto refresh"
              >
                <Radio
                  className={`w-3 h-3 ${isAutoRefreshLogs ? 'text-emerald-400' : 'text-zinc-500'}`}
                />
                <span>{isAutoRefreshLogs ? 'Pause Feed' : 'Resume Feed'}</span>
              </button>

              <button
                type="button"
                onClick={fetchAuditLogs}
                className="px-2.5 py-1 rounded-lg text-xs font-mono bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-colors flex items-center gap-1 cursor-pointer"
                title="Fetch latest audit entries now"
              >
                <RefreshCw className="w-3 h-3 text-zinc-400" />
                <span>Refresh</span>
              </button>

              <button
                type="button"
                onClick={onExportLogs}
                className="px-2.5 py-1 rounded-lg text-xs font-mono bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-colors flex items-center gap-1 cursor-pointer"
                title="Export audit ledger as JSON"
              >
                <Download className="w-3 h-3 text-blue-400" />
                <span>Export</span>
              </button>

              <button
                type="button"
                onClick={onClearLogs}
                className="px-2.5 py-1 rounded-lg text-xs font-mono bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-800/60 transition-colors flex items-center gap-1 cursor-pointer"
                title="Purge current ledger"
              >
                <Trash2 className="w-3 h-3 text-rose-400" />
                <span>Purge</span>
              </button>
            </div>
          </div>

          {/* Filter & Search Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search action, actor, IP, or details..."
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-8 pr-8 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 font-mono"
              />
              {logSearch && (
                <button
                  type="button"
                  onClick={() => setLogSearch('')}
                  className="absolute right-2.5 top-2.5 text-zinc-500 hover:text-zinc-300"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800 shrink-0 text-xs font-mono">
              {(['all', 'info', 'warn', 'security'] as const).map((sev) => (
                <button
                  key={sev}
                  type="button"
                  onClick={() => setLogSeverityFilter(sev)}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold uppercase transition-all cursor-pointer ${
                    logSeverityFilter === sev
                      ? sev === 'security'
                        ? 'bg-rose-600 text-white'
                        : sev === 'warn'
                        ? 'bg-amber-600 text-white'
                        : 'bg-zinc-800 text-white'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          {/* Stream of Log Cards */}
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 text-xs font-mono">
                No ledger events match the current filter.
              </div>
            ) : (
              filteredLogs.map((log) => {
                const isSec = log.severity === 'security';
                const isWarn = log.severity === 'warn';
                return (
                  <div
                    key={log.id}
                    className={`p-3 rounded-xl border text-xs font-mono transition-colors ${
                      isSec
                        ? 'bg-rose-950/20 border-rose-900/50 hover:bg-rose-950/30'
                        : isWarn
                        ? 'bg-amber-950/20 border-amber-900/50 hover:bg-amber-950/30'
                        : 'bg-zinc-950/70 border-zinc-850 hover:bg-zinc-950'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {isSec ? (
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        ) : isWarn ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        ) : (
                          <Info className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        )}
                        <span
                          className={`font-bold ${
                            isSec
                              ? 'text-rose-400'
                              : isWarn
                              ? 'text-amber-400'
                              : 'text-zinc-200'
                          }`}
                        >
                          {log.action}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-500 shrink-0">
                        {new Date(log.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </span>
                    </div>

                    <p className="text-[11px] text-zinc-300 mt-1 leading-relaxed pl-5 font-sans">
                      {log.details}
                    </p>

                    <div className="mt-2 pt-2 border-t border-zinc-850/80 flex items-center gap-3 text-[10px] text-zinc-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <span className="text-zinc-400 font-semibold">Actor:</span>
                        <span className="text-zinc-300">{log.actor}</span>
                      </span>
                      {log.ip && (
                        <span className="flex items-center gap-1">
                          <span className="text-zinc-400 font-semibold">IP:</span>
                          <span className="text-zinc-300">{log.ip}</span>
                        </span>
                      )}
                      <span className="text-zinc-600 truncate max-w-[120px]" title={log.id}>
                        {log.id}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
