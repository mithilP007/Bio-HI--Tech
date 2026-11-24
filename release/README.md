# BIO HI TECH — Cross-Platform Release Distribution Hub

BIO HI TECH Laboratory Management Information System is distributed as native software for Android and Desktop workstations.

## Directory Structure

```
release/
├── README.md               # This index
├── android/                # Android APK & AAB binaries & checksums
│   ├── README.md
│   └── SHA256SUMS.txt
├── linux/                  # Linux AppImage & .deb binaries & checksums
│   ├── README.md
│   └── SHA256SUMS.txt
└── windows/                # Windows .exe & .msi installers & checksums
    ├── README.md
    └── SHA256SUMS.txt
```

## Platform Target Summary

| Platform | Packaging Technology | Target Distribution Formats | Primary Hardware |
| :--- | :--- | :--- | :--- |
| **Android** | Capacitor 8 | `.apk` (Direct Sideload), `.aab` (Play Store) | Tablets (Samsung Galaxy Tab, Lenovo Tab) & Phones |
| **Linux Desktop** | Tauri 2 | `.AppImage` (Portable), `.deb` (Debian/Ubuntu) | Lab Workstations, Ubuntu/Debian/Mint Reception PCs |
| **Windows Desktop** | Tauri 2 | `.exe` (NSIS Setup), `.msi` (WiX Package) | Windows 10/11 Lab Reception PCs & Reporting Desks |

## Zero-Remote-Website Guarantee

Every release binary generated from this codebase bundles the entire React 19 / Next.js production frontend **locally inside the binary**.

- Android assets are compiled into `android/app/src/main/assets/public`.
- Desktop assets are bundled inside the Tauri application resources (`frontendDist: "../out"`).
- At runtime, the application opens directly from internal disk storage without loading from any remote Vercel or web hosting domain.
- Network communication is strictly confined to encrypted HTTPS and WSS connections with the central Supabase PostgreSQL database.
