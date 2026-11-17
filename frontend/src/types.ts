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

export interface UserPerspective {
  choice: 'trustworthy' | 'context' | 'misleading' | 'false' | 'unsure';
  comment?: string;
  submittedAt: string;
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
  userPerspective?: UserPerspective;
  isHonestInconclusive?: boolean;
}

export interface VideoKeyframeAnalysis {
  frameIndex: number;
  timestamp: string;
  frameUrl: string;
  authenticityScore: number;
  aiProbability: number;
  isManipulated: boolean;
  anomalyNote?: string;
}

export interface DeepfakeAnalysisResult {
  id: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  isManipulated: boolean;
  aiProbability: number;
  authenticityScore: number;
  verdict: DeepfakeVerdict | string;
  verdictLabel: string;
  summary: string;
  plainEnglishExplanation?: string;
  whatWeFound?: string[];
  anomalies: {
    feature: string;
    severity: 'High' | 'Medium' | 'Low';
    description: string;
    region?: { x: number; y: number; width: number; height: number };
  }[];
  categorizedObservations?: {
    faceAnalysis?: string[];
    imageArtifacts?: string[];
    compressionAnalysis?: string[];
    noisePatterns?: string[];
    frequencyAnalysis?: string[];
    temporalAnalysis?: string[];
  };
  technicalDetails: {
    facialBoundaryScore: number;
    lightingConsistencyScore: number;
    spectralNoiseScore: number;
    ganArtifactsScore: number;
    elaScore?: number;
    noiseVarianceScore?: number;
    subsurfaceScatteringScore?: number;
  };
  forensicPillars?: {
    biometric: {
      score: number;
      irisSymmetry: number;
      facialBoundary: number;
      skinMicroTexture: number;
      lipSyncCoherence: number;
    };
    digitalSignal: {
      score: number;
      elaDiscrepancy: number;
      highFreqNoise: number;
      ganSpectralArtifacts: number;
    };
    provenance: {
      score: number;
      exifVerified: boolean;
      c2paStatus: string;
      cameraHardware: string;
      softwareTag: string;
    };
    temporal?: {
      score: number;
      interFrameJitter: number;
      lightingCoherence: number;
      expressionContinuity: number;
    };
  };
  synthIdResult?: {
    detected: boolean;
    watermarkType: string;
    confidence: number;
    details: string;
  };
  metadataInspection?: {
    hasExif: boolean;
    cameraModel: string;
    softwareSignatures: string;
    c2paManifest: 'Verified Untampered' | 'Synthetic AI Origin Flagged' | 'Missing Manifest / Stripped';
    gpsCoordinates?: string;
    creationDate?: string;
    credibilityIndex: number;
  };
  elaScore?: number;
  elaHeatmapUrl?: string;
  edgeNoiseMapUrl?: string;
  videoFrames?: VideoKeyframeAnalysis[];
  heatmapUrl?: string;
  limitations?: string[];
  modelName?: string;
  hardwareDevice?: string;
  confidenceInterval?: [number, number] | string;
  confidenceBand?: { lower: number; upper: number; label: string };
  processingDurationMs?: number;
  temporalConsistency?: { faceJitterVariance?: number; lightingShiftStd?: number; score?: number } | number;
  timestamp: string;
}

export interface AITextAnalysisResult {
  id: string;
  inputText: string;
  aiScore: number;
  humanScore: number;
  perplexityScore: number;
  burstinessScore: number;
  predictedModel?: string;
  highlightedSentences: {
    text: string;
    aiLikelihood: 'High' | 'Medium' | 'Low';
    reason: string;
  }[];
  summaryExplanation: string;
  timestamp: string;
}

export interface NewsMediaFactCheckResult {
  id: string;
  mediaUrl?: string;
  mediaType: 'image' | 'video';
  headlineExtracted: string;
  ocrText: string;
  ocrLines?: string[];
  ocrConfidence?: number;
  ocrEngine?: string;
  verdict: VerdictType;
  compassVerdict?: CredibilityVerdict;
  truthScore: number;
  visualIntegrityScore: number;
  summary: string;
  detailedReasoning: string;
  whatWeFound?: string[];
  keyEvidence: string[];
  evidenceSupporting?: string[];
  evidenceContradicting?: string[];
  visualAnomalies: {
    element: string;
    anomalyType: string;
    note: string;
  }[];
  sources: CredibilitySource[];
  limitations?: string[];
  timestamp: string;
}

export interface UserHistoryItem {
  id: string;
  userId: string;
  type: 'deepfake' | 'news_factcheck' | 'media_ocr' | 'text_nlp';
  title: string;
  claim: string;
  originalFilename?: string;
  sourceUrl?: string;
  verdict: string;
  verdictLabel?: string;
  summary: string;
  evidence: string[];
  keyFindings?: string[];
  sources?: CredibilitySource[];
  metadata?: Record<string, any>;
  userPerspective?: UserPerspective;
  timestamp: string;
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

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  details: string;
  ip?: string;
  severity: 'info' | 'warn' | 'security';
}

export interface OverviewStatsResponse {
  success: boolean;
  timestamp?: string;
  stats: {
    totalClaimsChecked: number;
    editorialArticlesCount: number;
    fakeNewsBusted: number;
    deepfakesIntercepted: number;
    mediaAuditsCompleted: number;
    accuracyRate: number;
    userAccountsCount: number;
    totalUserScans: number;
    categoriesBreakdown: Array<{ category: string; count: number }>;
  };
  system: {
    nodeVersion: string;
    platform: string;
    cpuCount: number;
    uptimeSeconds: number;
    uptimeFormatted: string;
    memoryRssMb: number;
    memoryHeapUsedMb: number;
    memoryHeapTotalMb: number;
    systemMemoryUsedMb: number;
    systemMemoryTotalMb: number;
    systemMemoryPercent: number;
  };
  engines: {
    localAiStatus: string;
    geminiStatus: string;
    gnewsStatus: string;
  };
  controls: {
    maintenanceMode: boolean;
    deepfakeConfidenceThreshold: number;
    liveFeedAutoRefresh: boolean;
    aiEngineMode: 'hybrid' | 'gemini_only' | 'local_only';
  };
  recentUsers: Array<{ uid: string; itemCount: number; lastActive?: string }>;
}
