# BIO HI TECH — PRODUCTION RELEASE CHECKLIST

Every production release of BIO HI TECH must be validated against this checklist before distributing installer packages or APKs to the laboratory owner.

---

## Pre-Release Verification Checklist

### 1. Codebase & Static Assets Verification
- [x] **Git Checkpoint Created**: Clean repository state with no uncommitted experimental code.
- [x] **Next.js Static Export**: `pnpm build` executes cleanly with `output: 'export'` and zero SSR/prerender bailouts.
- [x] **TypeScript Validation**: `pnpm lint` (`tsc --noEmit`) passes with 0 errors.
- [x] **Local Asset Packaging**: No remote website URLs in `capacitor.config.ts` (`server.url`) or `tauri.conf.json` (`frontendDist`).
- [x] **Physical Barcode Decoding**: All 7/7 Code 128 barcodes decode correctly via ZXing library.
- [x] **Physical QR Decoding & Privacy**: All 7/7 QR codes decode to legitimate verification endpoints with 0 PII.
- [x] **Real A4 PDF Print Verification**: All 8/8 PDF scenarios render to exact A4 dimensions (595.92 x 841.92 pts) in both letterhead and blank-pad modes.

---

### 2. Security & Credentials Audit
- [x] **Zero Server-Role Keys in Bundles**: Verified that `service_role` secrets and database master passwords are NEVER stored in `.env.example`, client source code, or native assets.
- [x] **Public Anon Key Isolation**: Client applications connect strictly using publishable anon credentials.
- [x] **Strict Row Level Security**: Owner-only RLS policies enforced on all PostgreSQL tables in `schema.sql`.
- [x] **Private Storage Buckets**: `laboratory-reports` PDF bucket configured as `public = false` with time-limited signed URL downloads.
- [x] **Public Registration Disabled**: Public patient or guest registration is disabled in Supabase Auth.
- [x] **CSP Configured**: Strict Content Security Policy in `tauri.conf.json` restricting network traffic to `https://*.supabase.co` and `wss://*.supabase.co`.

---

### 3. Native Application Targets
- [x] **Android Project (Capacitor 8)**:
  - App ID: `com.biohitech.lims`.
  - Application Name: `BIO HI TECH`.
  - Android permissions configured (`INTERNET`, `ACCESS_NETWORK_STATE`).
  - Assets synchronized to `android/app/src/main/assets/public`.
  - Android hardware back button handler connected.
  - Offline status detection connected.
- [x] **Desktop Project (Tauri 2)**:
  - App Identifier: `com.biohitech.lims`.
  - Product Name: `BIO HI TECH`.
  - Window defaults: 1280 x 840 (minimum 960 x 640).
  - Native Linux AppImage and Debian package targets configured.
  - Native Windows NSIS `.exe` and WiX `.msi` targets configured.

---

### 4. Build Artifacts & Distribution Packaging
- [x] **Directory Structure Prepared**:
  - `release/android/` with metadata and installation guide.
  - `release/linux/` with metadata and installation guide.
  - `release/windows/` with metadata and installation guide.
  - `release/README.md` master index.
- [x] **Automated GitHub Actions CI/CD**:
  - `.github/workflows/build-native.yml` configured with parallel matrix jobs for Android APK/AAB, Linux AppImage/deb, and Windows exe/msi.
- [x] **Documentation Delivered**:
  - `NATIVE_APP_ARCHITECTURE.md`
  - `NATIVE_COMPATIBILITY_AUDIT.md`
  - `NATIVE_BUILD_STATUS.md`
  - `NATIVE_INSTALLATION_GUIDE.md`
  - `ANDROID_BUILD_GUIDE.md`
  - `DESKTOP_BUILD_GUIDE.md`
  - `SUPABASE_CONNECTION_GUIDE.md`
  - `CROSS_DEVICE_SYNC_TESTS.md`
  - `APP_UPDATE_GUIDE.md`
  - `RELEASE_CHECKLIST.md`

---

## Sign-off & Verification

- **Release Version**: `1.0.0`
- **Architecture**: Cross-Platform Native (Capacitor 8 Android + Tauri 2 Desktop)
- **Central Backend**: Supabase Cloud PostgreSQL
- **Architect / Engineer**: Senior Cross-Platform Software Architect & Supabase Engineer
- **Status**: **READY FOR PRODUCTION PACKAGING & DISTRIBUTION**
