import type {
  AITextAnalysisResult,
  DeepfakeAnalysisResult,
  FactCheckItem,
  NewsApiResponse,
  NewsArticle,
  NewsMediaFactCheckResult,
} from '../types';
import type {
  ElaResult,
  EdgeNoiseResult,
  ExtractedKeyframe,
} from '../utils/forensicVision';

export type TraceTab =
  | 'top-news'
  | 'live-news'
  | 'news-media'
  | 'busted'
  | 'recent'
  | 'deepfake'
  | 'ai-analyzer'
  | 'stats'
  | 'admin'
  | 'history'
  | 'terms'
  | 'privacy';

export type AuthGateState =
  | { open: false }
  | { open: true; portal: 'reader' | 'admin'; notice?: string; pendingTab: TraceTab | null };

export interface AppNavigationState {
  activeTab: TraceTab;
  authGate: AuthGateState;
}

export type AppNavigationAction =
  | { type: 'SELECT_TAB'; tab: TraceTab }
  | { type: 'OPEN_AUTH_GATE'; portal: 'reader' | 'admin'; notice?: string; pendingTab?: TraceTab | null }
  | { type: 'CLOSE_AUTH_GATE' }
  | { type: 'AUTH_COMPLETED'; role: 'reader' | 'admin' };

export function appNavigationReducer(
  state: AppNavigationState,
  action: AppNavigationAction
): AppNavigationState {
  switch (action.type) {
    case 'SELECT_TAB':
      return {
        activeTab: action.tab,
        authGate: { open: false },
      };
    case 'OPEN_AUTH_GATE':
      return {
        ...state,
        authGate: {
          open: true,
          portal: action.portal,
          notice: action.notice,
          pendingTab: action.pendingTab ?? null,
        },
      };
    case 'CLOSE_AUTH_GATE':
      return {
        ...state,
        authGate: { open: false },
      };
    case 'AUTH_COMPLETED': {
      const pending = state.authGate.open ? state.authGate.pendingTab : null;
      let targetTab: TraceTab = state.activeTab;
      if (pending) {
        targetTab = pending;
      } else if (action.role === 'admin') {
        targetTab = 'admin';
      } else if (state.activeTab === 'admin') {
        targetTab = 'top-news';
      }
      return {
        activeTab: targetTab,
        authGate: { open: false },
      };
    }
    default:
      return state;
  }
}

export type ClaimVerificationState =
  | { status: 'idle' }
  | { status: 'verifying'; query: string }
  | { status: 'success'; item: FactCheckItem }
  | { status: 'error'; message: string };

export type InspectionModalState =
  | null
  | { kind: 'fact-check'; item: FactCheckItem }
  | { kind: 'deepfake'; result: DeepfakeAnalysisResult };

export type DeepfakeAnalysisState =
  | { status: 'idle' }
  | {
      status: 'analyzing';
      stageText: string;
      loaderStepIdx: number;
      extractedFrames: ExtractedKeyframe[];
    }
  | {
      status: 'complete';
      result: DeepfakeAnalysisResult;
      ela: ElaResult | null;
      edgeNoise: EdgeNoiseResult | null;
      extractedFrames: ExtractedKeyframe[];
    }
  | {
      status: 'error';
      message: string;
      ela: ElaResult | null;
      edgeNoise: EdgeNoiseResult | null;
      extractedFrames: ExtractedKeyframe[];
    };

export type DeepfakeAnalysisAction =
  | { type: 'RESET' }
  | { type: 'START'; stageText: string }
  | { type: 'SET_STAGE'; stageText: string; loaderStepIdx?: number }
  | { type: 'SET_STEP_IDX'; loaderStepIdx: number }
  | { type: 'SET_FRAMES'; extractedFrames: ExtractedKeyframe[] }
  | { type: 'SET_MAPS'; ela?: ElaResult; edgeNoise?: EdgeNoiseResult }
  | {
      type: 'COMPLETE';
      result: DeepfakeAnalysisResult;
      ela: ElaResult | null;
      edgeNoise: EdgeNoiseResult | null;
      extractedFrames: ExtractedKeyframe[];
    }
  | {
      type: 'FAIL';
      message: string;
      ela: ElaResult | null;
      edgeNoise: EdgeNoiseResult | null;
      extractedFrames: ExtractedKeyframe[];
    };

export function deepfakeAnalysisReducer(
  state: DeepfakeAnalysisState,
  action: DeepfakeAnalysisAction
): DeepfakeAnalysisState {
  switch (action.type) {
    case 'RESET':
      return { status: 'idle' };
    case 'START':
      return {
        status: 'analyzing',
        stageText: action.stageText,
        loaderStepIdx: 0,
        extractedFrames: [],
      };
    case 'SET_STAGE':
      if (state.status !== 'analyzing') return state;
      return {
        ...state,
        stageText: action.stageText,
        loaderStepIdx: action.loaderStepIdx ?? state.loaderStepIdx,
      };
    case 'SET_STEP_IDX':
      if (state.status !== 'analyzing') return state;
      return {
        ...state,
        loaderStepIdx: action.loaderStepIdx,
      };
    case 'SET_FRAMES':
      if (state.status !== 'analyzing') return state;
      return {
        ...state,
        extractedFrames: action.extractedFrames,
      };
    case 'SET_MAPS':
      if (state.status !== 'complete' && state.status !== 'error') return state;
      return {
        ...state,
        ela: action.ela ?? state.ela,
        edgeNoise: action.edgeNoise ?? state.edgeNoise,
      };
    case 'COMPLETE':
      return {
        status: 'complete',
        result: action.result,
        ela: action.ela,
        edgeNoise: action.edgeNoise,
        extractedFrames: action.extractedFrames,
      };
    case 'FAIL':
      return {
        status: 'error',
        message: action.message,
        ela: action.ela,
        edgeNoise: action.edgeNoise,
        extractedFrames: action.extractedFrames,
      };
    default:
      return state;
  }
}

export type MediaCheckState =
  | { status: 'idle' }
  | { status: 'analyzing'; stageText: string; loaderStepIdx: number }
  | { status: 'complete'; result: NewsMediaFactCheckResult }
  | { status: 'error'; message: string };

export type MediaCheckAction =
  | { type: 'RESET' }
  | { type: 'START'; stageText: string }
  | { type: 'SET_STAGE'; stageText: string; loaderStepIdx?: number }
  | { type: 'SET_STEP_IDX'; loaderStepIdx: number }
  | { type: 'COMPLETE'; result: NewsMediaFactCheckResult }
  | { type: 'FAIL'; message: string };

export function mediaCheckReducer(
  state: MediaCheckState,
  action: MediaCheckAction
): MediaCheckState {
  switch (action.type) {
    case 'RESET':
      return { status: 'idle' };
    case 'START':
      return { status: 'analyzing', stageText: action.stageText, loaderStepIdx: 0 };
    case 'SET_STAGE':
      if (state.status !== 'analyzing') return state;
      return {
        ...state,
        stageText: action.stageText,
        loaderStepIdx: action.loaderStepIdx ?? state.loaderStepIdx,
      };
    case 'SET_STEP_IDX':
      if (state.status !== 'analyzing') return state;
      return { ...state, loaderStepIdx: action.loaderStepIdx };
    case 'COMPLETE':
      return { status: 'complete', result: action.result };
    case 'FAIL':
      return { status: 'error', message: action.message };
    default:
      return state;
  }
}

export type TextAuditState =
  | { status: 'idle' }
  | { status: 'analyzing' }
  | { status: 'complete'; result: AITextAnalysisResult }
  | { status: 'error'; message: string };

export interface LiveFeedState {
  status: 'idle' | 'loading' | 'ready' | 'error';
  articles: NewsArticle[];
  metadata: NewsApiResponse['metadata'] | null;
  errorMessage: string | null;
  isBackgroundRefresh: boolean;
}

export type EngineStatusCheckState =
  | { status: 'idle' }
  | { status: 'checking' }
  | { status: 'verified'; message: string }
  | { status: 'error'; message: string };

export type AuthSubmissionState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'error'; message: string };

export type CmsMutationState =
  | { status: 'idle' }
  | { status: 'saving'; mode: 'create' | 'update' }
  | { status: 'success'; message: string }
  | { status: 'error'; message: string };
