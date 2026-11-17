import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config();

// STRICT GUARD: Must hard-fail if NODE_ENV is not 'development'
const currentEnv = process.env.NODE_ENV || 'development';
if (currentEnv !== 'development') {
  console.error('\n❌ [SECURITY VIOLATION] seed-dev-admin is strictly forbidden in non-development environments!');
  console.error(`Current NODE_ENV is "${currentEnv}". Refusing to run.\n`);
  process.exit(1);
}

// Ensure database uses development path
import { getDb } from '../backend/database/db';
import { hashPassword, recordAuditLog } from '../backend/services/authService';

async function seedDevelopmentAdmin() {
  console.log('🌱 Seeding local development administrator...');
  const db = getDb();

  const devAdminEmail = 'admin@trace.local';
  const devAdminUsername = 'admin';
  const devAdminPassword = 'password';

  const existing = db.prepare(`SELECT * FROM users WHERE email = ?`).get(devAdminEmail) as any;
  const pwHash = await hashPassword(devAdminPassword);
  const now = new Date().toISOString();

  if (existing) {
    db.prepare(`
      UPDATE users
      SET password_hash = ?, role = 'admin', is_disabled = 0, is_email_verified = 1,
          must_change_password = 0, updated_at = ?
      WHERE id = ?
    `).run(pwHash, now, existing.id);

    console.log(`✅ Development admin updated: ${devAdminEmail} (username: ${devAdminUsername}) / password: ${devAdminPassword}`);
    recordAuditLog(
      'DEV_ADMIN_SEEDED',
      existing.id,
      devAdminEmail,
      'Development administrator re-seeded via scripts/seed-dev-admin.ts',
      existing.id,
      '127.0.0.1'
    );
  } else {
    const userId = 'admin_dev_local';
    db.prepare(`
      INSERT INTO users (
        id, email, password_hash, display_name, role,
        is_email_verified, is_disabled, must_change_password,
        mfa_enabled, token_version, failed_login_attempts,
        created_at, updated_at
      ) VALUES (?, ?, ?, 'Local Dev Administrator', 'admin', 1, 0, 0, 0, 1, 0, ?, ?)
    `).run(userId, devAdminEmail, pwHash, now, now);

    console.log(`✅ Development admin created: ${devAdminEmail} (username: ${devAdminUsername}) / password: ${devAdminPassword}`);
    recordAuditLog(
      'DEV_ADMIN_SEEDED',
      userId,
      devAdminEmail,
      'Development administrator seeded via scripts/seed-dev-admin.ts',
      userId,
      '127.0.0.1'
    );
  }

  process.exit(0);
}

seedDevelopmentAdmin().catch((err) => {
  console.error('❌ Failed to seed development administrator:', err);
  process.exit(1);
});
