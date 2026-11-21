# BIO HI TECH LIMS — FRONTEND ROUTE & INTERACTION MAP

**Audit Date**: November 21, 2026  
**Application Architecture**: Next.js 16.4.6 App Router Single-Page Application (SPA) driven by `app/[...slug]/page.tsx` and `components/lab-app.tsx`.

---

## 1. Route Inventory & Status Overview

| Route | View Component | Status | Persistence / Functional Mode |
| :--- | :--- | :--- | :--- |
| `/` or `/dashboard` | `Dashboard` (`lab-app.tsx`) | Complete | In-memory reactive store |
| `/login` | `AuthPage` (`lab-app.tsx`) | Incomplete / Mockup | Simulated 450ms delay, no auth check |
| `/forgot-password` | `AuthPage` (`lab-app.tsx`) | Incomplete / Mockup | Simulated delay, no email service |
| `/patients` | `Patients` (`lab-app.tsx`) | Complete | In-memory filtering & pagination |
| `/patients/new` | `FormPage` (`lab-app.tsx`) | Complete | In-memory creation with validation |
| `/patients/[id]` | `Details` (`lab-app.tsx`) | Complete | In-memory lookup, 4 history tabs |
| `/patients/[id]/edit` | `FormPage` (`lab-app.tsx`) | Complete | In-memory update with validation |
| `/reports` | `Reports` (`lab-app.tsx`) | Complete | In-memory filtering (status, date) |
| `/reports/new` | `FormPage` (`lab-app.tsx`) | Complete | In-memory multi-step report generator |
| `/reports/[id]` | `Details` (`lab-app.tsx`) | Complete | Results summary, issue & amendment flows |
| `/reports/[id]/edit` | `FormPage` (`lab-app.tsx`) | Complete | Draft editing only (issued reports locked) |
| `/reports/[id]` (Preview) | `ReportPrintSheet` | Partially Complete | A4 sheet layout; mock barcode & signatures |
| `/tests` | `Catalogue` (`lab-app.tsx`) | Complete | Category sidebar & price/status filters |
| `/tests/new` | `FormPage` (`lab-app.tsx`) | Complete | In-memory parameter builder |
| `/tests/[code]` | `TestDetails` (`test-details.tsx`)| Complete | Test parameters view |
| `/tests/[code]/edit` | `FormPage` (`lab-app.tsx`) | Complete | In-memory test & parameter update |
| `/billing` | `Billing` (`lab-app.tsx`) | Complete | Financial summaries & invoice list |
| `/billing/new` | `RecordPayment` (`record-payment.tsx`) | Complete | Ledger recording & balance calculation |
| `/billing/[id]` | `InvoiceDetails` (`invoice-details.tsx`)| Complete | Transaction history & invoice summary |
| `/analytics` | `AnalyticsPage` (`analytics-page.tsx`) | Complete | In-memory calculations & SVG bar charts |
| `/settings` | `SettingsPage` (`settings-page.tsx`)| Complete | 8 configuration navigation cards |
| `/settings/security` | `SettingsPage` (`settings-page.tsx`)| Incomplete / Notice | Information card stating auth not connected |
| `/settings/[slug]` | `SettingsPage` (`settings-page.tsx`)| Complete | In-memory settings editor with blob previews |
| `/notifications` | `Notifications` (`lab-app.tsx`) | Complete | Activity ledger & mark-read triggers |

---

## 2. Detailed Route Audit

### 2.1 Authentication Routes (`/login`, `/forgot-password`)
- **Rendered by**: `AuthPage` component in `components/lab-app.tsx`.
- **Inputs**: Email address, Password, "Remember this device" checkbox. Show/hide password eye toggle.
- **Interactions**:
  - Submitting triggers a 450ms fake timeout and sets feedback message:
    - Login: *"Demo sign-in is not connected. Continue to the workspace preview below."*
    - Forgot password: *"Password recovery is not connected in this prototype."*
  - Direct bypass link: *"Open demo workspace"* links directly to `/dashboard`.
- **Evaluation**: Visual prototype only. No credentials are encrypted, verified, or stored. No JWT tokens or cookies are issued.

### 2.2 Dashboard (`/`, `/dashboard`)
- **Rendered by**: `Dashboard` in `components/lab-app.tsx`.
- **Key Metrics (KPIs)**:
  - Total patients (count)
  - Today's registrations (filtered by date)
  - Reports generated today (count)
  - Reports in progress (Draft count)
  - Today's collections (INR sum from `paymentLedger`)
  - Outstanding payments (INR balance across open reports)
- **Quick Actions**: Direct links to Register patient, Create report, Record payment, Add new test.
- **Data Tables**:
  - Recent patients (5 latest) with direct links to `/patients/[id]`.
  - Recent activity feed (derived from `demoNotifications`).
  - Reports in progress (Draft status, amount, status pill).
- **Evaluation**: Fully functional in-memory dashboard that recalculates instantly when payments, reports, or patients are added.

### 2.3 Patients Module
#### `/patients` (List & Search)
- **Controls**:
  - Real-time text search across Name, Patient ID, and Phone.
  - Date filter dropdown (`All patients`, `Registered today`, `Registered this month`, `Registered this week`).
  - Pagination (7 records per page) with Previous and Next buttons.
  - "Register patient" primary button.
- **Table Data**: Patient avatar, Name, ID, Age/Gender, Phone, Referring doctor, Registered date, View and Edit action links.

#### `/patients/new` & `/patients/[id]/edit` (Forms)
- **Fields**:
  - Section 1: Full name (*required*), Date of birth (calculates age automatically), Age in years, Gender dropdown, Phone number (*required*), Address.
  - Section 2: Referring doctor, Registration date, Internal notes textarea.
- **Validation**:
  - Ensures name and phone are not empty.
  - Validates phone contains 7 to 15 digits.
  - Prevents duplicate phone numbers across patients.
  - Ensures age is between 0 and 130 and date of birth is not in the future.
- **Interactions**:
  - Add: Assigns new ID (`BHT-XXXXX`), unshifts to `patients`, creates a notification, redirects to profile.
  - Edit: Prepopulates existing data, updates record, redirects to profile.

#### `/patients/[id]` (Patient Profile & History)
- **Overview Card**: Patient ID, Age/Gender, Phone, Doctor, Registered date, Total reports count.
- **Actions**: "Edit profile" button, "Create report" button (pre-selects patient).
- **Timeline**: Chronological events (Registration date, associated reports).
- **Patient History Tabs** (`PatientHistoryTabs` component):
  - `Overview`: DOB, Address, Internal notes.
  - `Reports`: List of reports for this patient with status pills and direct links.
  - `Test History`: Aggregated test names and dates across patient reports.
  - `Billing History`: Invoices, amounts, payment status, and direct links to `/billing/[id]`.

### 2.4 Reports Module
#### `/reports` (Saved Reports)
- **Filters**:
  - Search by Report number, Patient name, or Patient ID.
  - Status filter (`All statuses`, `Issued`, `Draft`).
  - Date filter (`All dates`, `Today`, `Last 7 days`, `This month`).
- **Table Columns**: Report no., Patient, Patient ID, Report date, Test count, Amount, Payment status pill, Report status pill, View arrow link.

#### `/reports/new` (Report Creator)
- **Section 1 (Patient Selection)**:
  - Search existing patients by name/ID/phone with autocomplete dropdown.
  - Quick action: "Add patient" without leaving draft.
  - Displays selected patient badge with remove button.
- **Section 2 (Test Selection)**:
  - Searchable test catalogue picker.
  - Shows test category, parameter count, and offer price.
  - Multi-select toggle button with checkmark feedback.
- **Section 3 (Observed Results Entry)**:
  - Automatically loads configured parameters for each selected test.
  - Type-aware inputs: Numeric (with step precision), Qualitative (dropdown: Positive, Negative, Detected, Not detected, Reactive, Non-reactive, Trace), or Text.
  - Shows units and displays "Range not configured".
- **Aside (Financial Summary)**:
  - Subtotal calculation based on selected tests' offer prices.
  - Discount input (validates 0 <= discount <= subtotal).
  - Final amount calculation.
  - Initial payment input and Payment method dropdown (Cash, UPI, Card, Bank transfer).
  - Balance due calculation.
- **Submit Action**: Validates selections, assigns `RPT-YYMMDD-XXX` sequence, creates draft, redirects to `/reports/[id]`.

#### `/reports/[id]` (Report Details & Actions)
- **Status Workflows**:
  - **Draft**: Can be edited via `/reports/[id]/edit`. Has "Issue report" action.
  - **Issue Action**: Validates that every configured test parameter has an entered result value. Once issued, marks status as `Issued`.
  - **Issued (Immutability)**: Cannot be directly edited. Unlocks "Create amendment" action, creating a versioned amendment draft linked to the original report.
- **A4 Preview Toggle**: Toggles inline view of `ReportPrintSheet`.
- **Print / PDF Action**: Calls browser `window.print()` using `@media print` styles.

### 2.5 Test Catalogue Module
#### `/tests` (Catalogue)
- **Layout**: Left-hand Category sidebar with live record counts (`All tests`, `Haematology`, `Biochemistry`, `Liver function`, `Renal function`, `Thyroid`, `Diabetes`, `Urine`).
- **Filters**: Text search, Catalogue status (`Any status`, `Active`, `Inactive`), Price range (`Under ₹500`, `₹500–₹1,000`, `Over ₹1,000`).
- **Table**: Test name, Code, Category, Parameter count, Normal price, Offer price, Status pill, Link to details.

#### `/tests/new` & `/tests/[code]/edit` (Test Configuration & Parameter Builder)
- **Section 1**: Test name (*required*), Code (*required, uniqueness enforced*), Category, Normal price, Offer price, Status (Active/Inactive).
- **Section 2 (Parameter Builder)**:
  - Add parameter row button.
  - Parameter Name, Unit, Data Type (`Unconfigured`, `Numeric`, `Qualitative`, `Text`), Decimal precision (0-6).
  - Move Up (↑), Move Down (↓), Remove (X) per row.
- **Notice**: Includes an explicit disclaimer: *"Reference ranges are not configured here and must be professionally reviewed before clinical use."*

#### `/tests/[code]` (Test View)
- Displays test definition cards, normal and offer prices, active status.
- Lists all configured parameters with data types, units, and decimal precision.

### 2.6 Billing & Finance Module
#### `/billing` (Financial Dashboard)
- Aggregates collections, outstanding balances, and total billing.
- Searchable invoice table with payment status pills (`Paid`, `Partial · ₹X`, `Pending`).

#### `/billing/new` (Record Payment)
- Select outstanding report from dropdown (shows current balance).
- Payment amount input (capped at outstanding balance).
- Payment method dropdown (`UPI`, `Cash`, `Card`, `Bank transfer`).
- Payment date input and optional payment notes.
- Summary card showing Bill total, Previously paid, and Outstanding balance.
- On save: Updates report payment status, unshifts transaction to `paymentLedger`, creates notification, redirects to `/billing`.

#### `/billing/[id]` (Invoice Details)
- Summary: Patient, ID, Report number, Invoice date, Total amount, Paid amount, Balance due.
- Payment history timeline listing individual transactions with method, date, and receipt notes.
- "Record payment" button if balance remains.
- "Print / save PDF" action.

### 2.7 Analytics Module (`/analytics`)
- **Date Range Selector**: `Today`, `Last 7 days`, `Last 30 days`, `This month`, `Custom` (with start and end date inputs).
- **KPI Summary Cards**: Patient registrations, Reports generated (with issued count), Collections (INR), Outstanding amount.
- **SVG Charts**:
  - Daily Activity dual-bar chart comparing patient registrations against report generation.
  - Collections revenue bar chart with daily hover tooltips.
- **Popular Tests Table**: Ranked by frequency in the selected date window.

### 2.8 Settings Module (`/settings`)
Eight modular configuration sub-pages:
1. `/settings/lab-profile`: Laboratory name, owner name, owner designation, phone, email, registration number, address.
2. `/settings/branding`: Logo file upload, letterhead file upload, primary brand colour picker, letterhead title label.
3. `/settings/reports`: Default report format (A4 portrait, A4 landscape, Letter), report footer text, report number prefix.
4. `/settings/signatures`: Signatory name, signatory designation, signature image upload.
5. `/settings/billing`: Currency (INR), default discount percentage, invoice footer text.
6. `/settings/test-configuration`: Catalogue defaults, clinical review advisory notice.
7. `/settings/security`: Non-functional prototype explanation explaining that authentication is not connected.
8. `/settings/preferences`: Date format (DD MMM YYYY, DD/MM/YYYY, YYYY-MM-DD), timezone (Asia/Kolkata, UTC), notifications toggle.

---

## 3. Missing, Incomplete, and Broken Features

### Missing Features:
1. **Record Deletion**:
   - No UI or store function to delete patients.
   - No UI or store function to delete reports (legacy had `dlr()`).
   - No UI or store function to delete catalogue tests (legacy had `dl(i)`).
2. **Batch / Multi-Report Actions**:
   - No batch printing or multi-report export.
3. **Stand-alone Print Preview URL**:
   - A4 preview is an inline toggle inside `/reports/[id]`, not an independent `/reports/[id]/preview` route.
4. **Letterhead Mode Toggle**:
   - No option to print without letterhead (legacy had `LHM = 1 / 0` for printing on preprinted clinic stationery).

### Incomplete Features:
1. **Authentication**: `/login` and `/forgot-password` are visual mockups without backend tokens or access validation.
2. **File Uploads**: Logo, letterhead, and signature inputs generate ephemeral `blob:` URLs in browser memory that vanish on refresh.
3. **Settings Persistence**: Settings edits update in-memory objects `labProfile` and `appPreferences` but do not persist across reloads.
4. **Reports Pagination**: Reports list pagination buttons are disabled with hardcoded text (`Showing 6 reports`).

### Broken / Non-Compliant Elements:
1. **Barcode**: The print sheet uses repeated CSS gradient lines labeled `DEMO · NOT SCANNABLE`.
2. **QR Code**: No QR code graphic is rendered on the print sheet.
3. **Signatures**: The print sheet displays a text placeholder `Signature asset not configured` instead of actual signature assets.
4. **Catalogue Completeness**: Only 10 of 120 laboratory tests are present.
