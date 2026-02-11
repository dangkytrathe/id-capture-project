# ID Capture Project - Enhanced Version

A professional web application for capturing both sides of ID cards with real-time detection, automatic validation, and cloud storage.

## 🆕 New Features

- 📸 **Dual Capture** - Capture both front and back of ID cards
- 🎯 **Real-time Detection** - OpenCV.js detects ID card in frame
- ✅ **95% Coverage Requirement** - Ensures quality captures
- 📐 **Enforced Aspect Ratio** - 1.586:1 (credit card size)
- 🟢 **Visual Feedback** - Green/red borders with instructions
- 📊 **Upload Progress** - Shows percentage during submission
- 📱 **Mobile Optimized** - Works perfectly on phones and tablets

## Setup Instructions

### Prerequisites

- GitHub account
- Google account
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Step 1: Update Your Google Sheet

Your sheet needs **8 columns** now (not 7):

| A | B | C | D | E | F | G | H |
|---|---|---|---|---|---|---|---|
| Timestamp | Full Name | ID Number | Email | Phone | Notes | Front Image URL | Back Image URL |

**Important:** Add the 8th column header: `Back Image URL`

### Step 2: Update Your Apps Script

1. Open your Google Sheet
2. Go to Extensions → Apps Script
3. **Replace ALL code** with the updated `GoogleAppsScript.js`
4. Make sure these are set correctly:
   ```javascript
   const SHEET_NAME = 'Sheet1'; // Your sheet tab name
   const FOLDER_ID = '13v-YGmOI3hDiK2sPtJZX6tNFMAYmfCit'; // Your folder ID
   ```
5. Save (Ctrl+S)

### Step 3: Update Deployment

**If you already deployed:**
1. Deploy → Manage deployments
2. Click Edit (pencil icon)
3. Version → "New version"
4. Deploy
5. URL stays the same!

**If first deployment:**
1. Deploy → New deployment
2. Select "Web app"
3. Execute as: "Me"
4. Who has access: "Anyone"
5. Deploy and copy URL

### Step 4: Update capture.js

1. Open `capture.js`
2. Find this line:
   ```javascript
   const SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';
   ```
3. Replace with your actual URL:
   ```javascript
   const SCRIPT_URL = 'https://script.google.com/macros/s/YOUR_ID/exec';
   ```

### Step 5: Upload to GitHub

Upload these files to your repository:
- `index.html` (updated)
- `style.css` (updated)
- `capture.js` (updated)
- `README.md` (this file)
- `GoogleAppsScript.js` (for reference)

### Step 6: Test Everything

1. Visit your GitHub Pages URL
2. Click "Start Camera"
3. Position an ID card in the frame
4. Wait for **green border** (means 95%+ coverage detected)
5. Click "Capture Front Side"
6. Flip the card
7. Position for green border again
8. Click "Capture Back Side"
9. Fill in the form
10. Click Submit
11. Watch the upload progress bar
12. Check your Google Sheet - should see new row with 2 image URLs

## How It Works

### Real-time ID Detection

The app uses **OpenCV.js** to:
1. Analyze camera feed in real-time (10 times per second)
2. Detect rectangular shapes (ID cards)
3. Calculate coverage percentage
4. Show visual feedback:
   - 🟢 **Green border + "Perfect!"** = 95%+ coverage, ready to capture
   - 🔴 **Red border + "Move closer"** = < 95% coverage, adjust position
   - 🔴 **Dashed box + "Position ID"** = No card detected

### Aspect Ratio Enforcement

- Camera is locked to **1.586:1** ratio (standard ID card size)
- Captured images are automatically cropped to this ratio
- Ensures consistent, professional-looking captures

### Dual Capture Workflow

1. **Start Camera** → Camera opens showing front capture
2. **Capture Front** → Front side saved, switches to back capture
3. **Capture Back** → Back side saved, camera stops
4. **Retake** → Can retake either side if needed
5. **Submit** → Uploads both images with form data

## Troubleshooting

### OpenCV not loading
- **Symptom:** "Loading OpenCV..." message doesn't disappear
- **Fix:** Check internet connection, reload page

### Red border always shows
- **Symptom:** Never turns green even with card in frame
- **Fix:** 
  - Ensure good lighting
  - Position card flat and parallel to camera
  - Fill at least 95% of the frame
  - Try a contrasting background

### Both images not in Google Sheet
- **Symptom:** Only one image URL appears
- **Fix:** 
  - Make sure your sheet has 8 columns (add "Back Image URL")
  - Re-deploy your Apps Script with "New version"
  - Check Apps Script execution logs

### "Missing required fields" error
- **Fix:** Make sure BOTH front and back photos are captured before submitting

## Performance Tips

**For Best Detection:**
- Use good lighting (not too bright, not too dark)
- Plain contrasting background (dark card on light surface)
- Hold camera steady
- Keep card flat and parallel to camera
- Fill 95-100% of frame

## Technical Details

### OpenCV.js
- Version: 4.8.0
- Loaded from: `https://docs.opencv.org/4.8.0/opencv.js`
- Size: ~8MB (cached after first load)

### Image Quality
- Format: JPEG
- Quality: 90%
- Resolution: 1920px wide
- Aspect ratio: 1.586:1
- Average file size: 200-500KB per image

## Updates from Original Version

| Feature | Old | New |
|---------|-----|-----|
| Image Capture | Single | Front + Back |
| Detection | None | Real-time OpenCV |
| Visual Feedback | None | Green/red borders |
| Aspect Ratio | Variable | Locked 1.586:1 |
| Upload Progress | None | 0-100% bar |
| Coverage Check | None | 95% minimum |
| Sheet Columns | 7 | 8 |

## License

MIT License - Free to use and modify!

---

Made with ❤️ using OpenCV.js, GitHub Pages, and Google Apps Script
