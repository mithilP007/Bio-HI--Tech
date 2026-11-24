# BIO HI TECH LIMS — Owner Authentication & Runtime Security Report

## 1. Authentication Architecture

BIO HI TECH LIMS implements an owner-only security perimeter:
- **Application Scope**: Single-owner private diagnostic laboratory application.
- **Supabase Auth Config**: Public registration disabled (`enable_signup = false`), anonymous authentication disabled (`enable_anonymous_sign_ins = false`).
- **Owner Allowlist**: `public.owner_access` table with `uq_single_active_owner` constraint.

---

## 2. Runtime Authentication Lifecycle

### Step 1: Icon Launch & Asset Initialization
- Owner clicks BIO HI TECH icon on desktop or Android.
- Local HTML/JS/CSS assets load instantly from the native application package (`out/`).
- Splash screen displays while `initializeAuth()` executes.

### Step 2: Session Verification & Allowlist Assertion
- If an existing Supabase Auth session is found:
  1. The user's UUID is queried against `public.owner_access` where `is_active = TRUE`.
  2. If the user is found and active, the session is approved and the dashboard renders.
  3. If the user is **NOT** on the active owner allowlist:
     - `supabase.auth.signOut()` is triggered immediately.
     - Sensitive in-memory data is purged.
     - Access is strictly denied with a security alert.
     - Patient records are never rendered.
- If no session exists:
  - The Owner Authentication login screen renders.

### Step 3: Login Screen
- Form fields: Email, Password, Show/Hide Password toggle, Remember Device checkbox.
- Error prevention: Generic error message on failure ("Invalid email address or password") prevents user/email enumeration.
- Loading indicator during cryptographic handshake.
- Password reset available via `sendPasswordReset(email)`.

### Step 4: Session Security & 15-Minute Inactivity Lock
- Active user input events reset the idle timer.
- If no interaction occurs for 15 minutes, `lockSession()` is engaged.
- The screen blurs and presents a password unlock prompt.
- Entering the correct owner password re-authenticates the workspace.
- Entering an incorrect password blocks access and remains locked.

### Step 5: Secure Sign-Out & Memory Purging
- When the owner clicks **Sign Out**:
  1. Supabase Auth session tokens are invalidated with the server.
  2. Local session caches are wiped.
  3. Sensitive in-memory stores are purged.
  4. The application returns to the unauthenticated login screen.
