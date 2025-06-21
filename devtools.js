// Register the Loc8r DevTools panel
chrome.devtools.panels.create(
    "Loc8r", // title
    "icons/icon48.png", // icon
    "panel.html" // panel UI
);
