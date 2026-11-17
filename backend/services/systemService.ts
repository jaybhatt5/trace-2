import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import express from 'express';

export interface AdminSystemControls {
  maintenanceMode: boolean;
  deepfakeConfidenceThreshold: number;
  liveFeedAutoRefresh: boolean;
  aiEngineMode: 'hybrid' | 'gemini_only' | 'local_only';
}

const systemControls: AdminSystemControls = {
  maintenanceMode: false,
  deepfakeConfidenceThreshold: 60,
  liveFeedAutoRefresh: true,
  aiEngineMode: 'hybrid',
};

export function getSystemControls(): AdminSystemControls {
  return systemControls;
}

export function updateSystemControls(updates: Partial<AdminSystemControls>): AdminSystemControls {
  if (typeof updates.maintenanceMode === 'boolean') {
    systemControls.maintenanceMode = updates.maintenanceMode;
  }
  if (typeof updates.deepfakeConfidenceThreshold === 'number') {
    systemControls.deepfakeConfidenceThreshold = updates.deepfakeConfidenceThreshold;
  }
  if (typeof updates.liveFeedAutoRefresh === 'boolean') {
    systemControls.liveFeedAutoRefresh = updates.liveFeedAutoRefresh;
  }
  if (updates.aiEngineMode && ['hybrid', 'gemini_only', 'local_only'].includes(updates.aiEngineMode)) {
    systemControls.aiEngineMode = updates.aiEngineMode;
  }
  return systemControls;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  details: string;
  ip?: string;
  severity: 'info' | 'warn' | 'security';
}

const auditLogs: AuditLogEntry[] = [
  {
    id: `log-init`,
    timestamp: new Date().toISOString(),
    action: 'SYSTEM_BOOT',
    actor: 'system',
    details: 'TRACE Sentinel Master Operations initialized.',
    severity: 'info',
  },
];

export function recordAuditLog(
  action: string,
  actor: string,
  details: string,
  severity: 'info' | 'warn' | 'security' = 'info',
  ip?: string
) {
  auditLogs.unshift({
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    action,
    actor,
    details,
    severity,
    ip,
  });
  if (auditLogs.length > 250) auditLogs.pop();
}

export function getAuditLogs(filter?: { severity?: string; action?: string; search?: string }): AuditLogEntry[] {
  let filtered = [...auditLogs];
  if (filter?.severity && filter.severity !== 'all') {
    filtered = filtered.filter((l) => l.severity === filter.severity);
  }
  if (filter?.action && filter.action !== 'all') {
    filtered = filtered.filter((l) => l.action.toLowerCase().includes(filter.action!.toLowerCase()));
  }
  if (filter?.search) {
    const q = filter.search.toLowerCase().trim();
    filtered = filtered.filter(
      (l) =>
        l.details.toLowerCase().includes(q) ||
        l.actor.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q) ||
        (l.ip && l.ip.includes(q))
    );
  }
  return filtered;
}

export function getAggregateUserStats() {
  const dir = path.join(process.cwd(), 'backend', 'data', 'user_history');
  if (!fs.existsSync(dir)) {
    return { userCount: 0, totalUserHistoryItems: 0, users: [] };
  }
  try {
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
    let totalItems = 0;
    const usersSummary: Array<{ uid: string; itemCount: number; lastActive: string }> = [];

    for (const file of files) {
      const uid = file.replace('.json', '');
      try {
        const content = fs.readFileSync(path.join(dir, file), 'utf-8');
        const items = JSON.parse(content);
        if (Array.isArray(items)) {
          totalItems += items.length;
          const lastActive = items[0]?.timestamp || new Date().toISOString();
          usersSummary.push({ uid, itemCount: items.length, lastActive });
        }
      } catch {
        // Skip corrupted user file
      }
    }
    return {
      userCount: files.length,
      totalUserHistoryItems: totalItems,
      users: usersSummary,
    };
  } catch {
    return { userCount: 0, totalUserHistoryItems: 0, users: [] };
  }
}

export function handleServerError(res: express.Response, errorPrefix: string, err: any) {
  const requestId = crypto.randomUUID();
  console.error(`[Internal Server Error - ${requestId}] ${errorPrefix}:`, err);
  return res.status(500).json({
    error: errorPrefix,
    message: 'An internal error occurred. Please contact system support with the requestId.',
    requestId,
  });
}
