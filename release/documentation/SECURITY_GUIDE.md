# BIO HI TECH LIMS — Security Architecture & Administration Guide

## 1. Single Authorized Owner Access Model

BIO HI TECH LIMS is strictly designed for single-owner private clinical laboratory management.
- **Zero Public Registration**: Sign-ups and anonymous sign-ins are completely disabled in Supabase Auth (`enable_signup = false`, `enable_anonymous_sign_ins = false`).
- **Owner Allowlist (`public.owner_access`)**: Every database operation and API request is evaluated against `public.is_active_owner()`. Even if an account is manually created in Supabase Auth, it has zero read/write access to any business table unless explicitly provisioned in `owner_access` with `is_active = TRUE`.
- **Single Active Owner Constraint**: The database enforces a partial unique index `uq_single_active_owner` (`CREATE UNIQUE INDEX uq_single_active_owner ON public.owner_access (is_active) WHERE is_active = TRUE`), guaranteeing cryptographically that no more than ONE active owner can exist simultaneously.

---

## 2. Row Level Security (RLS) Implementation

All 16 business tables have PostgreSQL Row Level Security enabled:
1. `owner_access`
2. `owner_profile`
3. `referring_doctors`
4. `patients`
5. `test_catalogue`
6. `test_parameters`
7. `reference_intervals`
8. `laboratory_orders`
9. `order_tests`
10. `reports`
11. `report_versions`
12. `report_results`
13. `payment_transactions`
14. `file_metadata`
15. `audit_logs`
16. `lab_settings`

### Security Definer Search Path Hardening
All PostgreSQL functions (`is_active_owner`, `claim_system_catalogue_for_owner`, etc.) are declared with `SECURITY DEFINER SET search_path = public, pg_temp;` to completely prevent search-path injection vulnerabilities.

### Anon Role Revocation
The `anon` PostgREST role has all privileges revoked (`REVOKE ALL ON <table_name> FROM anon;`). Unauthenticated or anonymous HTTP/REST requests receive `401 Unauthorized` or empty result sets at the PostgreSQL engine level.

---

## 3. Storage Bucket Isolation & Signed URLs

Three private buckets are defined in Supabase Storage:
1. `patient-documents` (private)
2. `issued-reports` (private)
3. `laboratory-assets` (private)

### Bucket Policies
- Direct public access is disabled on all three buckets (`public = false`).
- Folders are partitioned by owner UID: `(storage.foldername(name))[1] = auth.uid()::text`.
- Active owner check is enforced on every upload, read, and delete operation.
- Download links for documents are short-lived signed URLs generated dynamically via Supabase Storage API (`createSignedUrl(path, 3600)`).
- Document URLs and QR code verification links contain zero patient PII (no names, phones, or clinical results in query parameters or payloads).

---

## 4. Native Credential Protection & Session Security

### Session Inactivity Lock
- The application monitors user activity (mouse moves, clicks, keystrokes, touch events).
- Inactivity exceeding 15 minutes automatically engages the workspace lock screen.
- Resuming requires entering the owner account password.

### Device Session Management
- **Strict Startup Login Mode**: When enabled in Security Settings, session tokens are not saved across app restarts, requiring password entry every time the app opens.
- **Immediate Non-Owner Revocation**: If a non-owner token is detected during `initializeAuth()`, `supabase.auth.signOut()` is executed immediately, followed by memory purging of all patient and clinical data.
- **No Patient Persistence in LocalStorage**: Patient medical histories, diagnostic test results, and financial transaction details are never persisted in unencrypted `localStorage`. PostgreSQL is the sole persistent source of truth.

---

## 5. Security Checklist for System Administrators
- [x] Mumbai project reference confirmed (`ymwfqvyvcavsbeezweea`).
- [x] Client publishable key configured (`sb_publishable_...`).
- [x] Zero service-role or secret keys in client bundles or tracked source files.
- [x] Anonymous access completely revoked on all tables and storage buckets.
- [x] Code 128 barcodes and QR verification codes contain zero patient PII.
- [x] Immutability enforced on payments (`payment_transactions`) and issued reports (`report_versions`).
