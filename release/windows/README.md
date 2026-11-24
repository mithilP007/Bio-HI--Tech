# BIO HI TECH — Windows Desktop Distribution Packages

## Package Metadata

- **Application Name**: BIO HI TECH
- **Identifier**: `com.biohitech.lims`
- **Version**: `1.0.0`
- **Build Date**: 2026-11-21
- **Platform**: Windows Desktop (Windows 10 / Windows 11)
- **Architecture**: `x64` (64-bit)
- **Engine**: Tauri 2 (Microsoft WebView2)

## Distribution Artifacts

| Artifact Name | Owner Handover Name | Format | Target | Intended Use |
| :--- | :--- | :--- | :--- | :--- |
| `bio-hi-tech_1.0.0_x64-setup.exe` | `BIO-HI-TECH-LIMS-Windows-Setup.exe` | NSIS Executable Installer | Windows 10/11 Workstations | User-friendly wizard installer creating Desktop & Start Menu shortcuts |
| `bio-hi-tech_1.0.0_x64_en-US.msi` | `BIO-HI-TECH-LIMS-Windows.msi` | WiX MSI Enterprise Package | Windows Active Directory / IT | Automated group policy or silent installation across lab reception PCs |

## Checksums (SHA-256)

Checksums are recorded in `SHA256SUMS.txt` after binary generation:
```powershell
Get-FileHash -Algorithm SHA256 bio-hi-tech_1.0.0_x64-setup.exe
```

## Installation Instructions (Windows Reception PC)

### Option A: Standard Setup (`.exe`)
1. Download `bio-hi-tech_1.0.0_x64-setup.exe`.
2. Double-click the installer.
3. If Windows SmartScreen displays "Windows protected your PC", click **More info** and select **Run anyway** (standard for privately distributed signed/unsigned enterprise software).
4. Follow the setup wizard prompts.
5. The BIO HI TECH shortcut will appear on your Desktop and in the Start Menu.
6. Launch the application and enter your Owner credentials.

### Option B: Enterprise MSI Installation
Run PowerShell or Command Prompt as Administrator:
```cmd
msiexec /i bio-hi-tech_1.0.0_x64_en-US.msi /quiet /norestart
```

## Runtime Requirements
- Microsoft Edge WebView2 Evergreen Runtime (pre-installed by default on Windows 10 version 2004+ and Windows 11).
- Outbound HTTPS (Port 443) access to Supabase PostgreSQL and Storage endpoints.
