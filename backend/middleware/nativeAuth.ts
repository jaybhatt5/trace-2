import { Request, Response, NextFunction } from 'express';
import {
  verifyAccessToken,
  sanitizeUser,
  UserProfile,
  UserRole,
  DbUser,
} from '../services/authService';
import { getDb } from '../database/db';

export interface AuthenticatedRequest extends Request {
  user?: UserProfile & { tokenVersion: number; mustChangePassword: boolean };
}

export function extractAccessToken(req: Request): string | null {
  // 1. Check HttpOnly cookie first
  if (req.cookies && req.cookies.trace_access) {
    return req.cookies.trace_access;
  }

  // 2. Fallback to raw Cookie header parsing if cookie-parser middleware not mounted yet
  if (req.headers.cookie) {
    const match = req.headers.cookie.match(/(?:^|;\s*)trace_access=([^;]+)/);
    if (match) {
      return decodeURIComponent(match[1]);
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

export function extractRefreshToken(req: Request): string | null {
  if (req.cookies && req.cookies.trace_refresh) {
    return req.cookies.trace_refresh;
  }
  if (req.headers.cookie) {
    const match = req.headers.cookie.match(/(?:^|;\s*)trace_refresh=([^;]+)/);
    if (match) {
      return decodeURIComponent(match[1]);
    }
  }
  if (req.body && req.body.refreshToken) {
    return req.body.refreshToken;
  }
  return null;
}

/**
 * Strict authentication middleware.
 * Verifies JWT signature, checks active account status and token_version against the database.
 */
export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = extractAccessToken(req);
  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required. No active session token found.',
    });
  }

  const payload = verifyAccessToken(token);
  if (!payload || !payload.sub) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Session token has expired or is invalid. Please sign in again.',
    });
  }

  const db = getDb();
  const dbUser = db.prepare(`SELECT * FROM users WHERE id = ?`).get(payload.sub) as DbUser | undefined;

  if (!dbUser) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'User account no longer exists.',
    });
  }

  if (dbUser.is_disabled === 1) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Your account has been suspended by an administrator.',
    });
  }

  // Check token_version for global session invalidation
  if (dbUser.token_version !== payload.tokenVersion) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Your session has been revoked. Please sign in again.',
    });
  }

  const sanitized = sanitizeUser(dbUser);
  req.user = {
    ...sanitized,
    tokenVersion: dbUser.token_version,
    mustChangePassword: dbUser.must_change_password === 1,
  };

  next();
}

/**
 * Optional authentication middleware.
 * Attaches user to req.user if valid token exists, otherwise proceeds as guest.
 */
export async function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const token = extractAccessToken(req);
  if (!token) {
    return next();
  }

  const payload = verifyAccessToken(token);
  if (!payload || !payload.sub) {
    return next();
  }

  try {
    const db = getDb();
    const dbUser = db.prepare(`SELECT * FROM users WHERE id = ?`).get(payload.sub) as DbUser | undefined;
    if (dbUser && dbUser.is_disabled === 0 && dbUser.token_version === payload.tokenVersion) {
      const sanitized = sanitizeUser(dbUser);
      req.user = {
        ...sanitized,
        tokenVersion: dbUser.token_version,
        mustChangePassword: dbUser.must_change_password === 1,
      };
    }
  } catch {
    // Ignore db lookup errors in optional auth
  }

  next();
}

/**
 * Role-Based Access Control (RBAC) middleware factory.
 * Enforces minimum role on the SERVER for protected API endpoints.
 */
export function requireRole(allowedRoles: UserRole | UserRole[]) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Ensure authentication ran first
    if (!req.user) {
      return requireAuth(req, res, () => {
        if (!req.user || !roles.includes(req.user.role)) {
          return res.status(403).json({
            error: 'Forbidden',
            message: `Access denied. Requires one of roles: ${roles.join(', ')}.`,
          });
        }
        next();
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Access denied. Requires one of roles: ${roles.join(', ')}.`,
      });
    }

    next();
  };
}

export const requireAdmin = requireRole('admin');
export const requireModerator = requireRole(['moderator', 'admin']);
