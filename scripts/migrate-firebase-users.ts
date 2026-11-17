import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { getDb } from '../backend/database/db';
import { hashPassword, recordAuditLog } from '../backend/services/authService';

dotenv.config();

interface FirebaseExportUser {
  localId?: string;
  uid?: string;
  email?: string;
  displayName?: string;
  emailVerified?: boolean;
  disabled?: boolean;
  passwordHash?: string;
  salt?: string;
}

export async function migrateFirebaseUsers(exportFilePath?: string) {
  console.log('🔄 Starting Firebase to TRACE Native Auth Migration...');
  const db = getDb();
  let migratedCount = 0;

  // 1. If an exported firebase-users.json file exists, process it
  const resolvedExportPath = exportFilePath || path.join(process.cwd(), 'firebase-users.json');
  if (fs.existsSync(resolvedExportPath)) {
    console.log(`📂 Found Firebase export file at: ${resolvedExportPath}`);
    const rawData = fs.readFileSync(resolvedExportPath, 'utf8');
    const parsed = JSON.parse(rawData);
    const users: FirebaseExportUser[] = Array.isArray(parsed) ? parsed : parsed.users || [];

    for (const fbUser of users) {
      const uid = fbUser.localId || fbUser.uid;
      const email = fbUser.email?.toLowerCase().trim();
      if (!uid || !email) continue;

      const existing = db.prepare(`SELECT id FROM users WHERE id = ? OR email = ?`).get(uid, email) as any;
      if (!existing) {
        // Since Firebase uses custom Scrypt, migrated users are flagged for mandatory password setup
        const tempHash = await hashPassword(`Migrated-${Date.now()}-${Math.random()}`);
        const now = new Date().toISOString();

        db.prepare(`
          INSERT INTO users (
            id, email, password_hash, display_name, role,
            is_email_verified, is_disabled, must_change_password,
            mfa_enabled, token_version, failed_login_attempts,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, 'user', ?, ?, 1, 0, 1, 0, ?, ?)
        `).run(
          uid,
          email,
          tempHash,
          fbUser.displayName || email.split('@')[0],
          fbUser.emailVerified ? 1 : 0,
          fbUser.disabled ? 1 : 0,
          now,
          now
        );
        migratedCount++;
        console.log(`  ✓ Migrated Firebase account: ${email} (UID: ${uid})`);
      }
    }
  }

  // 2. Discover orphaned local user_history files and ensure their accounts exist in SQLite
  const userHistoryDir = path.join(process.cwd(), 'backend', 'data', 'user_history');
  if (fs.existsSync(userHistoryDir)) {
    const files = fs.readdirSync(userHistoryDir).filter((f) => f.endsWith('.json'));
    console.log(`🔎 Checking ${files.length} existing user history files in ${userHistoryDir}...`);

    for (const file of files) {
      const uid = file.replace('.json', '');
      const existing = db.prepare(`SELECT id FROM users WHERE id = ?`).get(uid);
      if (!existing) {
        const placeholderEmail = `user_${uid.slice(0, 8).toLowerCase()}@trace.local`;
        const tempHash = await hashPassword(`Migrated-${Date.now()}-${Math.random()}`);
        const now = new Date().toISOString();

        db.prepare(`
          INSERT INTO users (
            id, email, password_hash, display_name, role,
            is_email_verified, is_disabled, must_change_password,
            mfa_enabled, token_version, failed_login_attempts,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, 'user', 1, 0, 1, 0, 1, 0, ?, ?)
        `).run(uid, placeholderEmail, tempHash, `Citizen Reader (${uid.slice(0, 6)})`, now, now);

        migratedCount++;
        console.log(`  ✓ Linked legacy history record to account: ${placeholderEmail} (UID: ${uid})`);
      }
    }
  }

  recordAuditLog('MIGRATION_COMPLETED', 'system', 'system', `Migrated ${migratedCount} accounts from Firebase / history records`);
  console.log(`\n🎉 Migration complete. Total accounts migrated/linked: ${migratedCount}`);
}

// Allow direct execution
if (process.argv[1]?.endsWith('migrate-firebase-users.ts')) {
  migrateFirebaseUsers()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}
