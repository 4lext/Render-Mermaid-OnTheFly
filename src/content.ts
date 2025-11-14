// Content script for rendering Mermaid diagrams
// Handles overlay creation, rendering, and user interactions

import mermaid from 'mermaid';

// Initialize Mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose'
});

// Message types
interface RenderMermaidMessage {
  action: 'renderMermaid';
  mermaidCode: string;
}

// Zoom state interface
interface ZoomState {
  scale: number;
  translateX: number;
  translateY: number;
}

// Extended overlay element with zoom methods
interface MermaidOverlay extends HTMLDivElement {
  zoomState: ZoomState;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomReset: () => void;
}

// Create overlay with Mermaid diagram
async function createMermaidOverlay(mermaidCode: string): Promise<void> {
  try {
    // Remove existing overlay if present
    const existingOverlay = document.getElementById('mermaid-overlay');
    if (existingOverlay) {
      existingOverlay.remove();
    }

    // Create overlay container
    const overlay = document.createElement('div') as MermaidOverlay;
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
      const { svg } = await mermaid.render('mermaid-svg-' + Date.now(), mermaidCode);
      diagramWrapper.innerHTML = svg;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Only treat it as a mermaid parse error if it looks like one.
      const isMermaidError =
        error instanceof Error &&
        /Parse error|Lexical error|Syntax error/i.test(error.message);
      
      diagramWrapper.innerHTML = `
        <div class="mermaid-error">
          <h3>${isMermaidError ? 'Error rendering Mermaid diagram' : 'Unexpected error while rendering'}</h3>
          <p>${errorMessage}</p>
          <pre>${mermaidCode}</pre>
        </div>
      `;
      
      console.error(
        isMermaidError ? 'Mermaid rendering error:' : 'Unexpected rendering error:',
        error
      );
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
    alert('Failed to create Mermaid overlay. Please check the console for details.');
  }
}

// Initialize zoom and pan functionality
function initializeZoomPan(
  overlay: MermaidOverlay,
  container: HTMLElement,
  wrapper: HTMLElement
): void {
  let scale = 1;
  let isPanning = false;
  let startX = 0;
  let startY = 0;
  let translateX = 0;
  let translateY = 0;

  // Store zoom/pan state
  overlay.zoomState = {
    scale: 1,
    translateX: 0,
    translateY: 0
  };

  function updateTransform(): void {
    wrapper.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    overlay.zoomState = { scale, translateX, translateY };

    // Update zoom display
    const zoomResetBtn = overlay.querySelector('#zoom-reset') as HTMLButtonElement;
    if (zoomResetBtn) {
      zoomResetBtn.textContent = `${Math.round(scale * 100)}%`;
    }
  }

  // Mouse wheel zoom
  container.addEventListener('wheel', (e: WheelEvent) => {
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
  container.addEventListener('mousedown', (e: MouseEvent) => {
    if (e.target instanceof Element && (e.target.closest('.mermaid-diagram-wrapper') || e.target === container)) {
      isPanning = true;
      startX = e.clientX - translateX;
      startY = e.clientY - translateY;
      container.style.cursor = 'grabbing';
      e.preventDefault();
    }
  });

  document.addEventListener('mousemove', (e: MouseEvent) => {
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
function initializeControls(overlay: MermaidOverlay, diagramWrapper: HTMLElement): void {
  // Close button
  const closeBtn = overlay.querySelector('#close-overlay');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      overlay.remove();
    });
  }

  // Zoom controls
  const zoomInBtn = overlay.querySelector('#zoom-in');
  if (zoomInBtn) {
    zoomInBtn.addEventListener('click', () => {
      overlay.zoomIn();
    });
  }

  const zoomOutBtn = overlay.querySelector('#zoom-out');
  if (zoomOutBtn) {
    zoomOutBtn.addEventListener('click', () => {
      overlay.zoomOut();
    });
  }

  const zoomResetBtn = overlay.querySelector('#zoom-reset');
  if (zoomResetBtn) {
    zoomResetBtn.addEventListener('click', () => {
      overlay.zoomReset();
    });
  }

  // Export to PNG
  const exportBtn = overlay.querySelector('#export-png');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      exportToPNG(diagramWrapper);
    });
  }
}

// Export diagram to PNG
function exportToPNG(diagramWrapper: HTMLElement): void {
  const svgElement = diagramWrapper.querySelector('svg');
  if (!svgElement) {
    alert('No diagram to export');
    return;
  }

  // Clone the SVG to avoid modifying the original
  const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;

  // Get SVG dimensions
  const bbox = svgElement.getBBox();
  const width = bbox.width || svgElement.width.baseVal.value || 800;
  const height = bbox.height || svgElement.height.baseVal.value || 600;

  // Set dimensions on cloned SVG
  clonedSvg.setAttribute('width', width.toString());
  clonedSvg.setAttribute('height', height.toString());
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

  if (!ctx) {
    alert('Failed to create canvas context');
    return;
  }

  const img = new Image();
  img.onload = () => {
    // Fill white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw SVG
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Convert to PNG and download
    canvas.toBlob((blob) => {
      if (!blob) {
        alert('Failed to create PNG');
        return;
      }
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
function makeOverlayDraggable(overlay: HTMLElement, header: HTMLElement): void {
  let isDragging = false;
  let currentX: number;
  let currentY: number;
  let initialX: number;
  let initialY: number;

  header.addEventListener('mousedown', (e: MouseEvent) => {
    if (e.target === header || (e.target instanceof Element && e.target.className === 'mermaid-title')) {
      isDragging = true;
      initialX = e.clientX - overlay.offsetLeft;
      initialY = e.clientY - overlay.offsetTop;
      header.style.cursor = 'grabbing';
    }
  });

  document.addEventListener('mousemove', (e: MouseEvent) => {
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
function makeOverlayResizable(overlay: HTMLElement): void {
  const resizer = document.createElement('div');
  resizer.className = 'mermaid-resizer';
  overlay.appendChild(resizer);

  let isResizing = false;
  let startX: number;
  let startY: number;
  let startWidth: number;
  let startHeight: number;

  resizer.addEventListener('mousedown', (e: MouseEvent) => {
    isResizing = true;
    startX = e.clientX;
    startY = e.clientY;
    startWidth = overlay.offsetWidth;
    startHeight = overlay.offsetHeight;
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e: MouseEvent) => {
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
chrome.runtime.onMessage.addListener((message: RenderMermaidMessage) => {
  if (message.action === 'renderMermaid') {
    createMermaidOverlay(message.mermaidCode);
  }
});
