# Building Target Specialties CRM Desktop App

This guide explains how to build the desktop application for Windows, macOS, and Linux using Electron.

## Prerequisites

1. **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
2. **Git** - [Download](https://git-scm.com/)

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# Install project dependencies
npm install

# Install Electron and build tools as dev dependencies
npm install --save-dev electron electron-builder concurrently wait-on
```

### 2. Update package.json

Add these scripts to your `package.json`:

```json
{
  "main": "electron/main.js",
  "scripts": {
    "electron:dev": "concurrently \"npm run dev\" \"wait-on http://localhost:8080 && NODE_ENV=development electron .\"",
    "electron:build": "npm run build && electron-builder",
    "electron:build:win": "npm run build && electron-builder --win",
    "electron:build:mac": "npm run build && electron-builder --mac",
    "electron:build:linux": "npm run build && electron-builder --linux"
  }
}
```

### 3. Development Mode

Run the app in development mode with hot-reload:

```bash
npm run electron:dev
```

This will:
- Start the Vite dev server on port 8080
- Launch Electron once the server is ready
- Enable DevTools for debugging

### 4. Building for Production

#### Build for all platforms (from macOS only):
```bash
npm run electron:build
```

#### Build for specific platform:

**Windows:**
```bash
npm run electron:build:win
```
Outputs: `.exe` installer and portable version

**macOS:**
```bash
npm run electron:build:mac
```
Outputs: `.dmg` and `.zip` files

**Linux:**
```bash
npm run electron:build:linux
```
Outputs: `.AppImage`, `.deb`, and `.rpm` packages

### 5. Build Output

Built applications will be in the `release/` directory:

```
release/
├── Target Specialties CRM-1.0.0-win-x64.exe
├── Target Specialties CRM-1.0.0-win-x64-portable.exe
├── Target Specialties CRM-1.0.0-mac-x64.dmg
├── Target Specialties CRM-1.0.0-mac-arm64.dmg
├── Target Specialties CRM-1.0.0-linux-x64.AppImage
├── Target Specialties CRM-1.0.0-linux-x64.deb
└── Target Specialties CRM-1.0.0-linux-x64.rpm
```

## Platform-Specific Notes

### Windows
- NSIS installer supports custom installation directory
- Creates desktop and start menu shortcuts
- Portable version available (no installation required)

### macOS
- Universal builds support both Intel (x64) and Apple Silicon (arm64)
- DMG includes drag-to-Applications installation
- You may need to sign the app for distribution

### Linux
- AppImage is portable and works on most distributions
- DEB packages for Ubuntu/Debian
- RPM packages for Fedora/RHEL/CentOS

## App Features in Desktop Mode

The desktop app includes:
- Native window controls
- Application menu with keyboard shortcuts
- Export/Import database from menu (Ctrl+E / Ctrl+I)
- External links open in default browser
- Automatic updates (if configured)

## Troubleshooting

### Build fails on Windows
- Run as Administrator
- Install Visual Studio Build Tools

### Build fails on macOS
- Install Xcode Command Line Tools: `xcode-select --install`
- For signing, set up Apple Developer certificates

### Build fails on Linux
- Install build dependencies: `sudo apt install build-essential`
- For RPM: `sudo apt install rpm`

## Support

For issues with the build process, check:
- [Electron Documentation](https://www.electronjs.org/docs)
- [Electron Builder Documentation](https://www.electron.build/)
