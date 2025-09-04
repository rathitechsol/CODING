# Gemini Insight - Screen Overlay Extension

A Chrome extension that uses Google's Gemini AI to solve on-screen questions through an intuitive screen overlay interface.

## Features

- **Screen Overlay**: Activate with Ctrl+Shift+G (or Cmd+Shift+G on Mac)
- **Visual Selection**: Click and drag to select any area of the screen
- **AI Integration**: Uses Google's Gemini API for intelligent problem solving
- **Polished UI**: Modern, non-intrusive interface with smooth animations
- **Secure Authentication**: OAuth 2.0 integration with Google accounts
- **Real-time Feedback**: Loading states and error handling

## Installation

### Prerequisites

1. **Google Cloud Project**: You'll need to create a Google Cloud project and enable the Gemini API
2. **API Key**: Generate a Gemini API key from the Google AI Studio
3. **Chrome Browser**: This extension requires Chrome or Chromium-based browsers

### Setup Steps

1. **Get your Gemini API Key**:
   - Go to [Google AI Studio](https://aistudio.google.com/)
   - Sign in with your Google account
   - Create a new API key
   - Copy the API key for later use

2. **Install the Extension**:
   - Download or clone this repository
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked" and select the extension folder
   - The extension should now appear in your extensions list

3. **Configure the Extension**:
   - Click the Gemini Insight extension icon in your browser toolbar
   - Enter your Gemini API key when prompted
   - The extension will now be ready to use

## Usage

1. **Activate Overlay**: Press `Ctrl+Shift+G` (or `Cmd+Shift+G` on Mac) on any webpage
2. **Select Area**: Click and drag to select the question or problem you want to solve
3. **Get Answer**: Click "Solve with Gemini" to process your selection
4. **View Results**: The AI response will appear in a movable panel
5. **Copy or Close**: Copy the answer or close the panel to continue browsing

## How It Works

1. **Screen Capture**: The extension captures the selected screen region as an image
2. **API Processing**: The image is sent to Google's Gemini API with a prompt to solve the problem
3. **Response Display**: The AI-generated answer is displayed in a polished overlay panel
4. **User Interaction**: Users can copy answers, make new selections, or close the overlay

## Technical Details

- **Manifest Version**: 3 (latest Chrome extension standard)
- **Permissions**: activeTab, scripting, storage, identity, tabs
- **API**: Google Gemini 1.5 Flash model
- **Image Format**: PNG for optimal quality
- **Security**: API keys stored locally, no data sent to third parties

## File Structure

```
gemini-insight-extension/
├── manifest.json          # Extension configuration
├── popup.html             # Extension popup interface
├── popup.css              # Popup styling
├── popup.js               # Popup functionality
├── content.js             # Content script for overlay
├── content.css            # Overlay styling
├── background.js          # Background service worker
├── overlay.html           # Standalone overlay (web accessible)
├── overlay.css            # Overlay styling
├── overlay.js             # Overlay functionality
└── README.md              # This file
```

## Privacy & Security

- **Local Storage**: API keys and settings are stored locally in your browser
- **No Data Collection**: The extension doesn't collect or store your personal data
- **Secure API Calls**: All communication with Gemini API uses HTTPS
- **Minimal Permissions**: Only requests necessary permissions for functionality

## Troubleshooting

### Common Issues

1. **Extension not activating**: Make sure you're on a supported webpage (not chrome:// pages)
2. **API errors**: Verify your Gemini API key is correct and has sufficient quota
3. **Selection not working**: Try refreshing the page and activating the overlay again
4. **Permission denied**: Check that the extension has the required permissions

### Debug Mode

To enable debug logging:
1. Go to `chrome://extensions/`
2. Find Gemini Insight and click "Details"
3. Click "Inspect views: background page"
4. Check the console for error messages

## Development

### Building from Source

1. Clone the repository
2. Make your changes
3. Load the extension in Chrome as described in installation
4. Test your changes

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues, questions, or feature requests, please open an issue on the GitHub repository.

## Changelog

### Version 1.0.0
- Initial release
- Screen overlay functionality
- Gemini API integration
- OAuth 2.0 authentication
- Polished UI with animations
- Keyboard shortcuts
- Error handling and user feedback
