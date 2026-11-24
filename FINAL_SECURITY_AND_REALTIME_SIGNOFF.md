# BIO HI TECH — FINAL SECURITY HARDENING & REALTIME SIGNOFF REPORT

**Date:** 2026-11-23  
**Target Environment:** `BIO-HI-TECH-DEV2` (Ref: `ymwfqvyvcavsbeezweea`, Mumbai `ap-south-1`)  
**Application Root:** `/home/mithil/Downloads/BIO-HI-TECH-LIMS/saran project/`  
**Test Stack:** PostgreSQL 17.12 (Isolated Local Supabase)  
**Status Assessment:** **PASS ✓ — ALL SECURITY & REALTIME AUDITS PASSED**

---

## 1. EXECUTIVE EVALUATION MATRIX

*All evaluations strictly conform to project standards: `PASS`, `FAIL`, `BLOCKED`, `NOT TESTED`.*

| Evaluation Dimension | Status | Key Verification Evidence |
|---|---|---|
| **SECURITY DEFINER Search Path** | **PASS** | All 6 functions strictly enforce `SET search_path = ''`. Zero un-qualified table, type, or function calls. |
| **Schema CREATE Privileges** | **PASS** | `CREATE ON SCHEMA public` revoked from `PUBLIC`, `anon`, and `authenticated`. Shadowing attacks blocked. |
| **Function Execution Grants** | **PASS** | Execution strictly revoked from `PUBLIC` and `anon`; granted only to `authenticated`. All functions assert `is_active_owner()`. |
| **Dynamic SQL Inspection** | **PASS** | Zero dynamic `EXECUTE` statements. All queries use static, parameterized PostgreSQL queries. |
| **Realtime Publication Membership** | **PASS** | All 14 operational and clinical tables included in `supabase_realtime` publication. |
| **Two-Client Realtime Verification** | **PASS** | 16/16 multi-client tests passed: Create, Edit, Archive, Restore, Order, Results, Finalize, Payment, Catalogue Price, Optimistic Concurrency, Disconnect/Reconnect, Deduplication. |
| **Patient Retention & Deletion** | **PASS** | `delete_eligible_patient` verified. Patients with linked clinical/financial history strictly blocked by RPC check and relational `ON DELETE RESTRICT`. |
| **RLS & Cross-Owner Isolation** | **PASS** | 16/16 tables RLS protected. Cross-owner query/write rejected; anonymous callers receive zero rows. |
| **System Catalogue Preservation** | **PASS** | Exactly 120 tests, 211 parameters (all 211 `is_verified = FALSE`), and 22 panels intact and unverified. |
| **Remote Database Isolation** | **BLOCKED** | Remote Mumbai project remains untouched (0 remote migrations applied). Awaiting explicit owner authorization. |

---

## 2. SECURITY DEFINER FUNCTIONS AUDIT & HARDENING

All six security-definer routines were audited and hardened in additive migration `20261123000002_security_hardening_and_realtime.sql` to enforce `SET search_path = ''`:

```
========================================================================================
FUNCTION SIGNATURES, SEARCH_PATH & SECURITY DEFINER ATTRIBUTES (pg_proc)
========================================================================================
1. public.is_active_owner()
   • Return Type:   pg_catalog.bool
   • Security:      SECURITY DEFINER
   • search_path:   ["search_path=\"\""] (Empty - Hardened)
   • Owner:         postgres
   • Qualifications: public.owner_access, auth.uid()

2. public.get_active_owner_id()
   • Return Type:   pg_catalog.uuid
   • Security:      SECURITY DEFINER
   • search_path:   ["search_path=\"\""] (Empty - Hardened)
   • Owner:         postgres
   • Qualifications: public.owner_access

3. public.claim_system_catalogue_for_owner()
   • Return Type:   pg_catalog.int4
   • Security:      SECURITY DEFINER
   • search_path:   ["search_path=\"\""] (Empty - Hardened)
   • Owner:         postgres
   • Qualifications: public.is_active_owner(), public.owner_access, public.test_catalogue

4. public.archive_patient(p_id pg_catalog.text)
   • Return Type:   pg_catalog.bool
   • Security:      SECURITY DEFINER
   • search_path:   ["search_path=\"\""] (Empty - Hardened)
   • Owner:         postgres
   • Qualifications: public.is_active_owner(), public.patients, public.audit_logs, auth.uid(),
                     pg_catalog.timezone(), pg_catalog.now(), pg_catalog.jsonb_build_object()

5. public.restore_patient(p_id pg_catalog.text)
   • Return Type:   pg_catalog.bool
   • Security:      SECURITY DEFINER
   • search_path:   ["search_path=\"\""] (Empty - Hardened)
   • Owner:         postgres
   • Qualifications: public.is_active_owner(), public.patients, public.audit_logs, auth.uid(),
                     pg_catalog.timezone(), pg_catalog.now(), pg_catalog.jsonb_build_object()

6. public.delete_eligible_patient(p_id pg_catalog.text)
   • Return Type:   pg_catalog.jsonb
   • Security:      SECURITY DEFINER
   • search_path:   ["search_path=\"\""] (Empty - Hardened)
   • Owner:         postgres
   • Qualifications: public.is_active_owner(), public.patients, public.laboratory_orders,
                     public.reports, public.payment_transactions, public.audit_logs, auth.uid(),
                     pg_catalog.count(), pg_catalog.format(), pg_catalog.jsonb_build_object()
```

### Execution Grants (pg_proc Privilege Check):
```sql
SELECT proname, anon_can_exec, auth_can_exec, public_can_exec FROM pg_proc_audit;
```
| Function Name | `anon_can_exec` | `auth_can_exec` | `public_can_exec` | Security Assessment |
|---|---|---|---|---|
| `is_active_owner` | **false** | **true** | **false** | Strictly Authenticated Only |
| `get_active_owner_id` | **false** | **true** | **false** | Strictly Authenticated Only |
| `claim_system_catalogue_for_owner` | **false** | **true** | **false** | Strictly Authenticated Only |
| `archive_patient` | **false** | **true** | **false** | Strictly Authenticated Only |
| `restore_patient` | **false** | **true** | **false** | Strictly Authenticated Only |
| `delete_eligible_patient` | **false** | **true** | **false** | Strictly Authenticated Only |

---

## 3. SCHEMA PRIVILEGE ISOLATION (CVE-2018-1058 DEFENSE)

To prevent untrusted object creation or malicious function/operator shadowing attacks:

```sql
SELECT 
    r.rolname, 
    has_schema_privilege(r.rolname, 'public', 'CREATE') AS can_create_in_public,
    has_schema_privilege(r.rolname, 'public', 'USAGE') AS can_use_public
FROM pg_roles r
WHERE r.rolname IN ('anon', 'authenticated', 'public');
```

### Results:
| Role Name | `can_create_in_public` | `can_use_public` | Status |
|---|---|---|---|
| `anon` | **false** | true | **PASS** (Cannot inject objects) |
| `authenticated` | **false** | true | **PASS** (Cannot inject objects) |
| `public` (pseudo-role) | **false** | true | **PASS** (Cannot inject objects) |

---

## 4. COMPLETE REALTIME PUBLICATION COVERAGE

All 14 business and clinical tables are registered in the `supabase_realtime` publication:

```sql
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
ORDER BY tablename;
```

1. `public.file_metadata` *(Patient documents, report attachments)*
2. `public.lab_settings` *(Lab branding, printing options, letterhead)*
3. `public.laboratory_orders` *(Orders, status transitions)*
4. `public.order_tests` *(Ordered tests & price snapshots)*
5. `public.owner_profile` *(Doctor name, designation, lab address)*
6. `public.patients` *(Patient demographics, archive/active flags)*
7. `public.payment_transactions` *(Financial ledger entries)*
8. `public.reference_intervals` *(Clinical reference ranges)*
9. `public.referring_doctors` *(Referring physician directory)*
10. `public.report_results` *(Parameter values, abnormal flags)*
11. `public.report_versions` *(Frozen report snapshots)*
12. `public.reports` *(Reports, invoice amounts, statuses)*
13. `public.test_catalogue` *(Test list, prices, categories)*
14. `public.test_parameters` *(Parameter definitions, units, types)*

### Frontend Subscription-to-Table Mapping (`lib/supabase-client.ts`):
```typescript
const channel = supabase
  .channel('bio_hitech_realtime_sync')
  .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
    // 1. Checks event deduplication cache: isDuplicateEvent(table, recordId, updated_at)
    // 2. Dispatches payload to data-service: syncLoadCloudData()
    // 3. Reconciles local stores and triggers reactive UI updates across screens
  })
```

---

## 5. ACTUAL TWO-CLIENT REALTIME WORKFLOW VALIDATION

Test script `scripts/test_two_client_realtime.mjs` executed against isolated local Supabase instance using two separate authenticated clients (`clientA` and `clientB`):

```
==============================================================================
BIO HI TECH — TWO-CLIENT REALTIME WEBSOCKET SYNCHRONIZATION AUDIT
==============================================================================
Target: http://127.0.0.1:54321
Timestamp: 2026-11-23T15:22:21.499Z

--- Realtime Channel Setup ---
  Client A authenticated: realtime-owner-1795447341499@biohitech.test
  Client B authenticated: realtime-owner-1795447341499@biohitech.test
  Client A WebSocket channel: SUBSCRIBED ✓
  Client B WebSocket channel: SUBSCRIBED ✓

--- 1. Patient Creation (Client A -> Client B) ---
  ✓ [PASS] Client A creates patient → Client B receives real-time INSERT (Realtime Test Patient)

--- 2. Patient Editing (Client B -> Client A) ---
  ✓ [PASS] Client B edits patient → Client A receives real-time UPDATE (+91 99999 11111)

--- 3. Patient Archival & Restoration ---
  ✓ [PASS] Client A archives patient → Client B receives real-time is_archived: true (id: BHT-RT-1991)
  ✓ [PASS] Client B restores patient → Client A receives real-time is_archived: false (id: BHT-RT-1991)

--- 4. Laboratory Order Creation & Status Update ---
  ✓ [PASS] Client A creates laboratory order → Client B receives real-time INSERT (Pending)
  ✓ [PASS] Client B updates order status → Client A receives real-time UPDATE (Processing)

--- 5. Test Results Entry (Client A -> Client B) ---
  ✓ [PASS] Client A enters test result → Client B receives real-time result event (Table: report_results)

--- 6. Report Finalization / Issuance (Client B -> Client A) ---
  ✓ [PASS] Client B issues report → Client A receives real-time status: Issued (Report: RPT-RT-8268)

--- 7. Payment Transaction Ledger Entry ---
  ✓ [PASS] Client A records payment → Client B receives real-time ledger INSERT (Amount: ₹500)

--- 8. Catalogue Price Modification ---
  ✓ [PASS] Client B updates catalogue price → Client A receives real-time UPDATE (New Price: 2200)

--- 9. Simultaneous Concurrency & Version Increment ---
  ✓ [PASS] Client A and Client B read identical order version snapshot (Version: 2)
  ✓ [PASS] PostgreSQL trigger automatically increments record version upon edit (Version: 3)

--- 10. Disconnect & Reconnect Resilience ---
  Client B reconnected and subscribed ✓
  ✓ [PASS] Client B reconnects and reconciles records created during disconnect (Offline Disconnect Patient)
  ✓ [PASS] Reconnected Client B immediately receives live events without restart (Post Reconnect Live Patient)

--- 11. Event Deduplication Verification ---
  ✓ [PASS] Client receives exactly 1 event payload (zero duplicate deliveries) (Event count: 1)

--- Teardown & Database Cleanliness ---
  ✓ [PASS] All test fixtures purged; operational database clean (Patients: 0)

==============================================================================
REALTIME TEST EXECUTION SUMMARY: 16 PASSED, 0 FAILED (TOTAL: 16)
==============================================================================
```

---

## 6. RECHECK OF PATIENT DELETION & DATA RETENTION RULES

The stored procedure `public.delete_eligible_patient(p_id)` was rechecked:

1. **Authorization Check:**
   `IF NOT public.is_active_owner() THEN RAISE EXCEPTION ...`
   *Non-owners or unauthorized callers cannot delete records.*
2. **Clinical Dependency Pre-Check:**
   ```sql
   SELECT count(*) INTO order_cnt FROM public.laboratory_orders WHERE patient_id = p_id;
   SELECT count(*) INTO report_cnt FROM public.reports WHERE patient_id = p_id;
   SELECT count(*) INTO txn_cnt FROM public.payment_transactions WHERE patient_id = p_id;
   ```
   If `order_cnt > 0 OR report_cnt > 0 OR txn_cnt > 0`:
   Returns `{ success: false, blocked: true, message: "Permanent deletion blocked..." }`.
3. **Defense-in-Depth Relational Foreign Keys:**
   ```sql
   ALTER TABLE public.laboratory_orders ADD CONSTRAINT ... ON DELETE RESTRICT;
   ALTER TABLE public.reports ADD CONSTRAINT ... ON DELETE RESTRICT;
   ALTER TABLE public.payment_transactions ADD CONSTRAINT ... ON DELETE RESTRICT;
   ```
   *Direct SQL DELETE attempts fail with PostgreSQL code 23503.*
4. **Audit Trail Logging:**
   Deletions of eligible patients write an immutable `DELETE` event to `public.audit_logs`.

---

## 7. FULL SUITE TEST EXECUTION TOTALS

```
==============================================================================
COMPLETE VALIDATION SUITE SUMMARY
==============================================================================
1. Barcode & QR Physical Decoding:          7/7 PASSED ✓
2. End-to-End Functional Workflows:        37/37 PASSED ✓
3. Two-Client Realtime WebSocket Sync:     16/16 PASSED ✓
4. PostgreSQL Database Security Tests:     11/11 PASSED ✓
5. TypeScript Compilation (tsc --noEmit):    0 ERRORS ✓
6. Production Next.js Build (56 routes):    PASSED in 2.6s ✓
7. Capacitor Android Sync:                  PASSED in 0.13s ✓
------------------------------------------------------------------------------
TOTAL TEST RUNS: 71 | PASSED: 71 | FAILED: 0 | SUCCESS RATE: 100%
==============================================================================
```

---

## 8. MIGRATION HISTORY & REMOTE STATUS

```bash
$ pnpm exec supabase migration list --remote
```

```json
{
  "target": {
    "kind": "linked",
    "project_name": "BIO-HI-TECH-DEV2",
    "project_ref": "ymwfqvyvcavsbeezweea",
    "environment": "production"
  },
  "migrations": [
    { "local": "20261121000001", "remote": "", "time": "2026-11-21 00:00:01" },
    { "local": "20261121000002", "remote": "", "time": "2026-11-21 00:00:02" },
    { "local": "20261121000003", "remote": "", "time": "2026-11-21 00:00:03" },
    { "local": "20261121000004", "remote": "", "time": "2026-11-21 00:00:04" },
    { "local": "20261123000001", "remote": "", "time": "2026-11-23 00:00:01" },
    { "local": "20261123000002", "remote": "", "time": "2026-11-23 00:00:02" }
  ]
}
```

- Total Local Migrations: **6**
- Total Remote Applied Migrations: **0**
- Total Pending Migrations: **6**
- Divergences / Inconsistencies: **0**
- Remote Mumbai Status: **Untouched & Preserved**

---

## 9. CONCLUSION & OWNER AUTHORIZATION COMMAND

All security hardening (`search_path = ''`, privilege revocation, dynamic SQL elimination) and complete Realtime coverage across 14 tables have been verified with 100% test success across two separate authenticated clients.

When the laboratory owner authorizes deployment to `BIO-HI-TECH-DEV2` (Mumbai), execute:

```bash
cd "/home/mithil/Downloads/BIO-HI-TECH-LIMS/saran project"
pnpm exec supabase db push
```
