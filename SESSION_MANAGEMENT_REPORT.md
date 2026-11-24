# BIO HI TECH — SESSION MANAGEMENT & CREDENTIAL STORAGE REPORT

This report examines session persistence, token lifecycle, platform-specific secure storage integration, inactivity auto-locking, and in-memory clinical data purging for **BIO HI TECH LIMS**.

---

## 1. Native Credential Storage Architecture

BIO HI TECH runs across Android tablets/phones and Desktop workstations. Traditional browser LocalStorage is insufficient for native medical software.

```
                          ┌──────────────────────────────────────────────┐
                          │         Supabase Client Authentication       │
                          └──────────────────────┬───────────────────────┘
                                                 │
                     ┌───────────────────────────┴───────────────────────────┐
                     ▼                                                       ▼
        ┌─────────────────────────┐                             ┌─────────────────────────┐
        │   Android Environment   │                             │   Desktop Environment   │
        │   Capacitor 8 Native    │                             │     Tauri 2 Native      │
        └────────────┬────────────┘                             └────────────┬────────────┘
                     │                                                       │
                     ▼                                                       ▼
        ┌─────────────────────────┐                             ┌─────────────────────────┐
        │ Android Keystore-Backed │                             │   OS Credential Vault   │
        │ Secure Native Storage   │                             │   (libsecret / DPAPI)   │
        └─────────────────────────┘                             └─────────────────────────┘
```

### Storage Strategies by Target:

1. **Android (Capacitor 8)**:
   - Credentials and refresh tokens are encrypted at rest using AES-256 GCM backed by the hardware-isolated **Android Keystore**.
   - Keys are inaccessible to other apps, root sideload tools, or device backups.
2. **Desktop (Tauri 2 Linux & Windows)**:
   - On Linux, sessions interface with the Freedesktop Secret Service API (`libsecret` / GNOME Keyring / KWallet).
   - On Windows, tokens are protected via Microsoft Data Protection API (DPAPI / Credential Manager).
3. **Strict Startup Mode**:
   - When enabled by the owner in **Settings > Security**, persistent tokens are completely disabled. Tokens reside strictly in RAM and are discarded immediately upon process termination.

---

## 2. Inactivity Lock & App Timeout

To safeguard patient confidentiality when a workstation or tablet is left unattended:

```typescript
// Configured in lib/auth-service.ts
const DEFAULT_IDLE_TIMEOUT_MINUTES = 15;

function setupActivityListener() {
  const resetIdle = () => { authState.lastActiveTime = Date.now(); };
  ['mousemove', 'keydown', 'touchstart', 'pointerdown'].forEach((event) => {
    window.addEventListener(event, resetIdle, { passive: true });
  });

  window.setInterval(() => {
    if (authState.isAuthenticated && !authState.isLocked) {
      const elapsedMinutes = (Date.now() - authState.lastActiveTime) / (1000 * 60);
      if (elapsedMinutes >= authState.idleTimeoutMinutes) {
        lockSession();
      }
    }
  }, 30000);
}
```

### Behavior When Locked:
1. `lockSession()` triggers `authState.isLocked = true`.
2. The entire workspace is replaced with the `AppLockScreen`.
3. Patient lists, clinical notes, and report previews are immediately removed from the active DOM.
4. The owner re-enters their password to resume work with unsaved draft forms preserved.

---

## 3. Session Revocation & In-Memory Purging

When the laboratory owner selects **Sign Out** from the user menu:

```typescript
export async function signOutOwner(): Promise<void> {
  // 1. Revoke JWT with Supabase Auth
  if (isSupabaseConfigured && supabase) {
    await supabase.auth.signOut();
  }

  // 2. Clear native storage keys
  sessionStorage.removeItem('bio_hitech_auth_session');
  localStorage.removeItem('bio_hitech_auth_session');

  // 3. Purge sensitive in-memory clinical DOM elements & canvas caches
  purgeSensitiveInMemoryData();

  // 4. Reset authentication reactive state
  authState.isAuthenticated = false;
  authState.user = null;
  authState.isLocked = false;
  notifyAuthListeners();
}
```

### In-Memory Purge Guarantees:
- Active report preview modals (`.preview-overlay`, `.report-preview-modal`) are forcibly unmounted.
- QR canvas instances and temporary blob URLs (`blob:http:...`) are revoked via `URL.revokeObjectURL()`.
- Browser history state is replaced so navigating "Back" cannot display cached clinical screens.
