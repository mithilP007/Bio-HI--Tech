# BIO HI TECH — NATIVE PLATFORM & NEXT.JS PACKAGING COMPATIBILITY AUDIT

**Audit Date**: November 21, 2026  
**Target Environments**: 
- Android 8.0+ (Capacitor 8 / Android WebView)
- Desktop Linux x86_64 (Tauri 2 / WebKitGTK)
- Desktop Windows x86_64 (Tauri 2 / WebView2)
**Frontend Framework**: Next.js 16.4.6 App Router / React 19.2.4 / TypeScript 5.7.3

---

## 1. Next.js App Router Static Export Audit (`output: 'export'`)

Next.js static export (`output: 'export'`) compiles the application into static HTML, CSS, JavaScript, and asset bundles in an `out/` directory. This is mandatory for local packaging in Capacitor and Tauri.

### 1.1 Server-Side Features Audit

| Feature Area | Existing App Implementation | Static Export Compatible? | Action Required |
| :--- | :--- | :---: | :--- |
| **Server Components** | None. All interactive views (`components/lab-app.tsx`, `report-print-sheet.tsx`, `settings-page.tsx`, etc.) are React client components marked `'use client'`. | **YES** | None. Client components export cleanly into client bundle. |
| **Server Actions** | None used. All mutations currently operate via reactive in-memory stores in `lib/demo-store.ts`. | **YES** | None. Mutations will transition to Supabase client SDK. |
| **Route Handlers (`app/api/*`)** | None exist. No Next.js API routes are present. | **YES** | Backend operations connect to Supabase Cloud directly. |
| **Dynamic Server Rendering (`cookies()`, `headers()`)** | None used. No server-side cookie inspection or dynamic server headers. | **YES** | None. Authentication will be managed via Supabase client session. |
| **Image Optimization (`next/image`)** | `images: { unoptimized: true }` is already explicitly configured in `next.config.mjs`. | **YES** | Images are served directly as static files from `/public/`. |
| **Vercel Analytics** | `app/layout.tsx` imports `@vercel/analytics/next`. | **CONDITIONAL** | Must guard against non-web environments so analytics ping does not log network errors offline. |

---

## 2. Dynamic Route & SPA Catch-All Route Evaluation

### 2.1 The `app/[...slug]/page.tsx` Challenge
- **Current Setup**:
  - `app/page.tsx` renders `<LabApp />`.
  - `app/[...slug]/page.tsx` renders `<LabApp />` for all subpaths (`/patients`, `/reports`, `/reports/RPT-261121-032/preview`, etc.).
- **Static Export Restriction**:
  Next.js requires that any dynamic route (`[...slug]`) must implement `generateStaticParams()` when `output: 'export'` is specified. If omitted, `next build` will halt with an error.
- **Solution Strategy**:
  1. Implement `generateStaticParams()` in `app/[...slug]/page.tsx` providing all known top-level and static route segments:
     - `dashboard`
     - `patients`
     - `patients/new`
     - `reports`
     - `reports/new`
     - `catalogue`
     - `tests`
     - `tests/new`
     - `billing`
     - `billing/new`
     - `analytics`
     - `settings`
     - `settings/lab-profile`
     - `settings/branding`
     - `settings/reports`
     - `settings/signatures`
     - `settings/billing`
     - `settings/test-configuration`
     - `settings/security`
     - `settings/preferences`
     - `notifications`
     - `login`
     - `forgot-password`
     - Known demo report/patient preview paths
  2. Configure `trailingSlash: true` in `next.config.mjs` so each route exports as `index.html` within its own subdirectory (e.g. `out/patients/index.html`).
  3. For dynamic ID subpaths loaded at runtime (e.g., newly created patient IDs `patients/BHT-02487`), configure an SPA fallback page (`out/404.html` or client fallback) that delegates to the client-side router (`window.location.pathname`).

---

## 3. Web APIs vs Native Platform Capabilities Audit

### 3.1 Report Printing (`window.print()`)
- **Desktop (Tauri 2)**:
  Tauri WebKitGTK (Linux) and WebView2 (Windows) support `window.print()`. In desktop mode, calling `window.print()` successfully opens the native operating system print dialog or allows "Save as PDF".
- **Android (Capacitor 8)**:
  Standard Android `WebView` does NOT always open the native Android print dialog when `window.print()` is triggered.
  - **Resolution**: Intercept print requests on Android and invoke Android's native `PrintManager` or Capacitor's native printer bridge to open the system print spooler.

### 3.2 Hardware Back Button (Android)
- In a web browser, the browser's back button navigates history.
- On Android native devices, pressing the physical/gesture back button by default can unexpectedly exit the app if unhandled.
- **Resolution**: Use `@capacitor/app` `backButton` listener to pop view history in `components/lab-app.tsx` or show an exit confirmation if already on the Dashboard.

### 3.3 Safe Areas & Mobile Status Bar
- Android devices with camera cutouts/notches require safe-area padding.
- **Resolution**: Incorporate `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)` into `app/globals.css` and use `@capacitor/status-bar` to set the status bar style to match the laboratory brand color (`#08796e`).

### 3.4 Network Connectivity & Offline Awareness
- Desktop and mobile devices may experience intermittent internet access in clinical environments.
- **Resolution**: Combine HTML5 `navigator.onLine` with `@capacitor/network` listeners. Display a non-intrusive warning banner when offline and prevent unconfirmed transactions from giving false positive success feedback.

---

## 4. Environment Variables & Client Security Audit

### 4.1 Required Client Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

### 4.2 Security Checklist
- [x] **No Service-Role Key**: `SUPABASE_SERVICE_ROLE_KEY` is strictly absent from the client-side codebase.
- [x] **No Database Password**: PostgreSQL connection strings (`postgres://postgres:...`) are not included in frontend or native assets.
- [x] **Strict RLS Required**: All tables must reject anonymous writes and restrict queries to the authenticated owner ID.
- [x] **Local Storage Hygiene**: Medical records are never persisted in unencrypted browser `localStorage`.
