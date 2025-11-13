// Load Mermaid.js library dynamically
function loadMermaid() {
  return new Promise((resolve, reject) => {
    if (window.mermaid) {
      resolve();
      return;
    }

    // Get the extension URL for the local Mermaid library
    const mermaidUrl = chrome.runtime.getURL('mermaid/mermaid.esm.min.mjs');

    // Import the local Mermaid module
    import(mermaidUrl)
      .then(m => {
        window.mermaid = m.default;
        window.mermaid.initialize({
          startOnLoad: false,
          theme: 'default',
          securityLevel: 'loose'
        });
        resolve();
      })
      .catch(err => {
        console.error('Failed to load Mermaid library:', err);
        reject(err);
      });
  });
}

// Create overlay with Mermaid diagram
async function createMermaidOverlay(mermaidCode) {
  try {
    // Load Mermaid if not already loaded
    await loadMermaid();

    // Remove existing overlay if present
    const existingOverlay = document.getElementById('mermaid-overlay');
    if (existingOverlay) {
      existingOverlay.remove();
    }

    // Create overlay container
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

    // Render Mermaid diagram
    try {
      const { svg } = await window.mermaid.render('mermaid-svg-' + Date.now(), mermaidCode);
      diagramWrapper.innerHTML = svg;
    } catch (error) {
      diagramWrapper.innerHTML = `
        <div class="mermaid-error">
          <h3>Error rendering Mermaid diagram</h3>
          <p>${error.message}</p>
          <pre>${mermaidCode}</pre>
        </div>
      `;
      console.error('Mermaid rendering error:', error);
    }

    // Initialize zoom and pan functionality
    initializeZoomPan(overlay, diagramContainer, diagramWrapper);

    // Initialize controls
    initializeControls(overlay, diagramWrapper);

    // Make overlay draggable
    makeOverlayDraggable(overlay, header);

    // Make overlay resizable
    makeOverlayResizable(overlay);

  } catch (error) {
    console.error('Error creating Mermaid overlay:', error);
    alert('Failed to load Mermaid library. Please check your internet connection.');
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
    overlay.remove();
  });

  // Zoom controls
  overlay.querySelector('#zoom-in').addEventListener('click', () => {
    overlay.zoomIn();
  });

  overlay.querySelector('#zoom-out').addEventListener('click', () => {
    overlay.zoomOut();
  });

  overlay.querySelector('#zoom-reset').addEventListener('click', () => {
    overlay.zoomReset();
  });

  // Export to PNG
  overlay.querySelector('#export-png').addEventListener('click', () => {
    exportToPNG(diagramWrapper);
  });
}

// Export diagram to PNG
function exportToPNG(diagramWrapper) {
  const svgElement = diagramWrapper.querySelector('svg');
  if (!svgElement) {
    alert('No diagram to export');
    return;
  }

  // Clone the SVG to avoid modifying the original
  const clonedSvg = svgElement.cloneNode(true);

  // Get SVG dimensions
  const bbox = svgElement.getBBox();
  const width = bbox.width || svgElement.width.baseVal.value || 800;
  const height = bbox.height || svgElement.height.baseVal.value || 600;

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

      // Cleanup
      URL.revokeObjectURL(pngUrl);
      URL.revokeObjectURL(url);
    });
  };

  img.src = url;
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
  if (message.action === 'renderMermaid') {
    createMermaidOverlay(message.mermaidCode);
  }
});
