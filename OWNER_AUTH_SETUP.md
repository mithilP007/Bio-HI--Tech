# BIO HI TECH LIMS — OWNER AUTHENTICATION & ACCESS SETUP GUIDE

**Application**: BIO HI TECH Private Laboratory Management System  
**Security Model**: Single-Tenant, Owner-Only Authorization Gate  
**Auth Provider**: Supabase Auth (Email & Password)  
**Region**: South Asia (Mumbai, ap-south-1)  
**Date**: November 21, 2026  

---

## 1. Authentication Architecture Overview

BIO HI TECH LIMS is private diagnostic software designed strictly for the laboratory owner and director. It features an owner-only gate:

1. **Zero Public Signup**: Public self-registration is strictly disabled in the application and in Supabase Auth.
2. **Owner-Access Allowlist**: Even if a user account exists in `auth.users`, application access and PostgreSQL row access are strictly denied unless the user's UUID is explicitly active in `public.owner_access`.
3. **Immediate Revocation**: If an authenticated session fails the owner allowlist check, the application immediately signs out, purges in-memory clinical state, and displays an Access Denied message.
4. **Session Protection**: Sessions are persisted securely with automatic token refresh, configurable inactivity timeout (15 minutes), and an optional Strict Mode.

```
                    ┌─────────────────────────┐
                    │  BIO HI TECH App Icon   │
                    └────────────┬────────────┘
                                 │
                     [Branded Splash Screen]
                                 │
                    ┌────────────▼────────────┐
                    │ Check Stored Session    │
                    └────────────┬────────────┘
                                 │
             ┌───────────────────┴───────────────────┐
      [Valid Session]                         [No Session]
             │                                       │
┌────────────▼────────────┐             ┌────────────▼────────────┐
│ Check PostgreSQL       │             │ /login Screen Only      │
│ public.owner_access     │             │ Zero Patient Data       │
└────────────┬────────────┘             └────────────┬────────────┘
             │                                       │
      ┌──────┴──────┐                         [Owner Authenticates]
 [Active]      [Not Owner]                           │
      │             │                                │
┌─────▼─────┐ ┌─────▼─────────────────────────┐      │
│ Dashboard │ │ Sign Out + Purge Memory       │◄─────┘
│ Unlocked  │ │ Show "Access Denied" Message  │ (If non-owner)
└───────────┘ └───────────────────────────────┘
```

---

## 2. Step-by-Step Owner Account Provisioning

### Step 1: Create Owner User in Supabase Auth
1. Log in to your [Supabase Dashboard](https://supabase.com/dashboard/project/zxcnnbugchxchjwxvale/auth/users).
2. Navigate to **Authentication** → **Users**.
3. Click **Add User** → **Create User**.
4. Enter the laboratory owner's authorized email (e.g., `owner@biohitech.com`) and a secure password.
5. Check **Auto Confirm User?** to mark the email as verified immediately.
6. Click **Create User**.
7. Copy the generated **User UID** (e.g., `a1b2c3d4-e5f6-7890-abcd-ef1234567890`).

### Step 2: Grant Owner Authorization in SQL Editor
1. In the Supabase Dashboard, navigate to **SQL Editor** → **New Query**.
2. Run the following command (substitute your copied User UID and email):

```sql
-- Provision the single authorized laboratory owner
INSERT INTO public.owner_access (id, email, is_active, role)
VALUES (
    'YOUR_COPIED_USER_UID_HERE'::uuid, 
    'owner@biohitech.com', 
    TRUE, 
    'OWNER'
)
ON CONFLICT (id) DO UPDATE SET is_active = TRUE;

-- Populate laboratory owner profile
INSERT INTO public.owner_profile (
    id, email, full_name, designation, lab_name, lab_address
)
VALUES (
    'YOUR_COPIED_USER_UID_HERE'::uuid,
    'owner@biohitech.com',
    'Dr. Arun Kumar',
    'Chief Pathologist & Lab Director',
    'BIO HI TECH',
    'Ground Floor, Health Plaza, Mumbai, Maharashtra'
)
ON CONFLICT (id) DO UPDATE SET 
    full_name = EXCLUDED.full_name,
    designation = EXCLUDED.designation;
```

---

## 3. Disabling Public Signups in Supabase

To ensure that no unauthorized person can self-register:
1. In the Supabase Dashboard, go to **Authentication** → **Providers** → **Email**.
2. Toggle **Allow new users to sign up** to **OFF** (`disable_signup: true`).
3. Under **Authentication** → **General**, ensure **Anonymous Sign-ins** is **OFF**.

---

## 4. Client-Side Security Gates

### Route Guarding & Privacy Halt
In [`saran project/components/lab-app.tsx`](file:///home/mithil/Downloads/BIO-HI-TECH-LIMS/saran%20project/components/lab-app.tsx):
- If `authState.isLoading` is true: Renders the branded teal Splash Screen.
- If `authState.isLocked` is true: Halts all views and displays the `AppLockScreen`.
- If `!authState.isAuthenticated`: Halts all clinical routes (`/patients`, `/reports`, `/billing`, `/analytics`, `/tests`, `/settings`) and renders `<AuthPage>`. Deep links cannot bypass authentication.

### Inactivity Lock (15 Minutes)
User activity (`mousemove`, `keydown`, `touchstart`, `pointerdown`) is monitored. If idle time exceeds 15 minutes, `lockSession()` is automatically invoked. The session remains authenticated in the background, but the UI is locked until the owner re-enters their password.

### Optional Strict Mode
Available under **Settings** → **Security**:
- "Require owner login every time the application opens"
- When enabled, stored tokens are not restored across app restarts, forcing a fresh login.

### Logout & Data Purge
Invoking `signOutOwner()`:
1. Calls `supabase.auth.signOut()` to revoke cloud session.
2. Removes storage tokens and session records.
3. Calls `purgeSensitiveInMemoryData()`: destroys any temporary report preview overlays, modals, and canvas buffers from DOM memory.
4. Resets UI state to `<AuthPage>`.
