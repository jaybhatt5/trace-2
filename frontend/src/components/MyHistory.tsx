// TRACE - Personal User Analysis History Dashboard
import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Filter,
  Trash2,
  Download,
  Calendar,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Camera,
  Cpu,
  Newspaper,
  CheckCircle2,
  RefreshCw,
  XCircle,
  HelpCircle,
  ChevronRight,
  Eye,
  SlidersHorizontal,
  X
} from 'lucide-react';
import { UserHistoryItem } from '../types';
import { getAuthHeaders, TraceAuthUser } from '../utils/firebase';

interface MyHistoryProps {
  currentUser?: TraceAuthUser | null;
  onOpenReport?: (item: any) => void;
  onNavigateToTool?: (toolTab: string) => void;
  onSelectItem?: (item: any) => void;
  onSelectDeepfake?: (result: any) => void;
}

export const MyHistory: React.FC<MyHistoryProps> = ({
  currentUser,
  onOpenReport,
  onNavigateToTool,
  onSelectItem,
  onSelectDeepfake,
}) => {
  const [historyItems, setHistoryItems] = useState<UserHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [verdictFilter, setVerdictFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Confirmation dialogs
  const [itemToDelete, setItemToDelete] = useState<UserHistoryItem | null>(null);
  const [isClearingAll, setIsClearingAll] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Fetch history from backend
  const fetchHistory = async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    try {
      const headers = await getAuthHeaders();
      const params = new URLSearchParams();
      if (typeFilter !== 'all') params.set('type', typeFilter);
      if (verdictFilter !== 'all') params.set('verdict', verdictFilter);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(`/api/history?${params.toString()}`, { headers });
      if (!res.ok) {
        throw new Error('Failed to load personal history.');
      }
      const data = await res.json();
      if (data.items) {
        setHistoryItems(data.items);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not load your history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [currentUser, typeFilter, verdictFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchHistory();
  };

  // Delete individual record
  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setActionLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/history/${encodeURIComponent(itemToDelete.id)}`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) throw new Error('Failed to delete history record.');
      setHistoryItems((prev) => prev.filter((i) => i.id !== itemToDelete.id));
      setItemToDelete(null);
    } catch (err: any) {
      alert(err.message || 'Delete operation failed.');
    } finally {
      setActionLoading(false);
    }
  };

  // Clear all history
  const confirmClearAll = async () => {
    setActionLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/history', {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) throw new Error('Failed to clear history.');
      setHistoryItems([]);
      setIsClearingAll(false);
    } catch (err: any) {
      alert(err.message || 'Clear history failed.');
    } finally {
      setActionLoading(false);
    }
  };

  // Export as JSON
  const handleExportData = async () => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/user/export', { headers });
      if (!res.ok) throw new Error('Export failed.');
      const json = await res.json();
      const blob = new Blob([JSON.stringify(json.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trace-user-history-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || 'Data export failed.');
    }
  };

  // Format timestamp nicely
  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  // Sorted list
  const sortedItems = [...historyItems].sort((a, b) => {
    const diff = new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    return sortOrder === 'newest' ? diff : -diff;
  });

  const getVerdictBadge = (verdict: string) => {
    const v = (verdict || '').toLowerCase();
    if (v.includes('supported') || v.includes('authentic') || v.includes('verified') || v.includes('true') || v.includes('human')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          <CheckCircle2 className="w-3 h-3" />
          <span>{verdict}</span>
        </span>
      );
    }
    if (v.includes('debunked') || v.includes('fake') || v.includes('ai-generated')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
          <XCircle className="w-3 h-3" />
          <span>{verdict}</span>
        </span>
      );
    }
    if (v.includes('misleading') || v.includes('manipulated') || v.includes('context')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          <AlertTriangle className="w-3 h-3" />
          <span>{verdict}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
        <HelpCircle className="w-3 h-3" />
        <span>{verdict}</span>
      </span>
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'deepfake':
        return <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case 'media_ocr':
        return <Camera className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'text_nlp':
        return <Cpu className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      default:
        return <Newspaper className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'deepfake':
        return 'Deepfake Vision';
      case 'media_ocr':
        return 'Photo & OCR';
      case 'text_nlp':
        return 'NLP Forensics';
      default:
        return 'News Fact-Check';
    }
  };

  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center">
          <History className="w-8 h-8 text-zinc-400" />
        </div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2 font-sans">
          Sign In to Access Your Personal History
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto mb-6">
          Your completed fact-checks, deepfake audits, and OCR media investigations are saved securely under your personal account.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
      
      {/* Top Banner & Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200 dark:border-zinc-800 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
              <History className="w-4 h-4" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 font-sans">
              My Analysis History
            </h1>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Isolated personal activity log • Private by default under <code className="font-mono text-[11px]">users/{currentUser.uid.slice(0, 8)}...</code>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportData}
            disabled={historyItems.length === 0}
            className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            title="Download full JSON export of your personal analysis history"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Data</span>
          </button>

          <button
            type="button"
            onClick={() => setIsClearingAll(true)}
            disabled={historyItems.length === 0}
            className="px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-semibold hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 sm:p-4 mb-6 shadow-2xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search across your saved claims, topics, or verdicts..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer shrink-0"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs">
          {/* Analysis Type Filters */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-zinc-400 text-[11px] font-mono mr-1">TYPE:</span>
            {[
              { id: 'all', label: 'All Activity' },
              { id: 'news_factcheck', label: 'News Fact-Checks' },
              { id: 'deepfake', label: 'Deepfake Scans' },
              { id: 'media_ocr', label: 'Photo & OCR' },
              { id: 'text_nlp', label: 'NLP Text' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTypeFilter(t.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                  typeFilter === t.id
                    ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Date Sorting */}
          <div className="flex items-center gap-2">
            <span className="text-zinc-400 text-[11px] font-mono">SORT:</span>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="text-[11px] py-1 px-2 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main History Records List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-zinc-500 font-mono">
          <RefreshCw className="w-5 h-5 mx-auto mb-2 animate-spin text-zinc-400" />
          <span>Loading your personal history records...</span>
        </div>
      ) : errorMessage ? (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs">
          {errorMessage}
        </div>
      ) : sortedItems.length === 0 ? (
        /* Empty State */
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-10 sm:p-14 text-center">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
            <History className="w-7 h-7 text-zinc-400" />
          </div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1 font-sans">
            No analysis records found
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto mb-6 leading-relaxed">
            Whenever you verify a news claim, test an image for deepfakes, or run OCR photo analysis, results will appear here automatically.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={() => onNavigateToTool('top-news')}
              className="px-3.5 py-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
            >
              Verify News Claim
            </button>
            <button
              type="button"
              onClick={() => onNavigateToTool('deepfake')}
              className="px-3.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
            >
              Deepfake Detector
            </button>
            <button
              type="button"
              onClick={() => onNavigateToTool('news-media')}
              className="px-3.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
            >
              Photo &amp; OCR
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedItems.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 sm:p-5 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors shadow-2xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-2 min-w-0 flex-1">
                  
                  {/* Category, Type & Timestamp */}
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
                    <span className="flex items-center gap-1 font-semibold text-zinc-700 dark:text-zinc-300">
                      {getTypeIcon(item.type)}
                      <span>{getTypeName(item.type)}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-mono text-zinc-400">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(item.timestamp)}</span>
                    </span>
                  </div>

                  {/* Title & Verdict */}
                  <div className="flex flex-wrap items-center gap-2">
                    {getVerdictBadge(item.verdictLabel || item.verdict)}
                    <h3 className="text-sm sm:text-base font-bold text-zinc-950 dark:text-zinc-50">
                      {item.title}
                    </h3>
                  </div>

                  {/* Claim Text */}
                  {item.claim && item.claim !== item.title && (
                    <p className="text-xs text-zinc-600 dark:text-zinc-300 italic border-l-2 border-zinc-200 dark:border-zinc-700 pl-2.5 py-0.5">
                      &quot;{item.claim}&quot;
                    </p>
                  )}

                  {/* Summary */}
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {item.summary}
                  </p>

                  {/* User Perspective Tag if submitted */}
                  {item.userPerspective && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-[11px] text-zinc-700 dark:text-zinc-300 font-mono">
                      <span>My Perspective:</span>
                      <strong className="capitalize text-zinc-900 dark:text-zinc-100">{item.userPerspective.choice}</strong>
                      {item.userPerspective.comment && (
                        <span className="text-zinc-500 truncate max-w-xs">&quot;{item.userPerspective.comment}&quot;</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Right Card Actions */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-100 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenReport) {
                        onOpenReport(item);
                      } else if (item.type === 'deepfake' && onSelectDeepfake) {
                        onSelectDeepfake(item.metadata || item);
                      } else if (onSelectItem) {
                        onSelectItem(item.metadata || item);
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Dossier</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setItemToDelete(item)}
                    className="p-1.5 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                    title="Delete this history record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Modal: Delete Single Item */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-sm w-full p-6 text-zinc-900 dark:text-zinc-100 shadow-2xl space-y-4">
            <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm mb-1">Delete History Record?</h4>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Are you sure you want to delete this analysis report? This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={actionLoading}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50 cursor-pointer"
              >
                {actionLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Clear All */}
      {isClearingAll && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-sm w-full p-6 text-zinc-900 dark:text-zinc-100 shadow-2xl space-y-4">
            <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm mb-1">Clear Entire Analysis History?</h4>
              <p className="text-xs text-zinc-500 leading-relaxed">
                This will permanently delete all {historyItems.length} personal analysis records from your account. This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsClearingAll(false)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmClearAll}
                disabled={actionLoading}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50 cursor-pointer"
              >
                {actionLoading ? 'Clearing...' : 'Clear All History'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
