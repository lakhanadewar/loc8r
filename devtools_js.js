// Loc8r DevTools Script
// This script runs in the DevTools context and can create panels

// Create a DevTools panel for Loc8r
chrome.devtools.panels.create(
  "Loc8r",
  "icons/icon16.png",
  "panel.html",
  (panel) => {
    console.log("Loc8r DevTools panel created");
    
    // Handle panel events
    panel.onShown.addListener((window) => {
      console.log("Loc8r panel shown");
      // Panel is now visible
    });
    
    panel.onHidden.addListener(() => {
      console.log("Loc8r panel hidden");
      // Panel is now hidden
    });
  }
);