import { Router } from 'express';
import {
  getUserHistory,
  getUserHistoryItem,
  addUserHistoryItem,
  updateUserHistoryItem,
  deleteUserHistoryItem,
  clearUserHistory,
  exportUserData,
  deleteUserAccountData,
} from '../services/historyService';
import { requireAuth, AuthenticatedRequest, createRateLimiter } from '../middleware/auth';
import { handleServerError } from '../services/systemService';

export const historyRouter = Router();
const authSensitiveLimiter = createRateLimiter(60 * 1000, 30, 'Too many auth or account requests. Please slow down.');

// GET /api/history: Retrieve personal history for current user
historyRouter.get('/history', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const uid = req.user!.uid;
    const filter = {
      type: req.query.type as string,
      verdict: req.query.verdict as string,
      search: req.query.search as string,
    };
    const history = await getUserHistory(uid, filter);
    res.json({ success: true, items: history, count: history.length });
  } catch (err: any) {
    return handleServerError(res, 'Failed to retrieve personal history', err);
  }
});

// GET /api/history/:id: Retrieve single history item (enforces user ownership)
historyRouter.get('/history/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const uid = req.user!.uid;
    const item = await getUserHistoryItem(uid, req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'History record not found or access denied.' });
    }
    res.json({ success: true, item });
  } catch (err: any) {
    return handleServerError(res, 'Failed to retrieve history item', err);
  }
});

// POST /api/history: Save item to personal history
historyRouter.post('/history', requireAuth, authSensitiveLimiter, async (req: AuthenticatedRequest, res) => {
  try {
    const uid = req.user!.uid;
    const saved = await addUserHistoryItem(uid, req.body);
    res.status(201).json({ success: true, item: saved });
  } catch (err: any) {
    return handleServerError(res, 'Failed to save to personal history', err);
  }
});

// DELETE /api/history/:id: Delete single history record
historyRouter.delete('/history/:id', requireAuth, authSensitiveLimiter, async (req: AuthenticatedRequest, res) => {
  try {
    const uid = req.user!.uid;
    const deleted = await deleteUserHistoryItem(uid, req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'History record not found or access denied.' });
    }
    res.json({ success: true, message: 'History record successfully deleted.' });
  } catch (err: any) {
    return handleServerError(res, 'Failed to delete history record', err);
  }
});

// DELETE /api/history: Clear all history records for the user
historyRouter.delete('/history', requireAuth, authSensitiveLimiter, async (req: AuthenticatedRequest, res) => {
  try {
    const uid = req.user!.uid;
    const count = await clearUserHistory(uid);
    res.json({ success: true, message: `Successfully cleared ${count} personal history records.` });
  } catch (err: any) {
    return handleServerError(res, 'Failed to clear user history', err);
  }
});

// GET /api/user/export: Export all user data (privacy compliance)
historyRouter.get('/user/export', requireAuth, authSensitiveLimiter, async (req: AuthenticatedRequest, res) => {
  try {
    const uid = req.user!.uid;
    const data = await exportUserData(uid, req.user);
    res.json({ success: true, data });
  } catch (err: any) {
    return handleServerError(res, 'Failed to export account data', err);
  }
});

// DELETE /api/user/account: Delete account data and history
historyRouter.delete('/user/account', requireAuth, authSensitiveLimiter, async (req: AuthenticatedRequest, res) => {
  try {
    const uid = req.user!.uid;
    const success = await deleteUserAccountData(uid);
    if (!success) {
      return res.status(500).json({ error: 'Failed to fully purge user account data.' });
    }
    res.json({ success: true, message: 'Account data and personal history purged successfully.' });
  } catch (err: any) {
    return handleServerError(res, 'Failed to delete account', err);
  }
});

// POST /api/perspective: User Participation - Credibility Feedback
historyRouter.post('/perspective', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const uid = req.user!.uid;
    const { historyId, choice, comment } = req.body;

    if (!historyId || !choice) {
      return res.status(400).json({ error: 'History ID and choice are required.' });
    }

    const validChoices = ['trustworthy', 'context', 'misleading', 'false', 'unsure'];
    if (!validChoices.includes(choice)) {
      return res.status(400).json({ error: `Invalid choice. Must be one of: ${validChoices.join(', ')}` });
    }

    const perspective = {
      choice,
      comment: (comment || '').trim().slice(0, 500),
      submittedAt: new Date().toISOString(),
    };

    const updated = await updateUserHistoryItem(uid, historyId, { userPerspective: perspective });
    res.json({ success: true, perspective, updated: Boolean(updated) });
  } catch (err: any) {
    return handleServerError(res, 'Failed to record user perspective', err);
  }
});
