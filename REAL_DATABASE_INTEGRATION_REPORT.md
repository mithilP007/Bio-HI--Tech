# BIO HI TECH LIMS — Real Application Database Integration Report

## 1. Overview
This report details the integration of actual Supabase PostgreSQL operations into the BIO HI TECH Laboratory Information Management System (LIMS), progressively replacing mock prototype operations with persistent database transactions.

---

## 2. Integrated Modules & Persistence Architecture

### A. Patients Module
- **Registration (`syncCreatePatient`)**:
  - Inserts new patient into `public.patients` table with authenticated owner ID (`owner_id = user.id`).
  - Generates sequential Patient ID (`BHT-XXXXX`).
  - Stores full name, phone number, age, gender, date of birth, address, referring doctor, and notes.
  - Supports multiple family members sharing the same contact phone number (`idx_patients_phone` non-unique index).
- **Search & Profile**:
  - Direct database queries with client-side optimistic merging.
- **Editing (`syncUpdatePatient`)**:
  - Updates patient profile in PostgreSQL with automatic trigger updating `updated_at` and incrementing `version` for concurrency control.

### B. Test Catalogue Module
- **Loading (`syncLoadCatalogue`)**:
  - Loads 120 tests from `public.test_catalogue` in PostgreSQL.
  - Dynamically merges price changes and active status into local runtime state.
- **Price Customization (`syncUpdateTestPrice`)**:
  - Updates `normal_price` and `discount_price` directly in `public.test_catalogue` under active owner authorization.
- **Adding / Editing Tests (`syncAddTest`, `syncUpdateTest`)**:
  - Inserts custom tests and parameter specifications into `public.test_catalogue` and `public.test_parameters`.

### C. Laboratory Orders & Results Module
- **Report & Order Creation (`syncCreateReport`)**:
  - Persists order and report draft to `public.reports` with patient association, calculated amounts, and status.
  - Inserts all observed test parameter results into `public.report_results` (`owner_id`, `report_id`, `test_name`, `parameter_name`, `result_value`).
- **Issuing Reports (`syncIssueReport`)**:
  - Updates report status to `Issued`.
  - Creates immutable snapshot in `public.report_versions`.
- **Amending Reports**:
  - Supports amendment revisions (`RPT-...-A1`) without overwriting historical records.

### D. Billing & Ledger Module
- **Recording Payments (`syncRecordPayment`)**:
  - Inserts payment receipts into `public.payment_transactions` (`id`, `owner_id`, `report_id`, `patient_id`, `amount`, `payment_method`, `notes`).
  - Enforces ledger immutability: table has zero UPDATE or DELETE RLS policies.
  - Automatically updates `paid_amount` and `payment_status` (`Paid` vs `Partial`) on the parent report.

### E. Settings Module
- **Lab Profile & Preferences (`syncSaveLabSettings`, `syncLoadLabSettings`)**:
  - Persists laboratory contact details, letterhead settings, authorized signatories, currency, and strict login preferences into `public.lab_settings` key-value table.

---

## 3. Realtime Cross-Device Synchronization
- PostgreSQL table changes trigger events via the `supabase_realtime` publication.
- `lib/supabase-client.ts` listens via WebSocket channel `bio_hitech_realtime_sync`.
- Incoming events are deduplicated via `processedEventCache` (keyed by `${table}:${recordId}` and timestamp).
- Confirmed database data is re-fetched upon external mutation, ensuring PostgreSQL remains the authoritative source of truth.

---

## 4. Error Handling & Demo Mode Separation
- Database errors throw explicit, descriptive user-facing error messages on form submission.
- Demo prototype data is strictly segregated: production mode requires database confirmation before confirming operation success.
