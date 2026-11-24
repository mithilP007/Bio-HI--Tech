# BIO HI TECH — NATIVE INSTALLATION GUIDE

This document provides step-by-step installation instructions for laboratory owners and administrators installing **BIO HI TECH Laboratory Management Information System** across Android tablets, smartphones, and desktop computers (Linux & Windows).

---

## 1. System Requirements & Architecture

BIO HI TECH is packaged as native installable software. It does **not** run inside a web browser and does **not** rely on loading a public website URL.

```
                      ┌──────────────────────────────────────┐
                      │    Central Supabase Cloud Database   │
                      │   PostgreSQL + Auth + Storage + Sync │
                      └──────────────────┬───────────────────┘
                                         │
                    ┌────────────────────┴────────────────────┐
                    │                                         │
                    ▼                                         ▼
       ┌────────────────────────┐                ┌────────────────────────┐
       │   Android Tablet/Phone │                │   Desktop Workstation  │
       │   Capacitor 8 Native   │                │     Tauri 2 Native     │
       │  Local Bundled Assets  │                │  Local Bundled Assets  │
       └────────────────────────┘                └────────────────────────┘
```

---

## 2. Android Installation (Tablets & Phones)

### Target Devices
- Android tablets (e.g. Samsung Galaxy Tab S series/A series, Lenovo Tab, Xiaomi Pad).
- Android smartphones (Android 7.0 / API Level 24 up to Android 15+).

### Pre-requisites on the Device
1. Enable installing applications from your file browser:
   - Go to **Settings > Apps & Notifications > Special app access > Install unknown apps**.
   - Select your file browser (e.g., Files by Google or Samsung My Files) and toggle **Allow from this source**.

### Installation Steps
1. Copy `bio-hi-tech-1.0.0-release.apk` to the device (via USB cable, private cloud drive, or SD card).
2. Open the device's **Files** app and tap the APK file.
3. Tap **Install** when prompted.
4. Once completed, tap **Open**.
5. The **BIO HI TECH** icon (teal cross and brand mark) is now permanently added to your home screen and application drawer.
6. On first launch, the app connects directly to your central Supabase database. Enter the laboratory owner credentials to begin.

---

## 3. Linux Desktop Installation (Ubuntu / Debian / Mint / Fedora)

### Target Systems
- Linux workstation running Ubuntu 20.04+, Debian 11+, Linux Mint 21+, Fedora 38+, or Arch Linux.
- 64-bit x86_64 CPU architecture.

### Method A: Standalone AppImage (Zero Install)
The AppImage format runs immediately without requiring administrator root privileges or system dependencies.
1. Download `bio-hi-tech_1.0.0_amd64.AppImage` into your desired folder (e.g. `~/Applications`).
2. Open a terminal and grant executable permissions:
   ```bash
   chmod +x bio-hi-tech_1.0.0_amd64.AppImage
   ```
3. Run directly:
   ```bash
   ./bio-hi-tech_1.0.0_amd64.AppImage
   ```
4. To integrate into your desktop application menu, use **AppImageLauncher** or copy the provided desktop entry into `~/.local/share/applications/`.

### Method B: Debian Package (`.deb`)
For permanent system-wide installation with automatic desktop launcher integration:
1. Open a terminal in the directory containing `bio-hi-tech_1.0.0_amd64.deb`:
   ```bash
   sudo apt update
   sudo apt install ./bio-hi-tech_1.0.0_amd64.deb
   ```
2. Launch the application:
   - Press the `Super` (Windows) key and type **BIO HI TECH**.
   - Click the application icon to launch.
   - Or run from terminal: `bio-hi-tech`.

---

## 4. Windows Desktop Installation (Windows 10 / Windows 11)

### Target Systems
- Reception PCs and reporting desks running Windows 10 (version 1903+) or Windows 11.
- 64-bit architecture.

### Installation Steps
1. Locate `bio-hi-tech_1.0.0_x64-setup.exe`.
2. Double-click the installer executable.
3. If Windows SmartScreen displays a warning (*"Windows protected your PC"*):
   - Click **More info**.
   - Click **Run anyway**. *(This is normal for proprietary private medical software distributed outside the public Microsoft Store).*
4. Choose the installation directory (default: `C:\Program Files\BIO HI TECH`) and check **Create Desktop Shortcut**.
5. Click **Install**, then click **Finish** to launch the software.
6. The BIO HI TECH icon appears on your desktop and Start menu.

---

## 5. Post-Installation Initial Setup

1. **Launch the software**: When opened, the software validates local asset integrity.
2. **Network Connection**: Ensure the device is connected to the internet. If offline, a yellow **Offline** badge appears in the top navigation bar.
3. **Owner Authentication**: Enter your registered laboratory owner email and password.
4. **Data Synchronization**: Upon signing in, the central database synchronizes active patients, report drafts, test catalog, and financial ledgers across all paired devices in real time.
