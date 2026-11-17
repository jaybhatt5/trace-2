import fs from 'fs';
import path from 'path';
import { getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export type AnalysisHistoryType = 'deepfake' | 'news_factcheck' | 'media_ocr' | 'text_nlp';

export interface UserPerspective {
  choice: 'trustworthy' | 'context' | 'misleading' | 'false' | 'unsure';
  comment?: string;
  submittedAt: string;
}

export interface UserHistoryItem {
  id: string;
  userId: string;
  type: AnalysisHistoryType;
  title: string;
  claim: string;
  originalFilename?: string;
  sourceUrl?: string;
  verdict: string;
  verdictLabel?: string;
  summary: string;
  evidence: string[];
  keyFindings?: string[];
  sources?: Array<{
    name: string;
    url?: string;
    publisher?: string;
    publicationDate?: string;
    credibilityScore?: number;
    type?: string;
  }>;
  metadata?: Record<string, any>;
  userPerspective?: UserPerspective;
  timestamp: string;
}

const HISTORY_DIR = path.join(process.cwd(), 'backend', 'data', 'user_history');

function ensureHistoryDir(): void {
  if (!fs.existsSync(HISTORY_DIR)) {
    fs.mkdirSync(HISTORY_DIR, { recursive: true });
  }
}

function getUserHistoryFilePath(uid: string): string {
  // Sanitize uid to prevent path traversal
  const safeUid = uid.replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(HISTORY_DIR, `${safeUid}.json`);
}

function readUserHistoryFile(uid: string): UserHistoryItem[] {
  ensureHistoryDir();
  const filePath = getUserHistoryFilePath(uid);
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn(`[TRACE History] Error reading history for user ${uid}:`, err);
  }
  return [];
}

function writeUserHistoryFile(uid: string, items: UserHistoryItem[]): void {
  ensureHistoryDir();
  const filePath = getUserHistoryFilePath(uid);
  const tempPath = `${filePath}.tmp.${Date.now()}`;
  try {
    fs.writeFileSync(tempPath, JSON.stringify(items, null, 2), 'utf-8');
    fs.renameSync(tempPath, filePath);
  } catch (err) {
    if (fs.existsSync(tempPath)) {
      try { fs.unlinkSync(tempPath); } catch {}
    }
    console.error(`[TRACE History] Error writing history for user ${uid}:`, err);
    throw new Error('Failed to save user history to persistent storage.');
  }
}

/**
 * Sanitize metadata to guarantee no multi-megabyte base64 payloads are stored in history.
 */
function sanitizeMetadata(metadata?: Record<string, any>): Record<string, any> | undefined {
  if (!metadata) return undefined;
  const clean: Record<string, any> = {};
  for (const [k, v] of Object.entries(metadata)) {
    if (typeof v === 'string' && (v.startsWith('data:image') || v.startsWith('data:video') || v.length > 2000)) {
      // Omit large base64 data to protect privacy and storage
      continue;
    }
    if (k === 'frames' || k === 'imageBase64' || k === 'videoBase64' || k === 'mediaBase64') {
      continue;
    }
    clean[k] = v;
  }
  return clean;
}

/**
 * Get all history items for an authenticated user with optional filtering and search.
 */
export async function getUserHistory(
  uid: string,
  filter?: { type?: string; verdict?: string; search?: string }
): Promise<UserHistoryItem[]> {
  let items = readUserHistoryFile(uid);

  if (filter?.type && filter.type !== 'all') {
    items = items.filter((i) => i.type === filter.type);
  }
  if (filter?.verdict && filter.verdict !== 'all') {
    items = items.filter((i) => i.verdict.toLowerCase().includes(filter.verdict!.toLowerCase()));
  }
  if (filter?.search) {
    const q = filter.search.toLowerCase().trim();
    items = items.filter(
      (i) =>
        i.title?.toLowerCase().includes(q) ||
        i.claim?.toLowerCase().includes(q) ||
        i.summary?.toLowerCase().includes(q)
    );
  }

  // Sort newest first
  items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return items;
}

/**
 * Get a single history item for an authenticated user.
 * Enforces ownership: returns null if the record does not belong to uid.
 */
export async function getUserHistoryItem(uid: string, historyId: string): Promise<UserHistoryItem | null> {
  const items = readUserHistoryFile(uid);
  return items.find((i) => i.id === historyId && i.userId === uid) || null;
}

/**
 * Add a completed analysis to the authenticated user's personal history.
 */
export async function addUserHistoryItem(
  uid: string,
  data: Omit<UserHistoryItem, 'id' | 'userId' | 'timestamp'> & { id?: string; timestamp?: string }
): Promise<UserHistoryItem> {
  const items = readUserHistoryFile(uid);
  const historyId = data.id || `hist_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  const newItem: UserHistoryItem = {
    id: historyId,
    userId: uid,
    type: data.type,
    title: data.title,
    claim: data.claim,
    originalFilename: data.originalFilename,
    sourceUrl: data.sourceUrl,
    verdict: data.verdict,
    verdictLabel: data.verdictLabel,
    summary: data.summary,
    evidence: Array.isArray(data.evidence) ? data.evidence : (data.keyFindings || []),
    keyFindings: Array.isArray(data.keyFindings) ? data.keyFindings : data.evidence,
    sources: data.sources || [],
    metadata: sanitizeMetadata(data.metadata),
    userPerspective: data.userPerspective,
    timestamp: data.timestamp || new Date().toISOString(),
  };

  // Prepend to user's history list
  const updatedItems = [newItem, ...items.filter((i) => i.id !== historyId)];
  writeUserHistoryFile(uid, updatedItems);

  // Optionally mirror to Firestore if admin has credentials
  try {
    if (getApps().length > 0) {
      const db = getFirestore();
      await db.collection('users').doc(uid).collection('history').doc(historyId).set(newItem);
    }
  } catch (fsErr) {
    // Firestore mirror is optional/supplementary; local storage is authoritative
  }

  return newItem;
}

/**
 * Update an existing user history item (e.g. attach user's reading/perspective).
 */
export async function updateUserHistoryItem(
  uid: string,
  historyId: string,
  updates: Partial<UserHistoryItem>
): Promise<UserHistoryItem | null> {
  const items = readUserHistoryFile(uid);
  const index = items.findIndex((i) => i.id === historyId && i.userId === uid);
  if (index === -1) return null;

  const current = items[index];
  const updated: UserHistoryItem = {
    ...current,
    ...updates,
    id: current.id,
    userId: current.userId, // immutable ownership
  };

  items[index] = updated;
  writeUserHistoryFile(uid, items);

  try {
    if (getApps().length > 0) {
      const db = getFirestore();
      await db.collection('users').doc(uid).collection('history').doc(historyId).set(updated, { merge: true });
    }
  } catch (fsErr) {
    // supplementary
  }

  return updated;
}

/**
 * Delete a specific history item belonging to uid.
 */
export async function deleteUserHistoryItem(uid: string, historyId: string): Promise<boolean> {
  const items = readUserHistoryFile(uid);
  const filtered = items.filter((i) => i.id !== historyId);
  if (filtered.length === items.length) {
    return false; // Item not found or belongs to another user
  }

  writeUserHistoryFile(uid, filtered);

  try {
    if (getApps().length > 0) {
      const db = getFirestore();
      await db.collection('users').doc(uid).collection('history').doc(historyId).delete();
    }
  } catch (fsErr) {
    // supplementary
  }

  return true;
}

/**
 * Clear all history entries for the authenticated user.
 */
export async function clearUserHistory(uid: string): Promise<number> {
  const items = readUserHistoryFile(uid);
  const count = items.length;
  writeUserHistoryFile(uid, []);

  try {
    if (getApps().length > 0) {
      const db = getFirestore();
      const snapshot = await db.collection('users').doc(uid).collection('history').get();
      const batch = db.batch();
      snapshot.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
    }
  } catch (fsErr) {
    // supplementary
  }

  return count;
}

/**
 * Export all data belonging to the user in compliance with privacy laws (GDPR / Indian DPDP).
 */
export async function exportUserData(uid: string, userClaims?: any) {
  const history = readUserHistoryFile(uid);
  return {
    userId: uid,
    email: userClaims?.email || null,
    phoneNumber: userClaims?.phone_number || null,
    historyCount: history.length,
    history,
    exportedAt: new Date().toISOString(),
    retentionNotice: 'TRACE does not retain uploaded media by default. Analysis results are stored privately until deleted by user.',
  };
}

/**
 * Delete user account data and all associated personal history.
 */
export async function deleteUserAccountData(uid: string): Promise<boolean> {
  try {
    ensureHistoryDir();
    const filePath = getUserHistoryFilePath(uid);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    if (getApps().length > 0) {
      try {
        const db = getFirestore();
        const historySnapshot = await db.collection('users').doc(uid).collection('history').get();
        const batch = db.batch();
        historySnapshot.docs.forEach((doc) => batch.delete(doc.ref));
        batch.delete(db.collection('users').doc(uid));
        await batch.commit();
      } catch {
        // ignore
      }
    }
    return true;
  } catch (err) {
    console.error(`[TRACE History] Failed to delete account data for user ${uid}:`, err);
    return false;
  }
}
