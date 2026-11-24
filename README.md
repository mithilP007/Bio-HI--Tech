# BIO HI TECH LIMS — Laboratory Information Management System

A secure, private diagnostic laboratory management application with Next.js 16.4.6 static export, Capacitor 8 native Android support, Tauri 2 cross-platform desktop installers (Windows & Linux), and central Supabase PostgreSQL integration.

---

# BIO HI TECH LIMS — DOWNLOAD APPLICATIONS

> [!WARNING]
> ### QA INSTALLERS — FOR CONTROLLED TESTING ONLY (Channel: `v1.0.0-qa.2`)
> - **Android APK:** Debug-signed for immediate installation and testing on authorized Android devices. Permanent Google Play production signing remains pending laboratory owner keystore configuration.
> - **Windows Installers:** Unsigned binaries compiled directly from source. When launching, Windows Defender SmartScreen will prompt with *"Unknown Publisher"*; click **"More info" -> "Run anyway"**.
> - **Private Repository Requirement:** To download release assets or view Actions workflows, you must be signed into your authorized GitHub account with repository read permissions.

Direct installation packages are available from the official [QA Prerelease v1.0.0-qa.2](https://github.com/mithilP007/Bio-HI--Tech/releases/tag/v1.0.0-qa.2):

---

### 1. Android Phone & Tablet (QA Build)

* **[Download Android Application (APK)](https://github.com/mithilP007/Bio-HI--Tech/releases/download/v1.0.0-qa.2/BIO-HI-TECH-LIMS-Android.apk)**<br/>
  *(Package: `BIO-HI-TECH-LIMS-Android.apk` · Universal ARM64/x86_64 · Android API 24–36 · Status: QA Debug-Signed)*
* **[Download Android App Bundle (AAB)](https://github.com/mithilP007/Bio-HI--Tech/releases/download/v1.0.0-qa.2/BIO-HI-TECH-LIMS-Android.aab)**<br/>
  *(Package: `BIO-HI-TECH-LIMS-Android.aab` · Google Play Store Format)*

#### Android Installation Instructions:
1. Tap the download link on your Android device or transfer the `.apk` file to your device.
2. Open the downloaded `BIO-HI-TECH-LIMS-Android.apk` file in your device's File Manager or Downloads.
3. If prompted with *"For your security, your phone is not allowed to install unknown apps from this source"*, tap **Settings** and toggle **Allow from this source**.
4. Tap **Install**, then tap **Open**.
5. Sign in using the authorized laboratory owner credentials (`owner@biohitech.com`).

---

### 2. Windows 10 & 11 Laptop / Desktop (QA Unsigned)

* **[Download Windows Setup (Recommended EXE)](https://github.com/mithilP007/Bio-HI--Tech/releases/download/v1.0.0-qa.2/BIO-HI-TECH-LIMS-Windows-Setup.exe)**<br/>
  *(Package: `BIO-HI-TECH-LIMS-Windows-Setup.exe` · NSIS Installer · Status: QA Unsigned)*
* **[Download Enterprise MSI Installer](https://github.com/mithilP007/Bio-HI--Tech/releases/download/v1.0.0-qa.2/BIO-HI-TECH-LIMS-Windows.msi)**<br/>
  *(Package: `BIO-HI-TECH-LIMS-Windows.msi` · WiX MSI Installer · Status: QA Unsigned)*

#### Windows Installation Instructions:
1. Download `BIO-HI-TECH-LIMS-Windows-Setup.exe` (or `BIO-HI-TECH-LIMS-Windows.msi`).
2. Double-click the downloaded file to run the installer.
3. **When Windows Defender SmartScreen displays *"Windows protected your PC / Unknown Publisher"***:
   - Click **More info**.
   - Click **Run anyway**. *(This prompt appears because the application is built without a commercial EV/OV code-signing certificate; the binary is 100% genuine and compiled directly from source).*
4. Complete the installation wizard and launch **BIO HI TECH** from your Start Menu.

---

### 3. Linux Desktop (Ubuntu / Debian x86_64)

* **[Download Standalone Linux AppImage](https://github.com/mithilP007/Bio-HI--Tech/releases/download/v1.0.0-qa.2/BIO-HI-TECH-LIMS.AppImage)**<br/>
  *(Package: `BIO-HI-TECH-LIMS.AppImage` · Portable Executable)*
* **[Download Debian Package](https://github.com/mithilP007/Bio-HI--Tech/releases/download/v1.0.0-qa.2/BIO-HI-TECH-LIMS.deb)**<br/>
  *(Package: `BIO-HI-TECH-LIMS.deb` · Debian/Ubuntu Package)*

#### Linux Installation Instructions:
* **AppImage:** Make executable and run:
  ```bash
  chmod +x BIO-HI-TECH-LIMS.AppImage
  ./BIO-HI-TECH-LIMS.AppImage
  ```
* **DEB:** Install via apt:
  ```bash
  sudo apt install ./BIO-HI-TECH-LIMS.deb
  ```

---

### 4. Package Integrity Verification (SHA-256)

* **[Download Package Checksums (SHA256SUMS.txt)](https://github.com/mithilP007/Bio-HI--Tech/releases/download/v1.0.0-qa.2/SHA256SUMS.txt)**<br/>
  *(Cryptographic SHA-256 hashes generated automatically during the build process to verify download integrity).*

---

### 5. Build Artifacts Fallback (Direct GitHub Actions Runs)

If you wish to download the raw build artifacts directly from individual CI/CD runs:

👉 **[View Latest Native Packages Workflow on GitHub Actions](https://github.com/mithilP007/Bio-HI--Tech/actions/workflows/build-native.yml)**

1. Navigate to the link above (requires GitHub login with repository access).
2. Click the most recent workflow run with a green checkmark.
3. Scroll down to the **Artifacts** section to download individual platform zip archives:
   - `BIO-HI-TECH-LIMS-ANDROID`
   - `BIO-HI-TECH-LIMS-WINDOWS`
   - `BIO-HI-TECH-LIMS-LINUX`

*(Note: GitHub Actions artifacts are retained for 90 days according to standard repository retention policy).*

---

## Laboratory Contact & Clinic Details

* **Address:** #3/120, Tirupur Road, Perumanallur - 641 666. Tirupur District, Tamil Nadu, India
* **Landline:** `0421 2351981`
* **Mobile / WhatsApp:** `80987 90981` / `99525 88981`
* **Email:** `biohitech2018@gmail.com`

---

## Technical Architecture & Specifications

| Dimension | Specification |
| :--- | :--- |
| **Frontend Framework** | Next.js 16.4.6 App Router with `output: "export"` (137 static routes) |
| **Mobile Runtime** | Capacitor 8 (`@capacitor/android@8.6.2`), JDK 21, Android API 36 |
| **Desktop Runtime** | Tauri 2 (`tauri@2.12.7`), Microsoft Edge WebView2, WebKitGTK 4.1 |
| **Backend & Database** | Supabase PostgreSQL (`BIO-HI-TECH-DEV2`, Mumbai `ap-south-1`) |
| **Clinical Reference Range Engine** | Validated against 120 legacy tests, 211 parameters, 22 clinical panels |
| **Document Export** | Physical A4 PDF generation (`jsPDF` + `html2canvas`), Code 128 barcodes, PII-free QR verification |
| **Automated Test Coverage** | 173 automated tests (Static routing, Decoders, Ranges, E2E, Realtime, PDF, DB RLS) |
