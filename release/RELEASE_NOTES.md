# BIO HI TECH LIMS — Release Notes (v1.0.0)

**Release Date**: 2026-11-24  
**Product**: BIO HI TECH Laboratory Information Management System  
**Version**: `1.0.0` (Production Milestone)  
**Package Identifiers**:
- **Android**: `com.biohitech.lims` (Version Code: 1)
- **Windows**: `BIO HI TECH` (Architecture: x64)

---

## 1. What's Included in This Release

### A. Dedicated Branding & Visual Identity
- **Standalone BiO Mark**: Pure BiO icon (Yellow `B`, `i` with orange dot, lime droplet with teal microscope) across all Android launcher densities (`mdpi` through `xxxhdpi`), round icons, adaptive foregrounds, splash screens, Windows taskbar/desktop `.ico`, and web favicons.
- Clean header banner and consistent visual theme across all pages.

### B. Single-Owner Security & Pre-Provisioning
- **Zero Arbitrary Installer Claiming**: First-launch open owner account creation has been eliminated.
- **Pre-Provisioned Server-Side Security**: The single authorized laboratory owner (`owner@biohitech.com`, Dr. Arun Kumar, Chief Pathologist & Lab Director) is pre-provisioned directly in PostgreSQL `public.owner_access` and `public.owner_profile`.
- **Strict Single-Tenant Gate**: Every login strictly verifies the authenticated user ID against `public.owner_access` where `is_active = true`. Unapproved users are instantly revoked and signed out.

### C. Verified Password Recovery
- **Supabase Auth Verified Email Flow**: Replaces obsolete security questions with cryptographically verified email recovery (`resetPasswordForEmail`).
- **Rate-Limiting & Anti-Enumeration**: Cooldown timer protects against brute-force reset requests; response masking prevents account enumeration.
- **Secure Password Update**: Verified recovery sessions enforce 8+ character master passwords via `supabase.auth.updateUser`.
- **Session Revocation**: Password update invalidates obsolete sessions across all other devices.

### D. Central PostgreSQL Cloud Connectivity & Real-Time Sync
- **Shared Real-Time Engine**: Both Android and Windows clients connect to the central Supabase PostgreSQL database over TLS 1.3 with WebSocket live replication.
- **Automatic Multi-Client Sync**: Patients, orders, results, reports, invoices, ledger entries, catalogue items, and reference approvals synchronize in real time without manual refresh.
- **Offline Resilience & Deduplication**: Automatic reconnect and event deduplication ensure no lost or duplicate clinical records.

### E. Clinical Engine & Reference Range Automation
- **Genuine 120-Test Catalogue**: All 120 tests, 211 parameter definitions, and 22 clinical panels preserved.
- **Automated Parameter Matching**: Age-specific and sex-specific reference intervals dynamically matched against patient profile.
- **Qualitative & Numeric Support**: Standardized status badges (Normal, High, Low, Detected, Negative) without artificial categories.

### F. Print-Ready A4 PDF Engine
- **Letterhead Toggle**: Switch seamlessly between **With Letterhead** (full color digital branding) and **Without Letterhead** (45mm reserved margin for pre-printed clinical stationery).
- **Physical Barcodes & Verification QR**: Code 128 barcodes for report tracking; QR codes linking to verification endpoint with **zero patient PII**.

---

## 2. Platform Artifact Specifications

| Target Platform | Package Format | Binary Name | Target Hardware |
| :--- | :--- | :--- | :--- |
| **Android** | Signed Release APK | `bio-hi-tech-1.0.0-release.apk` | Android 8.0+ Tablets & Smartphones |
| **Android** | Production AAB | `bio-hi-tech-1.0.0-release.aab` | Google Play Console Internal Track |
| **Windows Desktop** | NSIS Setup Executable | `bio-hi-tech_1.0.0_x64-setup.exe` | Windows 10/11 64-bit Workstations |
| **Windows Desktop** | Enterprise MSI | `bio-hi-tech_1.0.0_x64_en-US.msi` | Windows Active Directory / IT Deployments |
| **Linux Desktop** | AppImage / Debian | `bio-hi-tech_1.0.0_amd64.AppImage` | Linux 64-bit Lab Reception PCs |

---

## 3. Support & Maintenance Contacts

- **Technical Support**: `support@biohitech.com`
- **Laboratory Emergency Hotline**: Available in Owner Handover Documentation
- **Deployment Repository**: `https://github.com/mithilP007/Bio-HI--Tech.git`
