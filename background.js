// Loc8r Extension Background Script
let connections = {};
let contextMenuEnabled = true;

// Initialize context menu on extension startup
chrome.runtime.onInstalled.addListener(() => {
  createContextMenu();
  
  // Show welcome notification
  chrome.notifications.create({
    title: "Loc8r Extension",
    message: "Extension installed! Right-click on any element to extract selectors.",
    type: "basic",
    iconUrl: "icons/icon48.png"
  });
});

// Handle connections from content script and devtools
chrome.runtime.onConnect.addListener((port) => {
  console.log('Port connected:', port.name);
  
  const messageHandler = (message, sender, sendResponse) => {
    console.log('Message received on port:', message);
    
    if (message.name === 'init') {
      connections[message.tabId] = port;
    } else if (message.name === 'getSelector') {
      // Forward selector request to content script
      chrome.tabs.sendMessage(message.tabId, message);
    }
  };

  port.onMessage.addListener(messageHandler);
  
  port.onDisconnect.addListener(() => {
    console.log('Port disconnected:', port.name);
    port.onMessage.removeListener(messageHandler);
    
    // Clean up connections
    for (const [tabId, connection] of Object.entries(connections)) {
      if (connection === port) {
        delete connections[tabId];
        break;
      }
    }
  });
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'copyToClipboard') {
    // Handle clipboard copying asynchronously
    (async () => {
      try {
        await copyTextToClipboard(message.text);
        sendResponse({ success: true });
      } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true; // Indicates async response
  }
  
  // For other message types, don't return true unless we need async response
  return false;
});

// Create context menu items
function createContextMenu() {
  // Remove existing menu items
  chrome.contextMenus.removeAll(() => {
    // Parent menu
    chrome.contextMenus.create({
      id: "loc8r-parent",
      title: "Loc8r - Extract Selectors",
      contexts: ["all"]
    });

    // Submenu items for different selector types
    chrome.contextMenus.create({
      id: "copy-id",
      parentId: "loc8r-parent",
      title: "Copy ID",
      contexts: ["all"]
    });

    chrome.contextMenus.create({
      id: "copy-name",
      parentId: "loc8r-parent",
      title: "Copy Name",
      contexts: ["all"]
    });

    chrome.contextMenus.create({
      id: "copy-class",
      parentId: "loc8r-parent",
      title: "Copy Class",
      contexts: ["all"]
    });

    chrome.contextMenus.create({
      id: "copy-css-selector",
      parentId: "loc8r-parent",
      title: "Copy CSS Selector",
      contexts: ["all"]
    });

    chrome.contextMenus.create({
      id: "copy-xpath",
      parentId: "loc8r-parent",
      title: "Copy XPath",
      contexts: ["all"]
    });

    chrome.contextMenus.create({
      id: "copy-xpath-absolute",
      parentId: "loc8r-parent",
      title: "Copy Absolute XPath",
      contexts: ["all"]
    });

    chrome.contextMenus.create({
      id: "copy-js-path",
      parentId: "loc8r-parent",
      title: "Copy JS Path",
      contexts: ["all"]
    });

    chrome.contextMenus.create({
      id: "copy-text-content",
      parentId: "loc8r-parent",
      title: "Copy Text Content",
      contexts: ["all"]
    });
  });
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  const message = {
    action: 'contextMenuClick',
    menuItemId: info.menuItemId,
    targetElementId: info.targetElementId,
    frameId: info.frameId || 0
  };

  // Function to send message with proper error handling
  const sendMessageToTab = () => {
    chrome.tabs.sendMessage(tab.id, message, (response) => {
      if (chrome.runtime.lastError) {
        console.log('Message send failed, will retry after script injection');
      }
    });
  };

  // First try to inject content script if needed
  chrome.tabs.sendMessage(tab.id, { action: 'ping' }, (response) => {
    if (chrome.runtime.lastError) {
      // Content script not present, inject it
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      }).then(() => {
        // Wait a bit then send the message
        setTimeout(sendMessageToTab, 100);
      }).catch(err => {
        console.error('Failed to inject content script:', err);
      });
    } else {
      // Content script is present, send message directly
      sendMessageToTab();
    }
  });
});

// Utility function to copy text to clipboard
async function copyTextToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    console.log('Text copied to clipboard:', text);
  } catch (err) {
    console.error('Failed to copy text to clipboard:', err);
    throw err;
  }
}

// Handle tab updates to reinject content script if needed
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && !tab.url.startsWith('chrome://')) {
    // Ensure content script is injected
    chrome.tabs.sendMessage(tabId, { action: 'ping' }, (response) => {
      if (chrome.runtime.lastError) {
        // Content script not responding, might need to inject
        chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ['content.js']
        }).catch(err => {
          // Silently fail for pages where injection is not allowed
          console.log('Script injection failed (this is normal for some pages):', err.message);
        });
      }
    });
  }
});