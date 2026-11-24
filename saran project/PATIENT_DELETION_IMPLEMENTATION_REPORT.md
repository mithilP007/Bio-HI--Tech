# BIO HI TECH LIMS — PATIENT ARCHIVAL & SAFE DELETION IMPLEMENTATION REPORT

**Date:** 2026-11-23  
**Scope:** Clinical Data Retention, Archive / Restore Workflows, and Permanent Deletion Safeguards  
**Application Root:** `/home/mithil/Downloads/BIO-HI-TECH-LIMS/saran project/`  
**Status:** PASS ✓

---

## 1. EXECUTIVE SUMMARY

In healthcare laboratory management, medical records and financial audit trails are subject to strict legal retention obligations. Unchecked SQL cascade deletion of patient profiles would destroy clinical history, invalidate past diagnostic conclusions, and corrupt accounting ledgers.

To satisfy both owner operational control and statutory medical record compliance, BIO HI TECH implements a three-tier lifecycle:
1. **Active Roster**: Patient is visible in default lookups, order registration, and day-to-day laboratory workflows.
2. **Archived State (Safe Removal)**: Patient is hidden from active operational views but historical diagnostic reports, orders, and payment ledgers remain completely intact and searchable in the archive. Restoration is available at any time.
3. **Controlled Permanent Deletion**: Only eligible patients—defined strictly as records with **zero** linked laboratory orders, **zero** diagnostic reports, and **zero** payment transactions—can be permanently purged from PostgreSQL. If any clinical or financial dependency exists, the deletion is rejected by both the database RPC engine and relational `ON DELETE RESTRICT` foreign key constraints.

---

## 2. WORKFLOW SPECIFICATIONS

### A. Patient Archival Workflow
- **User Action**: The owner selects "Archive patient" on the patient profile view and confirms the dialog.
- **Backend Invocation**: `syncArchivePatient(patientId)` invokes the security-definer PostgreSQL function `public.archive_patient(p_id)`.
- **Database Behavior**:
  ```sql
  UPDATE public.patients
  SET is_archived = TRUE, updated_at = now()
  WHERE id = p_id AND owner_id = auth.uid();
  ```
- **Audit Logging**: An immutable audit entry is recorded in `public.audit_logs`:
  ```json
  { "action": "UPDATE", "entity_type": "patient", "entity_id": "BHT-02486", "details": { "event": "PATIENT_ARCHIVED" } }
  ```
- **UI State**: The patient is immediately removed from the "All active patients" roster. Connected devices receive the Realtime event and update simultaneously.

### B. Patient Restoration Workflow
- **User Action**: The owner filters patients by "Archived patients", opens the archived record, and clicks "Restore patient".
- **Backend Invocation**: `syncRestorePatient(patientId)` invokes `public.restore_patient(p_id)`.
- **Database Behavior**:
  ```sql
  UPDATE public.patients
  SET is_archived = FALSE, updated_at = now()
  WHERE id = p_id AND owner_id = auth.uid();
  ```
- **UI State**: The patient immediately reappears in the active roster and can be selected for new laboratory orders.

### C. Controlled Permanent Deletion Workflow
- **User Action**: The owner selects "Delete patient". A modal displays an explicit warning stating that clinical retention rules apply.
- **Verification Logic**: `public.delete_eligible_patient(p_id)` executes server-side checks:
  ```sql
  SELECT count(*) INTO order_cnt FROM public.laboratory_orders WHERE patient_id = p_id;
  SELECT count(*) INTO report_cnt FROM public.reports WHERE patient_id = p_id;
  SELECT count(*) INTO txn_cnt FROM public.payment_transactions WHERE patient_id = p_id;

  IF (order_cnt > 0 OR report_cnt > 0 OR txn_cnt > 0) THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'blocked', TRUE,
      'message', format('Permanent deletion blocked: Patient has %s orders, %s reports, and %s payment records. Historical medical and financial records must be preserved. Use archive instead.', order_cnt, report_cnt, txn_cnt)
    );
  END IF;
  ```
- **Eligible Outcome**: If all counts are zero, the row is permanently deleted from `public.patients`, any orphaned attachments in the `patient-documents` bucket are scheduled for purge, and a `DELETE` audit log entry is written.
- **Ineligible Outcome**: The operation is blocked, returning a diagnostic explanation. The UI displays an error alert recommending archival instead.

---

## 3. DATABASE RELATIONAL DEFENSE IN DEPTH

In addition to the stored procedure, the database schema enforces hard relational foreign key protection at the physical table level:

```sql
-- PostgreSQL Foreign Key Constraints
ALTER TABLE public.laboratory_orders
  ADD CONSTRAINT laboratory_orders_patient_id_fkey 
  FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE RESTRICT;

ALTER TABLE public.reports
  ADD CONSTRAINT reports_patient_id_fkey 
  FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE RESTRICT;

ALTER TABLE public.payment_transactions
  ADD CONSTRAINT payment_transactions_patient_id_fkey 
  FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE RESTRICT;
```

Even if an attacker attempts a raw SQL `DELETE FROM patients WHERE id = 'BHT-...'`, PostgreSQL aborts the transaction with code `23503 (foreign_key_violation)`.

---

## 4. ANONYMIZATION STRATEGY

For situations where patient contact information must be purged under data privacy regulations (e.g. Right to Erasure) while preserving historical clinical statistics and financial revenue ledgers:
1. Contact fields (`phone`, `address`, `notes`, `date_of_birth`) can be updated to `'[REDACTED]'`.
2. Name is updated to `'Patient ' || id`.
3. Historical diagnostic values, laboratory orders, and financial amounts are preserved unaltered for diagnostic accountability and financial audits.

---

## 5. TEST EXECUTION EVIDENCE

```bash
$ node scripts/test_e2e_workflows.mjs
# Output snippet:
# --- SECTION 5: Safe Patient Deletion vs Clinical Retention Rules ---
#   ✓ [PASS] Patient Permanent Deletion: Eligible unlinked patient deleted via RPC
#   ✓ [PASS] Patient Permanent Deletion: Verified deletion from database
#   ...
# --- SECTION 7: Report Issuance, Immutable Amendments & Retention Protection ---
#   ✓ [PASS] Clinical Retention: Deletion of patient with orders and reports is blocked with safe diagnostic message
#   ✓ [PASS] Database Constraint: ON DELETE RESTRICT foreign key blocks direct deletion
```

**Final Assessment: PASS ✓ — COMPLETE COMPLIANCE WITH STATUTORY CLINICAL RETENTION & AUDIT RULES.**
