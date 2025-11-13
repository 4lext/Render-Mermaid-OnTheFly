console.log('[Mermaid Content] Script loaded');

// Track if content script is initialized
let isInitialized = false;
let mermaidLoaded = false;
let mermaidLoadingPromise = null;

// Initialize the content script
function initialize() {
  if (isInitialized) {
    console.log('[Mermaid Content] Already initialized');
    return;
  }
  isInitialized = true;
  console.log('[Mermaid Content] Initializing...');
}

// Load Mermaid.js library dynamically
function loadMermaid() {
  console.log('[Mermaid Content] loadMermaid called, mermaidLoaded:', mermaidLoaded);

  if (mermaidLoaded && window.mermaid) {
    console.log('[Mermaid Content] Mermaid already loaded');
    return Promise.resolve();
  }

  if (mermaidLoadingPromise) {
    console.log('[Mermaid Content] Mermaid loading in progress, returning existing promise');
    return mermaidLoadingPromise;
  }

  mermaidLoadingPromise = new Promise((resolve, reject) => {
    console.log('[Mermaid Content] Starting to load Mermaid library...');

    // Get the extension URL for the local Mermaid library (using standalone bundle)
    const mermaidUrl = chrome.runtime.getURL('mermaid/mermaid.min.js');
    console.log('[Mermaid Content] Mermaid URL:', mermaidUrl);

    // Load the standalone Mermaid bundle via script tag
    const script = document.createElement('script');
    script.src = mermaidUrl;

    script.onload = () => {
      console.log('[Mermaid Content] Script loaded, checking window.mermaid...');
      if (window.mermaid) {
        console.log('[Mermaid Content] window.mermaid found, initializing...');
        try {
          window.mermaid.initialize({
            startOnLoad: false,
            theme: 'default',
            securityLevel: 'loose'
          });
          mermaidLoaded = true;
          console.log('[Mermaid Content] Mermaid initialized successfully');
          resolve();
        } catch (error) {
          console.error('[Mermaid Content] Error initializing Mermaid:', error);
          reject(error);
        }
      } else {
        console.error('[Mermaid Content] Script loaded but window.mermaid not available');
        reject(new Error('Mermaid library loaded but not available on window'));
      }
    };

    script.onerror = (error) => {
      console.error('[Mermaid Content] Error loading Mermaid script:', error);
      reject(new Error('Failed to load Mermaid library from extension'));
    };

    console.log('[Mermaid Content] Appending script to document head');
    try {
      document.head.appendChild(script);
      console.log('[Mermaid Content] Script appended successfully');
    } catch (error) {
      console.error('[Mermaid Content] Error appending script:', error);
      reject(error);
    }
  });

  return mermaidLoadingPromise;
}

// Create overlay with Mermaid diagram
async function createMermaidOverlay(mermaidCode) {
  console.log('[Mermaid Content] createMermaidOverlay called');
  console.log('[Mermaid Content] Mermaid code length:', mermaidCode.length);
  console.log('[Mermaid Content] Mermaid code preview:', mermaidCode.substring(0, 200));

  try {
    // Load Mermaid if not already loaded
    console.log('[Mermaid Content] Loading Mermaid library...');
    await loadMermaid();
    console.log('[Mermaid Content] Mermaid library loaded successfully');

    // Remove existing overlay if present
    const existingOverlay = document.getElementById('mermaid-overlay');
    if (existingOverlay) {
      console.log('[Mermaid Content] Removing existing overlay');
      existingOverlay.remove();
    }

    // Create overlay container
    console.log('[Mermaid Content] Creating overlay elements...');
    const overlay = document.createElement('div');
    overlay.id = 'mermaid-overlay';
    overlay.className = 'mermaid-overlay';

    // Create header with controls
    const header = document.createElement('div');
    header.className = 'mermaid-header';
    header.innerHTML = `
      <span class="mermaid-title">Mermaid Diagram</span>
      <div class="mermaid-controls">
        <button class="mermaid-btn" id="zoom-out" title="Zoom Out">−</button>
        <button class="mermaid-btn" id="zoom-reset" title="Reset Zoom">100%</button>
        <button class="mermaid-btn" id="zoom-in" title="Zoom In">+</button>
        <button class="mermaid-btn" id="export-png" title="Export as PNG">📥 PNG</button>
        <button class="mermaid-btn mermaid-close" id="close-overlay" title="Close">✕</button>
      </div>
    `;

    // Create content container
    const content = document.createElement('div');
    content.className = 'mermaid-content';

    // Create diagram container with pan/zoom support
    const diagramContainer = document.createElement('div');
    diagramContainer.className = 'mermaid-diagram-container';
    diagramContainer.id = 'mermaid-diagram-container';

    const diagramWrapper = document.createElement('div');
    diagramWrapper.className = 'mermaid-diagram-wrapper';
    diagramWrapper.id = 'mermaid-diagram';

    diagramContainer.appendChild(diagramWrapper);
    content.appendChild(diagramContainer);

    // Assemble overlay
    overlay.appendChild(header);
    overlay.appendChild(content);
    document.body.appendChild(overlay);
    console.log('[Mermaid Content] Overlay elements created and appended to body');

    // Render Mermaid diagram
    console.log('[Mermaid Content] Starting to render diagram...');
    try {
      const renderResult = await window.mermaid.render('mermaid-svg-' + Date.now(), mermaidCode);
      console.log('[Mermaid Content] Render result:', renderResult);

      if (renderResult && renderResult.svg) {
        diagramWrapper.innerHTML = renderResult.svg;
        console.log('[Mermaid Content] Diagram rendered successfully');
      } else {
        throw new Error('Render result does not contain SVG');
      }
    } catch (error) {
      console.error('[Mermaid Content] Error rendering diagram:', error);
      console.error('[Mermaid Content] Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });

      diagramWrapper.innerHTML = `
        <div class="mermaid-error">
          <h3>Error rendering Mermaid diagram</h3>
          <p><strong>Error:</strong> ${error.message || 'Unknown error'}</p>
          <p><strong>Code preview:</strong></p>
          <pre>${mermaidCode}</pre>
          <p style="margin-top: 15px; font-size: 12px; color: #666;">
            Check the browser console (F12) for detailed error information.
          </p>
        </div>
      `;
    }

    // Initialize zoom and pan functionality
    console.log('[Mermaid Content] Initializing zoom and pan...');
    initializeZoomPan(overlay, diagramContainer, diagramWrapper);

    // Initialize controls
    console.log('[Mermaid Content] Initializing controls...');
    initializeControls(overlay, diagramWrapper);

    // Make overlay draggable
    console.log('[Mermaid Content] Making overlay draggable...');
    makeOverlayDraggable(overlay, header);

    // Make overlay resizable
    console.log('[Mermaid Content] Making overlay resizable...');
    makeOverlayResizable(overlay);

    console.log('[Mermaid Content] Overlay creation complete!');

  } catch (error) {
    console.error('[Mermaid Content] Fatal error creating Mermaid overlay:', error);
    console.error('[Mermaid Content] Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });

    alert(`Failed to load Mermaid library.\n\nError: ${error.message}\n\nPlease check:\n1. Internet connection\n2. Browser console (F12) for details`);
  }
}

// Initialize zoom and pan functionality
function initializeZoomPan(overlay, container, wrapper) {
  let scale = 1;
  let isPanning = false;
  let startX, startY;
  let translateX = 0;
  let translateY = 0;

  // Store zoom/pan state
  overlay.zoomState = {
    scale: 1,
    translateX: 0,
    translateY: 0
  };

  function updateTransform() {
    wrapper.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    overlay.zoomState = { scale, translateX, translateY };

    // Update zoom display
    const zoomResetBtn = overlay.querySelector('#zoom-reset');
    if (zoomResetBtn) {
      zoomResetBtn.textContent = `${Math.round(scale * 100)}%`;
    }
  }

  // Mouse wheel zoom
  container.addEventListener('wheel', (e) => {
    e.preventDefault();

    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.min(Math.max(0.1, scale * delta), 5);

    // Zoom towards cursor position
    const scaleFactor = newScale / scale;
    translateX = x - scaleFactor * (x - translateX);
    translateY = y - scaleFactor * (y - translateY);
    scale = newScale;

    updateTransform();
  });

  // Pan with mouse drag
  container.addEventListener('mousedown', (e) => {
    if (e.target.closest('.mermaid-diagram-wrapper') || e.target === container) {
      isPanning = true;
      startX = e.clientX - translateX;
      startY = e.clientY - translateY;
      container.style.cursor = 'grabbing';
      e.preventDefault();
    }
  });

  document.addEventListener('mousemove', (e) => {
    if (isPanning) {
      translateX = e.clientX - startX;
      translateY = e.clientY - startY;
      updateTransform();
    }
  });

  document.addEventListener('mouseup', () => {
    if (isPanning) {
      isPanning = false;
      container.style.cursor = 'grab';
    }
  });

  // Expose zoom methods
  overlay.zoomIn = () => {
    scale = Math.min(scale * 1.2, 5);
    updateTransform();
  };

  overlay.zoomOut = () => {
    scale = Math.max(scale * 0.8, 0.1);
    updateTransform();
  };

  overlay.zoomReset = () => {
    scale = 1;
    translateX = 0;
    translateY = 0;
    updateTransform();
  };

  updateTransform();
}

// Initialize control buttons
function initializeControls(overlay, diagramWrapper) {
  // Close button
  overlay.querySelector('#close-overlay').addEventListener('click', () => {
    console.log('[Mermaid Content] Close button clicked');
    overlay.remove();
  });

  // Zoom controls
  overlay.querySelector('#zoom-in').addEventListener('click', () => {
    console.log('[Mermaid Content] Zoom in clicked');
    overlay.zoomIn();
  });

  overlay.querySelector('#zoom-out').addEventListener('click', () => {
    console.log('[Mermaid Content] Zoom out clicked');
    overlay.zoomOut();
  });

  overlay.querySelector('#zoom-reset').addEventListener('click', () => {
    console.log('[Mermaid Content] Zoom reset clicked');
    overlay.zoomReset();
  });

  // Export to PNG
  overlay.querySelector('#export-png').addEventListener('click', () => {
    console.log('[Mermaid Content] Export PNG clicked');
    exportToPNG(diagramWrapper);
  });
}

// Export diagram to PNG
function exportToPNG(diagramWrapper) {
  console.log('[Mermaid Content] exportToPNG called');

  const svgElement = diagramWrapper.querySelector('svg');
  if (!svgElement) {
    console.error('[Mermaid Content] No SVG element found for export');
    alert('No diagram to export');
    return;
  }

  console.log('[Mermaid Content] SVG element found, starting export...');

  try {
    // Clone the SVG to avoid modifying the original
    const clonedSvg = svgElement.cloneNode(true);

    // Get SVG dimensions
    const bbox = svgElement.getBBox();
    const width = bbox.width || svgElement.width.baseVal.value || 800;
    const height = bbox.height || svgElement.height.baseVal.value || 600;

    console.log('[Mermaid Content] SVG dimensions:', { width, height });

    // Set dimensions on cloned SVG
    clonedSvg.setAttribute('width', width);
    clonedSvg.setAttribute('height', height);
    clonedSvg.setAttribute('viewBox', `${bbox.x} ${bbox.y} ${width} ${height}`);

    // Serialize SVG to string
    const svgData = new XMLSerializer().serializeToString(clonedSvg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    // Create canvas to convert SVG to PNG
    const canvas = document.createElement('canvas');
    canvas.width = width * 2; // 2x for better quality
    canvas.height = height * 2;
    const ctx = canvas.getContext('2d');

    const img = new Image();
    img.onload = () => {
      console.log('[Mermaid Content] Image loaded, converting to PNG...');

      // Fill white background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw SVG
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Convert to PNG and download
      canvas.toBlob((blob) => {
        const pngUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `mermaid-diagram-${Date.now()}.png`;
        link.href = pngUrl;
        link.click();

        console.log('[Mermaid Content] PNG export complete');

        // Cleanup
        URL.revokeObjectURL(pngUrl);
        URL.revokeObjectURL(url);
      });
    };

    img.onerror = (error) => {
      console.error('[Mermaid Content] Error loading image for export:', error);
      alert('Failed to export diagram as PNG');
      URL.revokeObjectURL(url);
    };

    img.src = url;
  } catch (error) {
    console.error('[Mermaid Content] Error in exportToPNG:', error);
    alert('Failed to export diagram: ' + error.message);
  }
}

// Make overlay draggable
function makeOverlayDraggable(overlay, header) {
  let isDragging = false;
  let currentX, currentY, initialX, initialY;

  header.addEventListener('mousedown', (e) => {
    if (e.target === header || e.target.className === 'mermaid-title') {
      isDragging = true;
      initialX = e.clientX - overlay.offsetLeft;
      initialY = e.clientY - overlay.offsetTop;
      header.style.cursor = 'grabbing';
    }
  });

  document.addEventListener('mousemove', (e) => {
    if (isDragging) {
      e.preventDefault();
      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;

      overlay.style.left = currentX + 'px';
      overlay.style.top = currentY + 'px';
    }
  });

  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      header.style.cursor = 'grab';
    }
  });
}

// Make overlay resizable
function makeOverlayResizable(overlay) {
  const resizer = document.createElement('div');
  resizer.className = 'mermaid-resizer';
  overlay.appendChild(resizer);

  let isResizing = false;
  let startX, startY, startWidth, startHeight;

  resizer.addEventListener('mousedown', (e) => {
    isResizing = true;
    startX = e.clientX;
    startY = e.clientY;
    startWidth = overlay.offsetWidth;
    startHeight = overlay.offsetHeight;
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (isResizing) {
      const width = startWidth + (e.clientX - startX);
      const height = startHeight + (e.clientY - startY);

      overlay.style.width = Math.max(400, width) + 'px';
      overlay.style.height = Math.max(300, height) + 'px';
    }
  });

  document.addEventListener('mouseup', () => {
    isResizing = false;
  });
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Mermaid Content] Message received:', message);

  if (message.action === 'ping') {
    console.log('[Mermaid Content] Ping received, responding with ready status');
    sendResponse({ status: 'ready', initialized: isInitialized });
    return true;
  }

  if (message.action === 'renderMermaid') {
    console.log('[Mermaid Content] Render request received');
    createMermaidOverlay(message.mermaidCode)
      .then(() => {
        console.log('[Mermaid Content] Render completed successfully');
        sendResponse({ success: true });
      })
      .catch((error) => {
        console.error('[Mermaid Content] Render failed:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep the message channel open for async response
  }

  return false;
});

// Initialize on load
initialize();
console.log('[Mermaid Content] Content script ready');
