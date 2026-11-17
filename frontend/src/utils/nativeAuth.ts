// TRACE Native Authentication Client Service
// Replaces Firebase Auth with server-enforced HttpOnly cookie sessions & RBAC

export type UserRole = 'user' | 'moderator' | 'admin' | 'reader';

export interface NativeAuthUser {
  uid: string;
  id: string;
  email: string | null;
  displayName: string | null;
  role: 'user' | 'moderator' | 'admin';
  isAdmin: boolean;
  isEmailVerified: boolean;
  isDisabled: boolean;
  mustChangePassword: boolean;
  mfaEnabled: boolean;
  phoneNumber?: string | null;
  photoURL?: string | null;
  isAnonymous?: boolean;
}

export async function signInNative(email: string, password: string, mfaCode?: string): Promise<{
  user?: NativeAuthUser;
  mfaRequired?: boolean;
  mustChangePassword?: boolean;
  accessToken?: string;
  error?: string;
}> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      credentials: 'include',
      body: JSON.stringify({ email, password, mfaCode }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { error: data.error || 'Authentication failed.' };
    }

    if (data.mfaRequired) {
      return { mfaRequired: true };
    }

    const u = data.user;
    const mapped: NativeAuthUser = {
      uid: u.id,
      id: u.id,
      email: u.email,
      displayName: u.displayName || u.email?.split('@')[0] || 'Citizen Reader',
      role: u.role,
      isAdmin: u.role === 'admin',
      isEmailVerified: u.isEmailVerified,
      isDisabled: u.isDisabled,
      mustChangePassword: u.mustChangePassword,
      mfaEnabled: u.mfaEnabled,
      phoneNumber: null,
      photoURL: null,
      isAnonymous: false,
    };

    sessionStorage.setItem('trace_auth_user', JSON.stringify(mapped));
    return {
      user: mapped,
      accessToken: data.accessToken,
      mustChangePassword: data.mustChangePassword,
    };
  } catch (err: any) {
    return { error: err.message || 'Network connection failed.' };
  }
}

export async function signUpNative(email: string, password: string, displayName?: string): Promise<{
  user?: NativeAuthUser;
  accessToken?: string;
  message?: string;
  error?: string;
}> {
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      credentials: 'include',
      body: JSON.stringify({ email, password, displayName }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { error: data.error || 'Registration failed.' };
    }

    const u = data.user;
    const mapped: NativeAuthUser = {
      uid: u.id,
      id: u.id,
      email: u.email,
      displayName: u.displayName || u.email?.split('@')[0] || 'Citizen Reader',
      role: u.role,
      isAdmin: u.role === 'admin',
      isEmailVerified: u.isEmailVerified,
      isDisabled: u.isDisabled,
      mustChangePassword: u.mustChangePassword,
      mfaEnabled: u.mfaEnabled,
      phoneNumber: null,
      photoURL: null,
      isAnonymous: false,
    };

    sessionStorage.setItem('trace_auth_user', JSON.stringify(mapped));
    return { user: mapped, accessToken: data.accessToken, message: data.message };
  } catch (err: any) {
    return { error: err.message || 'Registration request failed.' };
  }
}

export async function signOutNative(): Promise<void> {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
      credentials: 'include',
    });
  } finally {
    sessionStorage.removeItem('trace_auth_user');
    localStorage.removeItem('trace_auth_user');
    sessionStorage.removeItem('trace_admin_session_token');
  }
}

export async function signOutAllNative(): Promise<void> {
  try {
    await fetch('/api/auth/logout-all', {
      method: 'POST',
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
      credentials: 'include',
    });
  } finally {
    sessionStorage.removeItem('trace_auth_user');
    localStorage.removeItem('trace_auth_user');
    sessionStorage.removeItem('trace_admin_session_token');
  }
}

export async function getCurrentUserNative(): Promise<NativeAuthUser | null> {
  try {
    const res = await fetch('/api/auth/me', {
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
      credentials: 'include',
    });

    if (!res.ok) {
      // Try refresh
      const refreshRes = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
        credentials: 'include',
      });
      if (!refreshRes.ok) return null;
      const refData = await refreshRes.json();
      const u = refData.user;
      return {
        uid: u.id,
        id: u.id,
        email: u.email,
        displayName: u.displayName || u.email?.split('@')[0],
        role: u.role,
        isAdmin: u.role === 'admin',
        isEmailVerified: u.isEmailVerified,
        isDisabled: u.isDisabled,
        mustChangePassword: u.mustChangePassword,
        mfaEnabled: u.mfaEnabled,
      };
    }

    const data = await res.json();
    const u = data.user;
    return {
      uid: u.id,
      id: u.id,
      email: u.email,
      displayName: u.displayName || u.email?.split('@')[0],
      role: u.role,
      isAdmin: u.role === 'admin',
      isEmailVerified: u.isEmailVerified,
      isDisabled: u.isDisabled,
      mustChangePassword: u.mustChangePassword,
      mfaEnabled: u.mfaEnabled,
    };
  } catch {
    return null;
  }
}

export async function requestPasswordResetNative(email: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch('/api/auth/forgot-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
    body: JSON.stringify({ email }),
  });
  return res.json();
}
