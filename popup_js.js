// Loc8r Popup Script
document.addEventListener('DOMContentLoaded', () => {
  const toggleButton = document.getElementById('toggleInspector');
  const clearConsoleButton = document.getElementById('clearConsole');
  const openDevToolsButton = document.getElementById('openDevTools');
  const statusElement = document.getElementById('status');

  let isInspectorActive = false;

  // Initialize popup
  init();

  async function init() {
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Check if we can inject scripts (not on chrome:// pages)
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
      showUnsupportedPage();
      return;
    }

    // Setup event listeners
    setupEventListeners();
    
    // Check inspector status
    checkInspectorStatus(tab.id);
  }

  function setupEventListeners() {
    toggleButton.addEventListener('click', handleToggleInspector);
    clearConsoleButton.addEventListener('click', handleClearConsole);
    openDevToolsButton.addEventListener('click', handleOpenDevTools);
  }

  async function handleToggleInspector() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    try {
      // Send message to content script to toggle inspector
      chrome.tabs.sendMessage(tab.id, { 
        action: 'toggleInspector' 
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error toggling inspector:', chrome.runtime.lastError.message || JSON.stringify(chrome.runtime.lastError));
          // Try to inject content script if it's not present
          injectAndRetry(tab.id);
        } else {
          // Update UI based on response
          isInspectorActive = response?.isActive || false;
          updateInspectorStatus();
        }
      });
      
    } catch (error) {
      console.error('Error in handleToggleInspector:', error.message || error.toString());
      injectAndRetry(tab.id);
    }
  }

  async function injectAndRetry(tabId) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['content.js']
      });
      
      // Try again after injection
      setTimeout(() => {
        chrome.tabs.sendMessage(tabId, { 
          action: 'toggleInspector' 
        }, (response) => {
          if (chrome.runtime.lastError) {
            showError('Failed to activate inspector. Please refresh the page.');
          } else {
            isInspectorActive = response?.isActive || false;
            updateInspectorStatus();
          }
        });
      }, 200);
      
    } catch (injectionError) {
      console.error('Injection error:', injectionError.message || injectionError.toString());
      showError('Cannot inject scripts on this page.');
    }
  }

  async function handleClearConsole() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => console.clear()
      });
      
      showSuccess('Console cleared!');
    } catch (error) {
      showError('Failed to clear console.');
    }
  }

  function handleOpenDevTools() {
    // This will be handled by the browser's built-in functionality
    showSuccess('Use F12 or right-click → Inspect to open DevTools');
  }

  function checkInspectorStatus(tabId) {
    chrome.tabs.sendMessage(tabId, { action: 'getStatus' }, (response) => {
      if (chrome.runtime.lastError) {
        // Content script not present
        isInspectorActive = false;
      } else {
        isInspectorActive = response?.isActive || false;
      }
      updateInspectorStatus();
    });
  }

  function updateInspectorStatus() {
    if (isInspectorActive) {
      statusElement.textContent = 'Inspector: Active';
      statusElement.className = 'status active';
      toggleButton.textContent = 'Deactivate Inspector';
    } else {
      statusElement.textContent = 'Inspector: Inactive';
      statusElement.className = 'status inactive';
      toggleButton.textContent = 'Activate Inspector';
    }
  }

  function showUnsupportedPage() {
    document.body.innerHTML = `
      <div class="header">
        <div class="logo">🎯 Loc8r</div>
        <div class="subtitle">Element Locator Tool</div>
      </div>
      <div class="section">
        <h3>⚠️ Unsupported Page</h3>
        <p style="font-size: 12px; line-height: 1.4; margin: 0;">
          Loc8r cannot run on browser internal pages (chrome://, chrome-extension://, etc.).
          <br><br>
          Please navigate to a regular website to use the extension.
        </p>
      </div>
    `;
  }

  function showSuccess(message) {
    showNotification(message, 'success');
  }

  function showError(message) {
    showNotification(message, 'error');
  }

  function showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 10px;
      left: 50%;
      transform: translateX(-50%);
      padding: 8px 16px;
      border-radius: 4px;
      font-size: 12px;
      z-index: 1000;
      ${type === 'success' 
        ? 'background: rgba(76, 175, 80, 0.9); color: white;' 
        : 'background: rgba(244, 67, 54, 0.9); color: white;'
      }
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remove after 2 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 2000);
  }
});