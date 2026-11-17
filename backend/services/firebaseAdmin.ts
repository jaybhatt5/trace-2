import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import crypto from 'crypto';
import { getFirebasePublicConfig } from '../config/env';

/**
 * Safely retrieve the administrator session signing secret.
 * Refuses default/weak secrets and fails closed in production.
 */
export function getAdminSessionSecret(): string | null {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret === 'trace_sentinel_admin_secret_key_2026_9921_alpha' || secret.length < 16) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[FATAL SECURITY] Missing or weak ADMIN_SESSION_SECRET. Server refuses to sign admin tokens.');
      return null;
    }
    return null;
  }
  return secret;
}

/**
 * Creates a cryptographically signed administrative bearer session token.
 */
export function createAdminSessionToken(username: string): string {
  const secret = getAdminSessionSecret();
  if (!secret) {
    throw new Error('Administrative session creation refused: ADMIN_SESSION_SECRET is missing or insecure.');
  }

  const adminEmail = (process.env.ADMIN_USERNAME || username || 'admin').trim();
  const payload = {
    uid: 'admin_root',
    username: username || adminEmail,
    email: adminEmail,
    name: 'Master Administrator',
    role: 'admin',
    admin: true,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86400, // 24 hours validity
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(payloadB64).digest('base64url');
  return `trace_admin_${payloadB64}.${signature}`;
}

/**
 * Validates the administrative bearer session token and checks its HMAC signature and expiration
 * using constant-time verification to prevent timing attacks.
 */
export function verifyAdminSessionToken(token: string): DecodedAuthToken | null {
  if (!token || !token.startsWith('trace_admin_')) return null;
  const raw = token.slice('trace_admin_'.length);
  const parts = raw.split('.');
  if (parts.length !== 2) return null;
  const [payloadB64, signature] = parts;

  const secret = getAdminSessionSecret();
  if (!secret) return null;

  const expectedSig = crypto.createHmac('sha256', secret).update(payloadB64).digest('base64url');
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expectedSig);

  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null; // Tampered or invalid signature
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null; // Expired
    }
    return {
      uid: payload.uid || 'admin_root',
      email: payload.email,
      name: payload.name || 'Master Administrator',
      role: 'admin',
      admin: true,
      auth_time: payload.iat,
      exp: payload.exp,
    };
  } catch {
    return null;
  }
}

let isInitialized = false;

export function initializeFirebaseAdmin(): App | null {
  const currentApps = getApps();
  if (isInitialized && currentApps.length > 0) {
    return currentApps[0]!;
  }

  const publicConfig = getFirebasePublicConfig();
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || publicConfig?.projectId || 'trace-34d57';

  // 1. Check if SERVICE_ACCOUNT_KEY or GOOGLE_APPLICATION_CREDENTIALS is provided
  const serviceAccountKeyRaw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (serviceAccountKeyRaw) {
    try {
      let serviceAccount: any;
      if (serviceAccountKeyRaw.trim().startsWith('{')) {
        serviceAccount = JSON.parse(serviceAccountKeyRaw);
      } else {
        serviceAccount = serviceAccountKeyRaw;
      }
      const app = initializeApp({
        credential: cert(serviceAccount),
        projectId,
      });
      isInitialized = true;
      console.info('[TRACE Security] Firebase Admin SDK initialized with Service Account Credentials.');
      return app;
    } catch (err) {
      console.warn('[TRACE Security] Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', err);
    }
  }

  // 2. Initialize with project ID (works for token verification against public certs or ADC)
  try {
    if (currentApps.length === 0) {
      const app = initializeApp({
        projectId,
      });
      isInitialized = true;
      console.info(`[TRACE Security] Firebase Admin SDK initialized for project "${projectId}".`);
      return app;
    }
    return currentApps[0]!;
  } catch (err: any) {
    console.warn('[TRACE Security] Firebase Admin default initialization notice:', err?.message || err);
    return null;
  }
}

export interface DecodedAuthToken {
  uid: string;
  email?: string;
  email_verified?: boolean;
  phone_number?: string;
  name?: string;
  picture?: string;
  admin?: boolean;
  role?: string;
  auth_time?: number;
  exp?: number;
}

/**
 * Verify Firebase ID Token on the server side.
 * Fails closed: if token is missing, expired, or tampered, returns null or throws.
 */
export async function verifyFirebaseIdToken(token: string): Promise<DecodedAuthToken | null> {
  if (!token || typeof token !== 'string') return null;
  const cleanToken = token.startsWith('Bearer ') ? token.slice(7).trim() : token.trim();
  if (!cleanToken) return null;

  // 1. Check if token is a signed TRACE Admin Session Token
  if (cleanToken.startsWith('trace_admin_')) {
    const adminUser = verifyAdminSessionToken(cleanToken);
    if (adminUser) return adminUser;
  }

  initializeFirebaseAdmin();

  // Try Admin SDK first
  if (getApps().length > 0) {
    try {
      const decoded = await getAuth().verifyIdToken(cleanToken, true);
      return {
        uid: decoded.uid,
        email: decoded.email,
        email_verified: decoded.email_verified,
        phone_number: decoded.phone_number,
        name: decoded.name,
        picture: decoded.picture,
        admin: Boolean(decoded.admin || decoded.role === 'admin'),
        role: (decoded.admin || decoded.role === 'admin') ? 'admin' : 'reader',
        auth_time: decoded.auth_time,
        exp: decoded.exp,
      };
    } catch (adminErr: any) {
      const errMsg = adminErr?.message || '';
      console.warn('[TRACE Security] Admin SDK verifyIdToken rejected token:', errMsg);
      if (process.env.NODE_ENV === 'production') {
        // In production, never downgrade verification if Admin SDK fails
        return null;
      }
    }
  } else if (process.env.NODE_ENV === 'production') {
    // Fail closed in production when Admin SDK credentials are missing
    console.error('[CRITICAL SECURITY ERROR] Firebase Admin SDK credentials are not configured in production. Token verification failed closed.');
    return null;
  }

  // Non-production fallback for local development only
  try {
    const publicConfig = getFirebasePublicConfig();
    const apiKey = publicConfig?.apiKey || process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY;
    if (apiKey) {
      const lookupUrl = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`;
      const resp = await fetch(lookupUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: cleanToken }),
      });
      if (resp.ok) {
        const data = await resp.json();
        const user = data.users?.[0];
        if (user && user.localId) {
          // Check server-side admin list (no hardcoded defaults)
          const adminEmails = (process.env.ADMIN_EMAILS || '')
            .split(',')
            .map((e) => e.trim().toLowerCase())
            .filter(Boolean);
          const isAdmin = Boolean(user.email && adminEmails.includes(user.email.toLowerCase()));

          return {
            uid: user.localId,
            email: user.email,
            email_verified: Boolean(user.emailVerified),
            phone_number: user.phoneNumber,
            name: user.displayName,
            picture: user.photoUrl,
            admin: isAdmin,
            role: isAdmin ? 'admin' : 'reader',
          };
        }
      }
    }
  } catch (fallbackErr) {
    console.warn('[TRACE Security] Token fallback verification failed:', fallbackErr);
  }

  return null;
}

/**
 * Check if a decoded user token possesses administrator privileges.
 * Verifies custom claims and server-side authorized email / UID allowlist.
 * NO HARDCODED DEFAULT EMAILS PERMITTED.
 */
export function isAuthorizedAdmin(user: DecodedAuthToken | null | undefined): boolean {
  if (!user || !user.uid) return false;
  if (user.admin === true || user.role === 'admin') return true;

  // Check email strictly against ADMIN_EMAILS environment variable (no fallback defaults)
  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (user.email && adminEmails.includes(user.email.toLowerCase())) {
    return true;
  }

  // Check UID strictly against ADMIN_UIDS environment variable (no fallback defaults)
  const adminUids = (process.env.ADMIN_UIDS || '')
    .split(',')
    .map((u) => u.trim())
    .filter(Boolean);

  if (adminUids.includes(user.uid)) {
    return true;
  }

  return false;
}
