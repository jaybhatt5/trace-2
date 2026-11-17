import { Router } from 'express';
import {
  getFirebasePublicConfig,
  getGeminiApiKey,
  getSystemKeyStatus,
} from '../config/env';
import {
  checkAiEngineHealth,
  dispatchLocalAiRequest,
  getAiBridgeState,
} from '../services/localAiBridge';
import {
  optionalAuth,
  requireAdmin,
  createRateLimiter,
  AuthenticatedRequest,
} from '../middleware/auth';
import { GoogleGenAI } from '@google/genai';
import { geminiCircuitBreaker } from '../utils/circuitBreaker';

export const systemRouter = Router();
const authSensitiveLimiter = createRateLimiter(60 * 1000, 30, 'Too many requests. Please slow down.');

// Public System Status & Health Check (Minimal, zero information leakage)
systemRouter.get('/system/status', optionalAuth, async (req: AuthenticatedRequest, res) => {
  // If authorized administrator, provide full operational telemetry
  if (req.user && req.user.role === 'admin') {
    const keys = getSystemKeyStatus();
    const bridge = getAiBridgeState();
    try {
      const health = await checkAiEngineHealth();
      return res.json({
        success: true,
        keys,
        bridge,
        localAi: health || null,
        circuitBreakers: {
          gemini: geminiCircuitBreaker.getStatus(),
        },
        security: {
          tokenVerificationActive: true,
          databaseIsolation: 'users/{uid}/history isolated',
          editorialSeparation: true,
        },
      });
    } catch {
      return res.json({
        success: true,
        keys,
        bridge,
        localAi: null,
      });
    }
  }

  // Public Response: Minimal health check only
  res.json({
    status: 'operational',
    service: 'TRACE Sentinel Truth Engine',
    timestamp: new Date().toISOString(),
  });
});

systemRouter.get('/admin/system/status', requireAdmin, async (_req, res) => {
  const keys = getSystemKeyStatus();
  const bridge = getAiBridgeState();
  const health = await checkAiEngineHealth().catch(() => null);
  res.json({
    success: true,
    keys,
    bridge,
    localAi: health,
    circuitBreakers: {
      gemini: geminiCircuitBreaker.getStatus(),
    },
  });
});

systemRouter.get('/config/firebase', (_req, res) => {
  const config = getFirebasePublicConfig();
  if (!config) {
    return res.json({ configured: false, config: null });
  }
  res.json({ configured: true, config });
});

systemRouter.get('/ai-status', optionalAuth, async (req: AuthenticatedRequest, res) => {
  // If authorized administrator, provide full health diagnosis
  if (req.user && req.user.role === 'admin') {
    try {
      const health = await checkAiEngineHealth();
      if (health) {
        return res.json({ success: true, localAi: health });
      }
      const cliStatus = await dispatchLocalAiRequest('/health', 'status', {});
      return res.json({ success: true, localAi: cliStatus });
    } catch {
      return res.json({
        success: false,
        error: 'Local AI engine is initializing or unavailable.',
      });
    }
  }

  // Public Response: minimal status without error details or internal topologies
  try {
    const health = await checkAiEngineHealth();
    return res.json({
      status: health ? 'operational' : 'degraded',
      service: 'TRACE Forensic AI Engine',
    });
  } catch {
    return res.json({
      status: 'offline',
      service: 'TRACE Forensic AI Engine',
    });
  }
});

systemRouter.post('/verify-api-key', requireAdmin, authSensitiveLimiter, async (_req, res) => {
  try {
    const key = getGeminiApiKey();
    if (!key) {
      return res.status(400).json({
        valid: false,
        error: 'GEMINI_API_KEY is not configured in backend .env.',
      });
    }

    const ai = new GoogleGenAI({ apiKey: key });
    await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Ping',
      config: { maxOutputTokens: 10 },
    });

    res.json({ valid: true, message: 'Backend Gemini gateway connected.' });
  } catch (err: any) {
    res.status(400).json({ valid: false, error: 'Validation failed.' });
  }
});
