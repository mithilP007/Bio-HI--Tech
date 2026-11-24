# BIO HI TECH LIMS — Laboratory Operations Manual

## 1. Introduction
BIO HI TECH Laboratory Information Management System (LIMS) is an enterprise-grade clinical diagnostic workspace designed for fast, accurate laboratory order management, patient registration, test catalogue customization, multi-parameter result entry, professional A4 report printing, and payment accounting.

---

## 2. Navigation & Workspace Layout
- **Dashboard**: High-level morning summary, today's collections, pending reports, recent patient registrations, and quick action shortcuts.
- **Patients**: Patient directory, historical search (by name, phone, or BHT ID), patient profile view, and editing.
- **Saved Reports**: Report management table with status filtering (Draft vs. Issued), date range filtering, and payment status indicators.
- **Test Catalogue**: 120 laboratory tests across 5 clinical categories (Biochemistry, Clinical Pathology, Haematology, Microbiology, Serology/Immunology), with parameters and active pricing.
- **Billing**: Financial ledger, daily collections, outstanding balance summaries, and payment recording.
- **Analytics**: Registration volume trends, weekly collections, and frequently ordered test metrics.
- **Settings**: Laboratory branding, letterhead mode configuration, signatory management, default currency, and security controls.

---

## 3. Patient Management

### Registering a New Patient
1. Click **Register Patient** (`/patients/new`) from the sidebar or dashboard.
2. Enter the patient's full name, date of birth or age, gender, and contact phone number.
   *(Note: Multiple family members sharing the same contact phone number is supported by design).*
3. Specify the referring doctor (defaults to "Self / Direct" if omitted).
4. Enter optional address and internal clinical notes.
5. Click **Save Patient**. The unique sequential Patient ID (`BHT-XXXXX`) is assigned and saved directly to the database.

### Editing a Patient
1. Open the patient's profile from the patient list.
2. Click **Edit Profile**.
3. Update contact or referral details and click **Save Changes**.

---

## 4. Test Orders & Diagnostic Reports

### Creating a Report
1. Click **Create Report** (`/reports/new`).
2. Search and select an existing patient (or click **Add Patient** to register on the fly without losing your current form state).
3. Search and select one or more tests from the catalogue.
4. Review the auto-calculated subtotal and apply any approved promotional discount (₹).
5. (Optional) Record an initial cash/UPI deposit.
6. Enter observed values for all parameters in the Results section.
7. Click **Save Draft** (`RPT-YYMMDD-XXX`).

### Previewing & Printing Reports
1. Open the report from Saved Reports.
2. Click **Preview A4** (`/reports/[id]/preview`) to view the report formatted for standard A4 paper.
3. Use the toggle buttons:
   - **With Letterhead**: Includes the full BIO HI TECH corporate header with logo, address, contact details, and accreditation badges.
   - **Without Letterhead (Pre-printed pad)**: Preserves an exact 45mm blank top margin designed to print cleanly onto existing physical letterhead stationery.
4. Click **Print / Save PDF** to trigger the native print dialog or save an offline PDF copy.

### Issuing Reports & Handling Amendments
- **Issuing**: Once all parameter values are entered, click **Issue Report**. This creates an immutable report snapshot in `report_versions`.
- **Amending**: If corrections or addendum tests are needed on an already issued report, click **Create Amendment**. This creates a new revision draft (`RPT-...-A1`) linked to the original without overwriting historical records.

---

## 5. Billing & Ledger Management

### Recording Payments
1. Navigate to **Billing** and click **Record Payment** (`/billing/new`).
2. Select an outstanding report or bill. The current balance due is automatically displayed.
3. Enter the amount being paid (capped at the current outstanding balance).
4. Select the payment method (UPI, Cash, Card, Bank Transfer).
5. Click **Save Payment**. The transaction is recorded to `payment_transactions`, and the report balance updates immediately across all devices.

---

## 6. Realtime Cross-Device Synchronization
- When changes (such as a new patient registration or payment recording) are made on Android, they synchronize automatically to Desktop within seconds via Supabase Realtime WebSocket subscriptions.
- If working offline, an "Offline" status indicator displays in the top navigation bar. When connectivity is restored, cloud synchronization reconnects automatically.
