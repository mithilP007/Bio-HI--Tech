import { supabase, isSupabaseConfigured } from '@/lib/supabase-client';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  designation: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  isLocked: boolean;
  isRecoveryMode: boolean; // Set true when recovering password via verified email link
  strictMode: boolean; // Require login every time the application opens
  idleTimeoutMinutes: number;
  lastActiveTime: number;
}

const DEFAULT_IDLE_TIMEOUT_MINUTES = 15;
const STRICT_MODE_KEY = 'bio_hitech_auth_strict_mode';
const SESSION_PERSIST_KEY = 'bio_hitech_auth_session';

let authState: AuthState = {
  isAuthenticated: false,
  isLoading: true,
  user: null,
  isLocked: false,
  isRecoveryMode: false,
  strictMode: false,
  idleTimeoutMinutes: DEFAULT_IDLE_TIMEOUT_MINUTES,
  lastActiveTime: Date.now(),
};

const authListeners = new Set<(state: AuthState) => void>();

function notifyAuthListeners() {
  authListeners.forEach((listener) => listener({ ...authState }));
}

export function subscribeAuth(listener: (state: AuthState) => void): () => void {
  authListeners.add(listener);
  listener({ ...authState });
  return () => authListeners.delete(listener);
}

export function getAuthState(): AuthState {
  return { ...authState };
}

// Track password reset timestamps to prevent spam / excessive attempts
let lastResetAttemptTime = 0;
const RESET_RATE_LIMIT_MS = 60 * 1000; // 60 seconds cooldown

/**
 * Initializes authentication state upon application launch.
 * Verifies whether a valid authenticated session exists and strictly validates
 * the active owner allowlist before permitting dashboard access.
 * Listens for Supabase PASSWORD_RECOVERY events.
 */
export async function initializeAuth(): Promise<AuthState> {
  if (typeof window !== 'undefined') {
    try {
      const savedStrict = localStorage.getItem(STRICT_MODE_KEY);
      if (savedStrict === 'true') {
        authState.strictMode = true;
      }
      // Check if URL hash indicates recovery flow
      if (window.location.hash.includes('type=recovery')) {
        authState.isRecoveryMode = true;
      }
    } catch {
      // Safe fallback if storage access restricted
    }
  }

  // Set up Supabase auth state listener once
  setupSupabaseAuthListener();

  // If strict mode is enabled, require fresh login on every app restart unless in recovery mode
  if (authState.strictMode && !authState.isRecoveryMode) {
    authState.isAuthenticated = false;
    authState.user = null;
    authState.isLoading = false;
    notifyAuthListeners();
    return { ...authState };
  }

  // Check Supabase session if configured
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        authState.isAuthenticated = false;
        authState.user = null;
      } else {
        const user = session.user;
        // Verify user against owner_access allowlist in PostgreSQL
        const { data: ownerAccess, error: accessErr } = await supabase
          .from('owner_access')
          .select('id, is_active, role')
          .eq('id', user.id)
          .eq('is_active', true)
          .maybeSingle();

        if (accessErr || !ownerAccess || !ownerAccess.is_active) {
          // If session belongs to a non-owner, immediately revoke
          console.warn('[Auth] Session does not belong to authorized owner. Revoking session.');
          await supabase.auth.signOut();
          purgeSensitiveInMemoryData();
          authState.isAuthenticated = false;
          authState.user = null;
        } else {
          // Load profile details
          const { data: profile } = await supabase
            .from('owner_profile')
            .select('full_name, designation')
            .eq('id', user.id)
            .maybeSingle();

          authState.isAuthenticated = true;
          authState.user = {
            id: user.id,
            email: user.email || '',
            fullName: profile?.full_name || user.user_metadata?.full_name || 'Dr. Arun Kumar',
            designation: profile?.designation || user.user_metadata?.designation || 'Chief Pathologist & Lab Director',
          };
        }
      }
    } catch (err) {
      console.warn('[Auth] Unable to restore cloud session:', err);
      authState.isAuthenticated = false;
      authState.user = null;
    }
  } else {
    authState.isAuthenticated = false;
    authState.user = null;
  }

  authState.isLoading = false;
  authState.lastActiveTime = Date.now();
  notifyAuthListeners();
  setupActivityListener();
  return { ...authState };
}

let supabaseListenerConfigured = false;
function setupSupabaseAuthListener() {
  if (supabaseListenerConfigured || !isSupabaseConfigured || !supabase) return;
  supabaseListenerConfigured = true;

  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'PASSWORD_RECOVERY') {
      authState.isRecoveryMode = true;
      notifyAuthListeners();
    } else if (event === 'SIGNED_OUT') {
      authState.isAuthenticated = false;
      authState.user = null;
      authState.isRecoveryMode = false;
      notifyAuthListeners();
    } else if (event === 'SIGNED_IN' && session?.user) {
      // Reload profile
      const { data: profile } = await supabase!
        .from('owner_profile')
        .select('full_name, designation')
        .eq('id', session.user.id)
        .maybeSingle();

      authState.isAuthenticated = true;
      authState.user = {
        id: session.user.id,
        email: session.user.email || '',
        fullName: profile?.full_name || session.user.user_metadata?.full_name || 'Dr. Arun Kumar',
        designation: profile?.designation || session.user.user_metadata?.designation || 'Chief Pathologist & Lab Director',
      };
      notifyAuthListeners();
    }
  });
}

/**
 * Signs in the laboratory owner using Supabase Auth.
 * Restricts access strictly to authorized owner identity via owner_access allowlist.
 */
export async function signInOwner(
  email: string,
  password: string,
  rememberDevice: boolean = false
): Promise<{ success: boolean; error?: string }> {
  authState.isLoading = true;
  notifyAuthListeners();

  const cleanEmail = email.trim().toLowerCase();

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        authState.isLoading = false;
        notifyAuthListeners();
        // Generic failure prevents email enumeration
        return { success: false, error: 'Invalid email address or password.' };
      }

      if (!data.user) {
        authState.isLoading = false;
        notifyAuthListeners();
        return { success: false, error: 'Authentication failed. Please verify credentials.' };
      }

      // Check PostgreSQL owner_access allowlist to ensure caller is authorized
      const { data: ownerAccess, error: accessErr } = await supabase
        .from('owner_access')
        .select('id, is_active, role')
        .eq('id', data.user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (accessErr || !ownerAccess || !ownerAccess.is_active) {
        await supabase.auth.signOut();
        purgeSensitiveInMemoryData();
        authState.isAuthenticated = false;
        authState.user = null;
        authState.isLoading = false;
        notifyAuthListeners();
        return {
          success: false,
          error: 'Access Denied: Only the authorized laboratory owner account is permitted to access BIO HI TECH LIMS.',
        };
      }

      // Fetch profile
      const { data: profile } = await supabase
        .from('owner_profile')
        .select('full_name, designation')
        .eq('id', data.user.id)
        .maybeSingle();

      authState.isAuthenticated = true;
      authState.isLocked = false;
      authState.isRecoveryMode = false;
      authState.user = {
        id: data.user.id,
        email: data.user.email || cleanEmail,
        fullName: profile?.full_name || data.user.user_metadata?.full_name || 'Dr. Arun Kumar',
        designation: profile?.designation || data.user.user_metadata?.designation || 'Chief Pathologist & Lab Director',
      };
      authState.lastActiveTime = Date.now();
      authState.isLoading = false;

      if (typeof window !== 'undefined') {
        localStorage.setItem('bio_hitech_owner_email', cleanEmail);
        if (rememberDevice) {
          localStorage.setItem(SESSION_PERSIST_KEY, 'true');
        }
      }

      notifyAuthListeners();
      return { success: true };
    } catch (err: any) {
      authState.isLoading = false;
      notifyAuthListeners();
      return { success: false, error: err?.message || 'Unable to connect to authentication service.' };
    }
  }

  // Standalone offline fallback for isolated environments
  if (typeof window !== 'undefined') {
    const savedEmail = (localStorage.getItem('bio_hitech_owner_email') || 'owner@biohitech.com').trim().toLowerCase();
    const savedPwd = localStorage.getItem('bio_hitech_owner_pwd') || 'BioHiTech2026!Master';
    if ((cleanEmail === savedEmail || cleanEmail === 'owner@biohitech.com') && password === savedPwd) {
      authState.isAuthenticated = true;
      authState.isLocked = false;
      authState.user = {
        id: 'e0000000-0000-0000-0000-000000000001',
        email: 'owner@biohitech.com',
        fullName: 'Dr. Arun Kumar',
        designation: 'Chief Pathologist & Lab Director',
      };
      authState.lastActiveTime = Date.now();
      authState.isLoading = false;
      notifyAuthListeners();
      return { success: true };
    }
  }

  authState.isLoading = false;
  notifyAuthListeners();
  return { success: false, error: 'Invalid email address or password.' };
}

/**
 * Requests a verified password recovery email using Supabase Auth.
 * Implements rate limiting and anti-enumeration response masking.
 */
export async function sendPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, message: 'Please enter a valid laboratory owner email address.' };
  }

  // Rate limiting protection against excessive reset attempts
  const now = Date.now();
  if (now - lastResetAttemptTime < RESET_RATE_LIMIT_MS) {
    const remainingSec = Math.ceil((RESET_RATE_LIMIT_MS - (now - lastResetAttemptTime)) / 1000);
    return {
      success: false,
      message: `Please wait ${remainingSec} seconds before requesting another recovery email.`,
    };
  }
  lastResetAttemptTime = now;

  if (isSupabaseConfigured && supabase) {
    try {
      const redirectUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/login`
        : 'http://localhost:3000/login';

      await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: redirectUrl,
      });

      // Uniform response prevents account enumeration
      return {
        success: true,
        message: 'If this email belongs to the authorized laboratory owner, a secure password recovery link has been dispatched to your inbox.',
      };
    } catch {
      return {
        success: false,
        message: 'Unable to reach the recovery service. Please verify internet connectivity.',
      };
    }
  }

  return {
    success: true,
    message: 'If this email belongs to the authorized laboratory owner, a secure password recovery link has been dispatched to your inbox.',
  };
}

/**
 * Updates the owner password during a verified recovery session or authenticated session.
 * Requires minimum 8 characters.
 */
export async function updateUserPassword(
  newPassword: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  if (!newPassword || newPassword.length < 8) {
    return { success: false, error: 'Password must be at least 8 characters long.' };
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // Exit recovery mode
      authState.isRecoveryMode = false;
      notifyAuthListeners();

      if (typeof window !== 'undefined') {
        localStorage.setItem('bio_hitech_owner_pwd', newPassword);
      }

      return {
        success: true,
        message: 'Password updated successfully. Your new master credentials are now active.',
      };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Error updating password.' };
    }
  }

  // Offline fallback
  if (typeof window !== 'undefined') {
    localStorage.setItem('bio_hitech_owner_pwd', newPassword);
    authState.isRecoveryMode = false;
    notifyAuthListeners();
    return {
      success: true,
      message: 'Password updated successfully in local storage.',
    };
  }

  return { success: false, error: 'Authentication service unavailable.' };
}

/**
 * Updates password for an already authenticated session, verifying the existing password first.
 */
export async function changePasswordAuthenticated(
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  if (!authState.user) {
    return { success: false, error: 'Not authenticated.' };
  }
  if (!newPassword || newPassword.length < 8) {
    return { success: false, error: 'New password must be at least 8 characters long.' };
  }

  // Re-verify current password first
  const verifyRes = await signInOwner(authState.user.email, currentPassword, false);
  if (!verifyRes.success) {
    return { success: false, error: 'Current password is incorrect.' };
  }

  // Proceed with update
  const updateRes = await updateUserPassword(newPassword);
  if (!updateRes.success) {
    return { success: false, error: updateRes.error || 'Failed to update password.' };
  }

  return { success: true };
}

/**
 * Logs out the laboratory owner, revokes the current session,
 * purges sensitive in-memory clinical data, and returns to the login screen.
 */
export async function signOutOwner(): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('[Auth] Error signing out from Supabase:', err);
    }
  }

  if (typeof window !== 'undefined') {
    try {
      sessionStorage.removeItem(SESSION_PERSIST_KEY);
      localStorage.removeItem(SESSION_PERSIST_KEY);
    } catch {
      // Fallback
    }
  }

  purgeSensitiveInMemoryData();

  authState.isAuthenticated = false;
  authState.user = null;
  authState.isLocked = false;
  authState.isRecoveryMode = false;
  notifyAuthListeners();
}

const purgeCallbacks = new Set<() => void>();

export function registerPurgeCallback(fn: () => void): () => void {
  purgeCallbacks.add(fn);
  return () => purgeCallbacks.delete(fn);
}

/**
 * Purges active in-memory patient records, previews, and cached forms.
 */
export function purgeSensitiveInMemoryData(): void {
  if (typeof window !== 'undefined') {
    const previewOverlays = document.querySelectorAll('.preview-overlay, .report-preview-modal');
    previewOverlays.forEach((el) => el.remove());
  }
  purgeCallbacks.forEach((fn) => {
    try { fn(); } catch (e) { console.error('Error in purge callback', e); }
  });
}

/**
 * Locks the active application session (e.g. following inactivity timeout).
 */
export function lockSession(): void {
  if (authState.isAuthenticated) {
    authState.isLocked = true;
    notifyAuthListeners();
  }
}

/**
 * Unlocks the session with owner password re-entry.
 */
export async function unlockSession(password: string): Promise<boolean> {
  if (!authState.user) return false;
  const result = await signInOwner(authState.user.email, password, false);
  if (result.success) {
    authState.isLocked = false;
    authState.lastActiveTime = Date.now();
    notifyAuthListeners();
    return true;
  }
  return false;
}

/**
 * Configures strict mode (requires login on every application restart).
 */
export function setStrictMode(enabled: boolean): void {
  authState.strictMode = enabled;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STRICT_MODE_KEY, String(enabled));
      if (enabled) {
        sessionStorage.removeItem(SESSION_PERSIST_KEY);
      }
    } catch {
      // Fallback
    }
  }
  notifyAuthListeners();
}

/**
 * Sets up user activity listeners to detect inactivity timeout.
 */
let activityListenerConfigured = false;
function setupActivityListener() {
  if (activityListenerConfigured || typeof window === 'undefined') return;
  activityListenerConfigured = true;

  const resetIdle = () => {
    authState.lastActiveTime = Date.now();
  };

  ['mousemove', 'keydown', 'touchstart', 'pointerdown'].forEach((event) => {
    window.addEventListener(event, resetIdle, { passive: true });
  });

  // Check idle interval every 30 seconds
  window.setInterval(() => {
    if (authState.isAuthenticated && !authState.isLocked) {
      const elapsedMinutes = (Date.now() - authState.lastActiveTime) / (1000 * 60);
      if (elapsedMinutes >= authState.idleTimeoutMinutes) {
        lockSession();
      }
    }
  }, 30000);
}
