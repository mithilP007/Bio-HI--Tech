# BIO HI TECH — ANDROID BUILD GUIDE

This guide details the complete toolchain setup, configuration, build commands, and release signing procedures for generating native Android packages (`.apk` and `.aab`) using **Capacitor 8**.

---

## 1. Toolchain Prerequisites

To build the native Android application locally, ensure the following tools are installed:

| Tool | Version Requirement | Purpose |
| :--- | :--- | :--- |
| **Node.js** | v20.x or v22.x (LTS) | JavaScript runtime |
| **pnpm** | v10+ or v12+ | Project package manager |
| **Java Development Kit (JDK)** | OpenJDK / Eclipse Temurin 17 or 21 | Android Gradle build engine |
| **Android Studio** | Hedgehog (2023.1.1) or Ladybug (2024.2+) | Native IDE, SDK Manager & Emulators |
| **Android SDK Platforms** | API Level 34 (Android 14) & API Level 35 | Target build platform |
| **Android SDK Build-Tools** | 34.0.0 or 35.0.0 | AAPT2, D8/R8 byte-code compiler |

### Environment Variables
Configure the following in your shell profile (`~/.bashrc`, `~/.zshrc`, or Windows Environment Variables):
```bash
export JAVA_HOME="/usr/lib/jvm/temurin-17-jdk-amd64"   # Adjust for your JDK path
export ANDROID_HOME="$HOME/Android/Sdk"
export PATH="$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin"
```

---

## 2. Project Structure & Configuration

The Android project is managed under:
```
saran project/
├── capacitor.config.ts        # Capacitor 8 bridge configuration
├── out/                       # Next.js statically exported web assets
└── android/                   # Full native Android Studio Gradle project
    ├── app/
    │   ├── build.gradle       # Application level dependencies, SDK versions
    │   └── src/
    │       └── main/
    │           ├── AndroidManifest.xml  # Permissions, orientations, launch modes
    │           ├── assets/public/       # Bundled local web assets (from Next.js out/)
    │           └── res/                 # App icons, splash screens, colors
    └── build.gradle           # Project level Gradle configuration
```

### Key Configuration in `capacitor.config.ts`:
- **App ID**: `com.biohitech.lims`
- **App Name**: `BIO HI TECH`
- **Web Directory**: `out` (Locally packaged assets)
- **Server Scheme**: `https` (Ensures secure context for Web APIs like crypto and QR canvas)
- **Local Asset Guarantee**: `server.url` is NOT pointed to any remote hosting domain.

---

## 3. Step-by-Step Local Build Commands

Run all commands from the Next.js project directory:
```bash
cd "/home/mithil/Downloads/BIO-HI-TECH-LIMS/saran project"
```

### Step 1: Install Dependencies
```bash
pnpm install
```

### Step 2: Build Web Assets & Sync to Android
This compiles the Next.js frontend into static production assets (`out/`) and synchronizes them directly into `android/app/src/main/assets/public`:
```bash
pnpm cap:sync
```
*(Equivalent to running `pnpm build && npx cap sync android`)*.

### Step 3: Build Debug APK via Command Line
If JDK and Android SDK are configured:
```bash
cd android
./gradlew assembleDebug
```
The output debug APK will be located at:
`android/app/build/outputs/apk/debug/app-debug.apk`

### Step 4: Build via Android Studio GUI
To inspect, test on emulator, or deploy to a physical device:
```bash
npx cap open android
```
1. Android Studio will open the `android/` project.
2. Wait for Gradle sync to complete.
3. Select your connected tablet or emulator from the device dropdown.
4. Click **Run** (`Shift + F10`) or select **Build > Build Bundle(s) / APK(s) > Build APK(s)**.

---

## 4. Generating Signed Production Release Builds

### Step 1: Create a Production Release Keystore
If you do not have an existing release keystore, generate one using `keytool` (keep this file secure and NEVER commit it to Git):
```bash
keytool -genkey -v -keystore bio-hitech-release-key.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias biohitech -storepass YOUR_SECURE_PASSWORD -keypass YOUR_SECURE_PASSWORD
```

### Step 2: Configure Signing in `android/app/build.gradle`
Reference the keystore via environment variables or a local `keystore.properties` file:
```groovy
signingConfigs {
    release {
        storeFile file(System.getenv("KEYSTORE_PATH") ?: "bio-hitech-release-key.jks")
        storePassword System.getenv("KEYSTORE_PASSWORD")
        keyAlias System.getenv("KEY_ALIAS") ?: "biohitech"
        keyPassword System.getenv("KEY_PASSWORD")
    }
}
buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled true
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
}
```

### Step 3: Compile Signed Release APK and AAB
```bash
cd android
./gradlew assembleRelease
./gradlew bundleRelease
```
Outputs:
- **Release APK**: `android/app/build/outputs/apk/release/app-release.apk`
- **Release AAB**: `android/app/build/outputs/bundle/release/app-release.aab`

---

## 5. Automated Cloud CI/CD Build via GitHub Actions

Because native SDKs require substantial disk space and setup, BIO HI TECH includes a pre-configured GitHub Actions workflow (`.github/workflows/build-native.yml`).

To trigger an automatic build on GitHub's cloud runners:
1. Push your changes or create a version tag (e.g., `v1.0.0`).
2. Navigate to **Actions > Build Native Cross-Platform Packages**.
3. The runner automatically sets up JDK 17, Android SDK 34, exports Next.js, and builds:
   - `bio-hi-tech-1.0.0-debug.apk`
   - `bio-hi-tech-1.0.0-release.apk`
   - `bio-hi-tech-1.0.0-release.aab`
   - `SHA256SUMS.txt`
4. Download the compiled artifacts directly from the workflow summary page.
