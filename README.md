# Clock It - Photo Journal App

A Progressive Web App (PWA) that helps you document your life by capturing one photo per day or week, and compile them into shareable social media posts.

## Features

- 📸 **Daily/Weekly Photo Capture** - Take one meaningful photo at your chosen frequency
- 📊 **Statistics Dashboard** - Track your total moments, monthly, and yearly captures
- 🖼️ **Photo Gallery** - Browse all your captured moments in a beautiful grid
- 📅 **Monthly & Yearly Compilations** - Generate collages for social media sharing
- 💾 **Offline Support** - Works without internet connection
- 🔔 **Push Notifications** - Get reminders to capture your moments (optional)
- 📱 **Install on Android** - Acts like a native app once installed

## Installation on Android

### Method 1: Install as PWA (Recommended)
1. Open Chrome browser on your Android device
2. Navigate to the app URL
3. Tap the menu (three dots) in the top-right corner
4. Select "Add to Home screen" or "Install app"
5. Follow the prompts to add the app icon to your home screen
6. Launch from your home screen like any other app!

### Method 2: Serve Locally for Testing
```bash
# Navigate to the app directory
cd /home/claude/clockit-app

# Start a simple HTTP server (Python 3)
python3 -m http.server 8000

# Or use Node.js http-server
npx http-server -p 8000

# Open in browser: http://localhost:8000
```

## How to Use

### 1. Set Your Frequency
- Tap the Settings button on the home screen
- Choose "Daily" or "Weekly" capture mode
- The app will remind you accordingly

### 2. Capture Moments
- Tap the "Take Photo" button
- Use your device camera to capture the moment
- Photo is automatically saved to your local collection

### 3. View Your Gallery
- Tap "Gallery" to see all your captured moments
- Photos are organized by date (newest first)

### 4. Create Compilations
- Tap "Compile" to access the compilation tool
- **Monthly Collage**: Select month and year, generate grid of that month's photos
- **Yearly Collage**: Select year, generate grid of the entire year's photos
- Download and share on social media!

## Technical Details

### Technologies Used
- **HTML5** - Structure and semantic markup
- **CSS3** - Responsive design with gradients and animations
- **Vanilla JavaScript** - No framework dependencies for optimal performance
- **Service Workers** - Offline functionality and caching
- **Web Storage API** - Local data persistence
- **Canvas API** - Collage generation
- **File API** - Photo capture and processing
- **Notifications API** - Push reminders (optional)

### Browser Compatibility
- Chrome/Edge (Android, Desktop)
- Safari (iOS, macOS)
- Firefox (Android, Desktop)

### Storage
- Photos are stored as base64 data URLs in localStorage
- Frequency preferences are persisted locally
- No server required - everything runs on device
- Note: localStorage has ~5-10MB limit per domain

### Privacy
- All data stays on your device
- No data sent to any server
- No analytics or tracking
- No account required

## File Structure
```
clockit-app/
├── index.html           # Main HTML structure
├── styles.css           # All styling and responsive design
├── app.js              # Core application logic
├── manifest.json       # PWA manifest for installation
├── service-worker.js   # Offline support and caching
├── icon-192.png        # App icon (192x192)
├── icon-512.png        # App icon (512x512)
└── README.md           # This file
```

## Future Enhancements

Potential features for future versions:
- Cloud backup (Firebase, Supabase, etc.)
- Social media direct integration
- Photo filters and editing
- Automatic collage templates
- Export to PDF
- Multi-device sync
- Weekly/monthly email digests
- Location tagging
- Mood/emotion tagging
- Search and filter by date/tag

## Development

To modify the app:

1. Edit the HTML structure in `index.html`
2. Adjust styles in `styles.css`
3. Modify logic in `app.js`
4. Update PWA settings in `manifest.json`
5. Test in Chrome DevTools with mobile device emulation
6. Use Chrome DevTools > Application > Service Workers to debug offline functionality

## Deployment

### Option 1: GitHub Pages (Free)
1. Create a GitHub repository
2. Upload all files
3. Enable GitHub Pages in repository settings
4. Access at `https://yourusername.github.io/clockit-app`

### Option 2: Netlify/Vercel (Free)
1. Create account on Netlify or Vercel
2. Connect your repository or drag-and-drop the folder
3. Deploy instantly
4. Get a custom domain or use provided subdomain

### Option 3: Your Own Server
1. Upload files to any web server
2. Ensure HTTPS is enabled (required for service workers)
3. Configure proper MIME types

## License

This is a demonstration project. Feel free to use, modify, and distribute as needed.

## Credits

Created as a demonstration of modern Progressive Web App capabilities for Android photo journaling.
