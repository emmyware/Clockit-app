# Clock It - Android Installation Guide

## Quick Start: Install on Your Android Phone

### Step 1: Deploy the App Online
First, you need to host the app online. Choose one of these free options:

#### Option A: GitHub Pages (Easiest)
1. Go to [github.com](https://github.com) and create a free account
2. Create a new repository called "clockit-app"
3. Upload all the files from the `clockit-app` folder
4. Go to Settings → Pages
5. Select "Deploy from main branch"
6. Wait 1-2 minutes, your app will be live at: `https://yourusername.github.io/clockit-app`

#### Option B: Netlify (Fastest)
1. Go to [netlify.com](https://netlify.com) and sign up
2. Drag and drop the `clockit-app` folder into Netlify
3. Your app is instantly live with a URL like: `https://random-name.netlify.app`

### Step 2: Install on Android

1. **Open the app URL** in Chrome browser on your Android phone

2. **Look for the install prompt**:
   - Chrome will show "Add Clock It to Home screen" banner
   - OR tap the menu (⋮) → "Install app" or "Add to Home screen"

3. **Confirm installation**:
   - Tap "Install" or "Add"
   - The app icon will appear on your home screen

4. **Launch the app**:
   - Tap the Clock It icon from your home screen
   - The app opens in fullscreen mode, just like a native app!
   - No browser UI - it looks and feels like a real app

### Step 3: Grant Permissions (Optional but Recommended)

When you first use the app:

1. **Camera Permission**:
   - Tap "Take Photo" button
   - Allow camera access when prompted
   - This lets you capture photos directly

2. **Notifications**:
   - The app will ask for notification permission
   - Allow this to get daily/weekly reminders
   - You can change this later in Android settings

## Features After Installation

✅ **Works Offline** - Use the app without internet
✅ **Home Screen Icon** - Launch like any app
✅ **Fullscreen Mode** - No browser interface
✅ **Push Notifications** - Get reminders to capture moments
✅ **Fast Loading** - Instant startup with cached files
✅ **Data Privacy** - Everything stored on your device

## Testing Locally (For Development)

If you want to test before deploying:

1. Connect your Android phone and computer to the same WiFi
2. On your computer, run:
   ```bash
   cd clockit-app
   python3 -m http.server 8000
   ```
3. Find your computer's local IP (usually starts with 192.168.x.x)
4. On your Android phone, open Chrome and go to: `http://YOUR_IP:8000`
5. Install from there

## Troubleshooting

### "Add to Home screen" doesn't appear
- Make sure you're using Chrome browser
- Ensure the site is served over HTTPS (required for PWA)
- Check that manifest.json is loading correctly
- Try refreshing the page

### Camera doesn't work
- Check Android Settings → Apps → Chrome → Permissions
- Ensure camera permission is granted
- Try a different browser if issues persist

### Photos not saving
- Check available storage space
- Clear browser cache if localStorage is full
- LocalStorage has ~5-10MB limit

### Notifications not working
- Go to Android Settings → Apps → Clock It
- Enable notification permission
- Check that notifications aren't blocked system-wide

## Uninstall

To remove the app:
1. Long-press the Clock It icon on your home screen
2. Tap "Uninstall" or "Remove"
3. Confirm removal

Or from Android settings:
1. Settings → Apps → Clock It
2. Tap "Uninstall"

## Why PWA Instead of Native App?

**Advantages:**
- ✅ No need for Google Play Store
- ✅ No APK to download
- ✅ Instant updates (just refresh)
- ✅ Works on any platform (Android, iOS, Desktop)
- ✅ Smaller size than native apps
- ✅ No app store approval process
- ✅ Direct installation from web

**Native App-like Features:**
- ✅ Home screen icon
- ✅ Fullscreen experience
- ✅ Offline functionality
- ✅ Push notifications
- ✅ Camera access
- ✅ File system access
- ✅ Fast performance

## Next Steps

After installation:
1. Set your preferred frequency (daily or weekly)
2. Take your first photo
3. Build your collection over time
4. Create monthly or yearly compilations
5. Share on social media!

Happy moment capturing! 📸
