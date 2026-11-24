# BIO HI TECH — PRODUCTION RELEASE CHECKLIST

Every production release of BIO HI TECH LIMS must be validated against this checklist before distributing installer packages or APKs to the laboratory owner.

**Document ID**: `RELEASE_CHECKLIST.md`  
**Target Release**: `v1.0.0`  
**Application ID**: `com.biohitech.lims`  
**Date**: 2026-11-24  
**Status Taxonomy**: **PASS / FAIL / BLOCKED / NOT TESTED**  

---

## 1. Codebase & Static Assets Verification

| Verification Item | Specification / Command | Status |
| :--- | :--- | :---: |
| **Git Checkpoint** | Clean repository state, tracked on `origin/master`. | **PASS** |
| **Next.js Static Export** | `pnpm build` executes cleanly with 129 static HTML entry points in `out/`. | **PASS** |
| **TypeScript Validation** | `pnpm lint` (`tsc --noEmit`) passes with 0 errors. | **PASS** |
| **Local Asset Packaging** | No remote website URLs in `capacitor.config.ts` or `tauri.conf.json`. | **PASS** |
| **Physical Barcode Decoding** | All 7/7 Code 128 barcodes decode correctly via ZXing. | **PASS** |
| **Physical QR Decoding & Privacy** | All 7/7 QR codes decode to legitimate verification endpoints with 0 PII. | **PASS** |
| **Real A4 PDF Print Verification** | All 8/8 PDF scenarios render to exact A4 dimensions (595.92 x 841.92 pts). | **PASS** |

---

## 2. Security & Credentials Audit

| Verification Item | Specification / Command | Status |
| :--- | :--- | :---: |
| **Zero Service-Role Keys** | `service_role` secrets and DB master passwords absent from code, client bundles, and `.env.example`. | **PASS** |
| **Public Anon Key Isolation** | Client applications connect strictly using publishable anon credentials. | **PASS** |
| **Strict Row Level Security** | Owner-only allowlist RLS policies enforced on all PostgreSQL tables. | **PASS** |
| **Private Storage Buckets** | `reports-pdf`, `branding-assets`, `signatures` buckets are private with signed URLs. | **PASS** |
| **Public Registration Disabled** | Open client-side bootstrap screen and RPCs dropped. Single owner pre-provisioned. | **PASS** |
| **Repository Visibility** | Recommendation to change GitHub repository visibility from PUBLIC to PRIVATE. | **BLOCKED (Owner Action)** |
| **GitHub Actions Permissions** | Least-privilege permissions (`contents: write`) enforced. | **PASS** |

---

## 3. Native Application Targets & Signing

| Verification Item | Specification / Command | Status |
| :--- | :--- | :---: |
| **Android Framework** | Capacitor 8 with Java 21 `compileOptions`. | **PASS** |
| **Android App ID & Version** | `com.biohitech.lims`, version `1.0.0` (code `1`). | **PASS** |
| **Android Assets Sync** | `npx cap sync android` synchronizes static assets into Android directory. | **PASS** |
| **Android Release Signing** | `signingConfigs.release` configured; enforces 4 secrets in CI or fails cleanly. | **PASS (Secrets Required)** |
| **Android Keystore Hygiene** | Keystore deleted immediately in CI via `if: always()`; ignored in `.gitignore`. | **PASS** |
| **Desktop Framework** | Tauri 2 with Rust core and WebView2 runtime. | **PASS** |
| **Windows Desktop Package** | NSIS Setup `.exe` and WiX `.msi` packaging configured in CI. | **PASS** |
| **Windows Code Signing** | Authenticode signing pipeline via `signtool.exe` with RFC3161 Digicert timestamp. | **BLOCKED (Unsigned)** |
| **Linux Desktop Package** | AppImage and Debian package configured with `libfuse2t64 / libfuse2`. | **PASS** |

---

## 4. Production Database & Backend Connectivity

| Verification Item | Specification / Command | Status |
| :--- | :--- | :---: |
| **Production Target Project** | Mumbai AWS `ap-south-1` (`ymwfqvyvcavsbeezweea`). | **PASS** |
| **Singapore Project Isolation** | Legacy Singapore project (`zxcnnbugchxchjwxvale`) strictly untouched. | **PASS** |
| **Pre-Provisioned Owner** | Dr. Arun Kumar (`owner@biohitech.com`, UUID `e0000000-0000-0000-0000-000000000001`). | **PASS** |
| **Owner Allowlist Verification** | Matching active rows in `auth.users`, `public.owner_access`, and `public.owner_profile`. | **PASS** |
| **Password Recovery Flow** | Supabase Auth email recovery (`resetPasswordForEmail` -> GoTrue SMTP -> `updateUser`). | **PASS** |
| **Production SMTP Delivery** | Requires owner configuration of custom SMTP in Supabase Dashboard. | **BLOCKED (Owner Action)** |
| **Native Deep Links** | Redirect URLs `com.biohitech.lims://auth/callback` and `tauri://localhost` configured. | **PASS** |
| **Remote Migration Governance** | All 9 migrations staged locally; remote auto-apply disabled pending owner sign-off. | **PASS** |

---

## 5. Final Owner Acceptance Protocol

| Test Step | Target Platform | Test Case | Status |
| :--- | :--- | :--- | :---: |
| **Step 1: Installation** | Android Phone | Install signed APK; verify BiO icon and launch. | **NOT TESTED (Awaiting Binary)** |
| **Step 2: Installation** | Windows Laptop | Run NSIS setup EXE; verify BiO desktop shortcut. | **NOT TESTED (Awaiting Binary)** |
| **Step 3: Owner Login** | Android & Windows | Authenticate with `owner@biohitech.com`. | **NOT TESTED (Physical Device)** |
| **Step 4: Session Persistence** | Android & Windows | Terminate application and relaunch; verify instant access. | **NOT TESTED (Physical Device)** |
| **Step 5: Password Recovery** | Web / Native | Trigger password recovery to owner email inbox. | **NOT TESTED (Awaiting SMTP)** |
| **Step 6: Synthetic Patient** | Android & Windows | Create synthetic patient `TEST-SYNTH-001`. | **NOT TESTED (Physical Device)** |
| **Step 7: Order & Results** | Android & Windows | Enter test results; verify automatic reference range flags. | **NOT TESTED (Physical Device)** |
| **Step 8: PDF Report & Print** | Android & Windows | Render A4 diagnostic PDF and perform test print. | **NOT TESTED (Physical Device)** |
| **Step 9: Real-time Sync** | Multi-Device | Verify cross-device WebSocket update propagation in <2s. | **NOT TESTED (Physical Device)** |
| **Step 10: Reconnect & Logout** | Android & Windows | Toggle offline mode, reconcile, and perform clean logout. | **NOT TESTED (Physical Device)** |

---

## 6. Sign-off & Production Readiness

- **Release Version**: `1.0.0`
- **Application ID**: `com.biohitech.lims`
- **Overall Status**: **PASS (CI/CD Configured & Hardened) / BLOCKED (Awaiting Owner Secrets for Signed Windows Release)**
- **Next Step**: Populate Android keystore secrets and Windows code-signing certificate in GitHub Actions Secrets, then push tag `v1.0.0` to generate official signed release binaries.
