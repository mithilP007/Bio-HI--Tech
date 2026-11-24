# BIO HI TECH LIMS — Native Installation & Deployment Guide

## 1. Overview
BIO HI TECH Laboratory Information Management System (LIMS) is an installed native desktop and mobile application. It is **not** a public website. When launched from its application icon, all application shell code, styles, and logic load directly from offline-capable local assets.

---

## 2. Android Installation (`com.biohitech.lims`)

### System Requirements
- Android 8.0 (Oreo / API Level 26) or higher.
- Minimum 100 MB free device storage.
- Active network connection for cloud synchronization with the Mumbai Supabase backend (`ap-south-1`).

### Installation Methods

#### A. Direct Sideloading (Debug APK / Release APK)
1. Download `BIO-HI-TECH-release.apk` (or `BIO-HI-TECH-debug.apk` for testing).
2. On your Android device, enable **Install unknown apps** for your file manager or browser:
   `Settings > Apps > Special app access > Install unknown apps`.
3. Open the downloaded APK file and tap **Install**.
4. The **BIO HI TECH** icon with the pulse mark will appear in your app drawer.
5. Tap the icon to launch. The splash screen will appear, followed by the Owner Authentication screen.

#### B. Play Store Distribution (Production AAB)
1. For Google Play Console release, upload `BIO-HI-TECH.aab` to internal/closed testing tracks.
2. Sign with Google Play App Signing key.

---

## 3. Linux Desktop Installation

### System Requirements
- 64-bit Linux distribution (Ubuntu 20.04+, Debian 11+, Fedora 36+, Arch Linux).
- WebKit2GTK 4.1 runtime (`libwebkit2gtk-4.1-0`).
- OpenSSL 1.1 or 3.0.

### Installation Methods

#### A. AppImage (Standalone Executable)
1. Download `BIO-HI-TECH.AppImage`.
2. Open terminal in the download folder and grant executable permissions:
   ```bash
   chmod +x BIO-HI-TECH.AppImage
   ```
3. Run the AppImage directly:
   ```bash
   ./BIO-HI-TECH.AppImage
   ```
4. Optional: Integrate into desktop menu using `AppImageLauncher`.

#### B. Debian / Ubuntu Package (`.deb`)
1. Download `BIO-HI-TECH.deb`.
2. Install via `dpkg` or `apt`:
   ```bash
   sudo dpkg -i BIO-HI-TECH.deb || sudo apt-get install -f -y
   ```
3. Launch "BIO HI TECH" from your application launcher or run `bio-hi-tech` in the terminal.

---

## 4. Windows Desktop Installation

### System Requirements
- Windows 10 (64-bit, Version 1903+) or Windows 11.
- Microsoft Edge WebView2 Evergreen Runtime (pre-installed on Windows 11 and recent Windows 10 updates).

### Installation Methods

#### A. NSIS Setup Installer (`BIO-HI-TECH-Setup.exe`)
1. Download `BIO-HI-TECH-Setup.exe`.
2. Double-click the installer. Follow the setup wizard to choose installation directory (Default: `%LOCALAPPDATA%\Programs\BIO-HI-TECH`).
3. Complete installation. A desktop shortcut and Start Menu entry for "BIO HI TECH" are created.
4. Launch the application from the desktop shortcut.

#### B. Windows Installer (`BIO-HI-TECH.msi`)
1. Useful for enterprise silent deployment:
   ```cmd
   msiexec /i BIO-HI-TECH.msi /quiet /qn /norestart
   ```

---

## 5. First-Time Launch & Owner Sign-In
1. Launch BIO HI TECH from the desktop or mobile icon.
2. The splash screen initializes secure storage and local encryption.
3. The Owner Authentication screen displays.
4. Enter the authorized owner credentials (email & password).
5. Upon successful allowlist verification, the full laboratory dashboard displays with real-time cloud synchronization active.
