# Installation Guide - Gemini Insight Extension

## Quick Start

### Step 1: Get Your Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Click "Get API Key" in the left sidebar
4. Create a new API key
5. Copy the API key (you'll need this later)

### Step 2: Install the Extension

1. **Download the Extension**:
   - Download this repository as a ZIP file
   - Extract it to a folder on your computer

2. **Load in Chrome**:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right corner)
   - Click "Load unpacked"
   - Select the folder containing the extension files
   - The extension should now appear in your extensions list

3. **Configure the Extension**:
   - Click the Gemini Insight icon in your browser toolbar
   - Enter your Gemini API key when prompted
   - Click "Save" to store your settings

### Step 3: Start Using

1. Go to any webpage with a question or problem
2. Press `Ctrl+Shift+G` (or `Cmd+Shift+G` on Mac)
3. Select the area you want to analyze
4. Click "Solve with Gemini"
5. View the AI-generated answer!

## Troubleshooting

### Extension Not Working?

- **Check API Key**: Make sure you've entered a valid Gemini API key
- **Refresh Page**: Try refreshing the webpage and activating the overlay again
- **Check Permissions**: Ensure the extension has the required permissions
- **Update Chrome**: Make sure you're using a recent version of Chrome

### Common Issues

**"API Error" messages**:
- Verify your API key is correct
- Check if you have sufficient API quota
- Ensure your internet connection is working

**Selection not working**:
- Make sure you're on a regular webpage (not chrome:// pages)
- Try refreshing the page
- Check if the extension is enabled

**Overlay not appearing**:
- Press `Ctrl+Shift+G` (or `Cmd+Shift+G` on Mac)
- Check if the extension is enabled in chrome://extensions/
- Try clicking the extension icon in the toolbar

## Need Help?

If you're still having issues:

1. Check the browser console for error messages
2. Go to `chrome://extensions/` and click "Details" on the extension
3. Click "Inspect views: background page" to see debug information
4. Open an issue on the GitHub repository with details about your problem

## Security Note

- Your API key is stored locally in your browser
- No data is sent to any servers except Google's Gemini API
- The extension only captures the specific area you select
- You can revoke your API key at any time from Google AI Studio
