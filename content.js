// Loc8r Content Script - Handles element selection and locator generation
class Loc8r {
  constructor() {
    this.currentElement = null;
    this.isInspectorActive = false;
    this.highlightOverlay = null;
    this.init();
  }

  init() {
    this.createHighlightOverlay();
    this.setupMessageListeners();
    this.setupKeyboardShortcuts();
    this.setupContextMenuDetection();
  }

  // Create overlay for highlighting elements
  createHighlightOverlay() {
    this.highlightOverlay = document.createElement('div');
    this.highlightOverlay.style.cssText = `
      position: absolute;
      background: rgba(255, 0, 0, 0.3);
      border: 2px solid red;
      pointer-events: none;
      z-index: 999999;
      display: none;
    `;
    document.body.appendChild(this.highlightOverlay);
  }

  // Setup message listeners
  setupMessageListeners() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.action) {
        case 'contextMenuClick':
          this.handleContextMenuClick(message.menuItemId);
          sendResponse({ success: true });
          return true;
        case 'toggleInspector':
          this.toggleInspector();
          sendResponse({ success: true, isActive: this.isInspectorActive });
          return true;
        case 'getStatus':
          sendResponse({ isActive: this.isInspectorActive });
          return true;
        case 'ping':
          sendResponse({ status: 'ok' });
          return true;
        default:
          return false; // Don't keep channel open for unknown messages
      }
    });
    
    // Listen for custom events from DevTools panel
    document.addEventListener('loc8r-message', (event) => {
      const message = event.detail;
      switch (message.action) {
        case 'toggleInspector':
          this.toggleInspector();
          break;
      }
    });
  }

  // Setup keyboard shortcuts
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl+Shift+L to toggle inspector
      if (e.ctrlKey && e.shiftKey && e.key === 'L') {
        e.preventDefault();
        this.toggleInspector();
      }
      
      // Escape to deactivate inspector
      if (e.key === 'Escape' && this.isInspectorActive) {
        this.deactivateInspector();
      }
    });
  }
  
  // Setup context menu detection
  setupContextMenuDetection() {
    document.addEventListener('contextmenu', (e) => {
      // Store the element that was right-clicked
      this.lastRightClickedElement = e.target;
      this.currentElement = e.target;
    });
  }

  // Toggle inspector mode
  toggleInspector() {
    if (this.isInspectorActive) {
      this.deactivateInspector();
    } else {
      this.activateInspector();
    }
  }

  // Activate inspector mode
  activateInspector() {
    this.isInspectorActive = true;
    document.body.style.cursor = 'crosshair';
    
    // Add event listeners
    document.addEventListener('mouseover', this.handleMouseOver.bind(this));
    document.addEventListener('mouseout', this.handleMouseOut.bind(this));
    document.addEventListener('click', this.handleClick.bind(this));
    
    this.showNotification('Inspector activated! Click on elements to extract selectors.');
  }

  // Deactivate inspector mode
  deactivateInspector() {
    this.isInspectorActive = false;
    document.body.style.cursor = '';
    this.hideHighlight();
    
    // Remove event listeners
    document.removeEventListener('mouseover', this.handleMouseOver.bind(this));
    document.removeEventListener('mouseout', this.handleMouseOut.bind(this));
    document.removeEventListener('click', this.handleClick.bind(this));
    
    this.showNotification('Inspector deactivated.');
  }

  // Handle mouse over events
  handleMouseOver(e) {
    if (!this.isInspectorActive) return;
    
    e.stopPropagation();
    this.currentElement = e.target;
    this.highlightElement(e.target);
  }

  // Handle mouse out events
  handleMouseOut(e) {
    if (!this.isInspectorActive) return;
    this.hideHighlight();
  }

  // Handle click events
  handleClick(e) {
    if (!this.isInspectorActive) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    this.currentElement = e.target;
    this.showElementInfo(e.target);
  }

  // Highlight element
  highlightElement(element) {
    const rect = element.getBoundingClientRect();
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    
    this.highlightOverlay.style.display = 'block';
    this.highlightOverlay.style.left = (rect.left + scrollX) + 'px';
    this.highlightOverlay.style.top = (rect.top + scrollY) + 'px';
    this.highlightOverlay.style.width = rect.width + 'px';
    this.highlightOverlay.style.height = rect.height + 'px';
  }

  // Hide highlight
  hideHighlight() {
    this.highlightOverlay.style.display = 'none';
  }

  // Handle context menu clicks
  handleContextMenuClick(menuItemId) {
    // Store the last right-clicked element
    if (!this.currentElement) {
      // Try to get the last right-clicked element or use document.activeElement
      this.currentElement = this.lastRightClickedElement || document.activeElement || document.body;
    }

    let textToCopy = '';
    
    switch (menuItemId) {
      case 'copy-id':
        textToCopy = this.currentElement.id || 'No ID found';
        break;
      case 'copy-name':
        textToCopy = this.currentElement.name || 'No name attribute found';
        break;
      case 'copy-class':
        textToCopy = this.currentElement.className || 'No class found';
        break;
      case 'copy-css-selector':
        textToCopy = this.generateCSSSelector(this.currentElement);
        break;
      case 'copy-xpath':
        textToCopy = this.generateXPath(this.currentElement);
        break;
      case 'copy-xpath-absolute':
        textToCopy = this.generateAbsoluteXPath(this.currentElement);
        break;
      case 'copy-js-path':
        textToCopy = this.generateJSPath(this.currentElement);
        break;
      case 'copy-text-content':
        textToCopy = this.currentElement.textContent?.trim() || 'No text content';
        break;
    }

    this.copyToClipboard(textToCopy);
  }

  // Generate CSS selector
  generateCSSSelector(element) {
    if (element.id) {
      return `#${element.id}`;
    }
    
    let selector = element.tagName.toLowerCase();
    
    if (element.className) {
      const classes = element.className.split(' ').filter(c => c.trim());
      selector += '.' + classes.join('.');
    }
    
    // Add nth-child if needed for uniqueness
    const parent = element.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(
        child => child.tagName === element.tagName
      );
      if (siblings.length > 1) {
        const index = siblings.indexOf(element) + 1;
        selector += `:nth-child(${index})`;
      }
    }
    
    return selector;
  }

  // Generate XPath
  generateXPath(element) {
    if (element.id) {
      return `//*[@id="${element.id}"]`;
    }
    
    const parts = [];
    let current = element;
    
    while (current && current.nodeType === Node.ELEMENT_NODE && current !== document.body) {
      let selector = current.tagName.toLowerCase();
      
      if (current.id) {
        selector += `[@id="${current.id}"]`;
        parts.unshift(selector);
        break;
      } else {
        const siblings = Array.from(current.parentElement?.children || [])
          .filter(sibling => sibling.tagName === current.tagName);
        
        if (siblings.length > 1) {
          const index = siblings.indexOf(current) + 1;
          selector += `[${index}]`;
        }
        
        parts.unshift(selector);
      }
      
      current = current.parentElement;
    }
    
    return '//' + parts.join('/');
  }

  // Generate absolute XPath
  generateAbsoluteXPath(element) {
    const parts = [];
    let current = element;
    
    while (current && current.nodeType === Node.ELEMENT_NODE) {
      const tagName = current.tagName.toLowerCase();
      const siblings = Array.from(current.parentElement?.children || [])
        .filter(sibling => sibling.tagName === current.tagName);
      
      let selector = tagName;
      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1;
        selector += `[${index}]`;
      }
      
      parts.unshift(selector);
      current = current.parentElement;
    }
    
    return '/' + parts.join('/');
  }

  // Generate JavaScript path
  generateJSPath(element) {
    if (element.id) {
      return `document.getElementById("${element.id}")`;
    }
    
    if (element.className) {
      const classes = element.className.split(' ').filter(c => c.trim());
      return `document.querySelector(".${classes.join('.')}")`;
    }
    
    return `document.querySelector("${this.generateCSSSelector(element)}")`;
  }

  // Show element information
  showElementInfo(element) {
    const info = {
      tagName: element.tagName.toLowerCase(),
      id: element.id || 'N/A',
      className: element.className || 'N/A',
      textContent: element.textContent?.trim().substring(0, 50) || 'N/A',
      cssSelector: this.generateCSSSelector(element),
      xpath: this.generateXPath(element),
      absoluteXPath: this.generateAbsoluteXPath(element),
      jsPath: this.generateJSPath(element)
    };
    
    console.group('🎯 Loc8r - Element Information');
    console.log('Element:', element);
    console.log('Tag Name:', info.tagName);
    console.log('ID:', info.id);
    console.log('Class:', info.className);
    console.log('Text Content:', info.textContent);
    console.log('CSS Selector:', info.cssSelector);
    console.log('XPath:', info.xpath);
    console.log('Absolute XPath:', info.absoluteXPath);
    console.log('JS Path:', info.jsPath);
    console.groupEnd();
    
    this.showNotification(`Element selected: ${info.tagName}${info.id !== 'N/A' ? '#' + info.id : ''}`);
  }

  // Copy text to clipboard
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      this.showNotification(`Copied: ${text}`);
    } catch (err) {
      // Fallback method
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      this.showNotification(`Copied: ${text}`);
    }
  }

  // Show notification
  showNotification(message) {
    // Remove existing notification
    const existing = document.querySelector('.loc8r-notification');
    if (existing) {
      existing.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = 'loc8r-notification';
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #333;
      color: white;
      padding: 10px 20px;
      border-radius: 5px;
      z-index: 999999;
      font-family: Arial, sans-serif;
      font-size: 14px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
}

// Initialize Loc8r when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new Loc8r();
  });
} else {
  new Loc8r();
}