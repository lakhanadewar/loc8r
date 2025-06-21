# 🎯 Loc8r - Advanced Element Locator Tool

A powerful Chrome extension for web developers and QA testers to extract various types of element selectors and locators from web pages. Clean, ad-free, and developer-focused.

## ✨ Features

- **Multiple Selector Types**: Generate CSS selectors, XPath (relative & absolute), JavaScript paths, and more
- **Visual Inspector**: Real-time element highlighting with click-to-select functionality  
- **Context Menu Integration**: Right-click any element to access selector extraction options
- **DevTools Panel**: Dedicated panel in Chrome DevTools for advanced features
- **One-Click Copy**: Instantly copy selectors to clipboard
- **Console Logging**: Detailed element information logged for debugging
- **Keyboard Shortcuts**: Quick access with `Ctrl+Shift+L`
- **Export Functionality**: Export selector data as JSON

## 🚀 Installation

### From Source (Developer Mode)
1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory
5. The Loc8r extension should now appear in your extensions list

### Required Files Structure
```
loc8r-extension/
├── manifest.json
├── background.js
├── content.js
├── popup.html
├── popup.js
├── devtools.html
├── devtools.js
├── panel.html
├── panel.js
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

## 🎮 How to Use

### Method 1: Context Menu
1. Right-click on any element on a webpage
2. Select "Loc8r - Extract Selectors" from the context menu
3. Choose the selector type you want to copy
4. The selector is automatically copied to your clipboard

### Method 2: Inspector Mode
1. Click the Loc8r extension icon in the toolbar
2. Click "Activate Inspector" or use `Ctrl+Shift+L`
3. Click on any element on the page
4. View detailed information in console and DevTools panel
5. Press `Escape` to deactivate inspector

### Method 3: DevTools Panel
1. Open Chrome DevTools (`F12`)
2. Navigate to the "Loc8r" tab
3. Use the advanced features and export functionality

## 🔧 Available Selector Types

| Selector Type | Description | Example |
|---------------|-------------|---------|
| **ID** | Element's ID attribute | `myButton` |
| **Name** | Element's name attribute | `username` |
| **Class** | Element's class names | `btn btn-primary` |
| **CSS Selector** | Optimized CSS selector | `#myButton.btn` |
| **XPath (Relative)** | Relative XPath expression | `//button[@id="myButton"]` |
| **XPath (Absolute)** | Absolute XPath from root | `/html/body/div[1]/button[2]` |
| **JavaScript Path** | JavaScript DOM query | `document.getElementById("myButton")` |
| **Text Content** | Element's text content | `Click Me` |

## ⌨️ Keyboard Shortcuts

- `Ctrl+Shift+L` - Toggle inspector mode
- `Escape` - Deactivate inspector mode
- `F12` - Open DevTools (browser shortcut)

## 🛠️ Technical Details

### Permissions Used
- `activeTab` - Access current tab for element inspection
- `contextMenus` - Create right-click context menu options
- `storage` - Store user preferences
- `tabs` - Communicate between extension components

### Browser Compatibility
- **Chrome**: Full support (Manifest V3)
- **Edge**: Compatible (Chromium-based)
- **Firefox**: Would require manifest adjustments
- **Opera**: Should work with Chromium base

### Architecture
- **Background Script**: Handles context menus and extension lifecycle
- **Content Script**: Injected into web pages for element interaction
- **Popup**: Extension toolbar popup interface
- **DevTools Panel**: Advanced features within Chrome DevTools

## 🐛 Troubleshooting

### Extension Not Working
1. Refresh the webpage after installing
2. Check if you're on a supported page (not chrome:// URLs)
3. Reload the extension in `chrome://extensions/`

### Inspector Not Activating
1. Make sure you're not on a restricted page
2. Try refreshing the page and activating again
3. Check browser console for error messages

### Selectors Not Copying
1. Ensure clipboard permissions are granted
2. Try using the manual copy buttons in DevTools panel
3. Check if popup blockers are interfering

## 🚫 Limitations

- Cannot run on browser internal pages (`chrome://`, `chrome-extension://`)
- Some dynamically generated content may need page refresh
- Complex shadow DOM elements may have limited selector options

## 🔄 Development

### Building Icons
You'll need to create icon files:
- `icons/icon16.png` (16x16px)
- `icons/icon48.png` (48x48px) 
- `icons/icon128.png` (128x128px)

### Testing
1. Load extension in developer mode
2. Test on various websites
3. Check console for any errors
4. Verify all selector types generate correctly

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.
---

**Happy element locating! 🎯**
