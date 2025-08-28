# 🎨 Elegant Dashboard - Chrome Extension

A beautiful, modern Chrome extension that transforms your new tab page into an elegant dashboard with customizable widgets, featuring a stunning glassmorphism design and pastel color palette.

![Dashboard Preview](https://via.placeholder.com/800x400/8B5CF6/FFFFFF?text=Elegant+Dashboard+Preview)

## ✨ Features

### 🎯 Core Widgets
- **⏰ Time Widget**: Real-time local and world time display with timezone switcher
- **📅 Calendar Widget**: Interactive monthly calendar with navigation
- **✅ Todo List**: Persistent task management with checkboxes and local storage
- **🔗 Quick Links**: One-click access to popular services (Google Drive, Gmail, GitHub, Twitter, etc.)
- **💻 System Monitor**: Real-time CPU, memory, and storage usage visualization
- **🌤️ Weather Widget**: Current weather information display

### 🎨 Design Features
- **Glassmorphism Aesthetic**: Beautiful frosted glass effect with backdrop blur
- **Pastel Color Palette**: Soft, elegant colors with lavender/peach tones
- **Dark/Light Theme**: Toggle between themes with smooth transitions
- **Adaptive Design**: All containers adapt to display size using CSS clamp() and viewport units
- **Smooth Animations**: Hover effects and micro-interactions

### 🔧 Customization
- **Widget Visibility**: Show/hide individual widgets
- **Accent Color**: Customize the primary accent color
- **Widget Opacity**: Adjust transparency levels
- **Search Engine Selection**: Choose from Google, DuckDuckGo, Bing, YouTube, GitHub
- **Quick Links Management**: Add, edit, and remove custom quick links with 30+ icon options including AI chatbots
- **Bookmarks Management**: Add, edit, and remove custom bookmarks
- **Image Displayer**: Display random stock images with show/hide controls
- **Fully Adaptive Design**: All containers adapt to display size using CSS clamp() and viewport units

## 🚀 Installation

### Method 1: Chrome Web Store (Recommended)
1. Visit the Chrome Web Store
2. Search for "Elegant Dashboard"
3. Click "Add to Chrome"
4. Confirm installation

### Method 2: Manual Installation (Developer Mode)
1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked"
5. Select the extension folder
6. The extension will be installed and ready to use

## 📱 Usage

### Opening the Dashboard
- Open a new tab in Chrome
- The dashboard will automatically load
- Or click the extension icon in the toolbar

### Using the Search Bar
1. Type your search query in the search bar
2. Select your preferred search engine from the dropdown
3. Press Enter or click the search button
4. Results will open in a new tab

### Managing Todos
1. Type a task in the todo input field
2. Press Enter or click the + button
3. Click the checkbox to mark as complete
4. Click the trash icon to delete

### Customizing the Dashboard
1. Click the settings gear icon in the top right
2. Toggle widget visibility
3. Adjust accent color and opacity
4. Changes are saved automatically

### Managing Quick Links
1. Open the settings menu (gear icon)
2. Scroll to the "Quick Links Management" section
3. **Adding Links**: Fill in the name, URL, and select an icon, then click "Add Link"
4. **Editing Links**: Click the edit button (pencil icon) next to any link
5. **Changing Icons**: When editing, you can select a different icon from the dropdown
6. **Deleting Links**: Click the delete button (trash icon) to remove a link
7. **URL Validation**: Invalid URLs will show an error message
8. All changes are automatically saved and synced across devices

### Managing Bookmarks
1. Use the Bookmarks widget on the main dashboard
2. **Adding Bookmarks**: Enter a name and URL, then click the "+" button
3. **Editing Bookmarks**: Click the edit button (pencil icon) next to any bookmark
4. **Deleting Bookmarks**: Click the delete button (trash icon) to remove a bookmark
5. **URL Validation**: Invalid URLs will show an error message
6. All bookmarks are automatically saved and synced across devices

### Using the Image Displayer
1. The Image Displayer widget shows random stock images
2. **Load New Image**: Click "New Image" button or click on the image container
3. **Show/Hide Image**: Use the "Show/Hide" button to toggle image visibility
4. **Responsive**: The widget adapts to different screen sizes

### Theme Switching
- Click the moon/sun icon in the header
- Or use the theme toggle in the popup menu

## 🎛️ Widget Details

### Time Widget
- **Local Time**: Current time in your timezone
- **World Time**: Select different timezones from the dropdown
- **Auto-update**: Updates every second

### Calendar Widget
- **Monthly View**: Navigate between months with arrow buttons
- **Today Highlight**: Current date is highlighted
- **Weekend Styling**: Weekends are color-coded

### Todo Widget
- **Persistent Storage**: Todos are saved across browser sessions
- **Checkbox Interface**: Click to mark complete/incomplete
- **Delete Function**: Remove completed or unwanted tasks
- **Real-time Updates**: Changes sync immediately

### Quick Links Widget
- **Fully Customizable**: Add, edit, and remove quick links
- **Icon Selection**: Choose from 30+ predefined icons including AI chatbots (changeable during editing)
- **Persistent Storage**: Links are saved across browser sessions
- **Default Links**: Google Drive, Gmail, GitHub, Twitter, Calendar, World Time
- **Easy Management**: Edit links directly in the settings menu
- **Unlimited Links**: Add any amount of quick links as needed

### Bookmarks Widget
- **Custom Bookmarks**: Add, edit, and remove personal bookmarks
- **URL Validation**: Ensures valid URLs are entered
- **Persistent Storage**: Bookmarks are saved and synced across devices
- **Inline Editing**: Edit bookmark names and URLs directly
- **Clean Interface**: Organized list with edit and delete actions

### Image Displayer Widget
- **Random Images**: Display beautiful stock images from Picsum Photos
- **Show/Hide Controls**: Toggle image visibility
- **Click to Refresh**: Click the image container to load a new random image
- **Adaptive Design**: All containers adapt to display size using CSS clamp() and viewport units
- **Placeholder State**: Shows a placeholder when no image is displayed

### System Monitor Widget
- **CPU Usage**: Real-time processor utilization
- **Memory Usage**: RAM consumption display
- **Storage Usage**: Disk space monitoring
- **Animated Progress Bars**: Smooth visual feedback

### Weather Widget
- **Current Conditions**: Temperature and weather description
- **Location Display**: Shows current location
- **Weather Icon**: Visual representation of conditions

## 🛠️ Technical Details

### Built With
- **HTML5**: Semantic markup structure
- **CSS3**: Modern styling with CSS Grid and Flexbox
- **Vanilla JavaScript**: No framework dependencies
- **Chrome Extension APIs**: Manifest V3 compliance

### Browser Compatibility
- ✅ Chrome 88+
- ✅ Edge 88+
- ✅ Other Chromium-based browsers

### Storage
- **Chrome Storage API**: Settings and todos are synced across devices
- **Local Storage**: Fallback for offline functionality

## 🎨 Customization Guide

### Changing Colors
1. Open the settings modal
2. Use the color picker to select a new accent color
3. The change applies immediately across all widgets

### Adjusting Opacity
1. In settings, use the opacity slider
2. Range: 0.1 (very transparent) to 1.0 (fully opaque)
3. Affects all widget backgrounds

### Widget Layout
- **Adaptive Grid**: Uses CSS Grid with auto-fit and minmax() for fluid layouts
- **Minimum Width**: Responsive minimum width using clamp(min(280px, 100vw - 2rem), 1fr)
- **Dynamic Sizing**: All containers scale with viewport using clamp() functions
- **Fluid Gaps**: Spacing adapts from 0.75rem to 2rem based on screen size
- **Container Adaptation**: All widgets, modals, and popups adapt to display size

### Adaptive Design
- **CSS clamp() Functions**: All sizes use clamp() for fluid scaling
- **Viewport Units**: Responsive sizing using vw, vh, and viewport-relative units
- **Desktop (1200px+)**: Enhanced grid with larger widgets and optimal spacing
- **Tablet (768px-1199px)**: Adaptive grid with responsive gaps and sizing
- **Mobile (480px-767px)**: Single column with touch-optimized elements
- **Small Mobile (<480px)**: Ultra-compact layout with minimum viable sizing
- **Landscape Mobile**: Special optimizations for landscape orientation
- **High DPI Displays**: Optimized borders and scaling for retina screens
- **Touch-Friendly**: 44px minimum touch targets and reduced motion support

## 🔧 Development

### Project Structure
```
extension/
├── manifest.json          # Extension configuration
├── newtab.html           # Main dashboard page
├── newtab.js             # Dashboard functionality
├── styles.css            # Main stylesheet
├── popup.html            # Extension popup
├── popup.css             # Popup styles
├── popup.js              # Popup functionality
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md             # This file
```

### Local Development
1. Clone the repository
2. Make your changes
3. Load the extension in Chrome
4. Test your modifications
5. Reload the extension to see changes

### Building for Production
1. Replace placeholder icons with actual PNG files
2. Test all functionality thoroughly
3. Package for Chrome Web Store submission

## 🐛 Troubleshooting

### Extension Not Loading
- Ensure Developer mode is enabled
- Check that all files are present
- Verify manifest.json syntax

### Widgets Not Displaying
- Check browser console for errors
- Verify Chrome Storage permissions
- Try refreshing the new tab page

### Search Not Working
- Ensure the search query is not empty
- Check that the selected search engine is valid
- Verify internet connectivity

### Settings Not Saving
- Check Chrome Storage permissions
- Ensure you're signed into Chrome
- Try clearing browser cache

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

- **Issues**: Report bugs on GitHub
- **Feature Requests**: Use GitHub issues
- **Questions**: Check the troubleshooting section

## 🎉 Acknowledgments

- **Font Awesome**: Icons
- **Google Fonts**: Inter font family
- **Chrome Extension APIs**: Extension functionality
- **Glassmorphism Design**: Modern UI inspiration

---

**Made with ❤️ for a better browsing experience**

*Transform your new tab into an elegant, functional dashboard that enhances your productivity and browsing experience.*

