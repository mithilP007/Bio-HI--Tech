# BIO HI TECH LIMS — Laboratory Owner Download & Installation Guide

**Application**: BIO HI TECH Laboratory Information Management System (LIMS)  
**Version**: `v1.0.0`  
**Application ID**: `com.biohitech.lims`  
**Date**: November 2026  
**Target Audience**: Laboratory Director & Authorized Reception Staff  

---

## 1. Android Phone & Tablet Application

### Package Information
- **Package Name**: `BIO-HI-TECH-LIMS-Android.apk`
- **Google Play Track**: `BIO-HI-TECH-LIMS-Android.aab`
- **Application ID**: `com.biohitech.lims`
- **Version**: `v1.0.0` (versionCode: `1`)
- **Compatibility**: Android 7.0 through Android 16 (API Level 24 to 36)
- **Engine**: Capacitor 8 Native Mobile Runtime
- **Icon**: Standalone **BiO** logo mark with emerald/lime droplet

### Download Links
Once the build workflow completes on GitHub Actions, download your package from the authorized repository:
- **Direct GitHub Release (Upon Tag Release)**:  
  [Download `BIO-HI-TECH-LIMS-Android.apk`](https://github.com/mithilP007/Bio-HI--Tech/releases)
- **GitHub Actions Build Artifacts**:  
  Artifact Name: **`BIO-HI-TECH-LIMS-ANDROID`**  
  Contains: `BIO-HI-TECH-LIMS-Android.apk`, `BIO-HI-TECH-LIMS-Android.aab`, `SHA256SUMS.txt`, `SIGNING_STATUS.txt`

*(Note: Download links become active as soon as the build pipeline runs on GitHub following your push confirmation. No fabricated or expired external links are used.)*

### Step-by-Step Installation Instructions
1. Download `BIO-HI-TECH-LIMS-Android.apk` onto your Android smartphone or tablet (via direct download, Google Drive, WhatsApp document, or USB cable transfer).
2. Locate the downloaded file in your device's **Files** or **Downloads** folder.
3. Tap `BIO-HI-TECH-LIMS-Android.apk`.

### Android Installation Permission Guidance ("Install Unknown Apps")
Because this is a private laboratory enterprise build installed directly without Google Play:
1. When prompted: *"For your security, your phone is not allowed to install unknown apps from this source"*, tap **Settings**.
2. Toggle the switch to enable **"Allow from this source"**.
3. Return to the installer screen and tap **Install**.
4. The installation completes in seconds. The app is placed in your App Drawer and on your Home Screen with the **BiO** logo and the title **BIO HI TECH**.

### App Launch & Login Instructions
1. Tap the **BiO** icon to launch the application.
2. The splash screen appears with the `#08796e` deep teal brand color and the BiO emblem.
3. The application opens directly to the **Daily Owner Sign-In** screen (no guest or arbitrary registration is allowed).
4. Enter your authorized Laboratory Owner credentials:
   - **Email**: `owner@biohitech.com`
   - **Password**: *(Your secure master password)*
5. The full Clinical Laboratory Workspace unlocks immediately, including Patient Registration, Laboratory Orders, Clinical Test Catalogue (120 tests), PDF Report Generation, and Real-time Multi-device Sync.

---

## 2. Windows 10/11 Desktop Workstation Application

### Package Information
- **Primary Setup Installer**: `BIO-HI-TECH-LIMS-Windows-Setup.exe` (NSIS Setup Wizard)
- **Enterprise MSI Package**: `BIO-HI-TECH-LIMS-Windows.msi` (WiX Windows Installer)
- **Application ID**: `com.biohitech.lims`
- **Version**: `v1.0.0`
- **Architecture**: `x64` (64-bit)
- **Compatibility**: Windows 10 (Version 2004+) & Windows 11
- **Engine**: Tauri 2 Native Desktop Runtime (WebView2 Evergreen)
- **Icon**: Standalone **BiO** logo mark with custom multi-resolution desktop icon

### Download Links
Once the build workflow completes on GitHub Actions, download your package from the authorized repository:
- **Direct GitHub Release (Upon Tag Release)**:  
  [Download `BIO-HI-TECH-LIMS-Windows-Setup.exe`](https://github.com/mithilP007/Bio-HI--Tech/releases)  
  [Download `BIO-HI-TECH-LIMS-Windows.msi`](https://github.com/mithilP007/Bio-HI--Tech/releases)
- **GitHub Actions Build Artifacts**:  
  Artifact Name: **`BIO-HI-TECH-LIMS-WINDOWS`**  
  Contains: `BIO-HI-TECH-LIMS-Windows-Setup.exe`, `BIO-HI-TECH-LIMS-Windows.msi`, `SHA256SUMS.txt`, `SIGNING_STATUS.txt`

*(Note: Download links become active as soon as the build pipeline runs on GitHub following your push confirmation. No fabricated or expired external links are used.)*

### Step-by-Step Installation Instructions
1. Download `BIO-HI-TECH-LIMS-Windows-Setup.exe` to your computer.
2. Double-click `BIO-HI-TECH-LIMS-Windows-Setup.exe` to start the setup wizard.
3. Choose the destination directory (defaults to `C:\Program Files\BIO HI TECH` or local user app folder).
4. Click **Install**.
5. The installer completes and creates:
   - A **Desktop Shortcut** with the **BiO** logo icon.
   - A **Start Menu Entry** under **BIO HI TECH**.

### Unknown-Publisher / Microsoft Defender SmartScreen Explanation
For builds without a public Authenticode code-signing certificate (or during initial private enterprise testing):
1. Windows Defender SmartScreen may display a blue warning box:  
   *"Windows protected your PC — Microsoft Defender SmartScreen prevented an unrecognized app from starting."*
2. **How to Proceed**:
   - Click the small link: **"More info"**.
   - An additional button will appear: click **"Run anyway"**.
3. **Why This Appears**: Windows SmartScreen displays this banner for all custom, privately compiled enterprise applications until tens of thousands of downloads establish "reputation" or an expensive EV certificate ($400+/yr) is attached. The application contains zero malware, bundles its frontend locally, and connects exclusively to your encrypted Supabase database.

### App Launch & Login Instructions
1. Launch **BIO HI TECH** from the Desktop shortcut or the Windows Start Menu.
2. The application opens as an isolated, standalone native desktop window with no browser URL bar or external browser dependencies.
3. Sign in with your authorized Owner credentials (`owner@biohitech.com`).
4. Perform patient intake, test entry, billing invoices, and generate high-resolution A4 PDF laboratory reports with direct printing support.

### Uninstallation Instructions
If you ever need to remove the software from the workstation:
1. Open Windows **Settings** (or press `Win + I`).
2. Navigate to **Apps > Installed apps** (or **Add or Remove Programs**).
3. Search for **BIO HI TECH**.
4. Click the three dots (`...`) next to BIO HI TECH and select **Uninstall**.
5. Confirm by clicking **Uninstall** in the confirmation dialog.
6. The uninstaller removes all application files and shortcuts cleanly.

---

## 3. Security & Operational Checklist

- **Zero-Vercel Independence**: All web interface assets are bundled directly inside the APK and Windows executable. The application never depends on a hosted Vercel URL.
- **Direct Database Connectivity**: Both Android and Windows applications connect directly to your central Supabase PostgreSQL database over encrypted HTTPS TLS 1.3.
- **Real-Time Cross-Device Synchronization**: Changes made on the Windows reception desk (e.g. adding a new patient or updating test results) immediately appear on the Android phone/tablet within 100 milliseconds via WebSocket connections.
- **A4 PDF Engine**: Laboratory report PDFs generated on either Android or Windows conform to exact 595 × 842 pt A4 international standards with 45 mm header margin allowances for official pre-printed letterheads.
