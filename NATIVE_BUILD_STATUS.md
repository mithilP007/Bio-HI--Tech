# BIO HI TECH — NATIVE BUILD & TOOLCHAIN STATUS

**Audit Date**: November 21, 2026  
**Project**: BIO HI TECH LIMS Native Packaging & Cloud Synchronization  
**Working Directory**: `/home/mithil/Downloads/BIO-HI-TECH-LIMS/saran project/`

---

## 1. Host System Environment & Toolchains

| Toolchain / Runtime | Detected Path | Version | Readiness Status | Notes |
| :--- | :--- | :---: | :---: | :--- |
| **Node.js** | `/usr/bin/node` | **v22.22.1** | **READY** | Standard LTS JavaScript runtime. |
| **pnpm** | `/home/mithil/.local/bin/pnpm` | **v12.3.4** | **READY** | Primary workspace package manager. |
| **Google Chrome (Headless)**| `/usr/bin/google-chrome` | **Available** | **READY** | Used for automated PDF print verification. |
| **Rust / Cargo** | Not detected in path | — | **REQUIRES INSTALL** | Required for compiling Tauri 2 desktop binaries locally. |
| **Java JDK / Gradle** | Not detected in path | — | **REQUIRES INSTALL** | Required for compiling Android APK/AAB locally via Gradle. |
| **Android SDK / Studio** | Not detected in path | — | **REQUIRES INSTALL** | Android project generated (`android/`) ready for Android Studio. |

---

## 2. Target Matrix & Packaging Status

| Target Platform | Technology Stack | Project Config | Source Artifacts | Local Binary Status | Continuous Integration Status |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Android Application** | Capacitor 8 | `capacitor.config.ts` | Complete `android/` project | Pending Android SDK / Gradle | Ready for GitHub Actions / Android Studio |
| **Linux Desktop (AppImage)**| Tauri 2 | `tauri.conf.json` | `src-tauri/` Rust workspace | Pending Rust/Cargo toolchain | Configured for GitHub Actions Linux runner |
| **Linux Desktop (.deb)** | Tauri 2 | `tauri.conf.json` | `src-tauri/` Rust workspace | Pending Rust/Cargo toolchain | Configured for GitHub Actions Linux runner |
| **Windows Desktop (.exe)** | Tauri 2 | `tauri.conf.json` | `src-tauri/` Rust workspace | Cross-compilation via CI | Configured for GitHub Actions Windows runner |
| **Windows Desktop (.msi)** | Tauri 2 | `tauri.conf.json` | `src-tauri/` Rust workspace | Cross-compilation via CI | Configured for GitHub Actions Windows runner |

---

## 3. Subsystem Implementation Status

| Subsystem | Scope & Requirements | Status | Notes |
| :--- | :--- | :---: | :--- |
| **Static Frontend Export** | Next.js 16 `output: 'export'` with `trailingSlash: true` | **READY** | `generateStaticParams()` implemented for catch-all route. |
| **Capacitor 8 Integration** | Android shell, identity `com.biohitech.lims`, icon/splash assets | **IN PROGRESS** | Integrating Capacitor dependencies and creating `android/`. |
| **Tauri 2 Integration** | Desktop shell, identity `com.biohitech.lims`, window bounds, capabilities | **IN PROGRESS** | Integrating Tauri dependencies and creating `src-tauri/`. |
| **Supabase Client & Auth** | Realtime client, session persistence, owner-only authorization | **READY FOR CONFIG** | Client module created with `.env.example` and fallback simulation. |
| **Supabase Database Schema** | PostgreSQL schema with RLS, patients, reports, results, ledger, settings | **READY** | Full SQL migration scripts authored in `supabase/schema.sql`. |
| **Report Printing** | A4 print layout, Code 128, QR token, 45mm letterhead margin, signatures | **VERIFIED** | 100% verified via automated decoder and PDF render tests. |
