# BIO HI TECH LIMS — Application Software Update Guide

## 1. Differentiating Data Sync vs. Software Updates

### Real-Time Clinical Data Updates
Changes to patients, test results, reports, pricing, and payments synchronize automatically over Supabase WebSockets and REST APIs in real time. **No software reinstall or application restart is ever required** for normal clinical laboratory operations.

### Software Feature & Binary Updates
When new native features, security patches, or UI enhancements are released, a new signed software package is compiled and distributed.

---

## 2. Desktop Application Updates (Tauri 2 Signed Updater)

### Architecture
Tauri 2 includes a cryptographic updater that validates digital signatures on all update packages before extraction or execution.
- **Public Key**: Bundled inside `saran project/src-tauri/tauri.conf.json` under `plugins.updater.pubkey`.
- **Private Signing Key**: Kept offline and protected (or stored as a GitHub Actions encrypted secret for automated CI compilation).

### Update Workflow
1. When launched, the application queries the update endpoint (`https://.../releases/latest.json`).
2. If a higher version number is detected, the application downloads the signed binary archive (`.tar.gz` for Linux, `.zip` for Windows).
3. The cryptographic signature is verified against the bundled public key using minisign/Ed25519.
4. If valid, the user is prompted: *"A new version of BIO HI TECH LIMS is available. Update and restart?"*
5. Upon confirmation, the application replaces itself and restarts seamlessly.

---

## 3. Android Application Updates (Capacitor 8)

### Sideloaded APK Upgrades
1. When a new release APK (`BIO-HI-TECH-release.apk`) is published, download it to the Android device.
2. Open the APK. Android package installer recognizes the existing package name `com.biohitech.lims`.
3. Tap **Update**.
4. The system updates the application binary while strictly preserving local keystore credentials and app settings.

### Google Play Store Upgrades
1. Upload the signed `BIO-HI-TECH.aab` to Google Play Console.
2. Create and roll out the release to internal/production tracks.
3. Connected devices receive the update automatically via the Play Store background updater.

---

## 4. Software Release Versioning Convention
BIO HI TECH follows Semantic Versioning (`MAJOR.MINOR.PATCH`):
- `MAJOR`: Schema-breaking architecture modifications.
- `MINOR`: New laboratory workflows, printing capabilities, or reporting modules.
- `PATCH`: Bug fixes, security patches, and minor styling refinements.
