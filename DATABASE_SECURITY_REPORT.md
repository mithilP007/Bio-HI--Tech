# BIO HI TECH — DATABASE SECURITY REPORT

This document audits the database security architecture, Row Level Security (RLS) policies, concurrency control, private storage permissions, and audit logging for **BIO HI TECH LIMS**.

---

## 1. Security Architecture Principles

```
+-------------------------------------------------------------------------------+
|                       Supabase PostgreSQL Kernel (RLS)                        |
|                                                                               |
|  [Anonymous Traffic] ───► DENIED (0 Tables, 0 Storage Buckets Exposed)        |
|                                                                               |
|  [Authenticated Non-Owner] ───► DENIED (auth.uid() != owner_id filter blocks)  |
|                                                                               |
|  [Authenticated Owner] ───► AUTHORIZED (Single-tenant Owner Isolation)        |
+-------------------------------------------------------------------------------+
```

### Guarantees Enforced:
1. **Zero Anonymous Access**: No table in the `public` schema grants `SELECT`, `INSERT`, `UPDATE`, or `DELETE` to the `anon` role.
2. **Owner-Only Isolation**: Every clinical record has an `owner_id UUID` foreign key referencing `auth.users(id)`.
3. **No Database Master Keys**: The native Android APK, desktop binaries, and web bundles embed exclusively the publishable `anon` key. The `service_role` key is strictly prohibited.
4. **Non-Unique Contact Numbers**: The `patients` table indexes `phone` for search performance without a `UNIQUE` constraint, supporting multi-member families with shared contact numbers.

---

## 2. Table-by-Table Row Level Security (RLS) Audit

| Table Name | RLS Status | Enforced Policy | Anonymous Access | Cross-Tenant Protection |
| :--- | :---: | :--- | :---: | :---: |
| `public.owner_profile` | **ENABLED** | `auth.uid() = id` | **BLOCKED** | Isolated by User UUID |
| `public.referring_doctors` | **ENABLED** | `auth.uid() = owner_id` | **BLOCKED** | Isolated by Owner ID |
| `public.patients` | **ENABLED** | `auth.uid() = owner_id` | **BLOCKED** | Isolated by Owner ID |
| `public.test_catalogue` | **ENABLED** | Read global or owner; Write owner only | **BLOCKED** | Owner writes only |
| `public.test_parameters` | **ENABLED** | Authenticated read only | **BLOCKED** | Authenticated only |
| `public.reference_intervals` | **ENABLED** | Authenticated read only | **BLOCKED** | Authenticated only |
| `public.laboratory_orders` | **ENABLED** | `auth.uid() = owner_id` | **BLOCKED** | Isolated by Owner ID |
| `public.order_tests` | **ENABLED** | Checked via parent `order.owner_id = auth.uid()` | **BLOCKED** | Isolated via Parent Order |
| `public.reports` | **ENABLED** | `auth.uid() = owner_id` | **BLOCKED** | Isolated by Owner ID |
| `public.report_versions` | **ENABLED** | Checked via parent `report.owner_id = auth.uid()` | **BLOCKED** | Isolated via Parent Report |
| `public.report_results` | **ENABLED** | `auth.uid() = owner_id` | **BLOCKED** | Isolated by Owner ID |
| `public.payment_transactions` | **ENABLED** | `auth.uid() = owner_id` | **BLOCKED** | Isolated by Owner ID |
| `public.file_metadata` | **ENABLED** | `auth.uid() = owner_id` | **BLOCKED** | Isolated by Owner ID |
| `public.audit_logs` | **ENABLED** | `auth.uid() = owner_id` | **BLOCKED** | Append-only audit logs |
| `public.lab_settings` | **ENABLED** | `auth.uid() = owner_id` | **BLOCKED** | Isolated by Owner ID |

---

## 3. Concurrency Protection & Version Triggers

To prevent silent overwrites when multiple devices (e.g., reception desktop and laboratory Android tablet) edit records concurrently:

```sql
CREATE OR REPLACE FUNCTION public.handle_row_update()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    NEW.version = OLD.version + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_patients_update BEFORE UPDATE ON public.patients
    FOR EACH ROW EXECUTE FUNCTION public.handle_row_update();

CREATE TRIGGER trg_reports_update BEFORE UPDATE ON public.reports
    FOR EACH ROW EXECUTE FUNCTION public.handle_row_update();

CREATE TRIGGER trg_orders_update BEFORE UPDATE ON public.laboratory_orders
    FOR EACH ROW EXECUTE FUNCTION public.handle_row_update();
```

When updating a patient or report from a client, the client specifies `WHERE id = $1 AND version = $2`. If another device committed an intermediate change, the query returns 0 modified rows, prompting the client to refresh rather than corrupt clinical records.

---

## 4. Private Storage Bucket Security

Three private buckets are provisioned in Supabase Storage:

1. **`patient-documents`**: Prescriptions, prior lab reports, insurance cards.
2. **`issued-reports`**: Official finalized PDF reports with QR codes and barcodes.
3. **`laboratory-assets`**: Digital signatures, stamps, and letterhead artwork.

### Storage RLS Policies:
- Direct HTTP requests without JWT headers receive `HTTP 403 Forbidden`.
- Folder paths are scoped strictly to the owner's UUID: `(storage.foldername(name))[1] = auth.uid()::text`.
- Clients download files via 15-minute expiring signed URLs (`createSignedUrl(path, 900)`). No permanent public URLs exist.

---

## 5. Audit Logging Architecture

Every critical clinical and security event is recorded in `public.audit_logs`:
- **Actions Logged**: `LOGIN`, `LOGOUT`, `CREATE`, `UPDATE`, `DELETE`, `VIEW_REPORT`, `PRINT_REPORT`, `EXPORT_DATA`.
- **Recorded Details**: Actor UUID, timestamp, entity type, entity ID, client IP address, User-Agent header, and JSONB metadata.
- **Integrity**: Audit logs cannot be deleted or mutated by standard application operations.
