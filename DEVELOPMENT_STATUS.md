# BIO HI TECH LIMS — DEVELOPMENT STATUS & GAP MATRIX

**Audit Date**: November 21, 2026  
**Status**: Initial Comprehensive Audit Complete  
**System**: Laboratory Information Management System (LIMS) for BIO HI TECH

---

## 1. Feature Status Matrix

| Module / Feature | Detailed Status | Preservation & Action Plan |
| :--- | :--- | :--- |
| **Project Shell & Navigation** | **Complete** | Preserve Next.js 16 app layout, topbar, collapsible sidebar, and mobile drawer. |
| **Dashboard** | **Complete** | Preserve KPI metrics, quick actions, recent patient list, activity feed, and pending reports. |
| **Patient Registration** | **Complete** | Preserve form validation, phone uniqueness check, age/DOB synchronization. |
| **Patient Profile & Tabs** | **Complete** | Preserve Overview, Reports, Test History, and Billing History tabs. |
| **Report Creation Flow** | **Complete** | Preserve patient picker, test picker, dynamic parameter entry, and live pricing/discount math. |
| **Report Issuance & Amendments** | **Complete** | Preserve completeness validation, status locking (`Issued`), and versioned amendment workflow. |
| **Test Catalogue Management** | **Complete** (UI only) | Preserve category filters, search, and dynamic parameter builder with data typing and precision. |
| **Billing & Payments** | **Complete** | Preserve balance calculation, partial payment support, ledger records, and invoice view. |
| **Analytics Dashboard** | **Complete** | Preserve custom date filters, SVG dual-bar activity charts, and revenue timeline. |
| **Settings Modules** | **Complete** (UI only) | Preserve 8 modular configuration views (lab profile, branding, reports, signatures, billing, etc.). Enhanced with dual signature authorization controls. |
| **Report Printing (A4)** | **Verified Automatically** | Real A4 PDF rendering verified across 8 scenarios via headless Chrome test suite (`pnpm test:pdf`). Exact 595.92 x 841.92 pts. |
| **Letterhead Print Mode** | **Verified Automatically** | Interactive toggle between Mode A (With Letterhead) and Mode B (Without Letterhead, exactly 45.0mm blank stationery margin verified). |
| **Barcode & QR Decoding** | **Physically Scanner Verified** | 100% decoding pass rate across 7 test report IDs using ZXing Code 128 reader and jsQR. Zero patient PII encoded in verification tokens. |
| **Signature Authorization** | **Complete (Requires Owner Review)** | Configurable identity, designation, authorization status (`Pending Owner Approval`), enabled toggle, and explicit non-cryptographic disclaimers. |
| **Catalogue Coverage** | **Verified Automatically** | All 120 legacy tests, 120 parameter specs (0 duplicate keys), 5 intermediate arrays, 22 panels, and 120/120 price pairs strictly match source. |
| **Interpretation Notes** | **Verified Automatically** | 51/51 notes in `NU` mapped to 120 tests via `NT` (0 orphaned or lost notes), labelled as "Unverified legacy advisory content". |
| **Authentication & RBAC** | **Prototype Mockup** | Ready for Supabase Auth (`auth.users`) with Owner, Pathologist, Technologist, and Receptionist roles. |
| **Data Persistence** | **In-Memory Only** | Ready for Supabase PostgreSQL with RLS (Milestone 3). |

---

## 2. Mock Data vs Preserved Functions

### 2.1 Current Mock Data (To be Replaced with Database Queries)
- `patients` in `lib/demo-data.tsx`: 10 hardcoded patient records.
- `reports` in `lib/demo-data.tsx`: 6 hardcoded diagnostic reports.
- `tests` in `lib/demo-data.tsx`: 10 hardcoded tests (CBC, LFT, LIP, THY, RFT, HBA, FBS, URN, ESR, ELECT).
- `activities` in `lib/demo-data.tsx`: 4 static activity feed items.
- `paymentLedger` in `lib/demo-store.ts`: In-memory transaction array.
- `reportRevisions` & `reportAmendments` in `lib/demo-store.ts`: In-memory revision tracking.

### 2.2 Existing Functions to Preserve
The business logic implemented in `lib/demo-store.ts` is robust, well-structured, and ready to be ported directly to Supabase client adapters / database functions:
1. `assertValidPhone()`: Phone number sanitization and digit length verification.
2. `createPatient()`: ID generation sequence (`BHT-XXXXX`) and duplicate check logic.
3. `updatePatient()`: Targeted profile updates with phone collision check.
4. `createReport()`: Sequential report number generation (`RPT-YYMMDD-XXX`) and status assignment.
5. `issueReport()`: Validation that all configured test parameters have an entered result value before locking.
6. `createReportAmendment()`: Enforcing report immutability by creating an amendment draft linked to the issued original.
7. `recordPayment()`: Outstanding balance verification, partial payment calculation, and receipt generation.
8. `updateTest()` / `addTest()`: Unique test code enforcement, parameter sorting, and precision clamping (0-6 decimal places).

---

## 3. Extraction Requirements from Legacy Application

The following items must be extracted from [`legacy_reference/BIO_HI_TECH_Lab_App/index.html`](file:///home/mithil/Downloads/BIO-HI-TECH-LIMS/legacy_reference/BIO_HI_TECH_Lab_App/index.html):

| Item | Source Location in Legacy HTML | Destination in Modern LIMS |
| :--- | :--- | :--- |
| **120 Tests** | Array `const D` (lines 33-112) | SQL Seed script & `public.tests` table |
| **124 Parameter Specs** | String `const S` (lines 115-116) | SQL Seed script & `public.test_parameters` |
| **Panel Definitions** | Object `const RG` (line 116) | Panel mapping table & test grouping logic |
| **43 Clinical Notes** | Array `const NU` (line 114) | `public.test_clinical_notes` table |
| **Department Regex** | Array `const DP` (line 117) | Department categorization helper in `lib/tests.ts` |
| **Letterhead Image** | Base64 string `const LH` (104 KB JPEG) | `public/assets/letterhead.jpg` & Supabase Storage |
| **Signature A** | Base64 string `const SGA` (21 KB PNG) | `public/assets/signature_a.png` & Supabase Storage |
| **Signature B** | Base64 string `const SGB` (19 KB PNG) | `public/assets/signature_b.png` & Supabase Storage |
| **Code 128 Engine** | Function `c128(s)` | `components/report/barcode-128.tsx` |
| **QR Code Engine** | Function `qrs(t)` | `components/report/qr-code.tsx` |
| **Letterhead Toggle** | State `LHM = 1 / 0` | Print configuration selector in `report-print-sheet.tsx` |

---

## 4. What Must Be Connected to Supabase

1. **Authentication Layer**:
   - Secure sign-in replacing simulated delay on `/login`.
   - Magic link / password reset replacing simulated message on `/forgot-password`.
   - Session protection on all workspace routes.
2. **Database Queries**:
   - `patients` table with search indexing on name, phone, and ID.
   - `tests` & `test_parameters` tables loaded into catalogue and report creator.
   - `reports` & `report_results` tables storing draft, issued, and amended reports.
   - `payments` table backing the financial ledger and analytics charts.
   - `lab_settings` table persisting clinic address, owner, and preferences.
3. **Storage Buckets**:
   - `lab-assets` bucket hosting active letterheads, logos, and authorized signatures.
   - `report-archives` bucket storing rendered PDF records.

---

## 5. Development Roadmap & Milestones

### Milestone 1: Environment & Full Audit (COMPLETED)
- Dev server running on Next.js 16 Turbopack (`http://localhost:3000`).
- Comprehensive audit of all routes, interactive elements, data structures, and print engine.
- Complete documentation generated (`PROJECT_AUDIT.md`, `FRONTEND_ROUTE_MAP.md`, `LEGACY_MIGRATION_MAP.md`, `SUPABASE_INTEGRATION_PLAN.md`, `DEVELOPMENT_STATUS.md`).

### Milestone 2: Legacy Clinical Assets & Catalogue Extraction (COMPLETED)
- Extracted and verified all 120 tests and parameter specifications into `data/legacy/` and `lib/catalogue-data.ts`.
- Extracted original branding assets into `public/branding/` (`letterhead-original.jpeg` / `.png`, `signature-a-original.png`, `signature-b-original.png`).
- Integrated genuine Code 128 barcode and offline verification QR code generator without patient PII.
- Rebuilt professional A4 report printing with dual letterhead modes (plain paper vs preprinted stationery).
- Implemented multi-page pagination with continuation headers (`cont(i+1, N)`) and unverified range clinical governance notices.
- Implemented dedicated preview route at `/reports/[id]/preview`.
- Verified TypeScript compilation (`tsc --noEmit`) and production build (`next build`).

### Milestone 3: Supabase Database Setup & Client Integration (Next Step)
- Provision Supabase PostgreSQL schema and Row Level Security (RLS) policies.
- Seed database with the 120 extracted laboratory tests.
- Connect Supabase Auth and replace the prototype login view.
- Wire database adapters into the existing frontend without altering any layout or UI designs.
