# BIO HI TECH — SUPABASE CONNECTION & CLOUD INTEGRATION GUIDE

This document details how to configure, secure, and connect the central **Supabase PostgreSQL** cloud backend for cross-platform desktop and mobile operation.

---

## 1. Centralized Database Topology

Desktop and mobile applications connect to **ONE single Supabase project**. There is no local SQLite database or browser LocalStorage database for clinical records.

```
+-------------------------------------------------------------------------+
|                Supabase Cloud Infrastructure (ap-south-1)               |
|                                                                         |
|  +--------------------+  +-------------------+  +--------------------+  |
|  |   PostgreSQL 16    |  |   Supabase Auth   |  |  Supabase Storage  |  |
|  | - Strict RLS       |  | - Owner Only      |  | - 3 Private Buckets|  |
|  | - Version Triggers |  | - JWT Sessions    |  | - Signed URLs      |  |
|  | - Realtime Sync    |  | - MFA Supported   |  | - Zero Public PII  |  |
|  +--------------------+  +-------------------+  +--------------------+  |
+------------------------------------+------------------------------------+
                                     |
               +---------------------+---------------------+
               |                     |                     |
               v                     v                     v
      [Linux AppImage]      [Windows .exe / .msi]   [Android APK / AAB]
```

---

## 2. Environment Variables Configuration

In `saran project/.env.local`, the client-safe connection variables are specified:

```env
# Public Supabase API URL (HTTPS, Mumbai ap-south-1)
NEXT_PUBLIC_SUPABASE_URL=https://ymwfqvyvcavsbeezweea.supabase.co

# Public Publishable Key (Subject to kernel-level Row Level Security)
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_MnsgIhHqS04_rv6UcwwHwA_AtGfXURu

# Application Environment Mode ('development' | 'production')
NEXT_PUBLIC_APP_ENV=development
```

### Critical Security Rules
> [!CAUTION]
> 1. **NEVER** place the `service_role` key, database master password, or administrative secrets inside `.env`, the frontend bundle, Capacitor assets, or desktop binaries.
> 2. The client applications connect exclusively using the **publishable (`anon`)** key.
> 3. Security is enforced at the database kernel level through **Row Level Security (RLS)**.

---

## 3. Database Provisioning & Migrations

The versioned SQL migrations are organized under:
`saran project/supabase/migrations/`

| Migration | Purpose |
|---|---|
| `20261121000001_core_laboratory_schema.sql` | 16 core business tables, concurrency triggers, indexes |
| `20261121000002_owner_access_and_rls.sql` | Owner allowlist (`owner_access`), `is_active_owner()`, RLS |
| `20261121000003_storage_buckets_and_policies.sql` | 3 private buckets (`patient-documents`, `issued-reports`, `laboratory-assets`) |
| `20261121000004_realtime_and_catalogue_seed.sql` | `supabase_realtime` publication, 120 legacy tests, 124 parameter specifications |
| `20261121000005_rls_security_verification_tests.sql` | Automated RLS and security posture assertion function |

A single consolidated snapshot is also maintained at:
`saran project/supabase/schema.sql`

---

## 4. Applying Migrations

### Option A: Supabase Dashboard SQL Editor (Direct & Secure)
1. Open [Supabase Dashboard SQL Editor](https://supabase.com/dashboard/project/zxcnnbugchxchjwxvale/sql/new).
2. Paste the contents of `saran project/supabase/schema.sql`.
3. Click **Run**. All 16 tables, triggers, RLS policies, buckets, and 120-test seeds are created.

### Option B: Supabase CLI
```bash
cd "saran project"
pnpm exec supabase link --project-ref ymwfqvyvcavsbeezweea
pnpm exec supabase db push --remote
```

---

## 5. Owner Authorization Setup

To authorize the laboratory owner:
1. In the Supabase Dashboard, create the user under **Authentication** → **Users**.
2. Run the SQL allowlist query:
```sql
INSERT INTO public.owner_access (id, email, is_active, role)
VALUES ('<USER-UUID>'::uuid, 'owner@biohitech.com', TRUE, 'OWNER')
ON CONFLICT (id) DO UPDATE SET is_active = TRUE;
```
