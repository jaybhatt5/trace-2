import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { getServerPort } from './config/env';
import { ensureAiEngineRunning } from './services/localAiBridge';
import {
  createRateLimiter,
  secureHeadersMiddleware,
} from './middleware/auth';
import {
  AdminSystemControls,
  AuditLogEntry,
  recordAuditLog,
  handleServerError,
  getSystemControls,
} from './services/systemService';
import { systemRouter } from './routes/systemRoutes';
import { newsRouter } from './routes/newsRoutes';
import { historyRouter } from './routes/historyRoutes';
import { adminRouter } from './routes/adminRoutes';
import { aiRouter } from './routes/aiRoutes';
import { authRouter } from './routes/authRoutes';
import { userAdminRouter } from './routes/userAdminRoutes';
import { bootstrapProductionAdmin } from './services/adminBootstrap';
import cookieParser from 'cookie-parser';

export type { AdminSystemControls, AuditLogEntry };
export { recordAuditLog, handleServerError, getSystemControls };

export const app = express();
const PORT = getServerPort();

// Configure proxy trust for cloud load balancers / App Hosting
app.set('trust proxy', 1);

// Apply Enterprise Security Headers with CSP to all responses
app.use(secureHeadersMiddleware);

// Strict CORS Allowlist - Never reflect arbitrary origin with credentials
const isDevelopment = process.env.NODE_ENV !== 'production';
const ALLOWED_ORIGINS = new Set(
  [
    process.env.APP_URL,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:8080',
    'http://127.0.0.1:8080',
  ]
    .filter(Boolean)
    .map((o) => (o as string).replace(/\/$/, ''))
);

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (
    origin &&
    (ALLOWED_ORIGINS.has(origin) ||
      (isDevelopment &&
        (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'))))
  ) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization, ngrok-skip-browser-warning'
  );

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Strict body parsers with limits (100kb default, 25mb only for validated media routes)
const defaultJsonParser = express.json({ limit: '100kb' });
const mediaJsonParser = express.json({ limit: '25mb' });

app.use(cookieParser());

app.use((req, res, next) => {
  if (req.path === '/api/detect-deepfake' || req.path === '/api/fact-check-media') {
    return mediaJsonParser(req, res, next);
  }
  return defaultJsonParser(req, res, next);
});
app.use(express.urlencoded({ limit: '100kb', extended: true }));

// Handle JSON parsing syntax errors cleanly with JSON response (not HTML)
app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({
      error: 'Invalid JSON',
      message: 'Malformed JSON payload in request body.',
    });
  }
  next(err);
});

// Rate Limiters to defend against abuse and quota exhaustion
const generalApiLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 120,
  message: 'API rate limit exceeded. Please wait a moment before sending more requests.',
});

// Mount API Routers
app.use('/api', generalApiLimiter);
app.use('/api/auth', authRouter);
app.use('/api/admin', userAdminRouter);
app.use('/api', systemRouter);
app.use('/api', newsRouter);
app.use('/api', historyRouter);
app.use('/api', adminRouter);
app.use('/api', aiRouter);

// -----------------------------------------------------------------------------
// SERVER INITIALIZATION
// -----------------------------------------------------------------------------

async function startServer() {
  await bootstrapProductionAdmin().catch((err) => {
    console.error('[TRACE BOOTSTRAP NOTICE]', err.message);
  });

  const DATA_DIR = path.join(process.cwd(), 'backend', 'data');
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      configFile: path.resolve(process.cwd(), 'vite.config.ts'),
      server: {
        middlewareMode: true,
        allowedHosts: [
          'moneybags-confused-exorcism.ngrok-free.dev',
          '.ngrok-free.dev',
          '.ngrok-free.app',
          '.trycloudflare.com',
        ],
        watch: {
          ignored: [
            '**/backend/data/**',
            '**/backend/data/*',
            '**/*.log',
            '**/dist/**',
            '**/scripts/**',
            '**/.git/**',
            '**/.system_generated/**',
            '**/user-factchecks.json',
          ],
        },
      },
      appType: 'spa',
    });

    try {
      vite.watcher.unwatch([
        DATA_DIR,
        path.join(DATA_DIR, '*'),
        path.join(DATA_DIR, '**/*'),
      ]);
    } catch (unwatchErr) {
      console.warn('[TRACE] Watcher unwatch notice:', unwatchErr);
    }

    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TRACE (Truth Review & Authenticity Checking Engine) running at http://localhost:${PORT}`);
    ensureAiEngineRunning().then((ready) => {
      if (ready) {
        console.info('[TRACE Local AI] Inference engine is online and ready.');
      } else {
        console.info('[TRACE Local AI] Inference engine using on-demand CLI fallback.');
      }
    });
  });
}

if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  startServer();
}

export { startServer };
