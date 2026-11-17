import { Router } from 'express';
import crypto from 'crypto';
import { requireAdmin, AuthenticatedRequest } from '../middleware/nativeAuth';
import {
  hashPassword,
  revokeAllUserSessions,
  recordAuditLog,
  DbUser,
  sanitizeUser,
} from '../services/authService';
import { getDb } from '../database/db';

export const userAdminRouter = Router();

// Protect ALL routes in this router with requireAdmin
userAdminRouter.use(requireAdmin);

// -----------------------------------------------------------------------------
// 1. LIST USERS (Paginated with search & filters)
// -----------------------------------------------------------------------------
userAdminRouter.get('/users', (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
    const offset = (page - 1) * limit;
    const search = ((req.query.search as string) || '').trim().toLowerCase();
    const roleFilter = (req.query.role as string) || '';

    const db = getDb();
    let whereClauses: string[] = [];
    let params: any[] = [];

    if (search) {
      whereClauses.push('(email LIKE ? OR display_name LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (roleFilter && ['user', 'moderator', 'admin'].includes(roleFilter)) {
      whereClauses.push('role = ?');
      params.push(roleFilter);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const totalCount = (
      db.prepare(`SELECT COUNT(*) as count FROM users ${whereSql}`).get(...params) as any
    )?.count || 0;

    const users = db.prepare(`
      SELECT * FROM users
      ${whereSql}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset) as DbUser[];

    return res.json({
      success: true,
      users: users.map(sanitizeUser),
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (err: any) {
    console.error('[ADMIN LIST USERS ERROR]', err);
    return res.status(500).json({ error: 'Failed to retrieve user directory.' });
  }
});

// -----------------------------------------------------------------------------
// 2. CHANGE USER ROLE
// -----------------------------------------------------------------------------
userAdminRouter.post('/users/:id/role', (req: AuthenticatedRequest, res) => {
  try {
    const targetId = req.params.id;
    const { role } = req.body || {};

    if (!role || !['user', 'moderator', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Valid role is required (user, moderator, admin).' });
    }

    const db = getDb();
    const targetUser = db.prepare(`SELECT * FROM users WHERE id = ?`).get(targetId) as DbUser | undefined;
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Guard: Prevent the last admin from demoting themselves
    if (targetId === req.user!.id && role !== 'admin') {
      const adminCount = (
        db.prepare(`SELECT COUNT(*) as count FROM users WHERE role = 'admin' AND is_disabled = 0`).get() as any
      )?.count || 0;
      if (adminCount <= 1) {
        return res.status(400).json({ error: 'Cannot demote the sole active administrator.' });
      }
    }

    db.prepare(`
      UPDATE users
      SET role = ?, token_version = token_version + 1, updated_at = ?
      WHERE id = ?
    `).run(role, new Date().toISOString(), targetId);

    recordAuditLog(
      'USER_ROLE_CHANGED',
      req.user!.id,
      req.user!.email,
      `Changed role of ${targetUser.email} from ${targetUser.role} to ${role}`,
      targetId,
      req.ip
    );

    return res.json({
      success: true,
      message: `User role updated to ${role}.`,
    });
  } catch (err: any) {
    console.error('[ADMIN ROLE UPDATE ERROR]', err);
    return res.status(500).json({ error: 'Failed to update user role.' });
  }
});

// -----------------------------------------------------------------------------
// 3. ENABLE / DISABLE USER
// -----------------------------------------------------------------------------
userAdminRouter.post('/users/:id/status', (req: AuthenticatedRequest, res) => {
  try {
    const targetId = req.params.id;
    const { isDisabled } = req.body || {};

    if (typeof isDisabled !== 'boolean') {
      return res.status(400).json({ error: 'isDisabled boolean flag is required.' });
    }

    if (targetId === req.user!.id && isDisabled) {
      return res.status(400).json({ error: 'Cannot suspend your own administrator account.' });
    }

    const db = getDb();
    const targetUser = db.prepare(`SELECT * FROM users WHERE id = ?`).get(targetId) as DbUser | undefined;
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    db.prepare(`
      UPDATE users
      SET is_disabled = ?, token_version = token_version + 1, updated_at = ?
      WHERE id = ?
    `).run(isDisabled ? 1 : 0, new Date().toISOString(), targetId);

    if (isDisabled) {
      revokeAllUserSessions(targetId, req.user!.id, req.user!.email, req.ip);
    }

    recordAuditLog(
      isDisabled ? 'USER_DISABLED' : 'USER_ENABLED',
      req.user!.id,
      req.user!.email,
      `${isDisabled ? 'Suspended' : 'Reactivated'} account for ${targetUser.email}`,
      targetId,
      req.ip
    );

    return res.json({
      success: true,
      message: `User account ${isDisabled ? 'disabled' : 'enabled'}.`,
    });
  } catch (err: any) {
    console.error('[ADMIN USER STATUS ERROR]', err);
    return res.status(500).json({ error: 'Failed to modify account status.' });
  }
});

// -----------------------------------------------------------------------------
// 4. REVOKE USER SESSIONS (Force Logout)
// -----------------------------------------------------------------------------
userAdminRouter.post('/users/:id/revoke-sessions', (req: AuthenticatedRequest, res) => {
  try {
    const targetId = req.params.id;
    const db = getDb();
    const targetUser = db.prepare(`SELECT * FROM users WHERE id = ?`).get(targetId) as DbUser | undefined;
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    revokeAllUserSessions(targetId, req.user!.id, req.user!.email, req.ip);

    return res.json({
      success: true,
      message: `All active sessions revoked for ${targetUser.email}.`,
    });
  } catch (err: any) {
    console.error('[ADMIN REVOKE SESSIONS ERROR]', err);
    return res.status(500).json({ error: 'Failed to revoke sessions.' });
  }
});

// -----------------------------------------------------------------------------
// 5. FORCE ADMIN PASSWORD RESET
// -----------------------------------------------------------------------------
userAdminRouter.post('/users/:id/reset-password', async (req: AuthenticatedRequest, res) => {
  try {
    const targetId = req.params.id;
    const { temporaryPassword } = req.body || {};
    const db = getDb();
    const targetUser = db.prepare(`SELECT * FROM users WHERE id = ?`).get(targetId) as DbUser | undefined;
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const tempPw = temporaryPassword || `Tr!${crypto.randomBytes(6).toString('hex')}#2026`;
    const newHash = await hashPassword(tempPw);

    db.prepare(`
      UPDATE users
      SET password_hash = ?, must_change_password = 1, token_version = token_version + 1, updated_at = ?
      WHERE id = ?
    `).run(newHash, new Date().toISOString(), targetId);

    revokeAllUserSessions(targetId, req.user!.id, req.user!.email, req.ip);

    recordAuditLog(
      'ADMIN_FORCE_PASSWORD_RESET',
      req.user!.id,
      req.user!.email,
      `Forced password reset for ${targetUser.email} (mustChangePassword set to true)`,
      targetId,
      req.ip
    );

    return res.json({
      success: true,
      message: 'Temporary password set. User will be required to change password on first login.',
      temporaryPassword: tempPw,
    });
  } catch (err: any) {
    console.error('[ADMIN RESET PASSWORD ERROR]', err);
    return res.status(500).json({ error: 'Failed to reset password.' });
  }
});

// -----------------------------------------------------------------------------
// 6. DELETE USER ACCOUNT
// -----------------------------------------------------------------------------
userAdminRouter.delete('/users/:id', (req: AuthenticatedRequest, res) => {
  try {
    const targetId = req.params.id;
    if (targetId === req.user!.id) {
      return res.status(400).json({ error: 'Cannot delete your own master administrator account.' });
    }

    const db = getDb();
    const targetUser = db.prepare(`SELECT * FROM users WHERE id = ?`).get(targetId) as DbUser | undefined;
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    db.prepare(`DELETE FROM users WHERE id = ?`).run(targetId);

    recordAuditLog(
      'USER_DELETED',
      req.user!.id,
      req.user!.email,
      `Deleted user account ${targetUser.email} (${targetId})`,
      targetId,
      req.ip
    );

    return res.json({
      success: true,
      message: `User ${targetUser.email} permanently deleted.`,
    });
  } catch (err: any) {
    console.error('[ADMIN DELETE USER ERROR]', err);
    return res.status(500).json({ error: 'Failed to delete user.' });
  }
});

// -----------------------------------------------------------------------------
// 7. AUDIT LEDGER (Security log viewer)
// -----------------------------------------------------------------------------
userAdminRouter.get('/audit-ledger', (req, res) => {
  try {
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit as string, 10) || 50));
    const action = req.query.action as string;

    const db = getDb();
    let query = `SELECT * FROM audit_logs`;
    let params: any[] = [];

    if (action) {
      query += ` WHERE action = ?`;
      params.push(action);
    }

    query += ` ORDER BY timestamp DESC LIMIT ?`;
    params.push(limit);

    const logs = db.prepare(query).all(...params);

    return res.json({
      success: true,
      logs,
    });
  } catch (err: any) {
    console.error('[ADMIN AUDIT LEDGER ERROR]', err);
    return res.status(500).json({ error: 'Failed to retrieve audit ledger.' });
  }
});
