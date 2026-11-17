import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../backend/server';
import { CircuitBreaker } from '../backend/utils/circuitBreaker';

describe('TRACE API Integration & Route Contracts Suite', () => {
  beforeAll(() => {
    process.env.NODE_ENV = 'test';
  });

  describe('GET /api/system/status', () => {
    it('returns 200 with minimal public health info and no leaked keys', async () => {
      const res = await request(app).get('/api/system/status');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('operational');
      expect(res.body.service).toMatch(/TRACE/i);
      expect(res.body.keys).toBeUndefined(); // Detailed keys must be hidden from public visitors
      expect(res.body.timestamp).toBeDefined();
    });
  });

  describe('GET /api/feed', () => {
    it('returns 200 with feed items array', async () => {
      const res = await request(app).get('/api/feed');
      expect(res.status).toBe(200);
      expect(res.body.items).toBeDefined();
      expect(Array.isArray(res.body.items)).toBe(true);
    });
  });

  describe('GET /api/news', () => {
    it('handles query parameters cleanly without crashing', async () => {
      const res = await request(app)
        .get('/api/news')
        .query({ category: 'technology', limit: 5 });
      expect([200, 502, 503]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.articles).toBeDefined();
      }
    });
  });

  describe('POST /api/fact-check (Validation & Contracts)', () => {
    it('returns 400 when claim is missing or empty', async () => {
      const res = await request(app)
        .post('/api/fact-check')
        .send({ claim: '   ' });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/claim.*required/i);
    });

    it('returns 400 when claim body is absent', async () => {
      const res = await request(app)
        .post('/api/fact-check')
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/claim.*required/i);
    });
  });

  describe('POST /api/detect-deepfake (Validation & Contracts)', () => {
    it('returns 400 when neither mediaUrl nor base64Media is supplied', async () => {
      const res = await request(app)
        .post('/api/detect-deepfake')
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/media/i);
    });

    it('rejects unsupported media formats', async () => {
      const res = await request(app)
        .post('/api/detect-deepfake')
        .send({
          base64Media: 'data:application/pdf;base64,JVBERi0xLjQK',
          mediaType: 'unsupported' as any,
        });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/analyze-text (Linguistic Analysis Contract)', () => {
    it('returns 400 when text parameter is empty or too short', async () => {
      const res = await request(app)
        .post('/api/analyze-text')
        .send({ text: '' });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/15 characters/i);
    });

    it('successfully processes valid text input and returns linguistic metrics', async () => {
      const res = await request(app)
        .post('/api/analyze-text')
        .send({
          text: 'This is a sample statement to verify semantic cohesion and synthetic markers in TRACE text analysis.',
        });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.result).toBeDefined();
      expect(res.body.result.aiScore).toBeDefined();
      expect(res.body.result.humanScore).toBeDefined();
      expect(res.body.result.summaryExplanation).toBeDefined();
    }, 45000);
  });

  describe('User Personal History Authentication Enforcements', () => {
    it('GET /api/history requires authentication (401)', async () => {
      const res = await request(app).get('/api/history');
      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/authentication required|unauthorized/i);
    });

    it('GET /api/history/export requires authentication (401)', async () => {
      const res = await request(app).get('/api/history/export');
      expect(res.status).toBe(401);
    });

    it('DELETE /api/history/delete-account requires authentication (401)', async () => {
      const res = await request(app).delete('/api/history/delete-account');
      expect(res.status).toBe(401);
    });
  });

  describe('Admin Operations Access Controls', () => {
    it('GET /api/admin/overview-stats requires administrator clearance (401)', async () => {
      const res = await request(app).get('/api/admin/overview-stats');
      expect(res.status).toBe(401);
    });

    it('POST /api/admin/system/control requires administrator clearance (401)', async () => {
      const res = await request(app)
        .post('/api/admin/system/control')
        .send({ maintenanceMode: true });
      expect(res.status).toBe(401);
    });

    it('GET /api/admin/audit-logs requires administrator clearance (401)', async () => {
      const res = await request(app).get('/api/admin/audit-logs');
      expect(res.status).toBe(401);
    });
  });

  describe('CircuitBreaker Unit Contract', () => {
    it('trips to OPEN state after configured threshold consecutive failures and returns fallback', async () => {
      const breaker = new CircuitBreaker('TestBreaker', {
        failureThreshold: 2,
        recoveryTimeMs: 1000,
      });

      const failingFn = async () => {
        throw new Error('Upstream timeout');
      };

      const fallbackFn = async () => 'fallback-response';

      // Call 1: fails -> uses fallback
      const call1 = await breaker.execute(failingFn, fallbackFn);
      expect(call1.fallbackUsed).toBe(true);
      expect(call1.result).toBe('fallback-response');
      expect(breaker.isOpen()).toBe(false);

      // Call 2: fails -> trips breaker to OPEN
      const call2 = await breaker.execute(failingFn, fallbackFn);
      expect(call2.fallbackUsed).toBe(true);
      expect(breaker.isOpen()).toBe(true);

      // Call 3: fast-fails without executing primary fn
      let primaryInvoked = false;
      const call3 = await breaker.execute(async () => {
        primaryInvoked = true;
        return 'primary';
      }, fallbackFn);

      expect(primaryInvoked).toBe(false);
      expect(call3.fallbackUsed).toBe(true);
      expect(call3.result).toBe('fallback-response');
      expect(call3.degradedReason).toMatch(/cooling down/i);
    });
  });
});
