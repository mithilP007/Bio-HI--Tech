# BIO HI TECH LIMS — Owner Handover Pack & Distribution Index

Welcome to the **BIO HI TECH** Laboratory Information Management System client handover package.

This package contains everything required by the laboratory director and IT administrators for installation, day-to-day operation, data synchronization, security, updates, and maintenance.

---

## 1. Handover Package Directory Contents

```
release/
├── README.md                          # Master release repository index
├── RELEASE_NOTES.md                   # Version 1.0.0 release notes & feature matrix
├── OWNER_HANDOVER_PACK.md             # This document (Owner instructions & operational guide)
├── android/
│   ├── README.md                      # Android package installation & sideloading instructions
│   ├── SHA256SUMS.txt                 # Android release binary checksums
│   └── bio-hi-tech-1.0.0-release.apk  # (Binary artifact from CI/CD pipeline)
├── windows/
│   ├── README.md                      # Windows desktop installer instructions
│   ├── SHA256SUMS.txt                 # Windows native executable checksums
│   └── bio-hi-tech_1.0.0_x64-setup.exe# (Binary artifact from CI/CD pipeline)
├── linux/
│   ├── README.md                      # Linux AppImage & Debian package instructions
│   └── SHA256SUMS.txt                 # Linux binary checksums
└── documentation/
    ├── INSTALLATION_GUIDE.md          # Multi-platform deployment guide
    ├── USER_MANUAL.md                 # Daily lab operations, patient CRUD & report issuing
    ├── SECURITY_GUIDE.md              # RLS policies, owner allowlisting & session audit
    ├── UPDATE_GUIDE.md                # Data sync vs native software update procedures
    └── BACKUP_GUIDE.md                # PostgreSQL encrypted backup & restoration procedures
```

---

## 2. Owner Login & Access Instructions

### Authorized Laboratory Director Account:
- **Registered Owner Email**: `owner@biohitech.com`
- **Authorized Director**: Dr. Arun Kumar (Chief Pathologist & Lab Director)
- **Security Access Level**: Master Administrator (`OWNER` in PostgreSQL `owner_access`)

### First Sign-In Procedure:
1. Launch BIO HI TECH on your Android phone or Windows desktop workstation.
2. The application opens directly to the **Sign In to Workspace** screen.
3. Enter your pre-provisioned owner email (`owner@biohitech.com`) and your master password.
4. Check **Remember this device** to keep your secure session active on trusted hardware.
5. Click **Sign In to Workspace**.
6. The system verifies your credentials against Supabase Auth and validates your identity in the PostgreSQL `owner_access` table.
7. Upon successful validation, the full clinical dashboard opens.

---

## 3. Password Recovery Instructions

If you forget your master password or wish to reset your credentials:

1. On the Sign In screen, click **Forgot password?**.
2. Enter your registered owner email: `owner@biohitech.com`.
3. Click **Send Recovery Email**.
4. A secure, time-limited password recovery link is dispatched to your registered email address.
5. Open your email inbox and click the **Reset password** link.
6. The BIO HI TECH application opens directly in **Verified Recovery Mode**.
7. Enter your new master password (minimum 8 characters) and confirm it.
8. Click **Update Master Password**.
9. Your master password is cryptographically updated, and all sessions on other devices are automatically revoked.
10. Return to the Sign In screen and sign in with your new credentials.

---

## 4. PDF Download & Physical Printing

BIO HI TECH includes a high-fidelity A4 document engine designed specifically for diagnostic laboratories:

1. **Viewing a Report**:
   - Navigate to **Saved reports** (`/reports`) or click on a patient to view their reports.
   - Click **Preview A4** to see the full print layout before printing.
2. **Pre-Printed vs Plain Paper Mode**:
   - In **Settings > Branding**, choose your printing mode:
     - **With Letterhead**: Prints the full BIO HI TECH visual header banner (for plain white A4 paper).
     - **Without Letterhead**: Automatically leaves a **45mm top margin** to accommodate pre-printed clinic stationery.
3. **Physical Printing / Saving PDF**:
   - Click **Print / save PDF** (`Ctrl+P` on Windows desktop, or native Print dialog on Android).
   - In the print dialog, select your clinic printer or choose **Save as PDF**.
4. **Barcode & QR Verification**:
   - Every report prints with a Code 128 barcode containing the unique Report ID.
   - Every report prints with an encrypted verification QR code linking to the secure result portal with **zero patient PII** (phone numbers and patient names are omitted for medical privacy).

---

## 5. Real-Time Multi-Device Data Synchronization

Both Android and Windows native installations share the same central cloud database:

| Action on Windows Reception PC | Result on Android Director Tablet |
| :--- | :--- |
| Receptionist registers a new patient | New patient appears on director's tablet instantly (< 2s) |
| Receptionist adds tests to an order | Order items and billing amounts synchronize live |
| Technologist enters observed test results | Results immediately populate with automatic clinical flags |
| Director issues report on tablet | Status updates to "Issued" on Windows and report locks |
| Reception records payment / cash receipt | Ledger balances and outstanding dues update live |
| Director approves new reference interval | Approved criteria become immediately active system-wide |

### Disconnection & Offline Resilience:
- If Wi-Fi or internet connectivity drops, the application displays an offline indicator.
- When internet reconnects, the application automatically catches up with all changes made on other devices without requiring an application restart or page refresh.

---

## 6. Software Updates vs Data Updates

### A. Data Updates (Automatic & Instant)
- Patient records, orders, results, reports, invoices, and catalogue prices update continuously over real-time WebSockets.
- Zero manual software updates are required for data changes.

### B. Software Updates (New Features & Capabilities)
- **Android**: When a new version is released, install the updated `bio-hi-tech-X.Y.Z-release.apk`. Android updates the app in-place while preserving all settings and session tokens.
- **Windows**: Run the new `bio-hi-tech_X.Y.Z_x64-setup.exe`. The installer updates application files and shortcuts seamlessly.

---

## 7. Security & Privacy Guarantee

- **Zero Secret Leaks**: No master database passwords, Supabase service-role keys, Personal Access Tokens (PATs), or keystore passwords exist in this handover package or inside client binaries.
- **Row Level Security (RLS)**: Enforced directly inside PostgreSQL. Even if an unauthorized user attempts direct API queries, PostgreSQL rejects all access.
- **Private Storage**: Patient report PDFs are stored in private, encrypted buckets accessible only via time-limited signed URLs.

---

## 8. Technical Support & Contacts

For technical assistance, server maintenance, or custom test configuration:

- **Laboratory IT Support**: `support@biohitech.com`
- **Lead System Architect**: Available through designated laboratory IT channels
- **Emergency Service Level Agreement**: 24/7 critical system coverage
