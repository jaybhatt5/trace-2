import { Router } from 'express';
import crypto from 'crypto';
import {
  getEditorialFeed,
  getEditorialArticle,
} from '../services/editorialService';
import {
  fetchLatestNews,
  searchNews,
  ALLOWED_CATEGORIES,
  clearNewsCache,
  getNewsCacheStats,
} from '../services/newsService';
import { requireAdmin, requireAuth, createRateLimiter, AuthenticatedRequest } from '../middleware/auth';
import { saveReportReview, getReportReviews } from '../services/reviewService';
import { recordAuditLog, handleServerError } from '../services/systemService';

export const newsRouter = Router();
const authSensitiveLimiter = createRateLimiter(60 * 1000, 30, 'Too many requests. Please slow down.');

// Public Editorial Feed & Wire
newsRouter.get('/feed', (_req, res) => {
  const feed = getEditorialFeed();
  res.json({
    items: feed.items,
    factChecks: feed.items,
    stats: feed.stats,
  });
});

newsRouter.get('/fact-check/:id', (req, res) => {
  const article = getEditorialArticle(req.params.id);
  if (!article) {
    return res.status(404).json({
      error: `Article with ID "${req.params.id}" not found in public editorial registry.`,
    });
  }
  res.json({ success: true, item: article });
});

// Community Truth Rating & TRACE Meter Review (Authenticated)
newsRouter.get('/fact-check/:id/reviews', (req, res) => {
  try {
    const reviewsData = getReportReviews(req.params.id);
    res.json({ success: true, ...reviewsData });
  } catch (err: any) {
    return handleServerError(res, 'Failed to fetch reviews', err);
  }
});

newsRouter.post('/fact-check/:id/review', requireAuth, authSensitiveLimiter, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { choice, comment } = req.body || {};

    if (!choice) {
      return res.status(400).json({ error: 'Review choice is required.' });
    }

    const validChoices = ['debunked', 'misleading', 'mostly_true', 'verified'];
    if (!validChoices.includes(choice)) {
      return res.status(400).json({ error: `Invalid choice. Must be one of: ${validChoices.join(', ')}` });
    }

    const userId = req.user!.uid;
    const authorName = req.user!.name || req.user!.email?.split('@')[0] || 'Citizen Investigator';
    const handle = req.user!.email ? `@${req.user!.email.split('@')[0]}` : `@user_${userId.slice(0, 6)}`;

    const saved = await saveReportReview(id, userId, {
      userName: authorName,
      authorName,
      handle,
      choice,
      comment: (comment || '').trim().slice(0, 1000),
    });

    recordAuditLog('TRUTH_REVIEW_SUBMITTED', handle, `Review submitted for report "${id}": choice=${choice}`, 'info');

    res.json({
      success: true,
      review: saved.review,
      communityStats: saved.communityStats,
      message: 'Truth review registered successfully.',
    });
  } catch (err: any) {
    return handleServerError(res, 'Failed to record truth review', err);
  }
});

// Live News Feed (GNews v4 Integration)
newsRouter.get('/news', async (req, res) => {
  const category = ((req.query.category as string) || 'general').toLowerCase().trim();
  const country = ((req.query.country as string) || 'in').toLowerCase().trim();
  const lang = ((req.query.lang as string) || 'en').toLowerCase().trim();
  const max = parseInt((req.query.max as string) || '10', 10);
  const page = parseInt((req.query.page as string) || '1', 10);

  if (!ALLOWED_CATEGORIES.has(category)) {
    return res.status(400).json({
      error: `Invalid news category: "${category}".`,
      allowedCategories: Array.from(ALLOWED_CATEGORIES),
    });
  }

  try {
    const result = await fetchLatestNews({
      category,
      country,
      lang,
      max: isNaN(max) ? 10 : max,
      page: isNaN(page) ? 1 : page,
    });
    res.json(result);
  } catch (err: any) {
    const reqId = crypto.randomUUID();
    console.error(`[TRACE - ${reqId}] Failed to retrieve live news:`, err);
    res.status(502).json({
      error: 'News is temporarily unavailable.',
      requestId: reqId,
    });
  }
});

newsRouter.get('/news/search', async (req, res) => {
  const q = ((req.query.q as string) || '').trim();
  const country = ((req.query.country as string) || 'in').toLowerCase().trim();
  const lang = ((req.query.lang as string) || 'en').toLowerCase().trim();
  const max = parseInt((req.query.max as string) || '10', 10);
  const page = parseInt((req.query.page as string) || '1', 10);

  if (!q) {
    return res.status(400).json({
      error: 'Search query parameter "q" is required and cannot be empty.',
    });
  }

  if (q.length > 100) {
    return res.status(400).json({
      error: 'Search query is too long (maximum 100 characters).',
    });
  }

  try {
    const result = await searchNews({
      query: q,
      country,
      lang,
      max: isNaN(max) ? 10 : max,
      page: isNaN(page) ? 1 : page,
    });
    res.json(result);
  } catch (err: any) {
    const reqId = crypto.randomUUID();
    console.error(`[TRACE - ${reqId}] Failed to search live news:`, err);
    res.status(502).json({
      error: 'News search is temporarily unavailable.',
      requestId: reqId,
    });
  }
});

newsRouter.get('/news/cache-stats', (_req, res) => {
  res.json({
    success: true,
    cache: getNewsCacheStats(),
  });
});

newsRouter.post('/news/clear-cache', requireAdmin, (_req, res) => {
  clearNewsCache();
  res.json({
    success: true,
    message: 'Live news in-memory cache successfully invalidated.',
  });
});
