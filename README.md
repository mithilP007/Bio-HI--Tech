# BIO HI TECH LIMS — Laboratory Information Management System

A secure, private diagnostic laboratory management application with Next.js 16.4.6 static export, Capacitor 8 native Android support, Tauri 2 cross-platform desktop installers (Windows & Linux), and central Supabase PostgreSQL integration.

---

# BIO HI TECH LIMS — Download Applications

Direct installer packages built automatically by the multi-platform CI/CD pipeline.

> [!NOTE]
> **Repository Access Requirement:** This repository is strictly private. To download build artifacts from GitHub Actions runs, ensure you are signed into your authorized GitHub account with repository read permissions.

---

### 1. Android Phone & Tablet

**[Download Android Application (APK)](https://github.com/mithilP007/Bio-HI--Tech/releases/latest/download/BIO-HI-TECH-LIMS-Android.apk)**<br/>
*(Package: `BIO-HI-TECH-LIMS-Android.apk` · Architecture: Universal ARM64/x86_64 · Android API 24–36)*

#### Installation Instructions:
1. Tap the download link on your Android phone or transfer the `.apk` via USB/Google Drive.
2. Open the downloaded `BIO-HI-TECH-LIMS-Android.apk` file in your phone's File Manager or Downloads.
3. If prompted with *"For your security, your phone is not allowed to install unknown apps from this source"*, tap **Settings** and enable **Allow from this source**.
4. Tap **Install**, then tap **Open**.
5. Sign in using the authorized laboratory owner credentials (`owner@biohitech.com`).

---

### 2. Windows 10 & 11 (Laptop / Desktop)

* **[Download Windows Setup (Recommended EXE)](https://github.com/mithilP007/Bio-HI--Tech/releases/latest/download/BIO-HI-TECH-LIMS-Windows-Setup.exe)** (`BIO-HI-TECH-LIMS-Windows-Setup.exe`)
* **[Download Enterprise MSI Installer](https://github.com/mithilP007/Bio-HI--Tech/releases/latest/download/BIO-HI-TECH-LIMS-Windows.msi)** (`BIO-HI-TECH-LIMS-Windows.msi`)

#### Installation Instructions:
1. Download `BIO-HI-TECH-LIMS-Windows-Setup.exe` (or the `.msi` package).
2. Double-click the downloaded file to run the installer.
3. **If Windows Defender SmartScreen displays *"Windows protected your PC / Unknown Publisher"***:
   - Click **More info**.
   - Click **Run anyway**. *(This prompt appears because the application is built without an expensive third-party EV/OV commercial code-signing certificate; the binary is 100% genuine and compiled directly from source).*
4. Follow the setup wizard prompts to complete installation.
5. Launch **BIO HI TECH** from your Start Menu or Desktop shortcut.

---

### 3. Linux Desktop (Ubuntu / Debian)

* **[Download Standalone Linux AppImage](https://github.com/mithilP007/Bio-HI--Tech/releases/latest/download/BIO-HI-TECH-LIMS.AppImage)** (`BIO-HI-TECH-LIMS.AppImage`)
* **[Download Debian Package](https://github.com/mithilP007/Bio-HI--Tech/releases/latest/download/BIO-HI-TECH-LIMS.deb)** (`BIO-HI-TECH-LIMS.deb`)

#### Installation Instructions:
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

### 4. Build Artifacts Fallback (Direct CI Runs)

If a formal versioned GitHub Release tag (`v1.0.0`) has not yet been published, or if you wish to download the bleeding-edge build from the latest commit:

👉 **[View Latest Successful Build Artifacts on GitHub Actions](https://github.com/mithilP007/Bio-HI--Tech/actions/workflows/build-native.yml)**

1. Navigate to the link above.
2. Click the most recent workflow run with a green checkmark.
3. Scroll to the **Artifacts** section at the bottom of the summary page.
4. Download the desired platform package:
   - `BIO-HI-TECH-LIMS-ANDROID` (Contains `BIO-HI-TECH-LIMS-Android.apk`, `.aab`, `SHA256SUMS.txt`, `SIGNING_STATUS.txt`)
   - `BIO-HI-TECH-LIMS-WINDOWS` (Contains `BIO-HI-TECH-LIMS-Windows-Setup.exe`, `.msi`, `SHA256SUMS.txt`, `SIGNING_STATUS.txt`)
   - `BIO-HI-TECH-LIMS-LINUX` (Contains `BIO-HI-TECH-LIMS.AppImage`, `.deb`, `SHA256SUMS.txt`)

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
