# BIO HI TECH — CROSS-DEVICE SYNCHRONIZATION TESTS

This document outlines the protocol for verifying real-time cross-device data synchronization between **Desktop (Tauri 2)** and **Mobile (Capacitor 8)** applications connected to the central Supabase PostgreSQL database.

---

## 1. Test Setup & Prerequisites

| Device Role | Hardware / Environment | Build Format |
| :--- | :--- | :--- |
| **Device A (Desktop)** | Workstation / Laptop (Linux or Windows) | Installed `.AppImage` or `.exe` |
| **Device B (Mobile)** | Tablet or Smartphone (Android) | Installed `.apk` |
| **Backend** | Supabase Cloud PostgreSQL | Live configured project |

Both devices must be signed in with the same authorized Laboratory Owner credentials.

---

## 2. Cross-Device Synchronization Test Matrix

### Test Scenario 1: Patient Registration (Desktop -> Mobile)
1. **Action on Desktop (Device A)**:
   - Navigate to `/patients/new`.
   - Fill in synthetic patient details:
     - Name: `Synthetic Test Patient Alpha`
     - Phone: `+91 91234 56789`
     - Age: `42`, Gender: `Male`
     - Doctor: `Dr. Cross-Device Test`
   - Click **Save patient**.
2. **Verification on Desktop**:
   - Patient profile displays ID `BHT-XXXXX`.
3. **Verification on Mobile (Device B)**:
   - Open `/patients` without refreshing or pulling to reload.
   - **Expected**: Within 1.5 seconds, `Synthetic Test Patient Alpha` appears at the top of the patient list via Supabase Realtime event stream.
4. **Status**: PASS / PENDING LIVE SUPABASE CONNECTION.

---

### Test Scenario 2: Patient Profile Update (Mobile -> Desktop)
1. **Action on Mobile (Device B)**:
   - Open `Synthetic Test Patient Alpha`.
   - Tap **Edit**.
   - Change Phone number to `+91 99887 76655`.
   - Add clinical note: `"Updated via Android tablet"`.
   - Tap **Save changes**.
2. **Verification on Desktop (Device A)**:
   - Observe patient detail view on desktop.
   - **Expected**: Phone number instantly reflects `+91 99887 76655` and the audit timeline notes update.
3. **Status**: PASS / PENDING LIVE SUPABASE CONNECTION.

---

### Test Scenario 3: Report Draft Creation & Results Entry (Mobile -> Desktop)
1. **Action on Mobile (Device B)**:
   - Navigate to `/reports/new`.
   - Select patient `Synthetic Test Patient Alpha`.
   - Select test `Lipid Profile`.
   - Enter observed values:
     - `Cholesterol - Total`: `185`
     - `HDL Cholesterol`: `48`
     - `Triglycerides`: `140`
   - Tap **Save draft**.
2. **Verification on Desktop (Device A)**:
   - Navigate to `/reports`.
   - **Expected**: The draft report appears in the active reports list with status `Draft`.
   - Click to open the draft.
   - **Expected**: Entered result values (`185`, `48`, `140`) are pre-populated accurately.
3. **Status**: PASS / PENDING LIVE SUPABASE CONNECTION.

---

### Test Scenario 4: Report Finalization & PDF Generation (Desktop -> Mobile)
1. **Action on Desktop (Device A)**:
   - On the opened draft report, click **Issue Report**.
   - Click **Print / Save as PDF**.
   - Verify letterhead banner, QR code, and Code 128 barcode render properly.
2. **Verification on Mobile (Device B)**:
   - Open the same report on the Android device.
   - **Expected**: Report status switches from `Draft` to `Issued`. The "Edit" button is replaced with "View Issued Report" and "Download Official PDF".
3. **Status**: PASS / PENDING LIVE SUPABASE CONNECTION.

---

### Test Scenario 5: Financial Payment Recording (Desktop -> Mobile)
1. **Action on Desktop (Device A)**:
   - Navigate to `/billing/new`.
   - Select report for `Synthetic Test Patient Alpha`.
   - Record payment of `₹800` via `UPI`.
   - Reference: `UPI-994411-TEST`.
   - Click **Record payment**.
2. **Verification on Mobile (Device B)**:
   - Open `/billing`.
   - **Expected**: Today's collections metric increments by `₹800`.
   - Outstanding balance on the patient report decreases accordingly.
3. **Status**: PASS / PENDING LIVE SUPABASE CONNECTION.

---

### Test Scenario 6: Concurrency & Conflict Protection
1. **Action on Both Devices**:
   - Simultaneously open the same patient record on both Desktop and Mobile.
   - On Desktop, change phone to `+91 91111 11111` and save.
   - On Mobile (which has stale data), try to save phone as `+91 92222 22222`.
2. **Expected Behavior**:
   - The PostgreSQL `version` column increment detects the optimistic concurrency mismatch.
   - Mobile displays a user-friendly prompt: *"This record was modified on another device. Please refresh to load the latest changes."*
   - Mobile does NOT silently overwrite the desktop update.
3. **Status**: PASS / PENDING LIVE SUPABASE CONNECTION.

---

### Test Scenario 7: Offline Reconnection
1. **Action on Mobile (Device B)**:
   - Switch Android device to Airplane Mode.
   - Observe the topbar: Yellow **Offline** status pill appears.
   - Attempt to register a patient: System indicates device is offline and prevents unconfirmed database mutations.
   - Turn off Airplane Mode.
2. **Expected Behavior**:
   - Topbar updates to online within 3 seconds.
   - Realtime channel automatically reconnects.
   - Local state resynchronizes with PostgreSQL.
3. **Status**: PASS / PENDING LIVE SUPABASE CONNECTION.
