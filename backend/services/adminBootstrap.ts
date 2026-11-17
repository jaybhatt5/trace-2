import crypto from 'crypto';
import { getDb } from '../database/db';
import { hashPassword, recordAuditLog } from './authService';

export async function bootstrapProductionAdmin(): Promise<void> {
  const db = getDb();
  const adminCount = (
    db.prepare(`SELECT COUNT(*) as count FROM users WHERE role = 'admin'`).get() as any
  )?.count || 0;

  if (adminCount > 0) {
    return;
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const adminEmail = process.env.ADMIN_EMAIL?.trim();
  const adminPassword = process.env.ADMIN_INITIAL_PASSWORD?.trim();

  if (isProduction) {
    if (!adminEmail || !adminPassword || adminPassword.length < 12) {
      console.error(
        '[FATAL BOOTSTRAP ERROR] Production startup refused: No administrator account exists, and ADMIN_EMAIL / ADMIN_INITIAL_PASSWORD (min 12 chars) are not configured.'
      );
      throw new Error('Production admin bootstrap required. Provide ADMIN_EMAIL and secure ADMIN_INITIAL_PASSWORD.');
    }

    const userId = crypto.randomUUID();
    const pwHash = await hashPassword(adminPassword);
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO users (
        id, email, password_hash, display_name, role,
        is_email_verified, is_disabled, must_change_password,
        mfa_enabled, token_version, failed_login_attempts,
        created_at, updated_at
      ) VALUES (?, ?, ?, 'System Administrator', 'admin', 1, 0, 1, 0, 1, 0, ?, ?)
    `).run(userId, adminEmail.toLowerCase(), pwHash, now, now);

    recordAuditLog(
      'ADMIN_BOOTSTRAP_PRODUCTION',
      userId,
      adminEmail.toLowerCase(),
      'Initial production administrator bootstrapped from environment variables with mandatory password change flag',
      userId,
      '127.0.0.1'
    );

    console.log(`[TRACE BOOTSTRAP] Production administrator provisioned for ${adminEmail}. Mandatory password rotation enforced on first login.`);
  }
}
