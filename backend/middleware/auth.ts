import { Request, Response, NextFunction } from 'express';
import { verifyFirebaseIdToken, isAuthorizedAdmin, verifyAdminSessionToken, DecodedAuthToken } from '../services/firebaseAdmin';
import { verifyAccessToken, DbUser } from '../services/authService';
import { getDb } from '../database/db';

// Extend Express Request interface to include authenticated user
export interface AuthenticatedRequest extends Request {
  user?: DecodedAuthToken & {
    id?: string;
    mustChangePassword?: boolean;
    tokenVersion?: number;
  };
}

function extractAuthToken(req: Request): string | null {
  // 1. Check native trace_access cookie
  if (req.cookies && req.cookies.trace_access) {
    return req.cookies.trace_access;
  }

  // 2. Fallback to raw Cookie header parsing
  if (req.headers.cookie) {
    const accessMatch = req.headers.cookie.match(/(?:^|;\s*)trace_access=([^;]+)/);
    if (accessMatch) {
      return decodeURIComponent(accessMatch[1]);
    }
    const adminMatch = req.headers.cookie.match(/(?:^|;\s*)trace_admin_session_token=([^;]+)/);
    if (adminMatch) {
      return decodeURIComponent(adminMatch[1]);
    }
  }

  // 3. Check Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  if (authHeader && !authHeader.includes(' ')) {
    return authHeader.trim();
  }

  return null;
}

async function resolveUserFromToken(token: string): Promise<(DecodedAuthToken & { id?: string; mustChangePassword?: boolean; tokenVersion?: number }) | null> {
  // Option A: Native JWT Access Token
  const nativePayload = verifyAccessToken(token);
  if (nativePayload && nativePayload.sub) {
    try {
      const db = getDb();
      const dbUser = db.prepare(`SELECT * FROM users WHERE id = ?`).get(nativePayload.sub) as DbUser | undefined;
      if (dbUser && dbUser.is_disabled === 0 && dbUser.token_version === nativePayload.tokenVersion) {
        return {
          uid: dbUser.id,
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.display_name || dbUser.email.split('@')[0],
          role: dbUser.role,
          admin: dbUser.role === 'admin',
          mustChangePassword: dbUser.must_change_password === 1,
          tokenVersion: dbUser.token_version,
        };
      }
    } catch {
      // Ignore db error, fall through
    }
  }

  // Option B: Master Sentinel Admin HMAC Token
  if (token.startsWith('trace_admin_')) {
    const adminDecoded = verifyAdminSessionToken(token);
    if (adminDecoded) {
      return {
        ...adminDecoded,
        id: adminDecoded.uid,
      };
    }
  }

  // Option C: Legacy Firebase ID Token
  const firebaseDecoded = await verifyFirebaseIdToken(token);
  if (firebaseDecoded && firebaseDecoded.uid) {
    return {
      ...firebaseDecoded,
      id: firebaseDecoded.uid,
    };
  }

  return null;
}

/**
 * Middleware that strictly enforces authenticated user token on private APIs.
 * Fails closed with 401 Unauthorized if token is missing or invalid.
 */
export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = extractAuthToken(req);
  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required. Missing authorization token or session cookie.',
    });
  }

  const user = await resolveUserFromToken(token);

  if (!user || !user.uid) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid, expired, or revoked authentication token. Please sign in again.',
    });
  }

  req.user = user;
  next();
}

/**
 * Optional authentication middleware: attaches user if valid token present,
 * allows guest access otherwise without blocking.
 */
export async function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const token = extractAuthToken(req);
  if (token) {
    const user = await resolveUserFromToken(token);
    if (user && user.uid) {
      req.user = user;
    }
  }
  next();
}

/**
 * Middleware that strictly restricts access to verified administrators.
 * Derives privileges solely from verified server-side claims or database roles.
 */
export async function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = extractAuthToken(req);
  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Administrator authentication required.',
    });
  }

  const user = await resolveUserFromToken(token);

  if (!user || !user.uid) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired administrative credentials.',
    });
  }

  const hasAdminRole = user.role === 'admin' || user.admin === true || isAuthorizedAdmin(user);
  if (!hasAdminRole) {
    console.warn(`[TRACE Security] Access denied: User "${user.email || user.uid}" attempted unauthorized admin access.`);
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Access restricted to authorized TRACE Editorial Administrators.',
    });
  }

  req.user = user;
  next();
}

/**
 * Role-Based Access Control (RBAC) middleware factory.
 */
export function requireRole(allowedRoles: string | string[]) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return requireAuth(req, res, () => {
        const userRole = req.user?.role || (req.user?.admin ? 'admin' : 'user');
        if (!roles.includes(userRole)) {
          return res.status(403).json({
            error: 'Forbidden',
            message: `Access denied. Requires one of roles: ${roles.join(', ')}.`,
          });
        }
        next();
      });
    }

    const userRole = req.user.role || (req.user.admin ? 'admin' : 'user');
    if (!roles.includes(userRole)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Access denied. Requires one of roles: ${roles.join(', ')}.`,
      });
    }

    next();
  };
}

/**
 * Resilient sliding-window rate limiter per client IP.
 */
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export function createRateLimiter(
  optionsOrWindowMs: number | { windowMs: number; maxRequests: number; message?: string },
  maxReqs?: number,
  msg?: string
) {
  const options =
    typeof optionsOrWindowMs === 'number'
      ? { windowMs: optionsOrWindowMs, maxRequests: maxReqs ?? 60, message: msg }
      : optionsOrWindowMs;
  const store = new Map<string, RateLimitEntry>();

  // Periodically clean up expired entries
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (entry.resetAt <= now) {
        store.delete(key);
      }
    }
  }, Math.max(30000, options.windowMs)).unref();

  return (req: Request, res: Response, next: NextFunction) => {
    // Rely exclusively on trusted Express req.ip (configured via app.set('trust proxy', 1))
    // Never blindly trust spoofable client X-Forwarded-For headers!
    const clientIp = req.ip || req.socket?.remoteAddress || 'unknown';
    const now = Date.now();

    let entry = store.get(clientIp);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 1, resetAt: now + options.windowMs };
      store.set(clientIp, entry);
      return next();
    }

    entry.count += 1;
    if (entry.count > options.maxRequests) {
      const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfterSec);
      return res.status(429).json({
        error: 'Too Many Requests',
        message: options.message || `Rate limit exceeded. Please try again in ${retryAfterSec} seconds.`,
        retryAfter: retryAfterSec,
      });
    }

    next();
  };
}

/**
 * Standard Security Headers Middleware with Content-Security-Policy.
 */
export function secureHeadersMiddleware(_req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; media-src 'self' data: https: blob:; connect-src 'self' https: http://localhost:* http://127.0.0.1:*; font-src 'self' data: https:; frame-ancestors 'self';"
  );
  next();
}
