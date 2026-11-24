# BIO HI TECH — Linux Desktop Distribution Packages

## Package Metadata

- **Application Name**: BIO HI TECH
- **Identifier**: `com.biohitech.lims`
- **Version**: `1.0.0`
- **Build Date**: 2026-11-21
- **Platform**: Linux Desktop (Ubuntu / Debian / Fedora / Arch / Mint)
- **Architecture**: `x86_64` (amd64)
- **Engine**: Tauri 2 (WebKitGTK 4.1)

## Distribution Artifacts

| Artifact Name | Owner Handover Name | Format | Target | Intended Use |
| :--- | :--- | :--- | :--- | :--- |
| `bio-hi-tech_1.0.0_amd64.AppImage` | `BIO-HI-TECH-LIMS.AppImage` | AppImage | Any Linux Distribution | Standalone zero-install portable executable |
| `bio-hi-tech_1.0.0_amd64.deb` | `BIO-HI-TECH-LIMS.deb` | Debian Package | Ubuntu / Debian / Mint | Native system package manager install with launcher icon |

## Checksums (SHA-256)

Checksums are recorded in `SHA256SUMS.txt` after binary generation:
```bash
sha256sum -c SHA256SUMS.txt
```

## Installation Instructions (Linux Workstation)

### Option A: AppImage (Portable — No Root Required)
1. Download or copy `BIO-HI-TECH-LIMS.AppImage`.
2. Make it executable:
   ```bash
   chmod +x BIO-HI-TECH-LIMS.AppImage
   ```
3. Run the application:
   ```bash
   ./BIO-HI-TECH-LIMS.AppImage
   ```
4. Optional: Integrate into the system menu with `appimaged` or [AppImageLauncher](https://github.com/TheAssassin/AppImageLauncher).

### Option B: Native Debian/Ubuntu Package (`.deb`)
1. Download or copy `BIO-HI-TECH-LIMS.deb`.
2. Install via APT or dpkg:
   ```bash
   sudo apt install ./BIO-HI-TECH-LIMS.deb
   ```
3. The application is now installed system-wide in `/usr/bin/bio-hi-tech`.
4. Launch BIO HI TECH directly from your desktop Application Menu or Super/Windows key search.

## Runtime Requirements
- `libwebkit2gtk-4.1-0` (pre-installed on modern Ubuntu 22.04+, Debian 12+, Fedora 38+)
- Active internet connectivity for real-time cloud synchronization with Supabase.
