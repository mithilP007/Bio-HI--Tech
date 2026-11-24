# BIO HI TECH LIMS — Supabase Database Deployment Preview

## 1. Target Backend Configuration
- **Project Name**: `BIO-HI-TECH-DEV2`
- **Project Reference**: `ymwfqvyvcavsbeezweea`
- **Region**: South Asia (Mumbai, India) — `ap-south-1`
- **Host**: `db.ymwfqvyvcavsbeezweea.supabase.co`
- **Database Engine**: PostgreSQL 17.12 (GA channel)
- **Status**: `ACTIVE_HEALTHY`
- **Connection Isolation**: Strictly isolated from legacy Singapore project (`zxcnnbugchxchjwxvale`).

---

## 2. CLI Authentication & Project Link Results

| Check | Expected | Actual Result | Status |
|---|---|---|---|
| **Supabase CLI Version** | `>= 3.0.0` | `3.2.0` | **VERIFIED ✓** |
| **CLI Authentication** | Active Session | Authenticated via Personal Access Token | **AUTHENTICATED ✓** |
| **Projects List** | Mumbai project accessible | `ymwfqvyvcavsbeezweea` (`ap-south-1`) confirmed healthy | **ACCESSIBLE ✓** |
| **Project Link** | Linked to Mumbai ref | `Target: project BIO-HI-TECH-DEV2 (ymwfqvyvcavsbeezweea)` | **LINKED ✓** |

---

## 3. Database Migration Inspection & SQL Validation

Four canonical migration files are staged and verified in `saran project/supabase/migrations/`:

### 1. `20261121000001_core_laboratory_schema.sql` (19.6 KB)
- **16 Core Tables**:
  1. `owner_access` (Single-owner allowlist)
  2. `owner_profile` (Owner details & designations)
  3. `referring_doctors` (Doctor referral registry)
  4. `patients` (Patient master records)
  5. `test_catalogue` (Master laboratory tests)
  6. `test_parameters` (124 parameter specifications)
  7. `reference_intervals` (Age/gender-stratified ranges)
  8. `laboratory_orders` (Laboratory order headers)
  9. `order_tests` (Tests ordered per order)
  10. `reports` (Diagnostic reports)
  11. `report_versions` (Immutable report versions)
  12. `report_results` (Entered parameter values)
  13. `payment_transactions` (Immutable financial ledger)
  14. `file_metadata` (Private storage metadata)
  15. `audit_logs` (Security & access event trail)
  16. `lab_settings` (Key-value laboratory configuration)
- **4 Compatibility Views**: `payments_ledger`, `lab_orders`, `test_results`, `file_attachments`.
- **Validation**:
  - Non-unique phone number index (`idx_patients_phone`) allows family members to share contacts.
  - Concurrency triggers automatically increment `version` on `patients`, `laboratory_orders`, and `reports`.

### 2. `20261121000002_owner_access_and_rls.sql` (15.3 KB)
- **Single Active Owner Constraint**:
  `CREATE UNIQUE INDEX uq_single_active_owner ON public.owner_access (is_active) WHERE is_active = TRUE;`
  Guarantees mathematically that no second active owner identity can exist.
- **Search Path Hardening**:
  All functions (`is_active_owner`, `get_active_owner_id`, `claim_system_catalogue_for_owner`) are declared with `SECURITY DEFINER SET search_path = public;`.
- **Catalogue Claim Function**:
  `claim_system_catalogue_for_owner()` requires `is_active_owner() = TRUE`.
- **Catalogue SELECT Policy**:
  Allows reading if `owner_id IS NULL` OR `(auth.uid() = owner_id AND public.is_active_owner())`.
- **Anon Revocation**:
  PostgREST `anon` role completely revoked across all 16 business tables and security functions.
- **Write-Once Immutability**:
  Zero `UPDATE` or `DELETE` policies on `payment_transactions`, `report_versions`, and `audit_logs`.

### 3. `20261121000003_storage_buckets_and_policies.sql` (4.2 KB)
- **3 Private Buckets**:
  - `patient-documents` (`public = false`, 10 MB limit)
  - `issued-reports` (`public = false`, 15 MB limit)
  - `laboratory-assets` (`public = false`, 5 MB limit)
- **Isolation Policy**:
  Storage objects are partitioned by owner UID folder: `(storage.foldername(name))[1] = auth.uid()::text AND public.is_active_owner()`.
- **Signed URLs**:
  All patient document links require time-bounded signed URLs; zero public bucket access.

### 4. `20261121000004_realtime_and_catalogue_seed.sql` (146.1 KB)
- **Realtime Publication**:
  Adds business tables (`patients`, `laboratory_orders`, `reports`, `report_results`, `payment_transactions`, `lab_settings`) to `supabase_realtime` for cross-device sync.
- **SQL Syntax Verification & Fix**:
  Resolved an unclosed single quote in line 10 (`pubname = 'supabase_realtime'`), ensuring clean execution without PostgreSQL parse errors.
- **Safe 120-Test Baseline**:
  All 120 tests and 124 parameter specifications are seeded with `owner_id = NULL`.
  Seeding executes cleanly before the owner account is created in `auth.users` without foreign key constraint violations.
- **Clinical Governance Status**:
  All reference intervals are seeded with `is_verified = FALSE` and interpretation notes are explicitly flagged as unverified clinical baseline notes.

---

## 4. Supabase DB Push Dry-Run Results

Command executed:
```bash
pnpm exec supabase db push --dry-run --remote
```

### Complete CLI Dry-Run Output:
```text
Target: project BIO-HI-TECH-DEV2 (ymwfqvyvcavsbeezweea) · production
Initialising login role...
DRY RUN: migrations will *not* be pushed to the database.
Would push these migrations:
 • 20261121000001_core_laboratory_schema.sql
 • 20261121000002_owner_access_and_rls.sql
 • 20261121000003_storage_buckets_and_policies.sql
 • 20261121000004_realtime_and_catalogue_seed.sql
{"upToDate":false,"dryRun":true,"migrations":["20261121000001_core_laboratory_schema.sql","20261121000002_owner_access_and_rls.sql","20261121000003_storage_buckets_and_policies.sql","20261121000004_realtime_and_catalogue_seed.sql"],"seeds":[],"roles":[],"message":"Finished supabase db push.","target":{"kind":"linked","project_ref":"ymwfqvyvcavsbeezweea","project_name":"BIO-HI-TECH-DEV2","environment":"production"}}
```

### Remote Migration Status (`supabase migration list --remote`):
```text
{"migrations":[
  {"local":"20261121000001","remote":"","time":"2026-11-21 00:00:01"},
  {"local":"20261121000002","remote":"","time":"2026-11-21 00:00:02"},
  {"local":"20261121000003","remote":"","time":"2026-11-21 00:00:03"},
  {"local":"20261121000004","remote":"","time":"2026-11-21 00:00:04"}
],"message":"Migrations listed","target":{"kind":"linked","project_ref":"ymwfqvyvcavsbeezweea","project_name":"BIO-HI-TECH-DEV2","environment":"production"}}
```

---

## 5. Security & Risk Findings

1. **No Destructive Operations**: All four migrations use idempotent `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, and `INSERT ... ON CONFLICT DO UPDATE`. No tables, schemas, or data are dropped.
2. **Zero History Conflicts**: The remote database is fresh (`remote: ""`), so there are zero checksum discrepancies or version collisions.
3. **No Duplicate Tables**: Exactly 16 distinct business tables and 4 views will be created.
4. **Credential Protection**:
   - Zero PAT tokens or database passwords are stored in application source code, `.env.local`, or Git.
   - Project uses only client-safe publishable key (`sb_publishable_...`) under RLS enforcement.

---

## 6. Awaiting Explicit Owner Approval (Step 5)

Per protocol:
- **`pnpm exec supabase db push --remote` HAS NOT BEEN EXECUTED.**
- No migrations have been written to the remote database yet.
- Awaiting explicit instruction from the owner to deploy.
