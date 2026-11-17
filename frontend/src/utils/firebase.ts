// TRACE Platform Authentication & Firebase Enterprise Integration
// Security Notice: No API keys or hash secrets are hardcoded in client bundles.
// Public Firebase Web SDK configuration is fetched dynamically from GET /api/config/firebase.

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  type ConfirmationResult,
  type Auth,
  type User,
  type IdTokenResult,
} from 'firebase/auth';

export type UserRole = 'reader' | 'admin';

export interface FirebaseConfigParams {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

export interface TraceAuthUser {
  uid: string;
  email: string | null;
  phoneNumber: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
  role: UserRole;
  isAdmin: boolean;
  providerId: string;
  emailVerified: boolean;
  acceptedTermsVersion?: string;
  acceptedPrivacyVersion?: string;
  consentTimestamp?: string;
}

export type AdminUser = TraceAuthUser;

let cachedConfig: FirebaseConfigParams | null = null;
let cachedApp: FirebaseApp | null = null;
let cachedAuth: Auth | null = null;
let initPromise: Promise<{ app: FirebaseApp | null; auth: Auth | null; config: FirebaseConfigParams | null }> | null = null;

export const getActiveFirebaseConfig = (): FirebaseConfigParams | null => cachedConfig;

export const ensureFirebaseInitialized = (): Promise<{
  app: FirebaseApp | null;
  auth: Auth | null;
  config: FirebaseConfigParams | null;
}> => {
  if (cachedApp && cachedAuth && cachedConfig) {
    return Promise.resolve({ app: cachedApp, auth: cachedAuth, config: cachedConfig });
  }
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      const res = await fetch('/api/config/firebase');
      if (!res.ok) {
        return { app: null, auth: null, config: null };
      }
      const data = await res.json();
      const config = data?.configured && data?.config ? (data.config as FirebaseConfigParams) : null;
      if (!config || !config.apiKey || !config.projectId) {
        return { app: null, auth: null, config: null };
      }

      cachedConfig = config;
      cachedApp = getApps().length === 0 ? initializeApp(config) : getApp();
      cachedAuth = getAuth(cachedApp);
      return { app: cachedApp, auth: cachedAuth, config: cachedConfig };
    } catch (err) {
      console.warn('[TRACE] Failed to initialize Firebase from backend config:', err);
      return { app: null, auth: null, config: null };
    } finally {
      if (!cachedApp) {
        initPromise = null;
      }
    }
  })();

  return initPromise;
};

/**
 * Returns current Firebase ID token for authenticated requests.
 * Automatically refreshes expired tokens.
 */
export async function getAuthToken(forceRefresh: boolean = false): Promise<string | null> {
  const { auth } = await ensureFirebaseInitialized();
  if (!auth || !auth.currentUser) return null;
  try {
    return await auth.currentUser.getIdToken(forceRefresh);
  } catch (err) {
    console.warn('[TRACE Auth] Failed to retrieve fresh ID token:', err);
    return null;
  }
}

/**
 * Returns Authorization header object with Bearer token if user is signed in.
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await getAuthToken();
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

/**
 * Translates Firebase error codes into clear, user-friendly messages.
 */
export const formatAuthErrorMessage = (error: any): string => {
  const code = error?.code || '';
  if (code === 'auth/configuration-not-found') {
    return 'Firebase Authentication is not fully enabled in your Firebase Console. Please enable Google, Email/Password, or Phone Auth in the console.';
  }
  if (code === 'auth/invalid-api-key' || code === 'auth/api-key-not-valid') {
    return 'Firebase configuration is missing or invalid in server .env.';
  }
  if (code === 'auth/popup-closed-by-user') {
    return 'Google sign-in popup was closed before completing login.';
  }
  if (code === 'auth/unauthorized-domain') {
    return `Domain "${window.location.hostname}" is not authorized in Firebase Console -> Auth -> Settings -> Authorized domains.`;
  }
  if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
    return 'Invalid email, phone number, or password.';
  }
  if (code === 'auth/email-already-in-use') {
    return 'An account with this email address already exists. Try signing in instead.';
  }
  if (code === 'auth/weak-password') {
    return 'Password must be at least 6 characters long and include numbers or symbols for strength.';
  }
  if (code === 'auth/invalid-verification-code') {
    return 'Invalid verification code (OTP). Please check and enter the 6-digit code sent to your phone.';
  }
  if (code === 'auth/code-expired') {
    return 'The verification code has expired. Please request a new OTP.';
  }
  if (code === 'auth/invalid-phone-number') {
    return 'Please enter a valid phone number in international E.164 format (e.g. +91 9876543210).';
  }
  if (code === 'auth/too-many-requests') {
    return 'Too many attempts. For security reasons, please wait a few minutes before trying again.';
  }
  if (code === 'auth/quota-exceeded') {
    return 'SMS quota exceeded for today. Please use Google or Email login in the meantime.';
  }
  if (code === 'auth/network-request-failed') {
    return 'Network connection error while contacting authentication servers. Please check your internet.';
  }
  return error?.message || 'Authentication failed. Please try again.';
};

/**
 * Maps Firebase User to TraceAuthUser and inspects server-side claims.
 */
const toTraceUser = async (user: User): Promise<TraceAuthUser> => {
  let isAdmin = false;
  try {
    const idTokenResult: IdTokenResult = await user.getIdTokenResult();
    isAdmin = Boolean(idTokenResult.claims.admin || idTokenResult.claims.role === 'admin');
  } catch {
    // non-fatal
  }

  return {
    uid: user.uid,
    email: user.email,
    phoneNumber: user.phoneNumber,
    displayName: user.displayName || (user.email ? user.email.split('@')[0] : (user.phoneNumber ? `User ${user.phoneNumber.slice(-4)}` : 'TRACE User')),
    photoURL: user.photoURL,
    isAnonymous: user.isAnonymous,
    role: isAdmin ? 'admin' : 'reader',
    isAdmin,
    providerId: user.providerData?.[0]?.providerId || (user.isAnonymous ? 'anonymous' : 'password'),
    emailVerified: user.emailVerified,
  };
};

/**
 * Configure session persistence based on user preference.
 */
export async function configureSessionPersistence(rememberMe: boolean = true): Promise<void> {
  const { auth } = await ensureFirebaseInitialized();
  if (!auth) return;
  try {
    await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
  } catch (err) {
    console.warn('[TRACE Auth] Could not set session persistence:', err);
  }
}

// -----------------------------------------------------------------------------
// GOOGLE AUTHENTICATION
// -----------------------------------------------------------------------------

export const signInWithGoogle = async (rememberMe: boolean | string = true): Promise<TraceAuthUser> => {
  const isRemember = typeof rememberMe === 'boolean' ? rememberMe : true;
  const { auth } = await ensureFirebaseInitialized();
  if (!auth) throw new Error('Firebase Auth is not configured on the backend.');

  await configureSessionPersistence(isRemember);

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const cred = await signInWithPopup(auth, provider);
  return await toTraceUser(cred.user);
};

// -----------------------------------------------------------------------------
// EMAIL AUTHENTICATION
// -----------------------------------------------------------------------------

export const signInWithEmail = async (
  email: string,
  pass: string,
  rememberMe: boolean | string = true
): Promise<TraceAuthUser> => {
  const isRemember = typeof rememberMe === 'boolean' ? rememberMe : true;
  const { auth } = await ensureFirebaseInitialized();
  if (!auth) throw new Error('Firebase Auth is not configured on the backend.');

  await configureSessionPersistence(isRemember);

  const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
  return await toTraceUser(cred.user);
};

export const signUpWithEmail = async (
  email: string,
  pass: string,
  displayName?: string,
  consent?: { termsVersion: string; privacyVersion: string },
  rememberMe: boolean = true
): Promise<TraceAuthUser> => {
  const { auth } = await ensureFirebaseInitialized();
  if (!auth) throw new Error('Firebase Auth is not configured on the backend.');

  await configureSessionPersistence(rememberMe);

  const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
  if (displayName?.trim()) {
    try {
      await updateProfile(cred.user, { displayName: displayName.trim() });
    } catch {
      // non-fatal
    }
  }

  // Send verification email
  try {
    await sendEmailVerification(cred.user);
  } catch (verErr) {
    console.warn('[TRACE Auth] Verification email notice:', verErr);
  }

  const session = await toTraceUser(cred.user);
  if (consent) {
    session.acceptedTermsVersion = consent.termsVersion;
    session.acceptedPrivacyVersion = consent.privacyVersion;
    session.consentTimestamp = new Date().toISOString();
  }
  return session;
};

export const sendPasswordReset = async (email: string): Promise<void> => {
  const { auth } = await ensureFirebaseInitialized();
  if (!auth) throw new Error('Firebase Auth is not configured.');
  await sendPasswordResetEmail(auth, email.trim());
};

// -----------------------------------------------------------------------------
// REAL FIREBASE PHONE AUTHENTICATION (E.164 & RecaptchaVerifier)
// -----------------------------------------------------------------------------

let globalRecaptchaVerifier: RecaptchaVerifier | null = null;

export const initPhoneRecaptcha = (containerId: string): RecaptchaVerifier => {
  const { auth } = getAuthInstanceSync();
  if (!auth) throw new Error('Firebase Auth must be initialized first.');

  if (globalRecaptchaVerifier) {
    try {
      globalRecaptchaVerifier.clear();
    } catch {
      // ignore
    }
    globalRecaptchaVerifier = null;
  }

  globalRecaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: 'normal',
    callback: () => {
      // reCAPTCHA solved
    },
    'expired-callback': () => {
      console.warn('[TRACE Phone Auth] reCAPTCHA expired. User must solve it again.');
    },
  });

  return globalRecaptchaVerifier;
};

export const clearPhoneRecaptcha = () => {
  if (globalRecaptchaVerifier) {
    try {
      globalRecaptchaVerifier.clear();
    } catch {
      // ignore
    }
    globalRecaptchaVerifier = null;
  }
};

export const sendPhoneOtp = async (
  phoneNumber: string,
  verifier: RecaptchaVerifier,
  rememberMe: boolean = true
): Promise<ConfirmationResult> => {
  const { auth } = await ensureFirebaseInitialized();
  if (!auth) throw new Error('Firebase Auth is not initialized.');

  await configureSessionPersistence(rememberMe);

  // Validate E.164 format: begins with + and 8-15 digits
  const cleanNumber = phoneNumber.replace(/[\s-]/g, '');
  if (!/^\+[1-9]\d{7,14}$/.test(cleanNumber)) {
    throw new Error('Please enter a valid phone number including country code (e.g. +91 9876543210).');
  }

  return await signInWithPhoneNumber(auth, cleanNumber, verifier);
};

export const verifyPhoneOtp = async (
  confirmation: ConfirmationResult,
  otpCode: string,
  consent?: { termsVersion: string; privacyVersion: string }
): Promise<TraceAuthUser> => {
  const cred = await confirmation.confirm(otpCode.trim());
  const user = await toTraceUser(cred.user);
  if (consent) {
    user.acceptedTermsVersion = consent.termsVersion;
    user.acceptedPrivacyVersion = consent.privacyVersion;
    user.consentTimestamp = new Date().toISOString();
  }
  return user;
};

// -----------------------------------------------------------------------------
// GUEST / EPHEMERAL READER ACCESS
// -----------------------------------------------------------------------------

export const signInAsPublicReader = async (
  readerName: string = 'Verified Citizen Reader'
): Promise<TraceAuthUser> => {
  const { auth } = await ensureFirebaseInitialized();
  if (auth) {
    try {
      const cred = await signInAnonymously(auth);
      const session = await toTraceUser(cred.user);
      session.displayName = readerName.trim() || 'Verified Citizen Reader';
      return session;
    } catch {
      // fall through
    }
  }

  return {
    uid: `guest_${Date.now()}`,
    email: null,
    phoneNumber: null,
    displayName: readerName.trim() || 'Verified Citizen Reader',
    photoURL: null,
    isAnonymous: true,
    role: 'reader',
    isAdmin: false,
    providerId: 'guest',
    emailVerified: false,
  };
};

export const logoutUser = async (): Promise<void> => {
  const { auth } = await ensureFirebaseInitialized();
  if (auth) {
    try {
      await signOut(auth);
    } catch {
      // ignore
    }
  }
};

export const logoutAdmin = logoutUser;

// Helper to access cached Auth instance synchronously if available
function getAuthInstanceSync(): { auth: Auth | null } {
  return { auth: cachedAuth };
}

export function initFirebase(): { app: FirebaseApp | null; auth: Auth | null } {
  return { app: cachedApp, auth: cachedAuth };
}

export function getCachedUserSession(): TraceAuthUser | null {
  if (cachedAuth?.currentUser) {
    return {
      uid: cachedAuth.currentUser.uid,
      email: cachedAuth.currentUser.email,
      phoneNumber: cachedAuth.currentUser.phoneNumber,
      displayName: cachedAuth.currentUser.displayName,
      photoURL: cachedAuth.currentUser.photoURL,
      isAnonymous: cachedAuth.currentUser.isAnonymous,
      role: 'reader',
      isAdmin: false,
      providerId: cachedAuth.currentUser.providerData[0]?.providerId || 'password',
      emailVerified: cachedAuth.currentUser.emailVerified,
    };
  }
  return null;
}

// -----------------------------------------------------------------------------
// AUTH STATE SUBSCRIPTION & INACTIVITY MONITOR
// -----------------------------------------------------------------------------

export const subscribeToTraceAuth = (callback: (user: TraceAuthUser | null) => void) => {
  let cancelled = false;
  let firebaseUnsub: (() => void) | null = null;

  ensureFirebaseInitialized().then(({ auth }) => {
    if (cancelled) return;
    if (!auth) {
      callback(null);
      return;
    }

    firebaseUnsub = onAuthStateChanged(auth, async (fbUser) => {
      if (cancelled) return;
      if (fbUser) {
        const traceUser = await toTraceUser(fbUser);
        callback(traceUser);
      } else {
        callback(null);
      }
    });
  });

  return () => {
    cancelled = true;
    if (firebaseUnsub) firebaseUnsub();
  };
};

export const subscribeToAuthChanges = subscribeToTraceAuth;

/**
 * Monitors user inactivity (mouse, touch, keydown) and triggers warning / auto-logout.
 */
export function setupInactivityMonitor(options: {
  timeoutMinutes: number;
  warningSecondsBeforeTimeout: number;
  onWarning: () => void;
  onLogout: () => void;
}) {
  let lastActive = Date.now();
  let warned = false;
  let timer: any = null;

  const resetActivity = () => {
    lastActive = Date.now();
    warned = false;
  };

  const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
  events.forEach((ev) => window.addEventListener(ev, resetActivity, { passive: true }));

  const checkInterval = 10000; // Check every 10 seconds
  timer = setInterval(() => {
    const elapsedMs = Date.now() - lastActive;
    const timeoutMs = options.timeoutMinutes * 60 * 1000;
    const warningMs = timeoutMs - options.warningSecondsBeforeTimeout * 1000;

    if (elapsedMs >= timeoutMs) {
      clearInterval(timer);
      events.forEach((ev) => window.removeEventListener(ev, resetActivity));
      options.onLogout();
    } else if (elapsedMs >= warningMs && !warned) {
      warned = true;
      options.onWarning();
    }
  }, checkInterval);

  return () => {
    clearInterval(timer);
    events.forEach((ev) => window.removeEventListener(ev, resetActivity));
  };
}
