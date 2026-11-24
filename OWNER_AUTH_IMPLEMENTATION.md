# BIO HI TECH — OWNER AUTHENTICATION IMPLEMENTATION

This document details the architecture, launch flow, credential validation, session handling, and clinical privacy protection implemented in **BIO HI TECH LIMS**.

---

## 1. Application Launch Flow

When the owner clicks the BIO HI TECH application icon on Android or Desktop:

```
                  ┌───────────────────────────────────────────────┐
                  │          App Icon Clicked by Owner            │
                  └───────────────────────┬───────────────────────┘
                                          │
                                          ▼
                  ┌───────────────────────────────────────────────┐
                  │       Locally Bundled Application Starts      │
                  │         Displays BIO HI TECH Splash           │
                  └───────────────────────┬───────────────────────┘
                                          │
                                          ▼
                  ┌───────────────────────────────────────────────┐
                  │     initializeAuth() Verifies Session         │
                  │  Checks Supabase JWT & Strict Mode Setting    │
                  └───────────────────────┬───────────────────────┘
                                          │
                     ┌────────────────────┴────────────────────┐
                     │                                         │
                     ▼                                         ▼
         [No Valid Session Exists]                [Valid Active Session Exists]
                     │                                         │
                     ▼                                         ▼
         ┌───────────────────────┐                 ┌───────────────────────┐
         │ Render Owner Login    │                 │ Restore Owner Session │
         │  (/login)             │                 │ Open Dashboard        │
         │  ZERO Patient Data    │                 │ Hydrate Cloud Records │
         └───────────────────────┘                 └───────────────────────┘
```

### Critical Privacy Invariant
> [!IMPORTANT]
> **No patient data is ever loaded into memory or rendered before authentication is confirmed.**
> If an unauthenticated user attempts to deep-link to `/reports/RPT-261121-032/preview`, the authentication guard interceptor halts execution and renders the Owner Login screen instead.

---

## 2. Login Page Design & Controls (`/login`)

The login interface in [`components/lab-app.tsx`](file:///home/mithil/Downloads/BIO-HI-TECH-LIMS/saran%20project/components/lab-app.tsx) adheres to the laboratory brand identity:

- **Branding**: Official teal cross brand-mark and `BIO HI TECH · PRIVATE LABORATORY MANAGEMENT` typography.
- **Eyebrow**: `OWNER ACCESS ONLY`.
- **Inputs**:
  - Owner Email input with leading mail icon.
  - Password input with lock icon and an interactive **Show / Hide Password toggle** (`Eye` / `EyeOff`).
  - **Remember this device** checkbox (controls local session persistence).
- **CTA**: Single high-contrast teal button (*"Sign In to Workspace"*), displaying an animated waiting state (`"Authenticating…"`) during network requests.
- **Error Handling**: Generic authentication failure alerts (*"Invalid email address or password"*). The system intentionally never confirms whether a specific email address exists.
- **Zero Public Registration**: No public sign-up, no patient portal login, no employee registration links.

---

## 3. Real Supabase Authentication Integration

In [`lib/auth-service.ts`](file:///home/mithil/Downloads/BIO-HI-TECH-LIMS/saran%20project/lib/auth-service.ts):

### A. Owner Sign-in (`signInOwner`)
```typescript
export async function signInOwner(email: string, password: string, rememberDevice: boolean) {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) {
      return { success: false, error: 'Invalid email address or password.' };
    }
    // Set authenticated state and start activity listeners
    authState.isAuthenticated = true;
    authState.user = { id: data.user.id, email: data.user.email, ... };
    return { success: true };
  }
}
```

### B. Password Recovery (`sendPasswordReset`)
Dispatches secure password reset instructions via Supabase Auth:
```typescript
await supabase.auth.resetPasswordForEmail(cleanEmail, {
  redirectTo: `${window.location.origin}/login`,
});
```

### C. Owner Logout & Memory Purge (`signOutOwner`)
```typescript
export async function signOutOwner(): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    await supabase.auth.signOut();
  }
  // Clear persistent tokens
  sessionStorage.removeItem(SESSION_PERSIST_KEY);
  localStorage.removeItem(SESSION_PERSIST_KEY);

  // Purge sensitive in-memory clinical data
  purgeSensitiveInMemoryData();

  authState.isAuthenticated = false;
  authState.user = null;
  notifyAuthListeners();
}
```

---

## 4. Inactivity Timeout & App Lock

- **Idle Detection**: Listens to passive user input events (`mousemove`, `keydown`, `touchstart`, `pointerdown`).
- **Configurable Timeout**: Default 15 minutes of inactivity.
- **Lock State**:
  - When idle threshold is exceeded, `lockSession()` switches the interface to `AppLockScreen`.
  - Clinical views and patient lists are hidden immediately.
  - Re-entering the owner password calls `unlockSession(password)` to resume the workspace without losing open form state.
