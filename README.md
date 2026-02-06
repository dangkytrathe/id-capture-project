# ID Capture Project

A simple web application for capturing ID photos and collecting form data, with automatic saving to Google Sheets and Google Drive.

## Features

- 📸 Camera capture (works on desktop and mobile)
- 📝 Simple form with validation
- ☁️ Automatic save to Google Sheets
- 💾 Image storage in Google Drive
- 📱 Mobile-responsive design
- 🚀 Free hosting on GitHub Pages

## Phase 0 - Setup Instructions

### Task 0.1 - Create GitHub Repository

1. Go to [GitHub](https://github.com) and sign in
2. Click the "+" icon in the top-right and select "New repository"
3. Name it `id-capture-project`
4. Choose "Public" (required for free GitHub Pages)
5. Click "Create repository"

### Task 0.2 - Add Files to Repository

**Option A: Upload via Web Interface**
1. Click "uploading an existing file"
2. Upload these files:
   - `index.html`
   - `style.css`
   - `capture.js`
   - `README.md`
3. Click "Commit changes"

**Option B: Use Git Command Line**
```bash
git init
git add index.html style.css capture.js README.md
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/id-capture-project.git
git push -u origin main
```

### Task 0.3 - Enable GitHub Pages

1. Go to your repository on GitHub
2. Click "Settings" tab
3. Scroll down to "Pages" in the left sidebar
4. Under "Source", select:
   - Branch: `main`
   - Folder: `/ (root)`
5. Click "Save"
6. Wait 1-2 minutes for deployment
7. Your site will be live at: `https://YOUR_USERNAME.github.io/id-capture-project/`

### Task 0.4 - Test Website

**Local Testing:**
1. Open `index.html` in your browser (double-click the file)
2. Allow camera permissions when prompted
3. Test capture and form fields

**Online Testing:**
1. Visit your GitHub Pages URL
2. Test on desktop browser
3. Test on mobile browser
4. Verify camera works on both devices

### Task 0.5 - Connect to Google Sheets & Drive

#### Step 1: Create Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet called "ID Capture Data"
3. Add headers in row 1:
   - A1: `Timestamp`
   - B1: `Full Name`
   - C1: `ID Number`
   - D1: `Email`
   - E1: `Phone`
   - F1: `Notes`
   - G1: `Image URL`

#### Step 2: Create Google Drive Folder

1. Go to [Google Drive](https://drive.google.com)
2. Create a new folder called "ID Capture Images"
3. Right-click the folder → Share → Change to "Anyone with the link can view"
4. Copy the folder ID from the URL (the long string after `/folders/`)

#### Step 3: Create Google Apps Script

1. Open your Google Sheet
2. Click "Extensions" → "Apps Script"
3. Delete any default code
4. Paste the following code:

```javascript
// Configuration
const SHEET_NAME = 'Sheet1'; // Change if your sheet has a different name
const FOLDER_ID = 'YOUR_FOLDER_ID_HERE'; // Paste your folder ID here

function doPost(e) {
  try {
    // Parse the incoming data
    const data = JSON.parse(e.postData.contents);
    
    // Get the spreadsheet and sheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME);
    
    // Save image to Google Drive
    const imageUrl = saveImageToDrive(data.image, data.idNumber);
    
    // Append data to sheet
    sheet.appendRow([
      data.timestamp,
      data.fullName,
      data.idNumber,
      data.email,
      data.phone,
      data.notes,
      imageUrl
    ]);
    
    // Return success response
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Data saved successfully'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log('Error: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function saveImageToDrive(base64Image, idNumber) {
  try {
    // Remove data URL prefix
    const base64Data = base64Image.split(',')[1];
    
    // Convert base64 to blob
    const blob = Utilities.newBlob(
      Utilities.base64Decode(base64Data),
      'image/jpeg',
      `ID_${idNumber}_${Date.now()}.jpg`
    );
    
    // Get the folder
    const folder = DriveApp.getFolderById(FOLDER_ID);
    
    // Create file in folder
    const file = folder.createFile(blob);
    
    // Make file accessible
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    // Return the file URL
    return file.getUrl();
    
  } catch (error) {
    Logger.log('Image save error: ' + error.toString());
    return 'Error saving image: ' + error.toString();
  }
}

// Test function (optional)
function testDoPost() {
  const testData = {
    postData: {
      contents: JSON.stringify({
        timestamp: new Date().toISOString(),
        fullName: 'Test User',
        idNumber: 'TEST123',
        email: 'test@example.com',
        phone: '1234567890',
        notes: 'Test submission',
        image: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...' // Truncated for example
      })
    }
  };
  
  const result = doPost(testData);
  Logger.log(result.getContent());
}
```

4. Replace `YOUR_FOLDER_ID_HERE` with your actual folder ID
5. Save the project (give it a name like "ID Capture Backend")

#### Step 4: Deploy the Script

1. Click "Deploy" → "New deployment"
2. Click the gear icon ⚙️ next to "Select type"
3. Choose "Web app"
4. Configure:
   - Description: "ID Capture API v1"
   - Execute as: "Me"
   - Who has access: "Anyone"
5. Click "Deploy"
6. Click "Authorize access"
7. Choose your Google account
8. Click "Advanced" → "Go to [project name] (unsafe)"
9. Click "Allow"
10. **Copy the Web app URL** - you'll need this!

#### Step 5: Update Your Website

1. Open `capture.js` in your code editor
2. Find this line:
   ```javascript
   const SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';
   ```
3. Replace it with your actual URL:
   ```javascript
   const SCRIPT_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';
   ```
4. Save the file
5. Commit and push to GitHub:
   ```bash
   git add capture.js
   git commit -m "Add Google Apps Script URL"
   git push
   ```

#### Step 6: Final Testing

1. Wait 1-2 minutes for GitHub Pages to update
2. Visit your GitHub Pages URL
3. Capture a photo
4. Fill in the form
5. Click Submit
6. Check your Google Sheet - you should see a new row
7. Check your Google Drive folder - you should see the image

## Troubleshooting

### Camera doesn't work
- Ensure you've granted camera permissions
- HTTPS is required for camera access (GitHub Pages uses HTTPS automatically)
- Try a different browser

### Form submission fails
- Check that SCRIPT_URL is correctly set in `capture.js`
- Verify the Apps Script is deployed as "Anyone" can access
- Check browser console for errors (F12)

### Images not saving to Drive
- Verify FOLDER_ID is correct in Apps Script
- Check folder sharing settings
- Look at Apps Script logs: View → Logs

### Data not appearing in Sheet
- Confirm SHEET_NAME matches your actual sheet name
- Check Apps Script execution logs
- Try the testDoPost() function in Apps Script

## Browser Support

- ✅ Chrome (desktop & mobile)
- ✅ Firefox (desktop & mobile)
- ✅ Safari (desktop & mobile)
- ✅ Edge
- ❌ Internet Explorer (not supported)

## Project Structure

```
id-capture-project/
├── index.html       # Main HTML page
├── style.css        # Styling
├── capture.js       # Camera & form logic
└── README.md        # This file
```

## Security Notes

- Camera access requires user permission
- Form data is sent directly to your Google Apps Script
- Images are stored in your Google Drive
- No data is stored on GitHub or client browser
- Use "Anyone with link" sharing carefully

## License

MIT License - Feel free to use and modify!

## Support

If you encounter issues:
1. Check the Troubleshooting section above
2. Review browser console for errors
3. Check Apps Script execution logs
4. Create an issue in this repository

---

Made with ❤️ using GitHub Pages and Google Apps Script
