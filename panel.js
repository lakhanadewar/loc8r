// Loc8r DevTools Panel Script
class Loc8rPanel {
  constructor() {
    this.isInspectorActive = false;
    this.currentElementData = null;
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.updateInspectorStatus();
  }

  setupEventListeners() {
    // Toggle inspector button
    document.getElementById('toggleInspector').addEventListener('click', () => {
      this.toggleInspector();
    });

    // Clear results button
    document.getElementById('clearResults').addEventListener('click', () => {
      this.clearResults();
    });

    // Export results button
    document.getElementById('exportResults').addEventListener('click', () => {
      this.exportResults();
    });

    // Listen for messages from content script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'elementSelected') {
        this.handleElementSelected(message.data);
      }
    });

    // Connect to background script
    try {
      this.port = chrome.runtime.connect({ name: 'devtools-panel' });
      this.port.postMessage({
        name: 'init',
        tabId: chrome.devtools.inspectedWindow.tabId
      });
      
      this.port.onMessage.addListener((message) => {
        // Handle messages from background script
        console.log('Message from background:', message);
      });
      
      this.port.onDisconnect.addListener(() => {
        console.log('DevTools panel disconnected from background');
        if (chrome.runtime.lastError) {
          console.error('Connection error:', chrome.runtime.lastError.message);
        }
      });
    } catch (error) {
      console.error('Failed to connect to background script:', error);
    }
  }

  async toggleInspector() {
    try {
      // Get current tab
      const tabId = chrome.devtools.inspectedWindow.tabId;
      
      // Send message to content script
      const response = await this.sendMessageToContentScript({
        action: 'toggleInspector'
      });

      this.isInspectorActive = !this.isInspectorActive;
      this.updateInspectorStatus();

    } catch (error) {
      console.error('Error toggling inspector:', error);
      this.showNotification('Failed to toggle inspector. Please refresh the page.', 'error');
    }
  }

  updateInspectorStatus() {
    const button = document.getElementById('toggleInspector');
    const indicator = document.getElementById('statusIndicator');

    if (this.isInspectorActive) {
      button.textContent = '⏹️ Deactivate Inspector';
      indicator.className = 'status-indicator active';
    } else {
      button.innerHTML = '<span class="status-indicator inactive" id="statusIndicator"></span>Activate Inspector';
      indicator.className = 'status-indicator inactive';
    }
  }

  handleElementSelected(elementData) {
    this.currentElementData = elementData;
    this.updateCurrentElement();
    this.updateSelectorsList();
  }

  updateCurrentElement() {
    const container = document.getElementById('currentElement');
    
    if (!this.currentElementData) {
      container.innerHTML = '<div class="empty-state">No element selected. Activate inspector and click on an element.</div>';
      return;
    }

    const data = this.currentElementData;
    container.innerHTML = `
      <div class="element-info">
        <div class="info-item">
          <span class="info-label">Tag Name:</span>
          <span class="info-value">${data.tagName}</span>
          <button class="copy-btn" onclick="copyToClipboard('${data.tagName}')">Copy</button>
        </div>
        <div class="info-item">
          <span class="info-label">ID:</span>
          <span class="info-value">${data.id || 'N/A'}</span>
          ${data.id ? `<button class="copy-btn" onclick="copyToClipboard('${data.id}')">Copy</button>` : ''}
        </div>
        <div class="info-item">
          <span class="info-label">Class:</span>
          <span class="info-value">${data.className || 'N/A'}</span>
          ${data.className ? `<button class="copy-btn" onclick="copyToClipboard('${data.className}')">Copy</button>` : ''}
        </div>
        <div class="info-item">
          <span class="info-label">Text:</span>
          <span class="info-value">${data.textContent || 'N/A'}</span>
          ${data.textContent ? `<button class="copy-btn" onclick="copyToClipboard('${data.textContent}')">Copy</button>` : ''}
        </div>
      </div>
    `;
  }

  updateSelectorsList() {
    const container = document.getElementById('selectorsList');
    
    if (!this.currentElementData) {
      container.innerHTML = '<div class="empty-state">Select an element to view its selectors.</div>';
      return;
    }

    const data = this.currentElementData;
    const selectors = [
      { type: 'CSS Selector', value: data.cssSelector },
      { type: 'XPath (Relative)', value: data.xpath },
      { type: 'XPath (Absolute)', value: data.absoluteXPath },
      { type: 'JavaScript Path', value: data.jsPath }
    ];

    const selectorItems = selectors.map(selector => `
      <div class="selector-item">
        <div class="selector-type">${selector.type}</div>
        <div class="selector-value">${this.escapeHtml(selector.value)}</div>
        <button class="copy-btn" onclick="copyToClipboard('${this.escapeQuotes(selector.value)}')" style="margin-top: 8px;">
          Copy ${selector.type}
        </button>
      </div>
    `).join('');

    container.innerHTML = `<ul class="selector-list">${selectorItems}</ul>`;
  }

  clearResults() {
    this.currentElementData = null;
    this.updateCurrentElement();
    this.updateSelectorsList();
    this.showNotification('Results cleared', 'success');
  }

  exportResults() {
    if (!this.currentElementData) {
      this.showNotification('No element data to export', 'error');
      return;
    }

    const data = this.currentElementData;
    const exportData = {
      timestamp: new Date().toISOString(),
      element: {
        tagName: data.tagName,
        id: data.id,
        className: data.className,
        textContent: data.textContent
      },
      selectors: {
        cssSelector: data.cssSelector,
        xpath: data.xpath,
        absoluteXPath: data.absoluteXPath,
        jsPath: data.jsPath
      }
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `loc8r-selectors-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.showNotification('Selectors exported successfully', 'success');
  }

  async sendMessageToContentScript(message) {
    return new Promise((resolve, reject) => {
      // Try to send message directly to content script first
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, message, (response) => {
            if (chrome.runtime.lastError) {
              // If direct message fails, try eval approach
              chrome.devtools.inspectedWindow.eval(
                `
                (function() {
                  try {
                    // Dispatch custom event to trigger content script
                    const event = new CustomEvent('loc8r-message', {
                      detail: ${JSON.stringify(message)}
                    });
                    document.dispatchEvent(event);
                    return 'success';
                  } catch (e) {
                    return 'error: ' + e.message;
                  }
                })()
                `,
                (result, isException) => {
                  if (isException) {
                    reject(new Error('Content script execution failed'));
                  } else {
                    resolve(result);
                  }
                }
              );
            } else {
              resolve(response);
            }
          });
        } else {
          reject(new Error('No active tab found'));
        }
      });
    });
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 6px;
      color: white;
      z-index: 1000;
      font-size: 14px;
      font-weight: 500;
      ${type === 'success' ? 'background: #4caf50;' : 
        type === 'error' ? 'background: #f44336;' : 
        'background: #2196f3;'}
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      animation: slideIn 0.3s ease;
    `;
    
    // Add CSS animation
    if (!document.querySelector('#notification-styles')) {
      const style = document.createElement('style');
      style.id = 'notification-styles';
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => {
          notification.parentNode.removeChild(notification);
        }, 300);
      }
    }, 3000);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  escapeQuotes(text) {
    return text.replace(/'/g, "\\'").replace(/"/g, '\\"');
  }
}

// Global function for copy buttons
window.copyToClipboard = async function(text) {
  try {
    await navigator.clipboard.writeText(text);
    console.log('Copied to clipboard:', text);
    
    // Show success notification
    if (window.loc8rPanel) {
      window.loc8rPanel.showNotification('Copied to clipboard!', 'success');
    }
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    if (window.loc8rPanel) {
      window.loc8rPanel.showNotification('Failed to copy to clipboard', 'error');
    }
  }
};

// Initialize panel when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.loc8rPanel = new Loc8rPanel();
});