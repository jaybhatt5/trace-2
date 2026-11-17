import dotenv from 'dotenv';

// Load root .env once on backend startup
dotenv.config();

export interface FirebasePublicClientConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

export interface FirebaseServerHashConfig {
  algorithm: string;
  base64SignerKey: string;
  base64SaltSeparator: string;
  rounds: number;
  memCost: number;
}

const cleanEnv = (val?: string): string => (val || '').trim();

/**
 * Returns the backend-only Gemini API key from environment variables.
 * Never accepts or trusts keys supplied by browser headers or request bodies.
 */
export function getGeminiApiKey(): string | undefined {
  const raw = cleanEnv(process.env.GEMINI_API_KEY || process.env.API_KEY);
  return raw.length > 5 ? raw : undefined;
}

/**
 * Returns the backend-only GNews API key from environment variables.
 */
export function getGnewsApiKey(): string | undefined {
  const raw = cleanEnv(process.env.GNEWS_API_KEY);
  return raw.length > 5 ? raw : undefined;
}

/**
 * Public Firebase Web SDK initialization parameters read from backend env.
 * Returned dynamically by GET /api/config/firebase so no keys are hardcoded
 * in frontend source or bundled into static client assets.
 */
export function getFirebasePublicConfig(): FirebasePublicClientConfig | null {
  const apiKey = cleanEnv(process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY);
  const projectId = cleanEnv(process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID);
  const appId = cleanEnv(process.env.FIREBASE_APP_ID || process.env.VITE_FIREBASE_APP_ID);

  if (!apiKey || !projectId || !appId) {
    return null;
  }

  return {
    apiKey,
    authDomain: cleanEnv(process.env.FIREBASE_AUTH_DOMAIN || process.env.VITE_FIREBASE_AUTH_DOMAIN) || `${projectId}.firebaseapp.com`,
    projectId,
    storageBucket: cleanEnv(process.env.FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET) || `${projectId}.firebasestorage.app`,
    messagingSenderId: cleanEnv(process.env.FIREBASE_MESSAGING_SENDER_ID || process.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
    appId,
    measurementId: cleanEnv(process.env.FIREBASE_MEASUREMENT_ID || process.env.VITE_FIREBASE_MEASUREMENT_ID) || undefined,
  };
}

/**
 * Server-only SCRYPT password hash parameters (contains private signer key).
 * Never exposed over HTTP to any client endpoint.
 */
export function getFirebaseServerHashConfig(): FirebaseServerHashConfig | null {
  const signerKey = cleanEnv(process.env.FIREBASE_HASH_SIGNER_KEY);
  if (!signerKey) return null;

  return {
    algorithm: cleanEnv(process.env.FIREBASE_HASH_ALGORITHM) || 'SCRYPT',
    base64SignerKey: signerKey,
    base64SaltSeparator: cleanEnv(process.env.FIREBASE_HASH_SALT_SEPARATOR) || 'Bw==',
    rounds: Number(process.env.FIREBASE_HASH_ROUNDS) || 8,
    memCost: Number(process.env.FIREBASE_HASH_MEM_COST) || 14,
  };
}

export function getServerPort(): number {
  return Number(process.env.PORT) || 3000;
}

export function getAppUrl(): string {
  return cleanEnv(process.env.APP_URL) || `http://localhost:${getServerPort()}`;
}

/**
 * Safe non-secret key readiness indicators for UI status badges.
 */
export function getSystemKeyStatus() {
  return {
    geminiConfigured: Boolean(getGeminiApiKey()),
    gnewsConfigured: Boolean(getGnewsApiKey()),
    firebaseConfigured: Boolean(getFirebasePublicConfig()),
  };
}
