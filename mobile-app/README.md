# 🌿 Plant Health Check - Mobile App

A React Native mobile app built with Expo for farmers to check plant health using their phone camera.

## ✅ Pre-configured

The app is already configured with your IP address: **10.28.179.194**

## Quick Start

### 1. Install Dependencies

```bash
cd mobile-app
npm install
```

### 2. Start the Backend API

**Important:** Make sure to run the backend with `--host 0.0.0.0` so your phone can connect!

In the main project directory:
```bash
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

### 3. Start Expo

```bash
cd mobile-app
npm start
```

### 4. Connect Your Phone

1. **Install Expo Go** on your phone:
   - Android: [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - iPhone: [App Store](https://apps.apple.com/app/expo-go/id982107779)

2. **Make sure your phone and computer are on the same WiFi network**

3. **Scan the QR code** shown in the terminal/browser

4. The app will load on your phone!

## Features

- 📸 **Take Photos**: Use your phone camera to capture leaf images
- 🖼️ **Upload from Gallery**: Select existing photos from your gallery
- 🔍 **AI Analysis**: Get instant plant health analysis
- 💡 **Farmer-Friendly**: Clear, actionable recommendations
- 📊 **Health Metrics**: Visual health indicators and progress bars
- 🔬 **Advanced Features**: Nutrient levels, soil pH estimates, and more

## Troubleshooting

### Can't connect to API

1. **Check backend is running:**
   ```bash
   uvicorn app:app --reload --host 0.0.0.0 --port 8000
   ```
   ⚠️ Must use `--host 0.0.0.0` not `localhost`!

2. **Verify same WiFi:**
   - Phone and computer must be on the same network
   - Check WiFi name matches

3. **Check firewall:**
   - Windows Firewall might block port 8000
   - Allow Python/uvicorn through firewall

4. **Verify IP address:**
   - Your IP is: `10.28.179.194`
   - If your IP changes, update `App.js` line 12

### Camera not working

- Grant camera permissions when prompted
- Check phone Settings → Apps → Expo Go → Permissions
- Restart the app

### Image upload fails

- Check internet connection
- Verify API URL in App.js
- Check backend logs for errors

## Changing IP Address

If your IP address changes, edit `mobile-app/App.js`:

Find line 12:
```javascript
const API_URL = 'http://10.28.179.194:8000';
```

Update with your new IP address.

## Building for Production

### Android APK
```bash
expo build:android
```

### iOS IPA
```bash
expo build:ios
```

## Notes

- The app uses the same FastAPI backend as the web version
- All features from the web app are available in mobile
- Camera and gallery access requires permissions
- Works offline for viewing results, but needs internet for analysis

