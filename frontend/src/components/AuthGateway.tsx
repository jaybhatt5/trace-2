// TRACE / TruthLens AI - Enterprise Authentication Gateway
import React, { useState, useEffect, useRef } from 'react';
import {
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  ShieldAlert,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  X,
  ExternalLink,
  ChevronDown,
  Info,
  Key
} from 'lucide-react';
import { TraceLogo } from './TraceLogo';
import {
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  sendPasswordReset,
  initPhoneRecaptcha,
  clearPhoneRecaptcha,
  sendPhoneOtp,
  verifyPhoneOtp,
  signInAsPublicReader,
  formatAuthErrorMessage,
  type TraceAuthUser,
  type UserRole
} from '../utils/firebase';
import {
  signInNative,
  signUpNative,
  requestPasswordResetNative,
} from '../utils/nativeAuth';
import type { ConfirmationResult } from 'firebase/auth';

interface AuthGatewayProps {
  onLoginSuccess: (user: TraceAuthUser, targetView: 'reader' | 'admin') => void;
  theme: 'light' | 'dark';
  onToggleTheme?: () => void;
  isModal?: boolean;
  initialPortal?: UserRole;
  onClose?: () => void;
  modalNotice?: string;
  onNavigateToTerms?: () => void;
  onNavigateToPrivacy?: () => void;
}

type AuthMethod = 'google' | 'email' | 'phone' | 'admin';
type FormMode = 'signin' | 'register' | 'forgot_password';

// Country codes for Phone Auth (+91 India default)
const COUNTRY_CODES = [
  { code: '+91', country: 'India (भारत)', flag: '🇮🇳' },
  { code: '+1', country: 'United States / Canada', flag: '🇺🇸' },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
  { code: '+971', country: 'United Arab Emirates', flag: '🇦🇪' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+81', country: 'Japan', flag: '🇯🇵' },
];

export const AuthGateway: React.FC<AuthGatewayProps> = ({
  onLoginSuccess,
  isModal = false,
  initialPortal = 'reader',
  onClose,
  modalNotice,
  onNavigateToTerms,
  onNavigateToPrivacy,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<AuthMethod>(() => {
    return initialPortal === 'admin' ? 'admin' : 'email';
  });
  const [formMode, setFormMode] = useState<FormMode>('signin');
  const [rememberMe, setRememberMe] = useState<boolean>(true);

  // Email form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Dedicated Master Admin Login state
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  // Mandatory consent state
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);

  // Phone authentication state
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [otpValues, setOtpValues] = useState<string[]>(['', '', '', '', '', '']);
  const [resendCountdown, setResendCountdown] = useState<number>(0);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Cleanup recaptcha on unmount
  useEffect(() => {
    return () => {
      clearPhoneRecaptcha();
    };
  }, []);

  // Resend OTP countdown timer
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setInterval(() => {
      setResendCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCountdown]);

  // Compute password strength
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 2) return { score: 1, label: 'Weak', color: 'bg-rose-500' };
    if (score === 3) return { score: 2, label: 'Fair', color: 'bg-amber-500' };
    if (score === 4) return { score: 3, label: 'Good', color: 'bg-blue-500' };
    return { score: 4, label: 'Strong', color: 'bg-emerald-500' };
  };

  const passwordStrength = getPasswordStrength(password);

  // ---------------------------------------------------------------------------
  // GOOGLE LOGIN HANDLER
  // ---------------------------------------------------------------------------
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const user = await signInWithGoogle(rememberMe);
      onLoginSuccess(user, user.role);
    } catch (err: any) {
      console.warn('[TRACE Gateway] Google sign-in failed:', err);
      setErrorMessage(formatAuthErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // EMAIL / PASSWORD LOGIN & REGISTRATION HANDLER
  // ---------------------------------------------------------------------------
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessNotice(null);

    if (formMode === 'forgot_password') {
      if (!email.trim()) {
        setErrorMessage('Please enter your email address to receive a password reset link.');
        return;
      }
      setIsLoading(true);
      try {
        const nativeReset = await requestPasswordResetNative(email.trim());
        setSuccessNotice(nativeReset.message || `Password reset link sent to ${email.trim()}.`);
        setFormMode('signin');
      } catch (err: any) {
        try {
          await sendPasswordReset(email.trim());
          setSuccessNotice(`Password reset link sent to ${email.trim()}. Please check your inbox.`);
          setFormMode('signin');
        } catch (fbErr: any) {
          setErrorMessage(formatAuthErrorMessage(fbErr));
        }
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    if (formMode === 'register') {
      if (!termsAccepted) {
        setErrorMessage('You must accept the Terms & Conditions and acknowledge the Privacy Policy to create an account.');
        return;
      }
      if (password.length < 8) {
        setErrorMessage('Password must be at least 8 characters long with uppercase, lowercase, and digits.');
        return;
      }
    }

    setIsLoading(true);
    try {
      let user: TraceAuthUser;
      if (formMode === 'register') {
        const res = await signUpNative(email, password, displayName);
        if (res.error) {
          // If native threw error, check if fallback needed
          throw new Error(res.error);
        }
        user = res.user as any;
      } else {
        const res = await signInNative(email, password);
        if (res.error) {
          throw new Error(res.error);
        }
        user = res.user as any;
      }
      onLoginSuccess(user, user.role);
    } catch (err: any) {
      console.warn('[TRACE Gateway] Native auth error, checking fallback:', err);
      // Fallback to Firebase client SDK if configured and native failed
      try {
        let user: TraceAuthUser;
        if (formMode === 'register') {
          user = await signUpWithEmail(
            email,
            password,
            displayName,
            { termsVersion: '2.4', privacyVersion: '2.4' },
            rememberMe
          );
        } else {
          user = await signInWithEmail(email, password, rememberMe);
        }
        onLoginSuccess(user, user.role);
      } catch (fbErr: any) {
        setErrorMessage(err.message || formatAuthErrorMessage(fbErr));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // PHONE NUMBER AUTHENTICATION (RECAPTCHA + SMS OTP)
  // ---------------------------------------------------------------------------
  const handleSendPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessNotice(null);

    const fullNumber = `${countryCode}${phoneNumber.replace(/\D/g, '')}`;
    if (phoneNumber.replace(/\D/g, '').length < 8) {
      setErrorMessage('Please enter a valid phone number.');
      return;
    }

    if (formMode === 'register' && !termsAccepted) {
      setErrorMessage('You must accept the Terms & Conditions and acknowledge the Privacy Policy to create an account.');
      return;
    }

    setIsLoading(true);
    try {
      const verifier = initPhoneRecaptcha('recaptcha-container');
      const confirmation = await sendPhoneOtp(fullNumber, verifier, rememberMe);
      setConfirmationResult(confirmation);
      setResendCountdown(60);
      setSuccessNotice(`Verification code sent via SMS to ${fullNumber}.`);
      // Focus first OTP field
      setTimeout(() => otpInputRefs.current[0]?.focus(), 150);
    } catch (err: any) {
      console.warn('[TRACE Gateway] Phone OTP send failed:', err);
      setErrorMessage(formatAuthErrorMessage(err));
      clearPhoneRecaptcha();
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, val: string) => {
    const digit = val.slice(-1);
    const updated = [...otpValues];
    updated[index] = digit;
    setOtpValues(updated);

    // Auto-advance focus to next field if digit entered
    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const updated = [...otpValues];
    for (let i = 0; i < pasted.length; i++) {
      updated[i] = pasted[i];
    }
    setOtpValues(updated);
    const nextIdx = Math.min(pasted.length, 5);
    otpInputRefs.current[nextIdx]?.focus();
  };

  const handleVerifyPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otpValues.join('');
    if (code.length < 6) {
      setErrorMessage('Please enter all 6 digits of the verification code.');
      return;
    }

    if (!confirmationResult) {
      setErrorMessage('Session expired. Please request a new verification code.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const user = await verifyPhoneOtp(confirmationResult, code, {
        termsVersion: '2.4',
        privacyVersion: '2.4',
      });
      onLoginSuccess(user, user.role);
    } catch (err: any) {
      console.warn('[TRACE Gateway] OTP verify failed:', err);
      setErrorMessage(formatAuthErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleFastReaderAccess = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const user = await signInAsPublicReader();
      onLoginSuccess(user, 'reader');
    } catch (err: any) {
      setErrorMessage(formatAuthErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({
          username: adminUsername.trim(),
          password: adminPassword.trim(),
        }),
      });

      const text = await res.text();
      let data: any = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        // Non-JSON response
      }

      if (!res.ok || !data?.token) {
        const errorMsg =
          data?.message ||
          data?.error ||
          (res.status === 401
            ? 'Access Denied: Invalid administrator credentials.'
            : res.status === 404
            ? 'Administrator login API endpoint not found. Please verify backend server is active.'
            : `Administrator authentication failed (HTTP ${res.status}).`);
        throw new Error(errorMsg);
      }

      // Store admin session token in both sessionStorage and localStorage
      sessionStorage.setItem('trace_admin_session_token', data.token);
      localStorage.setItem('trace_admin_session_token', data.token);

      const adminUser: TraceAuthUser = {
        uid: data.user?.uid || 'admin-master-root',
        email: data.user?.email || adminUsername || 'admin@trace.internal',
        phoneNumber: null,
        displayName: data.user?.displayName || 'TRACE Master Operations Director',
        photoURL: null,
        role: 'admin',
        isAdmin: true,
        isAnonymous: false,
        emailVerified: true,
        providerId: 'admin-password',
      };

      sessionStorage.setItem('trace_auth_user', JSON.stringify(adminUser));
      localStorage.setItem('trace_auth_user', JSON.stringify(adminUser));

      onLoginSuccess(adminUser, 'admin');
    } catch (err: any) {
      setErrorMessage(err.message || 'Administrator authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // RENDER FORM CONTENT
  // ---------------------------------------------------------------------------
  const renderAuthForm = () => (
    <div className="space-y-4">
      {/* METHOD SELECTION TABS */}
      <div className="bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl grid grid-cols-4 gap-1 border border-zinc-200 dark:border-zinc-700/80">
        <button
          type="button"
          onClick={() => {
            setSelectedMethod('google');
            setErrorMessage(null);
          }}
          className={`py-2 px-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
            selectedMethod === 'google'
              ? 'bg-white dark:bg-zinc-900 text-zinc-950 dark:text-zinc-50 shadow-2xs'
              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span className="hidden sm:inline">Google</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedMethod('email');
            setErrorMessage(null);
          }}
          className={`py-2 px-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
            selectedMethod === 'email'
              ? 'bg-white dark:bg-zinc-900 text-zinc-950 dark:text-zinc-50 shadow-2xs'
              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          <Mail className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
          <span className="hidden sm:inline">Email</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedMethod('phone');
            setErrorMessage(null);
          }}
          className={`py-2 px-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
            selectedMethod === 'phone'
              ? 'bg-white dark:bg-zinc-900 text-zinc-950 dark:text-zinc-50 shadow-2xs'
              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="hidden sm:inline">Phone</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedMethod('admin');
            setErrorMessage(null);
          }}
          className={`py-2 px-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
            selectedMethod === 'admin'
              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-2xs'
              : 'text-zinc-500 hover:text-amber-600 dark:hover:text-amber-400'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="font-bold">Admin</span>
        </button>
      </div>

      {/* ERROR / SUCCESS ALERTS */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-200 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
          <span className="leading-relaxed">{errorMessage}</span>
        </div>
      )}

      {successNotice && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-200 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
          <span className="leading-relaxed">{successNotice}</span>
        </div>
      )}

      {/* METHOD 1: GOOGLE SIGN IN */}
      {selectedMethod === 'google' && (
        <div className="space-y-4 pt-2">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            One-tap authentication with your verified Google account. Synchronizes your private analysis history securely across devices.
          </p>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white hover:bg-zinc-50 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm font-semibold flex items-center justify-center gap-3 transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>{isLoading ? 'Connecting Google Account...' : 'Continue with Google'}</span>
          </button>
        </div>
      )}

      {/* METHOD 2: EMAIL / PASSWORD */}
      {selectedMethod === 'email' && (
        <form onSubmit={handleEmailSubmit} className="space-y-3 pt-1">
          {formMode === 'register' && (
            <div>
              <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Full Name / Pseudonym
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Citizen Investigator"
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100"
              />
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Email Address <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="reader@example.com"
              required
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100"
            />
          </div>

          {formMode !== 'forgot_password' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                  Password <span className="text-rose-500">*</span>
                </label>
                {formMode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setFormMode('forgot_password');
                      setErrorMessage(null);
                    }}
                    className="text-[11px] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Password strength indicator for registration */}
              {formMode === 'register' && password && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-zinc-500">
                    <span>Password Strength:</span>
                    <span className="font-semibold">{passwordStrength.label}</span>
                  </div>
                  <div className="w-full h-1 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mandatory Terms & Privacy Checkbox for Registration */}
          {formMode === 'register' && (
            <div className="pt-1 space-y-2">
              <label className="flex items-start gap-2.5 cursor-pointer text-[11px] text-zinc-700 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 cursor-pointer"
                />
                <span className="leading-snug">
                  I agree to the{' '}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onNavigateToTerms) onNavigateToTerms();
                    }}
                    className="font-bold underline text-zinc-900 dark:text-zinc-100 hover:opacity-80"
                  >
                    Terms &amp; Conditions
                  </button>{' '}
                  and acknowledge that I have read the{' '}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onNavigateToPrivacy) onNavigateToPrivacy();
                    }}
                    className="font-bold underline text-zinc-900 dark:text-zinc-100 hover:opacity-80"
                  >
                    Privacy Policy
                  </button>
                  . <span className="text-rose-500">*</span>
                </span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-[11px] text-zinc-500">
                <input
                  type="checkbox"
                  checked={marketingConsent}
                  onChange={(e) => setMarketingConsent(e.target.checked)}
                  className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 cursor-pointer"
                />
                <span>(Optional) Receive breaking disinformation exposé dispatches via email.</span>
              </label>
            </div>
          )}

          {/* Remember Me Toggle */}
          <div className="flex items-center justify-between text-xs text-zinc-500 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 cursor-pointer"
              />
              <span className="text-[11px]">Remember this device</span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-2xs disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : formMode === 'register' ? (
              <span>Create Account</span>
            ) : formMode === 'forgot_password' ? (
              <span>Send Password Reset Link</span>
            ) : (
              <span>Sign In with Email</span>
            )}
          </button>

          {/* Form Mode Toggle */}
          <div className="text-center pt-2 text-xs text-zinc-500">
            {formMode === 'signin' ? (
              <span>
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setFormMode('register');
                    setErrorMessage(null);
                  }}
                  className="font-bold underline text-zinc-900 dark:text-zinc-100 cursor-pointer"
                >
                  Create one now
                </button>
              </span>
            ) : (
              <span>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setFormMode('signin');
                    setErrorMessage(null);
                  }}
                  className="font-bold underline text-zinc-900 dark:text-zinc-100 cursor-pointer"
                >
                  Sign In
                </button>
              </span>
            )}
          </div>
        </form>
      )}

      {/* METHOD 3: REAL PHONE AUTHENTICATION WITH OTP */}
      {selectedMethod === 'phone' && (
        <div className="space-y-4 pt-1">
          {!confirmationResult ? (
            /* STEP 1: PHONE NUMBER INPUT & RECAPTCHA */
            <form onSubmit={handleSendPhoneOtp} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Select Country &amp; Enter Mobile Number <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-2">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="text-xs py-2 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.code} ({c.country.split(' ')[0]})
                      </option>
                    ))}
                  </select>

                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="98765 43210"
                    required
                    className="flex-1 px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 font-mono"
                  />
                </div>
                <p className="text-[10px] text-zinc-400 mt-1 font-mono">
                  Default format for India (+91): 10 digits without leading zero.
                </p>
              </div>

              {/* Mandatory terms for phone login/registration */}
              <div className="pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer text-[11px] text-zinc-700 dark:text-zinc-300">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-0.5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 cursor-pointer"
                  />
                  <span className="leading-snug">
                    I agree to the{' '}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onNavigateToTerms) onNavigateToTerms();
                      }}
                      className="font-bold underline text-zinc-900 dark:text-zinc-100 hover:opacity-80"
                    >
                      Terms &amp; Conditions
                    </button>{' '}
                    and acknowledge the{' '}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onNavigateToPrivacy) onNavigateToPrivacy();
                      }}
                      className="font-bold underline text-zinc-900 dark:text-zinc-100 hover:opacity-80"
                    >
                      Privacy Policy
                    </button>
                    . <span className="text-rose-500">*</span>
                  </span>
                </label>
              </div>

              {/* Firebase reCAPTCHA Container */}
              <div id="recaptcha-container" className="my-2 flex justify-center" />

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-2xs disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <span>Send 6-Digit OTP</span>
                )}
              </button>
            </form>
          ) : (
            /* STEP 2: 6-DIGIT OTP VERIFICATION */
            <form onSubmit={handleVerifyPhoneOtp} className="space-y-4">
              <div className="text-center space-y-1">
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 block">
                  Enter 6-Digit Security Code
                </span>
                <p className="text-[11px] text-zinc-500">
                  Sent to <strong className="font-mono text-zinc-800 dark:text-zinc-200">{countryCode} {phoneNumber}</strong>
                </p>
              </div>

              {/* 6 Digit Inputs */}
              <div className="flex justify-center gap-2 sm:gap-2.5">
                {otpValues.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      otpInputRefs.current[idx] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    onPaste={handleOtpPaste}
                    className="w-10 h-12 text-center text-lg font-bold font-mono rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-950 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-2xs disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <span>Verify OTP &amp; Sign In</span>
                )}
              </button>

              {/* Resend & Change Number */}
              <div className="flex items-center justify-between text-xs text-zinc-500 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    setConfirmationResult(null);
                    setOtpValues(['', '', '', '', '', '']);
                    clearPhoneRecaptcha();
                  }}
                  className="hover:text-zinc-900 dark:hover:text-zinc-100 underline cursor-pointer"
                >
                  Change phone number
                </button>

                <button
                  type="button"
                  disabled={resendCountdown > 0 || isLoading}
                  onClick={handleSendPhoneOtp}
                  className="font-semibold text-zinc-900 dark:text-zinc-100 disabled:opacity-50 hover:underline cursor-pointer"
                >
                  {resendCountdown > 0 ? `Resend OTP in ${resendCountdown}s` : 'Resend Code'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* METHOD 4: DEDICATED MASTER ADMIN PANEL */}
      {selectedMethod === 'admin' && (
        <form onSubmit={handleAdminSubmit} className="space-y-4 pt-1">
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1.5">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-xs">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Level 5 Master Administrator Clearance</span>
            </div>
            <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 leading-relaxed">
              Restricted portal for system operations, real-time telemetry, maintenance mode controls, and editorial wire dispatch.
            </p>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Admin Identifier <span className="text-amber-500">*</span>
            </label>
            <input
              type="text"
              value={adminUsername}
              onChange={(e) => setAdminUsername(e.target.value)}
              placeholder="admin@domain.com"
              required
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <p className="text-[10px] text-zinc-400 font-mono mt-1">Authorized TRACE administrator email</p>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Admin Password <span className="text-amber-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showAdminPassword ? 'text' : 'password'}
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:ring-1 focus:ring-amber-500 pr-9"
              />
              <button
                type="button"
                onClick={() => setShowAdminPassword(!showAdminPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                {showAdminPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-[10px] text-zinc-400 font-mono mt-1">Cryptographically verified master token</p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Key className="w-4 h-4" />
                <span>Verify Master Credentials &amp; Unlock Console</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* QUICK VERIFIED CITIZEN READER ACCESS */}
      <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800">
        <button
          type="button"
          onClick={handleFastReaderAccess}
          disabled={isLoading}
          className="w-full py-2 px-3 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <span>Continue as Anonymous Citizen Reader</span>
        </button>
      </div>

      {/* Bottom Security Footer */}
      <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono pt-2">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>TLS 1.3 End-to-End Encrypted</span>
        </span>
        <span>Firebase Auth Protocol</span>
      </div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // MODAL VIEW WRAPPER
  // ---------------------------------------------------------------------------
  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6 animate-fade-in font-sans">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md w-full text-zinc-900 dark:text-zinc-100 shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
          {/* Header */}
          <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <TraceLogo className="w-7 h-7 rounded-lg shrink-0" />
              <div className="min-w-0">
                <h3 className="font-bold text-sm sm:text-base text-zinc-950 dark:text-zinc-50 truncate">
                  Sign In to TRACE
                </h3>
                <p className="text-[10px] text-zinc-500 font-mono truncate">Truth Review &amp; Authenticity Engine</p>
              </div>
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
            {modalNotice && (
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <span className="leading-relaxed">{modalNotice}</span>
              </div>
            )}

            {renderAuthForm()}
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // FULLSCREEN VIEW WRAPPER
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 flex flex-col justify-center items-center px-4 py-8 sm:py-12 font-sans">
      <div className="w-full max-w-md mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-3">
            <TraceLogo className="w-16 h-16 rounded-2xl shadow-sm" />
          </div>
          <h1 className="font-bold text-2xl sm:text-3xl tracking-tight text-zinc-950 dark:text-zinc-50 font-sans">
            TRACE AI
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            Truth Review &amp; Authenticity Checking Engine
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-7 shadow-xs">
          {renderAuthForm()}
        </div>
      </div>
    </div>
  );
};
