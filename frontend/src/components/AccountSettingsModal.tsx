// TRACE - User Account & Privacy Governance Modal
import React, { useState } from 'react';
import {
  X,
  User,
  Shield,
  Lock,
  Download,
  Trash2,
  LogOut,
  FileText,
  Mail,
  Phone,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { TraceLogo } from './TraceLogo';
import { TraceAuthUser, logoutUser, getAuthHeaders } from '../utils/firebase';

interface AccountSettingsModalProps {
  currentUser: TraceAuthUser;
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTerms: () => void;
  onNavigateToPrivacy: () => void;
  onLogout: () => void;
  onHistoryCleared?: () => void;
}

export const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({
  currentUser,
  isOpen,
  onClose,
  onNavigateToTerms,
  onNavigateToPrivacy,
  onLogout,
  onHistoryCleared,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'privacy'>('profile');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState<boolean>(false);
  const [isClearingHistory, setIsClearingHistory] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  // Handle Export Personal Data
  const handleExportData = async () => {
    setIsExporting(true);
    setStatusMessage(null);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/user/export', { headers });
      if (!res.ok) throw new Error('Data export request failed.');
      const json = await res.json();
      const blob = new Blob([JSON.stringify(json.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trace-account-export-${currentUser.uid}-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setStatusMessage({ type: 'success', text: 'Data export downloaded successfully.' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Export failed.' });
    } finally {
      setIsExporting(false);
    }
  };

  // Handle Clear History
  const handleClearHistory = async () => {
    setIsClearingHistory(true);
    setStatusMessage(null);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/history', { method: 'DELETE', headers });
      if (!res.ok) throw new Error('Failed to clear personal history.');
      if (onHistoryCleared) onHistoryCleared();
      setStatusMessage({ type: 'success', text: 'All personal analysis records cleared.' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Clear history failed.' });
    } finally {
      setIsClearingHistory(false);
    }
  };

  // Handle Delete Account
  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you absolutely sure you want to delete your account? All analysis history and preferences will be permanently wiped.')) {
      return;
    }
    setIsDeletingAccount(true);
    setStatusMessage(null);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/user/account', { method: 'DELETE', headers });
      if (!res.ok) throw new Error('Account deletion failed.');
      await logoutUser();
      onLogout();
      onClose();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Deletion failed.' });
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in font-sans">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-xl w-full text-zinc-900 dark:text-zinc-100 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Top Header */}
        <div className="p-4 sm:p-5 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <TraceLogo className="w-7 h-7 rounded-lg shrink-0" />
            <div className="min-w-0">
              <h3 className="font-bold text-sm sm:text-base text-zinc-950 dark:text-zinc-50 truncate">
                Account &amp; Privacy Settings
              </h3>
              <p className="text-[10px] text-zinc-500 font-mono truncate">
                UID: {currentUser.uid.slice(0, 16)}...
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Message Notification */}
        {statusMessage && (
          <div className={`p-3 text-xs flex items-center gap-2 border-b ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 text-rose-800 dark:text-rose-200'
          }`}>
            {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 px-4 pt-2 gap-2 text-xs">
          {[
            { id: 'profile', label: 'Profile & Identity', icon: User },
            { id: 'security', label: 'Session Security', icon: Lock },
            { id: 'privacy', label: 'Privacy & Portability', icon: Shield },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-3 border-b-2 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          
          {/* TAB 1: PROFILE & IDENTITY */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60">
                <div className="w-12 h-12 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold flex items-center justify-center text-lg shrink-0">
                  {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : 'U'}
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                    {currentUser.displayName || 'TRACE Verified User'}
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                    {currentUser.email || currentUser.phoneNumber || 'Anonymous Reader Session'}
                  </p>
                  <span className={`inline-block mt-1 text-[10px] font-mono px-2 py-0.2 rounded border uppercase font-semibold ${
                    currentUser.isAdmin
                      ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 text-amber-800 dark:text-amber-300'
                      : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-800 dark:text-emerald-300'
                  }`}>
                    {currentUser.isAdmin ? 'Editorial Administrator' : 'Citizen Reader'}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <label className="text-zinc-500 font-semibold font-mono text-[10px] uppercase">
                  Connected Authentication Provider
                </label>
                <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between">
                  <span className="capitalize font-medium">
                    {currentUser.providerId === 'google.com'
                      ? 'Google Workspace / Account'
                      : currentUser.providerId === 'phone'
                      ? 'Phone Number SMS Authentication'
                      : currentUser.providerId === 'password'
                      ? 'Email & Password'
                      : 'Anonymous Citizen Reader'}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                    Active
                  </span>
                </div>
              </div>

              {currentUser.email && (
                <div className="space-y-1 text-xs">
                  <label className="text-zinc-500 font-semibold font-mono text-[10px] uppercase">Email Verification</label>
                  <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between">
                    <span className="truncate">{currentUser.email}</span>
                    <span className="text-[10px] font-mono text-zinc-500">
                      {currentUser.emailVerified ? 'Verified' : 'Verification Email Sent'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SESSION SECURITY */}
          {activeTab === 'security' && (
            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 space-y-2">
                <div className="flex items-center gap-2 font-bold text-zinc-900 dark:text-zinc-100">
                  <Clock className="w-4 h-4 text-zinc-500" />
                  <span>Session Expiration &amp; Inactivity Protection</span>
                </div>
                <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed text-[11px]">
                  TRACE automatically refreshes your Firebase ID token in the background. To protect personal media and investigation data on shared workstations, sessions expire after 30 minutes of continuous inactivity.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <span className="font-semibold text-zinc-700 dark:text-zinc-300 block">Security Best Practices</span>
                <ul className="list-disc pl-5 space-y-1 text-zinc-500 dark:text-zinc-400 text-[11px]">
                  <li>Always sign out before leaving public or laboratory computers.</li>
                  <li>Administrative desks enforce elevated anti-bot verification and server-side token checks.</li>
                  <li>Passkeys and multi-factor authentication are enforced by your Google or Phone identity provider.</li>
                </ul>
              </div>

              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    logoutUser();
                    onLogout();
                    onClose();
                  }}
                  className="w-full py-2.5 px-4 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out of Current Device</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: PRIVACY & DATA GOVERNANCE */}
          {activeTab === 'privacy' && (
            <div className="space-y-4 text-xs">
              <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-1">
                <span className="font-bold text-zinc-900 dark:text-zinc-100 block">Indian DPDP &amp; GDPR Compliance</span>
                <p className="text-zinc-500 text-[11px] leading-relaxed">
                  You have the right to access, export, or erase your personal data at any time. Uploaded media is never retained for secondary foundation training.
                </p>
              </div>

              {/* Data Portability */}
              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700 flex items-center justify-between gap-3">
                <div>
                  <h5 className="font-bold text-zinc-900 dark:text-zinc-100">Export My Data (JSON)</h5>
                  <p className="text-[11px] text-zinc-500">Download a full machine-readable archive of your personal analysis history.</p>
                </div>
                <button
                  type="button"
                  onClick={handleExportData}
                  disabled={isExporting}
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 shrink-0 cursor-pointer"
                >
                  {isExporting ? 'Exporting...' : 'Download JSON'}
                </button>
              </div>

              {/* Clear History */}
              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700 flex items-center justify-between gap-3">
                <div>
                  <h5 className="font-bold text-zinc-900 dark:text-zinc-100">Clear All Analysis History</h5>
                  <p className="text-[11px] text-zinc-500">Wipe all completed fact-checks and deepfake scans from your account.</p>
                </div>
                <button
                  type="button"
                  onClick={handleClearHistory}
                  disabled={isClearingHistory}
                  className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-700 shrink-0 cursor-pointer"
                >
                  {isClearingHistory ? 'Clearing...' : 'Clear History'}
                </button>
              </div>

              {/* Delete Account */}
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 flex items-center justify-between gap-3">
                <div>
                  <h5 className="font-bold text-rose-950 dark:text-rose-100">Permanently Delete Account</h5>
                  <p className="text-[11px] text-rose-700 dark:text-rose-300">Irrevocably deletes your authentication profile and data.</p>
                </div>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={isDeletingAccount}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold shrink-0 cursor-pointer"
                >
                  {isDeletingAccount ? 'Deleting...' : 'Delete Account'}
                </button>
              </div>

              {/* Legal Documentation Links */}
              <div className="pt-2 flex items-center justify-between text-xs text-zinc-500 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToTerms();
                  }}
                  className="underline hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
                >
                  Terms &amp; Conditions
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToPrivacy();
                  }}
                  className="underline hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
                >
                  Privacy Policy
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
