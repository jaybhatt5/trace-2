export type CredibilityVerdict =
  | 'SUPPORTED_BY_EVIDENCE'
  | 'MOSTLY_TRUE_NEEDS_CONTEXT'
  | 'MISLEADING'
  | 'DEBUNKED'
  | 'UNVERIFIED';

export type LegacyVerdictType = 'VERIFIED_TRUE' | 'DEBUNKED_FAKE' | 'MISLEADING' | 'UNVERIFIED';

export type VerdictType = CredibilityVerdict | LegacyVerdictType;

export type DeepfakeVerdict =
  | 'No manipulation signals found'
  | 'Likely Authentic'
  | 'Potentially Manipulated'
  | 'Likely AI-Generated'
  | 'Inconclusive';

export type ContentCategory =
  | 'Politics'
  | 'Health & Science'
  | 'Technology'
  | 'World News'
  | 'Entertainment'
  | 'Finance'
  | 'General';

export interface CredibilitySource {
  name: string;
  publisher?: string;
  publicationDate?: string;
  url?: string;
  credibilityScore?: number;
  type?: 'Official Standard' | 'Fact Checking Org' | 'Peer Reviewed' | 'Primary Source' | 'Unverified Social' | string;
}

export interface FactCheckItem {
  id: string;
  title: string;
  claim: string;
  verdict: VerdictType;
  verdictLabel?: string;
  compassVerdict?: CredibilityVerdict;
  truthScore?: number;
  category: ContentCategory;
  summary: string;
  explanation: string;
  whatWeFound?: string[];
  keyFindings: string[];
  evidenceSupporting?: string[];
  evidenceContradicting?: string[];
  whatIsStillUnknown?: string;
  sources: CredibilitySource[];
  timestamp: string;
  verifiedBy: string;
  engineUsed?: string;
  isDegraded?: boolean;
  degradationNotice?: string;
  imageUrl?: string;
  isDeepfakeChecked?: boolean;
  isAiTextChecked?: boolean;
  sharesCount: number;
  tags: string[];
  isHonestInconclusive?: boolean;
}

export interface VerificationStats {
  totalClaimsChecked: number;
  fakeNewsBusted: number;
  deepfakesIntercepted: number;
  mediaAuditsCompleted: number;
  accuracyRate: number;
  categoriesBreakdown: { category: string; count: number }[];
}

export interface NewsArticleSource {
  name: string;
  url?: string;
}

export interface NewsArticle {
  id?: string;
  title: string;
  description: string;
  content?: string;
  url: string;
  image?: string;
  publishedAt: string;
  source: NewsArticleSource;
  category?: string;
}

export interface NewsApiResponse {
  articles: NewsArticle[];
  metadata?: {
    totalArticles?: number;
    cached?: boolean;
    cachedAt?: string;
    source?: string;
    category?: string;
    query?: string;
    delayNotice?: string;
    rateLimited?: boolean;
  };
}
