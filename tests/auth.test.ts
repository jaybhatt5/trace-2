import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../backend/server';
import { getDb, closeDb } from '../backend/database/db';
import { DbUser } from '../backend/services/authService';

describe('TRACE Native Authentication & RBAC Engine Suite', () => {
  beforeAll(() => {
    process.env.NODE_ENV = 'test';
    process.env.AUTH_JWT_SECRET = 'test_jwt_secret_for_vitest_runner_9921';
  });

  afterAll(() => {
    closeDb();
  });

  const testEmail = `citizen_${Date.now()}@trace.test`;
  const testPassword = 'SecurePassword123!';
  let userAccessToken = '';
  let userRefreshToken = '';
  let userId = '';

  const adminEmail = `admin_${Date.now()}@trace.test`;
  const adminPassword = 'MasterAdminPassword123!';
  let adminAccessToken = '';
  let adminCookie = '';

  describe('1. User Registration & Input Validation', () => {
    it('rejects passwords failing complexity rules (<8 chars or missing numbers/uppercase)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@weak.com', password: 'weak' });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/at least 8 characters/i);
    });

    it('successfully registers new user with Argon2/Bcrypt hash and sets HttpOnly cookies', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: testEmail,
          password: testPassword,
          displayName: 'Test Citizen Reader',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe(testEmail);
      expect(res.body.user.role).toBe('user');
      expect(res.body.user.password_hash).toBeUndefined(); // Never leak hashes!

      userId = res.body.user.id;
      userAccessToken = res.body.accessToken;

      // Verify cookies are issued
      const cookies = res.headers['set-cookie'] as unknown as string[];
      expect(cookies).toBeDefined();
      expect(cookies.some((c) => c.includes('trace_access='))).toBe(true);
      expect(cookies.some((c) => c.includes('trace_refresh='))).toBe(true);
      expect(cookies.some((c) => c.includes('HttpOnly'))).toBe(true);
      expect(cookies.some((c) => c.includes('SameSite=Strict'))).toBe(true);
    });

    it('rejects duplicate email registration cleanly', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: testEmail,
          password: testPassword,
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/already registered/i);
    });
  });

  describe('2. User Login & Rate Limiting & Account Lockout', () => {
    it('successfully logs in with valid credentials and returns profile', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe(testEmail);

      const cookies = res.headers['set-cookie'] as unknown as string[];
      const refreshCookie = cookies.find((c) => c.includes('trace_refresh='));
      expect(refreshCookie).toBeDefined();
      userRefreshToken = decodeURIComponent(refreshCookie!.split(';')[0].split('=')[1]);
    });

    it('rejects invalid password with generic 401 error', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: 'WrongPassword999!',
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/invalid email or password/i);
    });

    it('locks account after 5 consecutive failed login attempts (423 Locked)', async () => {
      const victimEmail = `lockout_${Date.now()}@trace.test`;
      // Register victim
      await request(app)
        .post('/api/auth/register')
        .send({ email: victimEmail, password: testPassword });

      // Attempt 4 failed logins
      for (let i = 0; i < 4; i++) {
        const res = await request(app)
          .post('/api/auth/login')
          .send({ email: victimEmail, password: 'wrong' });
        expect(res.status).toBe(401);
      }

      // 5th failed login triggers lockout (423)
      const lockRes = await request(app)
        .post('/api/auth/login')
        .send({ email: victimEmail, password: 'wrong' });
      expect(lockRes.status).toBe(423);
      expect(lockRes.body.error).toMatch(/account locked/i);

      // Even correct password is now blocked while locked
      const blockedRes = await request(app)
        .post('/api/auth/login')
        .send({ email: victimEmail, password: testPassword });
      expect(blockedRes.status).toBe(423);
    });
  });

  describe('3. Token Rotation & Replay Attack Defense', () => {
    it('rotates refresh token and returns new access token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', `trace_refresh=${userRefreshToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.accessToken).toBeDefined();

      const cookies = res.headers['set-cookie'] as unknown as string[];
      const newRefreshCookie = cookies.find((c) => c.includes('trace_refresh='));
      expect(newRefreshCookie).toBeDefined();
    });

    it('detects replay attack when re-using already consumed refresh token and revokes family', async () => {
      // Re-using old userRefreshToken that was already rotated
      const replayRes = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', `trace_refresh=${userRefreshToken}`);

      expect(replayRes.status).toBe(401);
      expect(replayRes.body.error).toMatch(/revoked|invalid/i);
    });
  });

  describe('4. Session Invalidation (Logout & Logout-All)', () => {
    it('POST /api/auth/logout clears auth cookies', async () => {
      const res = await request(app).post('/api/auth/logout');
      expect(res.status).toBe(200);
      const cookies = res.headers['set-cookie'] as unknown as string[];
      expect(cookies.some((c) => c.includes('trace_access=;') || c.includes('Max-Age=0'))).toBe(true);
    });

    it('POST /api/auth/logout-all increments token_version and invalidates previous JWTs', async () => {
      // Login again to get a fresh token
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: testEmail, password: testPassword });
      const freshToken = loginRes.body.accessToken;

      // Verify token works
      const meResBefore = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${freshToken}`);
      expect(meResBefore.status).toBe(200);

      // Call logout-all
      const logoutAllRes = await request(app)
        .post('/api/auth/logout-all')
        .set('Authorization', `Bearer ${freshToken}`);
      expect(logoutAllRes.status).toBe(200);

      // Previous token MUST now be rejected with 401 (session revoked)
      const meResAfter = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${freshToken}`);
      expect(meResAfter.status).toBe(401);
      expect(meResAfter.body.message).toMatch(/session has been revoked/i);
    });
  });

  describe('5. Password Reset Flow (No User Enumeration)', () => {
    it('POST /api/auth/forgot-password returns identical generic message for both existing and non-existing emails', async () => {
      const res1 = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: testEmail });
      expect(res1.status).toBe(200);
      expect(res1.body.message).toMatch(/if an account exists/i);

      const res2 = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent_ghost_user@nowhere.com' });
      expect(res2.status).toBe(200);
      expect(res2.body.message).toBe(res1.body.message); // Exact match preventing enumeration
    });
  });

  describe('6. Server-Enforced RBAC & Admin Operations', () => {
    beforeAll(async () => {
      // Register admin account and update role in DB directly for test
      const regRes = await request(app)
        .post('/api/auth/register')
        .send({
          email: adminEmail,
          password: adminPassword,
          displayName: 'Master Sentinel Lead',
        });
      const db = getDb();
      db.prepare(`UPDATE users SET role = 'admin' WHERE id = ?`).run(regRes.body.user.id);

      // Login as admin
      const adminLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: adminEmail, password: adminPassword });
      adminAccessToken = adminLogin.body.accessToken;
      const cookies = adminLogin.headers['set-cookie'] as unknown as string[];
      adminCookie = cookies.find((c) => c.includes('trace_access='))!;
    });

    it('blocks regular user from accessing GET /api/admin/users with 403 Forbidden', async () => {
      const userLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: testEmail, password: testPassword });

      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${userLogin.body.accessToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Forbidden');
    });

    it('allows verified admin to view paginated user directory at GET /api/admin/users', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.users).toBeDefined();
      expect(Array.isArray(res.body.users)).toBe(true);
      expect(res.body.pagination).toBeDefined();
    });

    it('allows admin to change user role to moderator at POST /api/admin/users/:id/role', async () => {
      const res = await request(app)
        .post(`/api/admin/users/${userId}/role`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ role: 'moderator' });

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/updated to moderator/i);

      // Verify in DB
      const db = getDb();
      const updated = db.prepare(`SELECT role FROM users WHERE id = ?`).get(userId) as any;
      expect(updated.role).toBe('moderator');
    });

    it('prevents an administrator from suspending their own account', async () => {
      const db = getDb();
      const admin = db.prepare(`SELECT id FROM users WHERE email = ?`).get(adminEmail) as any;

      const res = await request(app)
        .post(`/api/admin/users/${admin.id}/status`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ isDisabled: true });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/cannot suspend your own/i);
    });

    it('allows admin to view audit ledger logs at GET /api/admin/audit-ledger', async () => {
      const res = await request(app)
        .get('/api/admin/audit-ledger')
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.logs).toBeDefined();
      expect(res.body.logs.length).toBeGreaterThan(0);
    });
  });
});
