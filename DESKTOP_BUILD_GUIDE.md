# BIO HI TECH — DESKTOP BUILD GUIDE (TAURI 2)

This guide covers building native desktop executables and installers for **Linux** (`.AppImage`, `.deb`) and **Windows** (`.exe`, `.msi`) using **Tauri 2**.

---

## 1. Architecture Overview

Tauri 2 couples the shared React 19 / Next.js production bundle with an ultra-lightweight Rust native backend.

- **Desktop binary size**: ~15 MB (compared to 150+ MB for Electron).
- **Memory footprint**: ~35 MB idle RAM.
- **Rendering engine**: System-native webview (WebKitGTK on Linux, Microsoft WebView2 on Windows).
- **Security**: Granular Rust capability permissions and local Content Security Policy (CSP).

```
src-tauri/
├── Cargo.toml                 # Rust dependencies & package definition
├── tauri.conf.json            # Window dimensions, CSP, bundle configs
├── capabilities/
│   └── default.json           # Native capability grants
└── src/
    ├── main.rs                # Desktop executable entry point
    └── lib.rs                 # Core Tauri application logic & builder
```

---

## 2. Linux Desktop Build Instructions

### Toolchain Prerequisites (Ubuntu / Debian)
Install the Rust toolchain and Linux system webview libraries:
```bash
# 1. Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# 2. Install native system build dependencies
sudo apt update
sudo apt install -y \
  libwebkit2gtk-4.1-dev \
  build-essential \
  curl \
  wget \
  file \
  libxdo-dev \
  libssl-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev
```

### Local Build Commands
Navigate to the Next.js project directory:
```bash
cd "/home/mithil/Downloads/BIO-HI-TECH-LIMS/saran project"
```

1. **Test during development (Hot Reloading)**:
   ```bash
   pnpm tauri:dev
   ```
2. **Build Production Linux Installers**:
   ```bash
   pnpm tauri:build
   ```
   Tauri compiles the Rust binary and bundles:
   - **AppImage**: `src-tauri/target/release/bundle/appimage/bio-hi-tech_1.0.0_amd64.AppImage`
   - **Debian Package**: `src-tauri/target/release/bundle/deb/bio-hi-tech_1.0.0_amd64.deb`

---

## 3. Windows Desktop Build Instructions

### Toolchain Prerequisites (Windows 10 / 11)
1. **Install Visual Studio Build Tools 2022**:
   - Check the **"Desktop development with C++"** workload.
2. **Install Rust**:
   - Download and run `rustup-init.exe` from [rustup.rs](https://rustup.rs) (choose `x86_64-pc-windows-msvc` default).
3. **Install WiX Toolset** (Optional, for `.msi` package generation):
   - Install WiX 3.11 from [wixtoolset.org](https://wixtoolset.org) or via `winget install WiX`.
4. **WebView2**:
   - Pre-installed on Windows 10/11.

### Windows Build Commands
In PowerShell or Command Prompt:
```powershell
cd "saran project"
pnpm install
pnpm tauri:build
```
Tauri generates:
- **NSIS Setup Wizard**: `src-tauri\target\release\bundle\nsis\bio-hi-tech_1.0.0_x64-setup.exe`
- **WiX MSI Package**: `src-tauri\target\release\bundle\msi\bio-hi-tech_1.0.0_x64_en-US.msi`

---

## 4. Cross-Platform Compilation via GitHub Actions CI

When developing on a Linux workstation, Windows native binaries cannot be directly compiled locally without complex Wine toolchains. Instead, use the pre-configured GitHub Actions CI workflow (`.github/workflows/build-native.yml`):

1. Commit and push the repository to your GitHub remote.
2. The `build-windows` job automatically provisions a dedicated `windows-latest` virtual machine.
3. It installs Rust stable, builds the Next.js static export, and packages `bio-hi-tech_1.0.0_x64-setup.exe` and `bio-hi-tech_1.0.0_x64_en-US.msi`.
4. The installers are made available as downloadable release artifacts with SHA-256 checksums.

---

## 5. Security & Isolation Configurations

In `src-tauri/tauri.conf.json`:
- **Content Security Policy**:
  ```json
  "csp": "default-src 'self' ipc: http://ipc.localhost; img-src 'self' data: https: blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; connect-src 'self' https://*.supabase.co wss://*.supabase.co;"
  ```
- **Capability Isolation**: Native system dialogs and file system access are strictly locked down to application-specific scopes.
- **Zero Remote Website Loading**: Assets are loaded directly from the internal bundle (`../out`).
