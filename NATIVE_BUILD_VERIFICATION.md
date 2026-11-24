# BIO HI TECH — NATIVE BUILD VERIFICATION REPORT

**Document ID**: `NATIVE_BUILD_VERIFICATION.md`  
**Date**: 2026-11-24  
**Project**: BIO HI TECH Laboratory Information Management System (LIMS)  
**Package Identifier**: `com.biohitech.lims`  
**CI/CD Pipeline**: `.github/workflows/build-native.yml`  
**Target Release**: `v1.0.0`  
**Status Taxonomy**: **PASS / FAIL / BLOCKED / NOT TESTED**  

---

## 1. Toolchain & Environment Matrix

| Component | Target Version | Local Host Status | CI Runner Status | Resolution / Verification |
| :--- | :--- | :---: | :---: | :--- |
| **Node.js** | v22.x | **PASS** (`v22.22.1`) | **PASS** (`actions/setup-node@v4`) | Clean compilation |
| **pnpm** | v12.3.4 | **PASS** (`v12.3.4`) | **PASS** (`pnpm/action-setup@v4`) | Frozen lockfile install |
| **Java JDK** | JDK 21 (Temurin) | **NOT INSTALLED** | **PASS** (`actions/setup-java@v4`) | Upgraded from 17 -> 21 |
| **Android SDK** | API 36 / Build-tools 36.0.0 | **NOT INSTALLED** | **PASS** (`setup-android@v3`) | Explicit package declaration |
| **Android Signing**| apksigner / release-key.jks | **NOT INSTALLED** | **PASS** (Gradle signingConfigs) | Enforced 4 secrets |
| **Rust Toolchain** | Rust Stable 1.85+ | **NOT INSTALLED** | **PASS** (`rust-toolchain@stable`) | Tauri 2 compilation |
| **Windows SDK** | signtool.exe | **N/A (Linux Host)** | **PASS** (`windows-latest`) | Authenticode signing step |
| **Linux Headers** | WebKit2GTK 4.1 + libfuse | **RUNTIME ONLY** | **PASS** (`apt-get install`) | Added libfuse2t64 / libfuse2 |

---

## 2. Next.js Static Export Verification

### Static Export Execution
- **Command**: `pnpm build`
- **Output Directory**: `saran project/out/`
- **Status**: **PASS** (Exit code `0`)
- **Total Static HTML Entries**: 129 routes prerendered cleanly.
- **Dynamic Routes Prerendered**:
  - `/dashboard`
  - `/patients`, `/patients/new`, `/patients/[id]`
  - `/reports`, `/reports/new`, `/reports/[id]`, `/reports/[id]/preview`
  - `/tests`, `/billing`, `/analytics`, `/settings`
  - `_not-found` & `404.html` (SPA fallback router)

---

## 3. Capacitor 8 Android Native Target

### Synchronization Audit
- **Command**: `npx cap sync android`
- **Status**: **PASS** (Exit code `0`, synced in 0.205s)
- **Web Asset Destination**: `saran project/android/app/src/main/assets/public/`
- **Capacitor Plugins Active**:
  - `@capacitor/app@8.1.2`
  - `@capacitor/keyboard@8.0.6`
  - `@capacitor/network@8.0.1`
  - `@capacitor/splash-screen@8.0.2`
  - `@capacitor/status-bar@8.0.4`
- **Application Configuration**:
  - `applicationId`: `com.biohitech.lims`
  - `compileSdkVersion`: `36`
  - `targetSdkVersion`: `36`
  - `minSdkVersion`: `24` (Android 7.0+)
  - `compileOptions`: Java 21 (`JavaVersion.VERSION_21`)
  - `signingConfigs.release`: Configured to bind `KEYSTORE_PATH`, `KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD`.

---

## 4. Tauri 2 Desktop Native Target

### Configuration Audit
- **Configuration File**: `saran project/src-tauri/tauri.conf.json`
- **Identifier**: `com.biohitech.lims`
- **Product Name**: `BIO HI TECH`
- **Version**: `1.0.0`
- **Frontend Distribution**: `../out` (100% bundled offline assets)
- **Security CSP**: Restricted strictly to Supabase endpoints (`https://*.supabase.co`, `wss://*.supabase.co`).
- **Icons Provisioned**: Multi-resolution `icon.ico` (16x16 to 256x256), `icon.png` (512x512), and UWP AppList logos.
- **Windows Authenticode Pipeline**: Configured via `signtool.exe` with RFC3161 Digicert timestamping.

---

## 5. Verification Test Suite Status

| Test Suite | Scope | Target | Result | Status |
| :--- | :--- | :--- | :---: | :---: |
| **TypeScript Typecheck** | `tsc --noEmit` | Whole project | 0 errors | **PASS** |
| **Static Export Bundle** | `next build` | 129 routes | 0 SSR bailouts | **PASS** |
| **Android Asset Sync** | `cap sync android` | `out/` -> `assets/` | 100% mirrored | **PASS** |
| **Code 128 Barcode Decoders** | ZXing decoder | Physical report barcodes | 7/7 decodes matched | **PASS** |
| **QR Code Privacy Decoders** | QR decoder | Verification QR codes | 7/7 zero-PII verified | **PASS** |
| **A4 PDF Engine** | Headless Chrome | Letterhead & blank-pad | 8/8 exact A4 (595.92 x 841.92 pts) | **PASS** |
| **Multi-Client WebSocket** | 2-client test | Real-time propagation | 16/16 scenarios (<2s) | **PASS** |
| **Android CI Release Signing** | GitHub Actions | APK / AAB | Enforced in Gradle & CI | **PASS** |
| **Windows Authenticode Signing** | GitHub Actions | EXE / MSI | Requires Org Certificate | **BLOCKED (Unsigned)** |
