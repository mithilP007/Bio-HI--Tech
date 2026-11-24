# BIO HI TECH — APPLICATION UPDATE & LIFECYCLE GUIDE

This guide explains the update architecture for BIO HI TECH, distinguishing clearly between **real-time database updates** and **native binary software updates**.

---

## 1. Data Updates vs Software Updates

| Update Category | Scope | Mechanism | User Intervention |
| :--- | :--- | :--- | :--- |
| **Data Updates** | Patient records, test pricing, catalogue additions, draft reports, payment receipts, laboratory address/contact | Supabase PostgreSQL + Realtime WSS channels | **None required**. Data updates synchronize seamlessly across all active devices in under 2 seconds. |
| **Software Updates** | UI design improvements, new report formatting templates, new native capabilities, security patches, framework updates | Native package distribution (Tauri Updater / Versioned APK) | User downloads or applies the verified update package. |

---

## 2. Desktop Application Updates (Tauri 2 Updater)

Tauri 2 includes an integrated cryptographic auto-update system.

### How It Works:
1. When the desktop app launches, it checks a secure HTTPS endpoint (`https://updates.biohitech.com/desktop/latest.json` or private Supabase storage bucket).
2. The endpoint returns the latest version number, release notes, and cryptographic signature.
3. If a new version exists, the app downloads the update delta or installer in the background.
4. On next launch, the update is verified against the private minisign public key and applied.

### Generating Desktop Signing Keys (minisign):
```bash
npx tauri signer generate -w ~/.tauri/biohitech.key
```
This produces:
- **Private key**: Stored securely on the CI build runner or release manager's encrypted vault. **NEVER COMMIT TO GIT**.
- **Public key**: Embedded in `src-tauri/tauri.conf.json` under `plugins.updater.pubkey`.

### Updater Configuration in `tauri.conf.json`:
```json
{
  "plugins": {
    "updater": {
      "pubkey": "dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk...",
      "endpoints": [
        "https://your-supabase-project.supabase.co/storage/v1/object/public/app-releases/desktop/latest.json"
      ]
    }
  }
}
```

---

## 3. Android Application Updates (Capacitor 8)

### Option A: In-App Update Prompt (Direct Sideloading)
For independent lab deployments without Google Play:
1. The app queries the version endpoint on startup.
2. If `currentVersion < remoteVersion`, a non-intrusive banner appears:
   *"BIO HI TECH Version 1.1.0 is available. Tap here to download."*
3. Tapping the button downloads the new signed APK to the device Downloads folder.
4. Android package installer prompts the owner to tap **Update** (user data and database logins are preserved across updates).

### Option B: Google Play Internal App Sharing / Closed Testing
1. Generate the versioned `.aab` file:
   ```bash
   cd "saran project/android"
   ./gradlew bundleRelease
   ```
2. Upload `app-release.aab` to the Google Play Console under **Internal testing**.
3. Registered lab test devices receive automatic updates via the Google Play Store background updater.

---

## 4. Semantic Versioning Protocol

Every release must increment the version in the following coordinated locations:
1. `saran project/package.json` (`"version": "1.1.0"`)
2. `saran project/src-tauri/tauri.conf.json` (`"version": "1.1.0"`)
3. `saran project/src-tauri/Cargo.toml` (`version = "1.1.0"`)
4. `saran project/android/app/build.gradle` (`versionCode 2`, `versionName "1.1.0"`)

### Versioning Rules:
- **Patch (1.0.x)**: Bug fixes, barcode/QR adjustments, styling tweaks.
- **Minor (1.x.0)**: New laboratory workflows, new report layouts, enhanced analytics.
- **Major (x.0.0)**: Database schema breaking changes, major platform shifts.
