# BIO HI TECH LIMS — ROW LEVEL SECURITY (RLS) AUDIT

**Target Project**: `ymwfqvyvcavsbeezweea` (Mumbai Region, `ap-south-1`)  
**Security Level**: High / Clinical Single-Tenant Isolation  
**Date**: November 21, 2026  
**Auditor**: Senior Application & Database Security Engineer  

---

## 1. Executive Summary

Every exposed table in the BIO HI TECH PostgreSQL database has Row Level Security strictly enabled (`FORCE ROW LEVEL SECURITY`). Zero public or anonymous access is permitted to patient, clinical, report, or financial records. 

Authorization is enforced at the PostgreSQL kernel level using a custom `SECURITY DEFINER` function, `public.is_active_owner()`, which validates that the authenticated caller (`auth.uid()`) is registered and active in `public.owner_access`.

---

## 2. Table-by-Table RLS Policy Matrix

| Table Name | RLS Enabled | SELECT Policy | INSERT Policy | UPDATE Policy | DELETE Policy |
|---|---|---|---|---|---|
| `owner_access` | **YES** | `auth.uid() = id` | *None (Blocked)* | *None (Blocked)* | *None (Blocked)* |
| `owner_profile` | **YES** | `id = auth.uid() AND is_active_owner()` | *Admin only* | `id = auth.uid() AND is_active_owner()` | *None (Blocked)* |
| `referring_doctors` | **YES** | `owner_id = auth.uid() AND is_active_owner()` | `owner_id = auth.uid() AND is_active_owner()` | `owner_id = auth.uid() AND is_active_owner()` | `owner_id = auth.uid() AND is_active_owner()` |
| `patients` | **YES** | `owner_id = auth.uid() AND is_active_owner()` | `owner_id = auth.uid() AND is_active_owner()` | `owner_id = auth.uid() AND is_active_owner()` | *None (Immutable Medical Record)* |
| `test_catalogue` | **YES** | `owner_id IS NULL OR (owner_id = auth.uid() AND is_active_owner())` | `owner_id = auth.uid() AND is_active_owner()` | `owner_id = auth.uid() AND is_active_owner()` | `owner_id = auth.uid() AND is_active_owner()` |
| `test_parameters` | **YES** | `auth.role() = 'authenticated'` | `is_active_owner()` | `is_active_owner()` | `is_active_owner()` |
| `reference_intervals` | **YES** | `auth.role() = 'authenticated'` | `is_active_owner()` | `is_active_owner()` | `is_active_owner()` |
| `laboratory_orders` | **YES** | `owner_id = auth.uid() AND is_active_owner()` | `owner_id = auth.uid() AND is_active_owner()` | `owner_id = auth.uid() AND is_active_owner()` | *None (Cancelled via status)* |
| `order_tests` | **YES** | Parent order owner check | Parent order owner check | Parent order owner check | *None (Preserved)* |
| `reports` | **YES** | `owner_id = auth.uid() AND is_active_owner()` | `owner_id = auth.uid() AND is_active_owner()` | `owner_id = auth.uid() AND is_active_owner()` | *None (Immutable Medical Legal Record)* |
| `report_versions` | **YES** | Parent report owner check | `issued_by = auth.uid() AND is_active_owner()` | *None (Frozen Snapshot)* | *None (Frozen Snapshot)* |
| `report_results` | **YES** | `owner_id = auth.uid() AND is_active_owner()` | `owner_id = auth.uid() AND is_active_owner()` | `owner_id = auth.uid() AND is_active_owner()` | `owner_id = auth.uid() AND is_active_owner()` |
| `payment_transactions` | **YES** | `owner_id = auth.uid() AND is_active_owner()` | `owner_id = auth.uid() AND is_active_owner()` | *None (Immutable Financial Ledger)* | *None (Immutable Financial Ledger)* |
| `file_metadata` | **YES** | `owner_id = auth.uid() AND is_active_owner()` | `owner_id = auth.uid() AND is_active_owner()` | `owner_id = auth.uid() AND is_active_owner()` | `owner_id = auth.uid() AND is_active_owner()` |
| `audit_logs` | **YES** | `owner_id = auth.uid() AND is_active_owner()` | `owner_id = auth.uid() AND is_active_owner()` | *None (Immutable Security Audit)* | *None (Immutable Security Audit)* |
| `lab_settings` | **YES** | `owner_id = auth.uid() AND is_active_owner()` | `owner_id = auth.uid() AND is_active_owner()` | `owner_id = auth.uid() AND is_active_owner()` | *None (Blocked)* |

---

## 3. Immutable Table Governance

In healthcare compliance (HIPAA, ISO 15189, DISHA) and financial auditing standards, diagnostic reports and monetary transactions must maintain an unalterable history:

1. **`payment_transactions`**:
   - Zero `UPDATE` policy.
   - Zero `DELETE` policy.
   - Adjustments must be recorded as separate corrective transaction entries.
2. **`report_versions`**:
   - Zero `UPDATE` policy.
   - Zero `DELETE` policy.
   - Issued versions store frozen JSONB snapshots that cannot be modified after sign-off.
3. **`audit_logs`**:
   - Zero `UPDATE` policy.
   - Zero `DELETE` policy.
   - Security audit entries are strictly write-once, append-only.

---

## 4. Anonymous Role Privilege Revocation

All privileges for the `anon` PostgreSQL role have been explicitly revoked across all business tables:

```sql
REVOKE ALL ON public.patients FROM anon;
REVOKE ALL ON public.reports FROM anon;
REVOKE ALL ON public.report_results FROM anon;
REVOKE ALL ON public.payment_transactions FROM anon;
REVOKE ALL ON public.audit_logs FROM anon;
REVOKE ALL ON public.owner_access FROM anon;
```

---

## 5. Automated RLS Verification Suite

The standalone verification test suite [`supabase/tests/rls_security_test.sql`](file:///home/mithil/Downloads/BIO-HI-TECH-LIMS/saran%20project/supabase/tests/rls_security_test.sql) validates:

1. **All 16 tables** have `relrowsecurity = TRUE`.
2. **`anon` privileges = 0** on protected clinical and financial entities.
3. **`uq_single_active_owner`** unique index is present and enforcing 1 active owner.
4. **Immutable tables** have 0 UPDATE and 0 DELETE policies.
5. **Private storage buckets** have `public = FALSE`.
