import fs from 'fs';
import path from 'path';

export interface ReportReview {
  id: string;
  reportId: string;
  userId: string;
  choice: 'debunked' | 'misleading' | 'mostly_true' | 'verified';
  comment?: string;
  userName: string;
  handle: string;
  timestamp: string;
}

const REVIEWS_DIR = path.join(process.cwd(), 'backend', 'data', 'reviews');

function ensureReviewsDir(): void {
  if (!fs.existsSync(REVIEWS_DIR)) {
    fs.mkdirSync(REVIEWS_DIR, { recursive: true });
  }
}

function getReportReviewsFilePath(reportId: string): string {
  const safeId = reportId.replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(REVIEWS_DIR, `${safeId}.json`);
}

export function getReportReviews(reportId: string): ReportReview[] {
  ensureReviewsDir();
  const filePath = getReportReviewsFilePath(reportId);
  if (!fs.existsSync(filePath)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export interface CommunityReviewStats {
  totalVotes: number;
  debunked: number;
  misleading: number;
  mostly_true: number;
  verified: number;
  percentages: {
    debunked: number;
    misleading: number;
    mostly_true: number;
    verified: number;
  };
}

export function computeCommunityStats(reviews: ReportReview[]): CommunityReviewStats {
  const totalVotes = reviews.length;
  let debunked = 0;
  let misleading = 0;
  let mostly_true = 0;
  let verified = 0;
  for (const r of reviews) {
    if (r.choice === 'debunked') debunked++;
    else if (r.choice === 'misleading') misleading++;
    else if (r.choice === 'mostly_true') mostly_true++;
    else if (r.choice === 'verified') verified++;
  }
  const calcPct = (count: number) => (totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0);
  return {
    totalVotes,
    debunked,
    misleading,
    mostly_true,
    verified,
    percentages: {
      debunked: calcPct(debunked),
      misleading: calcPct(misleading),
      mostly_true: calcPct(mostly_true),
      verified: calcPct(verified),
    },
  };
}

export function saveReportReview(
  reportId: string,
  userId: string,
  data: {
    choice: 'debunked' | 'misleading' | 'mostly_true' | 'verified';
    comment?: string;
    userName?: string;
    authorName?: string;
    handle: string;
  }
): { review: ReportReview; isNew: boolean; communityStats: CommunityReviewStats } {
  ensureReviewsDir();
  const filePath = getReportReviewsFilePath(reportId);
  const reviews = getReportReviews(reportId);

  const existingIdx = reviews.findIndex((r) => r.userId === userId);
  const now = new Date().toISOString();
  const displayName = data.userName || data.authorName || 'Citizen Investigator';

  let review: ReportReview;
  let isNew = false;

  if (existingIdx !== -1) {
    // Update existing review (1 review per user)
    review = {
      ...reviews[existingIdx],
      choice: data.choice,
      comment: data.comment,
      userName: displayName,
      handle: data.handle,
      timestamp: now,
    };
    reviews[existingIdx] = review;
  } else {
    isNew = true;
    review = {
      id: `rev-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      reportId,
      userId,
      choice: data.choice,
      comment: data.comment,
      userName: displayName,
      handle: data.handle,
      timestamp: now,
    };
    reviews.unshift(review);
  }

  // Atomic file write
  const tempPath = `${filePath}.tmp.${Date.now()}`;
  fs.writeFileSync(tempPath, JSON.stringify(reviews, null, 2), 'utf8');
  fs.renameSync(tempPath, filePath);

  return { review, isNew, communityStats: computeCommunityStats(reviews) };
}
