import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { generateSecret, generateURI, verify as verifyTotp } from 'otplib';
import QRCode from 'qrcode';
import { getDb } from '../database/db';

export type UserRole = 'user' | 'moderator' | 'admin';

export interface DbUser {
  id: string;
  email: string;
  password_hash: string | null;
  display_name: string | null;
  role: UserRole;
  is_email_verified: number;
  is_disabled: number;
  must_change_password: number;
  mfa_enabled: number;
  mfa_secret: string | null;
  token_version: number;
  failed_login_attempts: number;
  locked_until: string | null;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string | null;
  role: UserRole;
  isEmailVerified: boolean;
  isDisabled: boolean;
  mustChangePassword: boolean;
  mfaEnabled: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: UserRole;
  tokenVersion: number;
  mustChangePassword?: boolean;
}

const BCRYPT_SALT_ROUNDS = 12;
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_DAYS = 7;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export function getJwtSecret(): string {
  const secret = process.env.AUTH_JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('[FATAL SECURITY] AUTH_JWT_SECRET is required in production.');
    }
    return 'trace_dev_fallback_jwt_secret_9941_change_in_production';
  }
  return secret;
}

function getMfaEncryptionKey(): Buffer {
  const keyStr = process.env.AUTH_MFA_SECRET || getJwtSecret();
  return crypto.createHash('sha256').update(keyStr).digest();
}

export function encryptMfaSecret(secret: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getMfaEncryptionKey(), iv);
  let enc = cipher.update(secret, 'utf8', 'hex');
  enc += cipher.final('hex');
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${enc}`;
}

export function decryptMfaSecret(encryptedPayload: string): string | null {
  try {
    const parts = encryptedPayload.split(':');
    if (parts.length !== 3) return null;
    const [ivHex, tagHex, dataHex] = parts;
    const decipher = crypto.createDecipheriv('aes-256-gcm', getMfaEncryptionKey(), Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    let dec = decipher.update(dataHex, 'hex', 'utf8');
    dec += decipher.final('utf8');
    return dec;
  } catch {
    return null;
  }
}

export function sanitizeUser(dbUser: DbUser): UserProfile {
  return {
    id: dbUser.id,
    email: dbUser.email,
    displayName: dbUser.display_name,
    role: dbUser.role,
    isEmailVerified: dbUser.is_email_verified === 1,
    isDisabled: dbUser.is_disabled === 1,
    mustChangePassword: dbUser.must_change_password === 1,
    mfaEnabled: dbUser.mfa_enabled === 1,
    createdAt: dbUser.created_at,
    lastLoginAt: dbUser.last_login_at,
  };
}

export async function hashPassword(plainText: string): Promise<string> {
  return bcrypt.hash(plainText, BCRYPT_SALT_ROUNDS);
}

export async function verifyPassword(plainText: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainText, hash);
}

export function signAccessToken(user: DbUser): string {
  const payload: AccessTokenPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    tokenVersion: user.token_version,
    mustChangePassword: user.must_change_password === 1,
  };
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: ACCESS_TOKEN_EXPIRY,
    algorithm: 'HS256',
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload | null {
  try {
    return jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] }) as AccessTokenPayload;
  } catch {
    return null;
  }
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function isAccountLocked(user: DbUser): boolean {
  if (!user.locked_until) return false;
  return new Date(user.locked_until).getTime() > Date.now();
}

export function recordFailedLogin(user: DbUser, ip?: string): { locked: boolean; lockedUntil?: string } {
  const db = getDb();
  const attempts = (user.failed_login_attempts || 0) + 1;
  let lockedUntil: string | null = null;
  let locked = false;

  if (attempts >= MAX_FAILED_ATTEMPTS) {
    locked = true;
    lockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000).toISOString();
    recordAuditLog('ACCOUNT_LOCKED', user.id, user.email, `Account locked due to ${attempts} failed login attempts`, user.id, ip);
  }

  db.prepare(`
    UPDATE users
    SET failed_login_attempts = ?, locked_until = ?, updated_at = ?
    WHERE id = ?
  `).run(attempts, lockedUntil, new Date().toISOString(), user.id);

  return { locked, lockedUntil: lockedUntil || undefined };
}

export function resetFailedLogin(userId: string): void {
  const db = getDb();
  db.prepare(`
    UPDATE users
    SET failed_login_attempts = 0, locked_until = NULL, last_login_at = ?, updated_at = ?
    WHERE id = ?
  `).run(new Date().toISOString(), new Date().toISOString(), userId);
}

export function createRefreshToken(userId: string, familyId?: string, ip?: string, userAgent?: string): { token: string; expiresAt: Date } {
  const db = getDb();
  const rawToken = crypto.randomBytes(48).toString('base64url');
  const tokenHash = hashToken(rawToken);
  const activeFamilyId = familyId || crypto.randomUUID();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000);
  const id = crypto.randomUUID();

  db.prepare(`
    INSERT INTO refresh_tokens (id, user_id, token_hash, family_id, is_revoked, expires_at, created_at, user_agent, ip_address)
    VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?)
  `).run(id, userId, tokenHash, activeFamilyId, expiresAt.toISOString(), new Date().toISOString(), userAgent || null, ip || null);

  return { token: rawToken, expiresAt };
}

export function rotateRefreshToken(oldRawToken: string, ip?: string, userAgent?: string): { newAccessToken: string; newRefreshToken: string; user: DbUser } | null {
  const db = getDb();
  const oldHash = hashToken(oldRawToken);

  const tokenRecord = db.prepare(`
    SELECT * FROM refresh_tokens WHERE token_hash = ?
  `).get(oldHash) as any;

  if (!tokenRecord) {
    return null;
  }

  // Detect token reuse / theft attack:
  // If an already-revoked refresh token is presented, revoke all sessions in that family!
  if (tokenRecord.is_revoked === 1) {
    db.prepare(`
      UPDATE refresh_tokens SET is_revoked = 1 WHERE family_id = ?
    `).run(tokenRecord.family_id);

    // Bump user token_version to invalidate outstanding access tokens
    db.prepare(`
      UPDATE users SET token_version = token_version + 1 WHERE id = ?
    `).run(tokenRecord.user_id);

    recordAuditLog(
      'REFRESH_TOKEN_REUSE_DETECTED',
      tokenRecord.user_id,
      'system',
      `Suspicious refresh token reuse. Revoked token family ${tokenRecord.family_id}.`,
      tokenRecord.user_id,
      ip,
      userAgent
    );
    return null;
  }

  // Check expiration
  if (new Date(tokenRecord.expires_at).getTime() < Date.now()) {
    db.prepare(`UPDATE refresh_tokens SET is_revoked = 1 WHERE id = ?`).run(tokenRecord.id);
    return null;
  }

  // Fetch user
  const user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(tokenRecord.user_id) as DbUser | undefined;
  if (!user || user.is_disabled === 1) {
    return null;
  }

  // Invalidate current token and rotate to a new one within the same family
  db.prepare(`UPDATE refresh_tokens SET is_revoked = 1 WHERE id = ?`).run(tokenRecord.id);

  const { token: newRefreshToken } = createRefreshToken(user.id, tokenRecord.family_id, ip, userAgent);
  const newAccessToken = signAccessToken(user);

  return { newAccessToken, newRefreshToken, user };
}

export function revokeRefreshToken(rawToken: string): void {
  const db = getDb();
  const hash = hashToken(rawToken);
  db.prepare(`UPDATE refresh_tokens SET is_revoked = 1 WHERE token_hash = ?`).run(hash);
}

export function revokeAllUserSessions(userId: string, actorId?: string, actorEmail?: string, ip?: string): void {
  const db = getDb();
  db.prepare(`UPDATE refresh_tokens SET is_revoked = 1 WHERE user_id = ?`).run(userId);
  db.prepare(`UPDATE users SET token_version = token_version + 1, updated_at = ? WHERE id = ?`).run(new Date().toISOString(), userId);

  recordAuditLog(
    'ALL_SESSIONS_REVOKED',
    actorId || userId,
    actorEmail || 'user',
    `All active sessions revoked for user ${userId}`,
    userId,
    ip
  );
}

export function createVerificationToken(userId: string, type: 'email_verify' | 'password_reset', lifespanHours = 24): string {
  const db = getDb();
  const rawToken = crypto.randomBytes(32).toString('base64url');
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + lifespanHours * 60 * 60 * 1000).toISOString();
  const id = crypto.randomUUID();

  // Invalidate previous unused tokens of the same type
  db.prepare(`
    UPDATE verification_tokens SET used_at = ? WHERE user_id = ? AND type = ? AND used_at IS NULL
  `).run(new Date().toISOString(), userId, type);

  db.prepare(`
    INSERT INTO verification_tokens (id, user_id, token_hash, type, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, userId, tokenHash, type, expiresAt, new Date().toISOString());

  return rawToken;
}

export function consumeVerificationToken(rawToken: string, type: 'email_verify' | 'password_reset'): string | null {
  const db = getDb();
  const tokenHash = hashToken(rawToken);

  const record = db.prepare(`
    SELECT * FROM verification_tokens WHERE token_hash = ? AND type = ? AND used_at IS NULL
  `).get(tokenHash, type) as any;

  if (!record) return null;

  if (new Date(record.expires_at).getTime() < Date.now()) {
    return null;
  }

  db.prepare(`UPDATE verification_tokens SET used_at = ? WHERE id = ?`).run(new Date().toISOString(), record.id);
  return record.user_id;
}

export async function setupMfa(userId: string, userEmail: string): Promise<{ secret: string; qrCodeDataUrl: string }> {
  const secret = generateSecret();
  const uri = generateURI({
    secret,
    label: userEmail,
    issuer: 'TRACE',
  });
  const qrCodeDataUrl = await QRCode.toDataURL(uri);
  return { secret, qrCodeDataUrl };
}

export async function verifyAndEnableMfa(userId: string, secret: string, token: string): Promise<boolean> {
  const isValid = await verifyTotp({ token, secret });
  if (!isValid.valid) return false;

  const db = getDb();
  const encryptedSecret = encryptMfaSecret(secret);
  db.prepare(`
    UPDATE users SET mfa_enabled = 1, mfa_secret = ?, updated_at = ? WHERE id = ?
  `).run(encryptedSecret, new Date().toISOString(), userId);

  return true;
}

export async function verifyUserMfaToken(user: DbUser, token: string): Promise<boolean> {
  if (!user.mfa_enabled || !user.mfa_secret) return false;
  const secret = decryptMfaSecret(user.mfa_secret);
  if (!secret) return false;
  const res = await verifyTotp({ token, secret });
  return !!res.valid;
}

export function recordAuditLog(
  action: string,
  actorId: string | null,
  actorEmail: string | null,
  details: string,
  targetId?: string | null,
  ip?: string | null,
  userAgent?: string | null
): void {
  try {
    const db = getDb();
    const id = crypto.randomUUID();
    db.prepare(`
      INSERT INTO audit_logs (id, timestamp, actor_id, actor_email, action, target_id, details, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      new Date().toISOString(),
      actorId || null,
      actorEmail || null,
      action,
      targetId || null,
      details,
      ip || null,
      userAgent || null
    );
  } catch (err) {
    console.error('[TRACE Audit Log Error]', err);
  }
}
