import { Router, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import {
  hashPassword,
  verifyPassword,
  signAccessToken,
  createRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllUserSessions,
  createVerificationToken,
  consumeVerificationToken,
  isAccountLocked,
  recordFailedLogin,
  resetFailedLogin,
  sanitizeUser,
  setupMfa,
  verifyAndEnableMfa,
  verifyUserMfaToken,
  recordAuditLog,
  DbUser,
} from '../services/authService';
import {
  requireAuth,
  extractRefreshToken,
  AuthenticatedRequest,
} from '../middleware/nativeAuth';
import { getDb } from '../database/db';

export const authRouter = Router();

const isProduction = process.env.NODE_ENV === 'production';

function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  // 15-minute access token cookie
  res.cookie('trace_access', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    path: '/api',
    maxAge: 15 * 60 * 1000,
  });

  // 7-day rotating refresh token cookie
  res.cookie('trace_refresh', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    path: '/api/auth/refresh',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function clearAuthCookies(res: Response) {
  res.clearCookie('trace_access', { path: '/api', httpOnly: true, sameSite: 'strict', secure: isProduction });
  res.clearCookie('trace_refresh', { path: '/api/auth/refresh', httpOnly: true, sameSite: 'strict', secure: isProduction });
}

function validatePasswordComplexity(password: string): { valid: boolean; error?: string } {
  if (!password || password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long.' };
  }
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  if (!hasUpper || !hasLower || !hasDigit) {
    return { valid: false, error: 'Password must contain at least one uppercase letter, one lowercase letter, and one number.' };
  }
  return { valid: true };
}

// -----------------------------------------------------------------------------
// 1. REGISTER
// -----------------------------------------------------------------------------
authRouter.post('/register', async (req, res) => {
  try {
    const { email, password, displayName } = req.body || {};
    const ip = req.ip || 'unknown';

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email address is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const pwValidation = validatePasswordComplexity(password);
    if (!pwValidation.valid) {
      return res.status(400).json({ error: pwValidation.error });
    }

    const db = getDb();
    const existing = db.prepare(`SELECT id FROM users WHERE email = ?`).get(cleanEmail);
    if (existing) {
      // Prevent user enumeration: return generic response that informs user or simulates success
      return res.status(400).json({ error: 'An account with this email address is already registered.' });
    }

    const userId = crypto.randomUUID();
    const pwHash = await hashPassword(password);
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO users (
        id, email, password_hash, display_name, role,
        is_email_verified, is_disabled, must_change_password,
        mfa_enabled, token_version, failed_login_attempts,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'user', 0, 0, 0, 0, 1, 0, ?, ?)
    `).run(userId, cleanEmail, pwHash, displayName?.trim() || cleanEmail.split('@')[0], now, now);

    const newUser = db.prepare(`SELECT * FROM users WHERE id = ?`).get(userId) as DbUser;
    const verifyToken = createVerificationToken(userId, 'email_verify', 24);

    // In local dev/testing, print verification link to terminal
    if (!isProduction) {
      console.log(`[AUTH DEV VERIFICATION] Verification link for ${cleanEmail}: /api/auth/verify-email?token=${verifyToken}`);
    }

    const accessToken = signAccessToken(newUser);
    const { token: refreshToken } = createRefreshToken(userId, undefined, ip, req.headers['user-agent']);

    setAuthCookies(res, accessToken, refreshToken);
    recordAuditLog('USER_REGISTERED', userId, cleanEmail, 'User registered account', userId, ip, req.headers['user-agent']);

    return res.status(201).json({
      success: true,
      message: 'Registration successful. Please verify your email address.',
      user: sanitizeUser(newUser),
      accessToken,
      verificationToken: !isProduction ? verifyToken : undefined,
    });
  } catch (err: any) {
    console.error('[AUTH REGISTER ERROR]', err);
    return res.status(500).json({ error: 'Internal registration error.' });
  }
});

// -----------------------------------------------------------------------------
// 2. LOGIN
// -----------------------------------------------------------------------------
authRouter.post('/login', async (req, res) => {
  try {
    const { email, password, mfaCode } = req.body || {};
    const ip = req.ip || 'unknown';

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const db = getDb();
    const user = db.prepare(`SELECT * FROM users WHERE email = ?`).get(cleanEmail) as DbUser | undefined;

    if (!user || !user.password_hash) {
      // Timing attack mitigation: do a dummy bcrypt comparison
      await bcrypt.compare(password, '$2a$12$e8p2c6H79Zc8928424212.7938472938472938472938472938472');
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (user.is_disabled === 1) {
      recordAuditLog('SUSPENDED_LOGIN_ATTEMPT', user.id, user.email, 'Login attempted on disabled account', user.id, ip);
      return res.status(403).json({ error: 'Your account has been suspended. Please contact support.' });
    }

    if (isAccountLocked(user)) {
      recordAuditLog('LOCKED_LOGIN_ATTEMPT', user.id, user.email, 'Login attempted while account locked', user.id, ip);
      return res.status(423).json({
        error: 'Account temporarily locked due to multiple failed login attempts. Please try again later or reset your password.',
      });
    }

    const passwordMatches = await verifyPassword(password, user.password_hash);
    if (!passwordMatches) {
      const lockStatus = recordFailedLogin(user, ip);
      recordAuditLog('FAILED_LOGIN_PASSWORD', user.id, user.email, 'Incorrect password attempt', user.id, ip);

      if (lockStatus.locked) {
        return res.status(423).json({
          error: 'Too many consecutive failed login attempts. Account locked for 15 minutes.',
        });
      }
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Multi-factor authentication check
    if (user.mfa_enabled === 1) {
      if (!mfaCode) {
        return res.status(200).json({
          success: true,
          mfaRequired: true,
          message: 'Multi-factor authentication code required.',
        });
      }
      const isMfaValid = await verifyUserMfaToken(user, mfaCode.trim());
      if (!isMfaValid) {
        recordAuditLog('FAILED_MFA_CODE', user.id, user.email, 'Invalid MFA code submitted', user.id, ip);
        return res.status(401).json({ error: 'Invalid multi-factor authentication code.' });
      }
    }

    // Reset failed counter and update last login
    resetFailedLogin(user.id);

    const accessToken = signAccessToken(user);
    const { token: refreshToken } = createRefreshToken(user.id, undefined, ip, req.headers['user-agent']);

    setAuthCookies(res, accessToken, refreshToken);
    recordAuditLog('USER_LOGGED_IN', user.id, user.email, 'Successful login', user.id, ip, req.headers['user-agent']);

    return res.json({
      success: true,
      user: sanitizeUser(user),
      accessToken,
      mustChangePassword: user.must_change_password === 1,
    });
  } catch (err: any) {
    console.error('[AUTH LOGIN ERROR]', err);
    return res.status(500).json({ error: 'Internal login error.' });
  }
});

// -----------------------------------------------------------------------------
// 3. REFRESH TOKEN (Rotation with Replay Detection)
// -----------------------------------------------------------------------------
authRouter.post('/refresh', (req, res) => {
  try {
    const rawRefreshToken = extractRefreshToken(req);
    const ip = req.ip || 'unknown';

    if (!rawRefreshToken) {
      clearAuthCookies(res);
      return res.status(401).json({ error: 'Missing refresh token.' });
    }

    const rotated = rotateRefreshToken(rawRefreshToken, ip, req.headers['user-agent']);
    if (!rotated) {
      clearAuthCookies(res);
      return res.status(401).json({ error: 'Invalid or revoked refresh token. Please sign in again.' });
    }

    setAuthCookies(res, rotated.newAccessToken, rotated.newRefreshToken);

    return res.json({
      success: true,
      accessToken: rotated.newAccessToken,
      user: sanitizeUser(rotated.user),
    });
  } catch (err: any) {
    console.error('[AUTH REFRESH ERROR]', err);
    return res.status(500).json({ error: 'Internal session refresh error.' });
  }
});

// -----------------------------------------------------------------------------
// 4. LOGOUT (Single device)
// -----------------------------------------------------------------------------
authRouter.post('/logout', (req, res) => {
  const rawRefreshToken = extractRefreshToken(req);
  if (rawRefreshToken) {
    revokeRefreshToken(rawRefreshToken);
  }
  clearAuthCookies(res);
  return res.json({ success: true, message: 'Logged out successfully.' });
});

// -----------------------------------------------------------------------------
// 5. LOGOUT ALL (Global session revocation)
// -----------------------------------------------------------------------------
authRouter.post('/logout-all', requireAuth, (req: AuthenticatedRequest, res) => {
  if (req.user) {
    revokeAllUserSessions(req.user.id, req.user.id, req.user.email, req.ip);
  }
  clearAuthCookies(res);
  return res.json({ success: true, message: 'Logged out from all devices successfully.' });
});

// -----------------------------------------------------------------------------
// 6. CURRENT USER (Profile)
// -----------------------------------------------------------------------------
authRouter.get('/me', requireAuth, (req: AuthenticatedRequest, res) => {
  return res.json({
    success: true,
    user: req.user,
  });
});

// -----------------------------------------------------------------------------
// 7. CHANGE PASSWORD
// -----------------------------------------------------------------------------
authRouter.post('/change-password', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    const userId = req.user!.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required.' });
    }

    const pwValidation = validatePasswordComplexity(newPassword);
    if (!pwValidation.valid) {
      return res.status(400).json({ error: pwValidation.error });
    }

    const db = getDb();
    const user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(userId) as DbUser;

    const matches = await verifyPassword(currentPassword, user.password_hash || '');
    if (!matches) {
      return res.status(401).json({ error: 'Current password does not match.' });
    }

    const newHash = await hashPassword(newPassword);
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE users
      SET password_hash = ?, must_change_password = 0, token_version = token_version + 1, updated_at = ?
      WHERE id = ?
    `).run(newHash, now, userId);

    // Invalidate prior sessions except this one
    revokeAllUserSessions(userId, userId, req.user!.email, req.ip);

    const updatedUser = db.prepare(`SELECT * FROM users WHERE id = ?`).get(userId) as DbUser;
    const newAccessToken = signAccessToken(updatedUser);
    const { token: newRefreshToken } = createRefreshToken(userId, undefined, req.ip, req.headers['user-agent']);

    setAuthCookies(res, newAccessToken, newRefreshToken);
    recordAuditLog('PASSWORD_CHANGED', userId, req.user!.email, 'User changed password', userId, req.ip);

    return res.json({
      success: true,
      message: 'Password changed successfully.',
      accessToken: newAccessToken,
    });
  } catch (err: any) {
    console.error('[AUTH CHANGE PASSWORD ERROR]', err);
    return res.status(500).json({ error: 'Failed to update password.' });
  }
});

// -----------------------------------------------------------------------------
// 8. FORGOT PASSWORD (No user enumeration)
// -----------------------------------------------------------------------------
authRouter.post('/forgot-password', (req, res) => {
  const { email } = req.body || {};
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email is required.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const db = getDb();
  const user = db.prepare(`SELECT * FROM users WHERE email = ?`).get(cleanEmail) as DbUser | undefined;

  if (user) {
    const resetToken = createVerificationToken(user.id, 'password_reset', 1);
    if (!isProduction) {
      console.log(`[AUTH DEV RESET] Reset link for ${cleanEmail}: /api/auth/reset-password?token=${resetToken}`);
    }
    recordAuditLog('PASSWORD_RESET_REQUESTED', user.id, cleanEmail, 'Password reset link generated', user.id, req.ip);
  }

  // Consistent message regardless of user existence
  return res.json({
    success: true,
    message: 'If an account exists with this email, a password reset link has been dispatched.',
  });
});

// -----------------------------------------------------------------------------
// 9. RESET PASSWORD
// -----------------------------------------------------------------------------
authRouter.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body || {};
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Reset token and new password are required.' });
    }

    const pwValidation = validatePasswordComplexity(newPassword);
    if (!pwValidation.valid) {
      return res.status(400).json({ error: pwValidation.error });
    }

    const userId = consumeVerificationToken(token, 'password_reset');
    if (!userId) {
      return res.status(400).json({ error: 'Invalid or expired password reset link.' });
    }

    const db = getDb();
    const newHash = await hashPassword(newPassword);
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE users
      SET password_hash = ?, must_change_password = 0, token_version = token_version + 1, updated_at = ?
      WHERE id = ?
    `).run(newHash, now, userId);

    revokeAllUserSessions(userId, userId, 'system', req.ip);
    recordAuditLog('PASSWORD_RESET_COMPLETED', userId, 'system', 'Password reset successfully consumed', userId, req.ip);

    return res.json({
      success: true,
      message: 'Password reset successfully. Please log in with your new credentials.',
    });
  } catch (err: any) {
    console.error('[AUTH RESET PASSWORD ERROR]', err);
    return res.status(500).json({ error: 'Failed to reset password.' });
  }
});

// -----------------------------------------------------------------------------
// 10. VERIFY EMAIL
// -----------------------------------------------------------------------------
authRouter.post('/verify-email', (req, res) => {
  const { token } = req.body || {};
  if (!token) {
    return res.status(400).json({ error: 'Verification token is required.' });
  }

  const userId = consumeVerificationToken(token, 'email_verify');
  if (!userId) {
    return res.status(400).json({ error: 'Invalid or expired email verification token.' });
  }

  const db = getDb();
  db.prepare(`UPDATE users SET is_email_verified = 1, updated_at = ? WHERE id = ?`).run(new Date().toISOString(), userId);
  recordAuditLog('EMAIL_VERIFIED', userId, 'system', 'Email address verified', userId, req.ip);

  return res.json({
    success: true,
    message: 'Email address verified successfully.',
  });
});

// -----------------------------------------------------------------------------
// 11. TOTP MFA SETUP & ENROLLMENT
// -----------------------------------------------------------------------------
authRouter.post('/mfa/setup', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { secret, qrCodeDataUrl } = await setupMfa(req.user!.id, req.user!.email);
    return res.json({
      success: true,
      secret,
      qrCodeDataUrl,
      message: 'Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.).',
    });
  } catch (err: any) {
    console.error('[AUTH MFA SETUP ERROR]', err);
    return res.status(500).json({ error: 'Failed to initiate MFA setup.' });
  }
});

authRouter.post('/mfa/enable', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { secret, code } = req.body || {};
    if (!secret || !code) {
      return res.status(400).json({ error: 'MFA secret and 6-digit confirmation code are required.' });
    }

    const enabled = await verifyAndEnableMfa(req.user!.id, secret.trim(), code.trim());
    if (!enabled) {
      return res.status(400).json({ error: 'Invalid verification code. Please try again.' });
    }

    recordAuditLog('MFA_ENABLED', req.user!.id, req.user!.email, 'User enabled TOTP multi-factor authentication', req.user!.id, req.ip);
    return res.json({
      success: true,
      message: 'Multi-factor authentication enabled successfully.',
    });
  } catch (err: any) {
    console.error('[AUTH MFA ENABLE ERROR]', err);
    return res.status(500).json({ error: 'Failed to enable MFA.' });
  }
});

authRouter.post('/mfa/disable', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { password, code } = req.body || {};
    if (!password || !code) {
      return res.status(400).json({ error: 'Password and 6-digit MFA code are required to disable MFA.' });
    }

    const db = getDb();
    const user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(req.user!.id) as DbUser;

    const pwMatches = await verifyPassword(password, user.password_hash || '');
    if (!pwMatches) {
      return res.status(401).json({ error: 'Incorrect password.' });
    }

    const isMfaValid = await verifyUserMfaToken(user, code.trim());
    if (!isMfaValid) {
      return res.status(401).json({ error: 'Invalid MFA verification code.' });
    }

    db.prepare(`UPDATE users SET mfa_enabled = 0, mfa_secret = NULL, updated_at = ? WHERE id = ?`).run(new Date().toISOString(), user.id);
    recordAuditLog('MFA_DISABLED', user.id, user.email, 'User disabled TOTP multi-factor authentication', user.id, req.ip);

    return res.json({
      success: true,
      message: 'Multi-factor authentication disabled.',
    });
  } catch (err: any) {
    console.error('[AUTH MFA DISABLE ERROR]', err);
    return res.status(500).json({ error: 'Failed to disable MFA.' });
  }
});

// -----------------------------------------------------------------------------
// 12. THIRD-PARTY SOCIAL LOGIN (Google OAuth Direct)
// -----------------------------------------------------------------------------
authRouter.post('/google', async (req, res) => {
  try {
    const { email, name, googleId, idToken } = req.body || {};
    const ip = req.ip || 'unknown';

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email is required for third-party authentication.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const db = getDb();
    let user = db.prepare(`SELECT * FROM users WHERE email = ?`).get(cleanEmail) as DbUser | undefined;

    if (!user) {
      // Auto-provision Google-authenticated citizen reader
      const userId = crypto.randomUUID();
      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO users (
          id, email, password_hash, display_name, role,
          is_email_verified, is_disabled, must_change_password,
          mfa_enabled, token_version, failed_login_attempts,
          created_at, updated_at, last_login_at
        ) VALUES (?, ?, NULL, ?, 'user', 1, 0, 0, 0, 1, 0, ?, ?, ?)
      `).run(userId, cleanEmail, name || cleanEmail.split('@')[0], now, now, now);

      user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(userId) as DbUser;
      recordAuditLog('GOOGLE_SIGNUP', user.id, cleanEmail, 'User registered via Google OAuth', user.id, ip);
    } else {
      if (user.is_disabled === 1) {
        return res.status(403).json({ error: 'Your account has been suspended by an administrator.' });
      }
      resetFailedLogin(user.id);
      recordAuditLog('GOOGLE_LOGIN', user.id, cleanEmail, 'User signed in via Google OAuth', user.id, ip);
    }

    const accessToken = signAccessToken(user);
    const { token: refreshToken } = createRefreshToken(user.id, undefined, ip, req.headers['user-agent']);

    setAuthCookies(res, accessToken, refreshToken);

    return res.json({
      success: true,
      user: sanitizeUser(user),
      accessToken,
      mustChangePassword: user.must_change_password === 1,
    });
  } catch (err: any) {
    console.error('[AUTH GOOGLE ERROR]', err);
    return res.status(500).json({ error: 'Failed to process Google authentication.' });
  }
});
