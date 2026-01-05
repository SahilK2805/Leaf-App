# 📱 Mobile App Setup Guide - Quick Start

## ✅ Your Configuration

- **Your IP Address:** `10.28.179.194`
- **API URL:** Already configured in `mobile-app/App.js`
- **Port:** `8000`

## 🚀 Quick Start (3 Steps)

### Step 1: Install Dependencies

```bash
cd mobile-app
npm install
```

### Step 2: Start Backend (IMPORTANT!)

**In the main project folder** (not mobile-app):

```bash
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

⚠️ **Must use `--host 0.0.0.0`** - this allows your phone to connect!

### Step 3: Start Mobile App

```bash
cd mobile-app
npm start
```

Then:
1. Install **Expo Go** app on your phone
2. Scan the QR code
3. App loads on your phone!

## 📱 Using the App

1. **Take Photo:** Tap "📸 Take Photo" to use camera
2. **Or Upload:** Tap "📷 Choose from Gallery" to select photo
3. **Analyze:** Tap "🔍 Check Plant Health"
4. **View Results:** See health status and recommendations

## ⚠️ Important Notes

### Same WiFi Required
- Phone and computer **must** be on the same WiFi network
- Check that both devices show the same WiFi name

### Backend Must Be Running
- Keep the backend terminal window open
- If you close it, the app won't work

### If IP Changes
If your computer gets a new IP address:
1. Run `ipconfig` again
2. Find your new IPv4 address
3. Edit `mobile-app/App.js` line 12
4. Update the IP address

## 🔧 Troubleshooting

### "Can't connect to server"

**Check these:**
1. ✅ Backend is running with `--host 0.0.0.0`
2. ✅ Phone and computer on same WiFi
3. ✅ IP address is `10.28.179.194` (or your current IP)
4. ✅ Firewall allows port 8000

**Try this:**
- Restart backend
- Restart Expo: `npm start`
- Check backend terminal for errors

### "Camera permission denied"

1. Go to phone Settings
2. Find Expo Go app
3. Enable Camera permission
4. Restart app

### App won't load

1. Make sure you're on same WiFi
2. Try restarting Expo: `npm start`
3. Clear Expo Go app cache
4. Reinstall Expo Go app

## 📊 What Works

✅ Camera integration
✅ Gallery photo selection  
✅ Real-time health analysis
✅ Farmer-friendly recommendations
✅ Visual health indicators
✅ Nutrient level analysis
✅ Soil pH estimation
✅ All 12 feature analysis

## 🎯 Next Steps

Once everything works:
1. Test with different leaf photos
2. Try both camera and gallery
3. Check all features display correctly
4. When ready, build for production

The app is ready to use! Just follow the 3 steps above. 🌿

