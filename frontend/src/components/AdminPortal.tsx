// TRACE - Master Sentinel Operations Console & Admin Space
import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Lock,
  LogOut,
  Terminal,
  Activity,
  RefreshCw,
  Eye,
  EyeOff,
  CheckCircle2,
  Sliders,
  Radio,
  ArrowRight,
} from 'lucide-react';
import { TraceLogo } from './TraceLogo';
import type { FactCheckItem, ContentCategory, OverviewStatsResponse } from '../types';
import { AdminTelemetryTab } from './admin/AdminTelemetryTab';
import { AdminControlsTab } from './admin/AdminControlsTab';
import { AdminEditorialTab } from './admin/AdminEditorialTab';
import { AdminAuditLedgerTab } from './admin/AdminAuditLedgerTab';
import { AdminArticleModal } from './admin/AdminArticleModal';

interface AdminPortalProps {
  onBackToPublic: () => void;
  feedItems: FactCheckItem[];
  onRefreshFeed: () => Promise<void>;
  currentUser?: any;
  onLogout?: () => void;
}

interface AuditLogItem {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  details: string;
  ip?: string;
  severity: 'info' | 'warn' | 'security';
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  onBackToPublic,
  feedItems,
  onRefreshFeed,
  currentUser: _propUser,
  onLogout: propLogout,
}) => {
  // ---------------------------------------------------------------------------
  // AUTHENTICATION & SESSION STATE
  // ---------------------------------------------------------------------------
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    return sessionStorage.getItem('trace_admin_session_token') || null;
  });

  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Active Admin Sub-Desk Tab
  const [activeAdminTab, setActiveAdminTab] = useState<'telemetry' | 'controls' | 'editorial' | 'ledger'>(() => {
    const saved = sessionStorage.getItem('trace_admin_default_subtab');
    if (saved === 'ledger' || saved === 'controls' || saved === 'editorial' || saved === 'telemetry') {
      sessionStorage.removeItem('trace_admin_default_subtab');
      return saved;
    }
    return 'telemetry';
  });

  useEffect(() => {
    const handleSubTabEvent = (e: Event) => {
      const custom = e as CustomEvent;
      if (custom.detail && ['telemetry', 'controls', 'editorial', 'ledger'].includes(custom.detail)) {
        setActiveAdminTab(custom.detail);
      }
    };
    window.addEventListener('trace:open-admin-subtab', handleSubTabEvent);
    return () => window.removeEventListener('trace:open-admin-subtab', handleSubTabEvent);
  }, []);

  // Real-time System Telemetry & Statistics
  const [systemData, setSystemData] = useState<OverviewStatsResponse | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [_statsError, setStatsError] = useState<string | null>(null);

  // Live Audit Ledger Filter & Controls State
  const [isAutoRefreshLogs, setIsAutoRefreshLogs] = useState(true);

  // Diagnostic Ping State
  const [diagnosticPing, setDiagnosticPing] = useState<Record<string, { ok: boolean; latencyMs: number; details: string }> | null>(null);
  const [isPinging, setIsPinging] = useState(false);

  // Control Actions Loading
  const [isUpdatingControl, setIsUpdatingControl] = useState(false);
  const [controlNotice, setControlNotice] = useState<string | null>(null);

  // CMS Edit / Publish State
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FactCheckItem | null>(null);

  // CMS Publish Form
  const [formTitle, setFormTitle] = useState('');
  const [formClaim, setFormClaim] = useState('');
  const [formVerdict, setFormVerdict] = useState<string>('SUPPORTED_BY_EVIDENCE');
  const [formCategory, setFormCategory] = useState<ContentCategory>('World News');
  const [formSummary, setFormSummary] = useState('');
  const [formExplanation, setFormExplanation] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1000&q=80');
  const [formFindings, setFormFindings] = useState('Official wire archives corroborate claim parameters.\nNo doctored media artifacts detected.');
  const [isSavingArticle, setIsSavingArticle] = useState(false);
  const [articleError, setArticleError] = useState<string | null>(null);

  // Helper to obtain admin authorization header
  const getAdminHeaders = (): HeadersInit => {
    return {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'ngrok-skip-browser-warning': 'true',
      Authorization: `Bearer ${adminToken || ''}`,
    };
  };

  // ---------------------------------------------------------------------------
  // AUTHENTICATION HANDLERS
  // ---------------------------------------------------------------------------
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsAuthenticating(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({
          username: adminUsername.trim(),
          password: adminPassword.trim(),
        }),
      });

      const text = await res.text();
      let data: any = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        // Response was not JSON
      }

      if (!res.ok || !data?.token) {
        const errorMsg =
          data?.message ||
          data?.error ||
          (res.status === 401
            ? 'Authentication denied. Invalid master admin credentials.'
            : res.status === 404
            ? 'Administrator login API endpoint not found. Please ensure the backend server is running.'
            : `Authentication failed (HTTP ${res.status}).`);
        throw new Error(errorMsg);
      }

      setAdminToken(data.token);
      sessionStorage.setItem('trace_admin_session_token', data.token);
      localStorage.removeItem('trace_admin_session_token');

      const adminUser = {
        uid: data.user?.uid || 'admin_root',
        email: data.user?.email || adminUsername.trim(),
        phoneNumber: null,
        displayName: data.user?.displayName || 'Master Administrator',
        photoURL: null,
        role: 'admin',
        isAdmin: true,
        isAnonymous: false,
        emailVerified: true,
        providerId: 'admin-password',
      };
      sessionStorage.setItem('trace_auth_user', JSON.stringify(adminUser));
      localStorage.setItem('trace_auth_user', JSON.stringify(adminUser));

      setAdminPassword('');
    } catch (err: any) {
      setLoginError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleAdminLogout = () => {
    setAdminToken(null);
    sessionStorage.removeItem('trace_admin_session_token');
    localStorage.removeItem('trace_admin_session_token');
    if (propLogout) propLogout();
  };

  // ---------------------------------------------------------------------------
  // DATA FETCHING: REAL TELEMETRY & AUDIT LOGS
  // ---------------------------------------------------------------------------
  const fetchOverviewStats = async () => {
    if (!adminToken) return;
    setIsLoadingStats(true);
    setStatsError(null);

    try {
      const res = await fetch('/api/admin/overview-stats', {
        headers: getAdminHeaders(),
      });

      if (res.status === 401 || res.status === 403) {
        handleAdminLogout();
        throw new Error('Administrative session expired or invalid. Please re-authenticate.');
      }

      const data = await res.json();
      if (data.success) {
        setSystemData(data);
      } else {
        throw new Error(data.error || 'Failed to fetch platform telemetry.');
      }
    } catch (err: any) {
      setStatsError(err.message);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const fetchAuditLogs = async () => {
    if (!adminToken) return;
    try {
      const res = await fetch('/api/admin/audit-logs', {
        headers: getAdminHeaders(),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.logs)) {
        setAuditLogs(data.logs);
      }
    } catch (err) {
      console.warn('[TRACE Admin] Audit log notice:', err);
    }
  };

  const handleClearLogs = async () => {
    if (!adminToken) return;
    if (!confirm('Are you sure you want to purge the live audit activity ledger?')) return;
    try {
      const res = await fetch('/api/admin/audit-logs', {
        method: 'DELETE',
        headers: getAdminHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setAuditLogs(data.logs || []);
        setControlNotice('Audit ledger purged successfully.');
      }
    } catch (err) {
      console.warn('[TRACE Admin] Clear logs error:', err);
    }
  };

  const handleExportLogs = () => {
    const blob = new Blob([JSON.stringify(auditLogs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `trace-audit-ledger-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (adminToken) {
      fetchOverviewStats();
      fetchAuditLogs();
      const interval = setInterval(() => {
        fetchOverviewStats();
        if (isAutoRefreshLogs) {
          fetchAuditLogs();
        }
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [adminToken, isAutoRefreshLogs]);

  // ---------------------------------------------------------------------------
  // SYSTEM CONTROLS & OVERRIDES
  // ---------------------------------------------------------------------------
  const handleUpdateControls = async (updates: any) => {
    if (!adminToken) return;
    setIsUpdatingControl(true);
    setControlNotice(null);

    try {
      const res = await fetch('/api/admin/system/control', {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify(updates),
      });

      const data = await res.json();
      if (data.success && data.controls) {
        setSystemData((prev: any) => prev ? { ...prev, controls: data.controls } : prev);
        setControlNotice(data.message || 'System controls successfully calibrated.');
        setTimeout(() => setControlNotice(null), 4000);
      } else {
        throw new Error(data.error || 'Failed to apply system controls.');
      }
    } catch (err: any) {
      alert(`Control adjustment failed: ${err.message}`);
    } finally {
      setIsUpdatingControl(false);
    }
  };

  // ---------------------------------------------------------------------------
  // DIAGNOSTIC PING
  // ---------------------------------------------------------------------------
  const handleRunDiagnosticPing = async () => {
    if (!adminToken) return;
    setIsPinging(true);
    setDiagnosticPing(null);

    try {
      const res = await fetch('/api/admin/diagnostics/ping', {
        method: 'POST',
        headers: getAdminHeaders(),
      });
      const data = await res.json();
      if (data.success && data.diagnostics) {
        setDiagnosticPing(data.diagnostics);
      }
    } catch (err) {
      console.warn('[TRACE Admin] Diagnostic ping error:', err);
    } finally {
      setIsPinging(false);
    }
  };

  // ---------------------------------------------------------------------------
  // CMS ARTICLE EDIT / PUBLISH HANDLERS
  // ---------------------------------------------------------------------------
  const handleOpenEdit = (item: FactCheckItem) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormClaim(item.claim);
    setFormVerdict(item.verdict);
    setFormCategory(item.category as ContentCategory);
    setFormSummary(item.summary);
    setFormExplanation(item.explanation || '');
    setFormFindings(Array.isArray(item.keyFindings) ? item.keyFindings.join('\n') : '');
    setFormImageUrl(item.imageUrl || '');
    setArticleError(null);
    setIsPublishModalOpen(true);
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormTitle('');
    setFormClaim('');
    setFormVerdict('SUPPORTED_BY_EVIDENCE');
    setFormCategory('World News');
    setFormSummary('');
    setFormExplanation('');
    setFormFindings('Primary sources cross-referenced.\nCorroborated by international wire archives.');
    setFormImageUrl('https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1000&q=80');
    setArticleError(null);
    setIsPublishModalOpen(true);
  };

  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken) return;
    setIsSavingArticle(true);
    setArticleError(null);

    const findingsArr = formFindings
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      title: formTitle.trim(),
      claim: formClaim.trim(),
      verdict: formVerdict,
      category: formCategory,
      summary: formSummary.trim(),
      explanation: formExplanation.trim() || formSummary.trim(),
      keyFindings: findingsArr.length > 0 ? findingsArr : ['Corroborated by accredited news agencies.'],
      imageUrl: formImageUrl.trim(),
      tags: ['Admin Verified', formCategory],
      author: 'TRACE Sentinel Editorial Bureau',
    };

    try {
      const url = editingItem ? `/api/admin/news/${editingItem.id}` : '/api/admin/news';
      const method = editingItem ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: getAdminHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setIsPublishModalOpen(false);
        await onRefreshFeed();
        await fetchOverviewStats();
      } else {
        throw new Error(data.error || 'Failed to save editorial article.');
      }
    } catch (err: any) {
      setArticleError(err.message);
    } finally {
      setIsSavingArticle(false);
    }
  };

  const handleDeleteArticle = async (id: string, title: string) => {
    if (!adminToken) return;
    if (!confirm(`Are you sure you want to permanently delete "${title}" from the editorial wire?`)) return;

    try {
      const res = await fetch(`/api/admin/news/${id}`, {
        method: 'DELETE',
        headers: getAdminHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        await onRefreshFeed();
        await fetchOverviewStats();
      } else {
        alert(data.error || 'Failed to delete article.');
      }
    } catch (err: any) {
      alert(`Deletion error: ${err.message}`);
    }
  };

  // ---------------------------------------------------------------------------
  // VIEW 1: LOCKED ADMINISTRATIVE AUTHENTICATION GATEWAY
  // ---------------------------------------------------------------------------
  if (!adminToken) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-center items-center p-4 font-sans selection:bg-rose-500 selection:text-white">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-3">
            <div className="inline-flex p-3 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl relative">
              <TraceLogo className="w-12 h-12" />
              <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px] font-mono font-semibold uppercase tracking-wider mb-2">
                <Lock className="w-3 h-3" />
                <span>Clearance Level 5 • Restricted Zone</span>
              </div>
              <h2 className="text-2xl font-black tracking-tight text-white font-mono">
                TRACE Sentinel Master Console
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Authorized Personnel Only • Unrestricted Security Override
              </p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-2xl backdrop-blur-xl space-y-5">
            {loginError && (
              <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-mono flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                  Admin Username / Email
                </label>
                <input
                  type="text"
                  required
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  placeholder="admin@domain.com"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-rose-500 transition-colors font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                  Master Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-rose-500 transition-colors font-mono pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isAuthenticating}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-mono font-bold text-xs uppercase tracking-wider shadow-lg shadow-rose-950/50 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isAuthenticating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Authenticate Master Clearance</span>
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={onBackToPublic}
                className="text-xs text-zinc-500 hover:text-zinc-300 font-mono transition-colors cursor-pointer"
              >
                ← Return to Public Verification Portal
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // VIEW 2: AUTHORIZED SENTINEL OPERATIONS MASTER CONSOLE
  // ---------------------------------------------------------------------------
  const sys = systemData?.system;
  const controls = systemData?.controls;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-rose-500 selection:text-white pb-20">
      {/* Top Operations Header Bar */}
      <header className="sticky top-0 z-30 bg-zinc-950/95 border-b border-zinc-800 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-3 transition-colors">
        <div className="max-w-[1720px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <TraceLogo className="w-9 h-9 rounded-xl shadow-md" />
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-zinc-950 ${
                  controls?.maintenanceMode ? 'bg-amber-500 animate-ping' : 'bg-emerald-500 animate-pulse'
                }`}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-sm sm:text-base text-zinc-50 tracking-tight font-mono">
                  TRACE SENTINEL MASTER OPERATIONS
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/30">
                  Level 5 Clearance
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-mono flex items-center gap-2">
                <span>Actor: <strong className="text-zinc-200">{adminUsername || 'Administrator'}</strong></span>
                <span>•</span>
                <span className={controls?.maintenanceMode ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                  {controls?.maintenanceMode ? 'DEFCON 3 • MAINTENANCE ACTIVE' : 'DEFCON 1 • ALL ENGINES NOMINAL'}
                </span>
              </p>
            </div>
          </div>

          {/* Quick Hardware Ticker & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
            {sys && (
              <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-400">
                <span>Uptime: <strong className="text-zinc-200">{sys.uptimeFormatted}</strong></span>
                <span>•</span>
                <span>Heap: <strong className="text-zinc-200">{sys.memoryHeapUsedMb} MB</strong></span>
                <span>•</span>
                <span>CPU: <strong className="text-zinc-200">{sys.cpuCount} Cores</strong></span>
              </div>
            )}

            <button
              type="button"
              onClick={fetchOverviewStats}
              disabled={isLoadingStats}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
              title="Refresh Telemetry"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingStats ? 'animate-spin text-rose-400' : ''}`} />
            </button>

            <button
              type="button"
              onClick={onBackToPublic}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-mono font-semibold transition-colors cursor-pointer"
            >
              Public Wire
            </button>

            <button
              type="button"
              onClick={handleAdminLogout}
              className="px-3 py-1.5 rounded-xl bg-rose-600/15 hover:bg-rose-600/25 border border-rose-500/30 text-rose-300 text-xs font-mono font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Terminate Session</span>
            </button>
          </div>
        </div>

        {/* Sub-Desk Navigation Tabs */}
        <div className="max-w-[1720px] mx-auto mt-3 pt-2 border-t border-zinc-850 flex items-center gap-1 overflow-x-auto no-scrollbar font-mono text-xs">
          <button
            onClick={() => setActiveAdminTab('telemetry')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeAdminTab === 'telemetry'
                ? 'bg-zinc-800 text-white shadow-xs border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-rose-400" />
            <span>Mission Telemetry &amp; Stats</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('controls')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeAdminTab === 'controls'
                ? 'bg-zinc-800 text-white shadow-xs border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>Platform Controls &amp; Engine</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('editorial')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeAdminTab === 'editorial'
                ? 'bg-zinc-800 text-white shadow-xs border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-blue-400" />
            <span>Editorial Wire CMS ({feedItems.length})</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('ledger')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeAdminTab === 'ledger'
                ? 'bg-zinc-800 text-white shadow-xs border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span>Security Ledger &amp; Users</span>
          </button>
        </div>
      </header>

      {/* Main Operations Canvas */}
      <main className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {controlNotice && (
          <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs font-mono flex items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              {controlNotice}
            </span>
          </div>
        )}

        {activeAdminTab === 'telemetry' && (
          <AdminTelemetryTab
            systemData={systemData}
            diagnosticPing={diagnosticPing}
            isPinging={isPinging}
            onRunDiagnosticPing={handleRunDiagnosticPing}
          />
        )}

        {activeAdminTab === 'controls' && (
          <AdminControlsTab
            systemData={systemData}
            isUpdatingControl={isUpdatingControl}
            onUpdateControls={handleUpdateControls}
          />
        )}

        {activeAdminTab === 'editorial' && (
          <AdminEditorialTab
            feedItems={feedItems}
            onOpenCreate={handleOpenCreate}
            onOpenEdit={handleOpenEdit}
            onDeleteArticle={handleDeleteArticle}
          />
        )}

        {activeAdminTab === 'ledger' && (
          <AdminAuditLedgerTab
            systemData={systemData}
            auditLogs={auditLogs}
            isAutoRefreshLogs={isAutoRefreshLogs}
            setIsAutoRefreshLogs={setIsAutoRefreshLogs}
            fetchAuditLogs={fetchAuditLogs}
            onExportLogs={handleExportLogs}
            onClearLogs={handleClearLogs}
          />
        )}
      </main>

      {/* CMS Publish / Edit Modal Dialog */}
      <AdminArticleModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        editingItem={editingItem}
        formTitle={formTitle}
        setFormTitle={setFormTitle}
        formClaim={formClaim}
        setFormClaim={setFormClaim}
        formVerdict={formVerdict}
        setFormVerdict={setFormVerdict}
        formCategory={formCategory}
        setFormCategory={setFormCategory}
        formSummary={formSummary}
        setFormSummary={setFormSummary}
        formFindings={formFindings}
        setFormFindings={setFormFindings}
        formImageUrl={formImageUrl}
        setFormImageUrl={setFormImageUrl}
        articleError={articleError}
        isSavingArticle={isSavingArticle}
        onSaveArticle={handleSaveArticle}
      />
    </div>
  );
};
