# Building Android APK

This guide explains how to build your Chor-Dakat-Babu-Pulish game as an Android APK.

## Prerequisites

You need to have the following installed:
- Node.js and npm
- Java Development Kit (JDK) 17 or later
- Android SDK
- Android Studio (recommended for easier setup)

### Quick Setup

1. Install Android Studio from https://developer.android.com/studio
2. During installation, choose to install Android SDK
3. Add these to your environment variables:
   - `ANDROID_HOME`: Point to your Android SDK directory (usually `~/Android/Sdk`)
   - `PATH`: Add `$ANDROID_HOME/cmdline-tools/latest/bin` and `$ANDROID_HOME/platform-tools`

## Build Instructions

### Step 1: Build Web Files
```bash
npm run build
```

### Step 2: Sync with Android Project
```bash
npm run build:android
```

### Step 3: Open Android Studio
```bash
npm run android
```

This opens Android Studio with the Capacitor Android project.

### Step 4: Build APK in Android Studio

1. In Android Studio, go to `Build` → `Build Bundle(s) / APK(s)` → `Build APK(s)`
2. Wait for the build to complete
3. You'll see a notification with the location of the APK file
4. The APK will be at: `android/app/build/outputs/apk/debug/app-debug.apk`

### Step 5: Install on Device or Emulator

**Using Command Line:**
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

**Using Android Studio:**
1. Connect your Android device or start an emulator
2. Click the green Play button in Android Studio

## Creating Release APK

For production/release builds:

1. In Android Studio: `Build` → `Build Bundle(s) / APK(s)` → `Build APK(s)`
2. Select `Release` variant instead of `Debug`
3. You'll need to create a signing key (follow Android Studio prompts)
4. The release APK will be at: `android/app/build/outputs/apk/release/app-release.apk`

## Troubleshooting

### Build fails with Gradle errors
- Run `./gradlew clean` in the android directory
- Try again with `npm run build:android`

### APK won't install
- Check that your device allows installation from unknown sources (Settings → Apps → Unknown sources)
- Uninstall any previous version first

### App crashes on startup
- Check that you built the web files first: `npm run build`
- Verify that `dist` folder exists and contains `index.html`

## App Configuration

The app is configured in `capacitor.config.ts`:
- **App Name**: Chor Dakat Babu Pulish
- **App Package ID**: com.chordakat.pulish
- **Web Directory**: dist (compiled React files)

To change these, edit `capacitor.config.ts` and rebuild.

## About Capacitor

Capacitor is a cross-platform framework that allows you to run your web app as a native mobile app. The app runs in a WebView but has access to native capabilities when needed.

For more information: https://capacitorjs.com
