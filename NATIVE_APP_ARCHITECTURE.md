# BIO HI TECH — NATIVE CROSS-PLATFORM APPLICATION ARCHITECTURE
## Single-Codebase Laboratory Information Management System (LIMS) for Desktop & Mobile

**Document Version**: 1.0.0  
**Architectural Scope**: Android (Capacitor 8) & Desktop (Tauri 2) native software packaging with a unified Supabase cloud backend.  
**Authoritative Frontend Root**: [`saran project/`](file:///home/mithil/Downloads/BIO-HI-TECH-LIMS/saran%20project/)  
**Primary Target Audience**: Laboratory Owner (Single-tenant, owner-only authorization).  
**Distribution Mode**: Private downloadable native software (NOT a public hosted website).

---

## 1. Architectural Philosophy & Core Constraints

```
                           +------------------------------------------+
                           |       CENTRAL CLOUD BACKEND              |
                           |       Supabase Production Project        |
                           |  - PostgreSQL with Row Level Security    |
                           |  - Supabase Auth (Owner credentials)     |
                           |  - Supabase Realtime (WebSocket sync)    |
                           |  - Supabase Storage (Private report PDFs)|
                           +--------------------+---------------------+
                                                ^
                                HTTPS / WSS     |     HTTPS / WSS
                                (Anon key only) |     (Anon key only)
                                                v
               +--------------------------------+--------------------------------+
               |                                                                 |
               v                                                                 v
+-----------------------------+                                   +-----------------------------+
|    ANDROID APPLICATION      |                                   |     DESKTOP APPLICATION     |
|       (Capacitor 8)         |                                   |          (Tauri 2)          |
|                             |                                   |                             |
| +-------------------------+ |                                   | +-------------------------+ |
| | Android Native Shell    | |                                   | | Native Rust Shell       | |
| | (APK / AAB - API 26-35) | |                                   | | (Linux .deb / AppImage, | |
| | - Network status bridge | |                                   | |  Windows .exe / .msi)   | |
| | - Hardware back button  | |                                   | | - Window controls       | |
| | - Android PrintAdapter  | |                                   | | - System file dialogs   | |
| | - Secure Biometric/Key  | |                                   | | - Auto-updater bridge   | |
| +------------+------------+ |                                   | +------------+------------+ |
|              |              |                                   |              |              |
|              v              |                                   |              v              |
| +-------------------------+ |                                   | +-------------------------+ |
| | Local Android WebView   | |                                   | | Native WebKit/WebView2  | |
| | (Served from local assets)|                                   | | (Served from local dist)| |
| +------------+------------+ |                                   | +------------+------------+ |
|              |              |                                   |              |              |
+--------------|--------------+                                   +--------------|--------------+
               |                                                                 |
               +--------------------------------+--------------------------------+
                                                |
                                                v
                           +------------------------------------------+
                           |      SHARED LOCAL FRONTEND BUNDLE        |
                           |       Next.js 16 Static SPA Export       |
                           |  - React 19 / TypeScript / Tailwind CSS  |
                           |  - Unified LabApp Component Router       |
                           |  - 120 Extracted Legacy Diagnostic Tests |
                           |  - Verified A4 PDF Printing Subsystem    |
                           |  - Physical Barcode & QR Decoders        |
                           |  - Supabase Realtime Sync Client         |
                           +------------------------------------------+
```

### Core Architecture Rules:
1. **No External Hosting Requirement**: The application runs from locally bundled assets (`file:///android_asset/public` on Android, local binary assets via Tauri custom protocol on Desktop). Launching the application does NOT depend on visiting a remote website URL.
2. **One Shared Frontend Codebase**: A single responsive UI codebase in `saran project/` powers Android tablets, phones, Linux workstations, and Windows PCs.
3. **Single Central Source of Truth**: Desktop and mobile clients connect directly over secure HTTPS/WSS to the same Supabase PostgreSQL database. No split databases or peer-to-peer ad-hoc synchronization.
4. **Zero Client Secrets**: Only the Supabase `anon` / `publishable` public key is bundled in client binaries. Service-role keys, database passwords, and administrative secrets are NEVER embedded.
5. **Owner-Only Security Perimeter**: Access is strictly gated to the authenticated laboratory owner via Supabase Auth and PostgreSQL Row Level Security (RLS). No public accounts or patient self-registration.
6. **No Unencrypted LocalStorage for Medical Records**: Clinical records, patient PII, test results, and invoices are never stored in unencrypted browser `localStorage`. Active state resides in secure memory stores, backed by Supabase cloud storage.

---

## 2. Platform Target Specifications

### 2.1 Android Target (Capacitor 8)
- **Framework**: Capacitor 8 (`@capacitor/core`, `@capacitor/cli`, `@capacitor/android`).
- **Application ID**: `com.biohitech.lims`
- **Application Name**: `BIO HI TECH`
- **Minimum Android SDK**: API 26 (Android 8.0 Oreo)
- **Target Android SDK**: API 35 (Android 15)
- **Local Asset Serving**: Bundled local directory (`dist` / `out`) loaded via `WebView` asset loader without internet dependence.
- **Native Capabilities & Plugins**:
  - `@capacitor/network`: Real-time connectivity detection and offline state banner.
  - `@capacitor/app`: Android hardware back-button interceptor and application lifecycle management.
  - `@capacitor/status-bar`: Coordinated brand theme styling (`#08796e` / `#0f9d8c`).
  - `@capacitor/splash-screen`: Professional laboratory launch animation and splash screen.
  - Native print bridge: Interfacing with Android `PrintManager` for laboratory report printing.

### 2.2 Desktop Target (Tauri 2)
- **Framework**: Tauri 2 (Rust 2021 edition core).
- **Application Identifier**: `com.biohitech.lims`
- **Application Title**: `BIO HI TECH — Laboratory Management System`
- **Window Architecture**:
  - Minimum dimensions: `960 x 640` px (compact desktop / tablet view).
  - Default dimensions: `1280 x 840` px (standard laboratory workstation).
  - Resizable: Yes, with responsive layout recalculation.
- **Distribution Packages**:
  - **Linux**: `.AppImage` (portable universal binary) and `.deb` (Debian/Ubuntu/Mint installer).
  - **Windows**: Modern setup `.exe` (NSIS installer) and `.msi` (Windows Installer package).
- **Local Asset Serving**: Custom secure local protocol (`tauri://localhost` or `http://tauri.localhost`) loading the local frontend export without web server overhead.
- **Tauri Permissions / Capabilities**: Secure fine-grained capabilities in `src-tauri/capabilities/default.json` restricting network calls strictly to the laboratory's Supabase domain.

---

## 3. Frontend Packaging & Next.js Static Export Architecture

### 3.1 Next.js 16 Static Export Compatibility
The existing application uses Next.js 16.4.6 with React 19. All primary application views (`components/lab-app.tsx`, `components/report-print-sheet.tsx`, `components/settings-page.tsx`, etc.) are React client components (`'use client'`).

To achieve local bundling without a Node.js server runtime:
1. **Next.js Configuration**:
   ```javascript
   // next.config.mjs
   const nextConfig = {
     output: 'export',
     trailingSlash: true,
     images: { unoptimized: true },
     typescript: { ignoreBuildErrors: false },
   }
   ```
2. **Catch-All Route Resolution**:
   In Next.js App Router, dynamic catch-all route `app/[...slug]/page.tsx` requires `generateStaticParams()` when `output: 'export'` is active. By exporting the known application sitemap (e.g., `dashboard`, `patients`, `reports`, `catalogue`, `billing`, `analytics`, `settings`, etc.), Next.js pre-renders all primary entry points.
3. **Client-Side SPA Routing**:
   At runtime, `components/lab-app.tsx` intercepts path changes via Next.js navigation hooks (`usePathname`, `useRouter`) and updates the active view dynamically. For deep links with dynamic IDs (`/reports/RPT-261121-032`), the client-side router matches the route in memory without server round-trips.

---

## 4. Supabase Cloud Database & Synchronization Architecture

### 4.1 Single Central Source of Truth
```
+-------------------------------------------------------------+
|                     SUPABASE POSTGRESQL                     |
|                                                             |
| +-------------------+  1:N  +-----------------------------+ |
| | patients          +------>| reports                     | |
| | - id (BHT-XXXXX)  |       | - id (RPT-YYMMDD-XXX)       | |
| | - name, age, phone|       | - patient_id, status        | |
| | - doctor, gender  |       | - total_amount, balance_due | |
| | - updated_at      |       | - version, updated_at       | |
| +-------------------+       +--------------+--------------+ |
|                                            | 1:N            |
|                                            v                |
|                             +-----------------------------+ |
|                             | report_results              | |
|                             | - report_id, test_name      | |
|                             | - parameter, result_value   | |
|                             +-----------------------------+ |
|                                                             |
| +-------------------+       +-----------------------------+ |
| | tests_catalogue   |       | payments_ledger             | |
| | - 120 tests       |       | - receipt_number, report_id | |
| | - normal/offer prc|       | - amount_paid, payment_mode | |
| +-------------------+       +-----------------------------+ |
+-------------------------------------------------------------+
```

### 4.2 Row Level Security (RLS) & Owner-Only Enforcement
Every table in Supabase enforces strict RLS policies:
```sql
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE tests_catalogue ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_settings ENABLE ROW LEVEL SECURITY;

-- Owner-only policy: user must be authenticated and match owner profile ID
CREATE POLICY "Owner access only" ON patients
  FOR ALL TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);
```

### 4.3 Real-Time Cross-Device Synchronization Protocol
1. **Subscription Channel**:
   Both Android and Desktop clients subscribe to `supabase.channel('lab_realtime_sync')` listening to `postgres_changes` across tables `patients`, `reports`, `report_results`, `payments_ledger`, and `lab_settings`.
2. **Event Dispatch & Optimistic Updates**:
   - When an action is taken (e.g. Patient registered on Desktop), the client commits the transaction to Supabase.
   - Upon confirmation, local memory state updates immediately.
   - Supabase Realtime broadcasts the change event over WebSocket to all active client instances.
   - The Mobile app receives the event, verifies that the change is newer than its local `updated_at` timestamp, and merges the record into the reactive store.
3. **Concurrency & Conflict Protection**:
   Every record includes `updated_at` (timestamp) and `version` (integer). Updates employ optimistic concurrency checks (`WHERE id = :id AND version = :expected_version`). If another device updated the record in the interim, the update fails gracefully with an actionable conflict warning prompt.
4. **Offline Handling (Cloud-First)**:
   - When network connectivity is lost, an offline banner appears.
   - Unsaved form inputs remain preserved in component state.
   - Dangerous financial/clinical actions (issuing reports, recording payments) are blocked with a clear notice: *"Internet connection required to record transactions."*
   - Upon reconnection, subscriptions resubscribe automatically and run an incremental synchronization query.

---

## 5. Security & Governance Perimeter

1. **Authentication Persistence**:
   - Native credentials and session refresh tokens are stored using platform-secure storage:
     - Android: Android Keystore / EncryptedSharedPreferences via Capacitor Preferences plugin.
     - Desktop: OS Keychain / Keyring integration or encrypted app-data credentials.
2. **Report Storage Security**:
   - Finalized A4 PDF reports uploaded to Supabase Storage reside in a private bucket (`lab-reports-private`).
   - Access requires a short-lived signed URL (60-second expiry) generated on-demand by the authenticated owner.
   - No public URLs or unauthenticated access.
3. **Data Protection**:
   - Medical reference ranges retain `"Range not verified"` governance tags.
   - Interpretation notes remain marked `"Unverified legacy advisory content"`.
   - Historical signatures require owner confirmation before report signing activation.
