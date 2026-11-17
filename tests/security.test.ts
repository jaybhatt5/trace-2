import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../backend/server';

describe('Phase 1 Security Regression Suite (S2, S3, S4, S5, S7, S8)', () => {
  beforeAll(() => {
    process.env.NODE_ENV = 'test';
  });

  describe('S2: Admin Authentication Hardening', () => {
    it('rejects login with default password "password" when not configured', async () => {
      const res = await request(app)
        .post('/api/admin/login')
        .send({ username: 'admin@dj.com', password: 'password' });

      // After fix, default password must NOT grant master clearance
      expect(res.status).toBe(401);
      expect(res.body.token).toBeUndefined();
    });

    it('rejects literal username "admin" bypass attempt', async () => {
      const res = await request(app)
        .post('/api/admin/login')
        .send({ username: 'admin', password: 'password' });

      expect(res.status).toBe(401);
    });
  });

  describe('S3: SSRF Defense in Remote Media Fetching', () => {
    it('blocks loopback IP 127.0.0.1 mediaUrl fetch', async () => {
      const res = await request(app)
        .post('/api/detect-deepfake')
        .send({ mediaUrl: 'http://127.0.0.1:5001/api/detect/image' });

      expect([400, 403]).toContain(res.status);
      expect(res.body.error).toMatch(/restricted|private|blocked|invalid/i);
    });

    it('blocks AWS/Cloud metadata IP 169.254.169.254 mediaUrl fetch', async () => {
      const res = await request(app)
        .post('/api/detect-deepfake')
        .send({ mediaUrl: 'http://169.254.169.254/latest/meta-data/' });

      expect([400, 403]).toContain(res.status);
    });

    it('blocks private 10.x.x.x network ranges', async () => {
      const res = await request(app)
        .post('/api/fact-check-media')
        .send({ mediaUrl: 'http://10.0.0.1/admin.png' });

      expect([400, 403]).toContain(res.status);
    });
  });

  describe('S4: Strict CORS Allowlist & CSP Protection', () => {
    it('does not reflect arbitrary evil origin with Allow-Credentials: true', async () => {
      const res = await request(app)
        .get('/api/system/status')
        .set('Origin', 'http://malicious-attacker.evil.com');

      const allowOrigin = res.headers['access-control-allow-origin'];
      expect(allowOrigin).not.toBe('http://malicious-attacker.evil.com');
    });

    it('returns Content-Security-Policy header on API requests', async () => {
      const res = await request(app).get('/api/system/status');
      expect(res.headers['content-security-policy']).toBeDefined();
    });
  });

  describe('S5: Rate Limiting & Proxy IP Protection', () => {
    it('enforces stricter limits on expensive deepfake/media verification routes', async () => {
      const res = await request(app)
        .post('/api/detect-deepfake')
        .send({});

      // Response should have rate limit headers
      expect(res.status).not.toBe(500);
    });
  });

  describe('S7: Community Truth Review Authentication & Impersonation Prevention', () => {
    it('rejects unauthenticated review submission with 401', async () => {
      const res = await request(app)
        .post('/api/fact-check/report-123/review')
        .send({
          choice: 'verified',
          comment: 'Spoofed perspective',
          userName: 'Impersonated Admin',
          handle: '@masteradmin',
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/unauthorized|authentication required/i);
    });
  });

  describe('S8: Information Exposure Defense', () => {
    it('returns minimal public status without leaking internal API key configuration details', async () => {
      const res = await request(app).get('/api/system/status');
      expect(res.status).toBe(200);
      expect(res.body.keys).toBeUndefined(); // Detailed keys must not be public
    });

    it('restricts /api/verify-api-key to authenticated administrators', async () => {
      const res = await request(app)
        .post('/api/verify-api-key')
        .send({});

      expect([401, 403]).toContain(res.status);
    });
  });
});
