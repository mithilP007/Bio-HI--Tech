# BIO HI TECH — Android Distribution Packages

## Package Metadata

- **Application Name**: BIO HI TECH
- **Application ID / Package**: `com.biohitech.lims`
- **Version**: `1.0.0`
- **Build Date**: 2026-11-21
- **Platform**: Android
- **Target SDK**: Android 16 (API Level 36)
- **Minimum SDK**: Android 7.0 (API Level 24)
- **Compiler**: JDK 21
- **Architecture**: Universal (`arm64-v8a`, `armeabi-v7a`, `x86_64`)

## Distribution Artifacts

| Artifact Name | Owner Handover Name | Format | Target | Intended Use |
| :--- | :--- | :--- | :--- | :--- |
| `app-release.apk` | `BIO-HI-TECH-LIMS-Android.apk` | APK | Direct Lab Owner Install | Independent lab tablet/phone installation (no Play Store needed) |
| `app-release.aab` | `BIO-HI-TECH-LIMS-Android.aab` | AAB | Google Play Console | Future private internal app sharing or closed testing track |
| `app-debug.apk` | `BIO-HI-TECH-LIMS-Android-debug.apk` | APK | Sideload / Development | Testing on developer Android devices via USB / ADB |

## Checksums (SHA-256)

Checksums are recorded in `SHA256SUMS.txt` after binary generation:
```bash
sha256sum -c SHA256SUMS.txt
```

## Installation Instructions (Android Device)

### Option A: Direct Sideloading (Recommended for Lab Owner)
1. Transfer `bio-hi-tech-1.0.0-release.apk` to the Android tablet or smartphone via USB cable, Google Drive, or local network.
2. On Android, navigate to **Settings > Security > Install unknown apps** and enable permission for your file manager or browser.
3. Tap `bio-hi-tech-1.0.0-release.apk` and tap **Install**.
4. Once installed, tap **Open**. The BIO HI TECH icon appears on your home screen and app launcher.
5. Log in using your Owner Supabase credentials.

### Option B: ADB Command-Line Installation
Connect the tablet via USB with Developer Mode and USB Debugging enabled:
```bash
adb install -r bio-hi-tech-1.0.0-release.apk
```

## Security Note
This application connects to the central Supabase PostgreSQL cloud database over HTTPS TLS 1.3 using public anon keys with strict Row Level Security (RLS). No database master keys or service passwords reside inside the APK.
