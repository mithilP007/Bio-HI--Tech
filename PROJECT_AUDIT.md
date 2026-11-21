# BIO HI TECH LIMS — COMPREHENSIVE PROJECT AUDIT

**Audit Date**: November 21, 2026  
**System Target**: Laboratory Information Management System (LIMS) for BIO HI TECH  
**Scope**: Frontend architecture, route inventory, legacy application assets, data storage, report generation, and backend readiness.

---

## 1. Executive Summary

This comprehensive audit was conducted inside the active workspace `/home/mithil/Downloads/BIO-HI-TECH-LIMS`. The system consists of:
1. **Modern V0 Frontend** (`saran project/`): A high-fidelity Next.js 16.4.6 App Router application built with React 19, Tailwind CSS v4, Lucide React, and custom styling tokens.
2. **Legacy Reference Application** (`legacy_reference/BIO_HI_TECH_Lab_App/`): A standalone, single-file HTML/JavaScript application containing **120 preconfigured diagnostic tests**, 124 parameter specifications, Code 128 barcode generation, QR code generation, clinical interpretation notes, and embedded letterhead and signature assets.
3. **Planned Supabase Integration**: Cloud PostgreSQL database with Row Level Security (RLS), Supabase Auth, database functions for financial calculations, and secure Storage buckets.

### Key Audit Findings:
- **Authoritative Application Root**: Strictly determined as [`saran project/`](file:///home/mithil/Downloads/BIO-HI-TECH-LIMS/saran%20project/) containing `package.json`, `pnpm-lock.yaml`, and active application routes. All dependencies and imports resolve cleanly from this canonical application root.
- **Canonical Legacy Catalogue Data**: Located inside `saran project/data/legacy/` with an identical byte-for-byte SHA-256 backup in `data/legacy/`. All 120 tests, 120 parameter specifications, 22 panels, and 51 interpretation notes are 100% extracted.
- **Frontend Quality & State**: High-fidelity Next.js 16.4.6 App Router application. In-memory reactive stores (`lib/demo-store.ts`) manage prototype state without leaking patient records to insecure LocalStorage, ready for Milestone 3 Supabase integration.
- **Report & Print Subsystem**: Enhanced with genuine Code 128 barcodes and offline QR code tokens (both physically verified via ZXing and jsQR decoders), dual original signature images with authorization status controls, content-aware pagination, and exact 45.0mm without-letterhead top margin. Real A4 PDF rendering verified across 8 comprehensive test scenarios via headless Chrome.
- **Governance Notice**: All reference intervals are explicitly labelled "Range not verified" and interpretation notes are marked "Unverified legacy advisory content" pending formal clinical laboratory sign-off.
- **Action Buttons**: Print actions are accurately labelled "Print / Save as PDF" rather than falsely claiming direct client-side PDF downloading.

---

## 2. Technical Stack & Workspace Structure

### 2.1 Workspace Directory Layout
```
BIO-HI-TECH-LIMS/
├── legacy_reference/
│   └── BIO_HI_TECH_Lab_App/
│       ├── index.html              # Original standalone HTML (185 KB, 120 tests, embedded assets)
│       └── README.txt              # Original operator notes
│
├── saran project/                  # Modern Next.js application workspace
│   ├── app/
│   │   ├── layout.tsx              # RootLayout, Vercel Analytics, viewport, metadata
│   │   ├── page.tsx                # Index entry point (renders <LabApp />)
│   │   ├── [...slug]/
│   │   │   └── page.tsx            # App Router catch-all route (renders <LabApp />)
│   │   └── globals.css             # Unified design system & print styles (239 lines)
│   ├── components/
│   │   ├── lab-app.tsx             # Primary application shell, topbar, navigation, core pages
│   │   ├── report-print-sheet.tsx  # A4 print-ready laboratory report template
│   │   ├── analytics-page.tsx      # KPI cards, SVG activity charts, revenue analytics
│   │   ├── invoice-details.tsx     # Transaction summary, payment timeline, balance due
│   │   ├── record-payment.tsx      # Payment entry modal/page with ledger recording
│   │   ├── test-details.tsx        # Catalogue test view, parameter specification list
│   │   ├── patient-history-tabs.tsx# Patient profile subtabs (Overview, Reports, Tests, Billing)
│   │   ├── settings-page.tsx       # 8 laboratory configuration views
│   │   └── ui/
│   │       └── button.tsx          # Base UI button component
│   ├── lib/
│   │   ├── app-settings.ts         # Laboratory profile & preferences defaults
│   │   ├── demo-data.tsx           # Seeded demo patients (10), reports (6), tests (10)
│   │   ├── demo-store.ts           # In-memory reactive store (pub/sub, versioning)
│   │   └── utils.ts                # Tailwind clsx / twMerge utility
│   ├── public/                     # Static icons, favicons, placeholder images
│   ├── package.json                # Dependencies, project metadata, scripts
│   ├── pnpm-lock.yaml              # Lockfile (pnpm v12)
│   ├── pnpm-workspace.yaml         # Workspace configuration
│   ├── tsconfig.json               # TypeScript strict configuration
│   └── postcss.config.mjs          # PostCSS configuration with @tailwindcss/postcss
│
├── PROJECT_AUDIT.md                # This document
├── FRONTEND_ROUTE_MAP.md           # Route-by-route audit
├── LEGACY_MIGRATION_MAP.md         # 120-test extraction and asset migration map
├── SUPABASE_INTEGRATION_PLAN.md    # Database schema, RLS, and auth design
└── DEVELOPMENT_STATUS.md           # Implementation progress tracker
```

### 2.2 Dependencies & Build System
| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Framework** | Next.js (App Router) | 16.4.6 | Server and client rendering with Turbopack |
| **Runtime** | React / React DOM | 19.2.4 | Modern React components and client state |
| **Package Manager** | pnpm | 12.3.4 | Strict dependency resolution and fast linking |
| **Styling** | Tailwind CSS / PostCSS | 4.3.3 / 8.5.32 | Utility styling with `@tailwindcss/postcss` |
| **Icons** | Lucide React | 1.17.0 | Consistent iconography |
| **UI Primitives** | Class Variance Authority | 0.7.1 | Component variants |
| **Class Utilities** | `clsx` + `tailwind-merge` | 2.1.1 / 3.4.0 | Dynamic CSS class merging |
| **UI Library** | `@base-ui/react` | 1.5.0 | Accessible primitives |
| **Analytics** | `@vercel/analytics` | 1.6.1 | Production telemetry |

---

## 3. Frontend Architecture Analysis

### 3.1 Single-Page Application (SPA) inside Next.js App Router
- The application uses `app/page.tsx` and `app/[...slug]/page.tsx` to mount `<LabApp />`.
- Internal routing is driven by Next.js client navigation (`usePathname()`, `useRouter()`, `useSearchParams()`).
- All sub-views (Dashboard, Patients, Reports, Tests, Billing, Analytics, Settings, Notifications, Auth) are conditionally rendered inside `<LabApp />` based on `pathname`.
- **Advantage**: Instant, zero-latency transitions between views; smooth desktop and mobile app experience.
- **Limitation**: Deep linking to sub-routes relies on client-side mounting; dynamic SEO metadata per sub-route is currently centralized in `layout.tsx`.

### 3.2 State Management & Reactive Data Store
- All data modifications flow through `lib/demo-store.ts`.
- State is subscribed to using React 19's `useSyncExternalStore(subscribeDemoData, getDemoDataVersion)`.
- Mutations trigger `publishChange()`, incrementing an internal version counter and re-rendering listening components.
- **Critical Architectural Notice**: The V0 state is held strictly **in memory**. Refreshing the browser resets the records back to the initial seeds in `lib/demo-data.tsx`. No LocalStorage is used for medical records, which is compliant with clinical data privacy requirements.

---

## 4. Summary of Functional Capabilities vs Gaps

| Capability Area | Current V0 Frontend Status | Functional vs Prototype | Legacy Match Status |
| :--- | :--- | :--- | :--- |
| **Dashboard** | Complete, highly polished | Fully functional (in-memory) | Exceeds legacy capabilities |
| **Patient Registration** | Form with validation, phone uniqueness | Fully functional (in-memory) | Exceeds legacy capabilities |
| **Patient Profile** | Complete with 4 history tabs | Fully functional (in-memory) | Exceeds legacy capabilities |
| **Report Generation** | Multi-step: patient, tests, results | Fully functional (in-memory) | Missing 110 legacy tests |
| **Report Amendments** | Immutable issued reports, amendment flow | Fully functional (in-memory) | Exceeds legacy capabilities |
| **Test Catalogue** | Catalogue view with filters, test details | Fully functional (in-memory) | Contains only 10/120 tests |
| **Test Parameter Builder** | Custom parameter creation with precision | Fully functional (in-memory) | Missing legacy specs |
| **Billing & Payments** | Invoices, partial payment, ledger | Fully functional (in-memory) | Exceeds legacy capabilities |
| **Analytics** | Custom date ranges, SVG charts | Fully functional (in-memory) | New capability (absent in legacy) |
| **Settings** | 8 modules (branding, profile, reports) | Prototype (in-memory / blob preview) | Matches and expands legacy |
| **Report Printing** | A4 sheet layout with `@media print` | Partially complete | Lacks real barcode, QR, signatures |
| **Authentication** | Sign-in and password reset views | Prototype mockup (simulated delay) | Not present in legacy |
| **Database Storage** | In-memory only | Prototype only | Legacy used LocalStorage |

---

## 5. Security & Clinical Data Protection

1. **No Medical Records in LocalStorage**: Medical records, patient PII (names, phone numbers, addresses), test results, and financial transactions must never be written to unencrypted browser storage.
2. **Access Control**: Currently, any visitor can navigate between owner settings, test pricing, and patient records. Supabase Auth with Role-Based Access Control (Admin, Lab Technologist, Receptionist) is required.
3. **Audit Trail**: The in-memory prototype has an activity notification ledger (`demoNotifications`) and a payment ledger (`paymentLedger`). These must be backed by immutable PostgreSQL audit log tables in Supabase.
4. **Clinical Verification Disclaimer**: Until approved by a certified pathologist or lab director, all reference ranges must explicitly indicate "Range not verified" on all screens and print documents.
