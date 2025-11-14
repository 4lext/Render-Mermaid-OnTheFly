# Installation and Testing Guide

## Quick Start

### 1. Build the Extension

```bash
npm install
npm run build
```

After building, you'll see a `dist/` directory with all the compiled files.

### 2. Load in Chrome

1. Open Chrome browser
2. Navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle switch in top-right corner)
4. Click **"Load unpacked"** button
5. Navigate to and select the `dist/` directory
6. The extension should now appear in your extensions list

### 3. Verify Installation

After loading, you should see:
- Extension name: **Render Mermaid OnTheFly**
- Version: **1.0.0**
- Status: **Enabled**
- No errors in the console

### 4. Test the Extension

#### Using the provided test page:

1. Open `test.html` in Chrome (File > Open File)
2. Select any Mermaid diagram code on the page
3. Right-click to open the context menu
4. Click **"Render Mermaid"**
5. An overlay should appear with the rendered diagram

#### On any webpage:

1. Find or paste Mermaid diagram code on any webpage
2. Select the code (click and drag, or triple-click)
3. Right-click > **"Render Mermaid"**
4. The diagram renders in an interactive overlay

## Testing Different Diagram Types

The extension supports all Mermaid diagram types. Try these examples:

### Flowchart
```
graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
```

### Sequence Diagram
```
sequenceDiagram
    Alice->>John: Hello John!
    John-->>Alice: Hi Alice!
```

### Class Diagram
```
classDiagram
    Animal <|-- Duck
    Animal <|-- Fish
```

## Features to Test

### Overlay Controls

- **Zoom In (+)**: Click to enlarge diagram
- **Zoom Out (−)**: Click to shrink diagram
- **Reset (100%)**: Click to reset to default size
- **Export PNG**: Download diagram as image
- **Close (✕)**: Close the overlay

### Mouse Interactions

- **Wheel scroll**: Zoom in/out on the diagram
- **Click + Drag** on diagram: Pan around
- **Click + Drag** on header: Move the overlay window
- **Click + Drag** on bottom-right corner: Resize overlay

## Troubleshooting

### Extension doesn't appear after loading

**Check:**
- Make sure you selected the `dist/` directory, not the root directory
- Look for error messages in `chrome://extensions/`
- Try refreshing the extensions page

### Context menu doesn't show "Render Mermaid"

**Check:**
- Make sure text is selected before right-clicking
- Ensure the extension is enabled
- Try refreshing the page

### Diagram doesn't render

**Check:**
- Verify the Mermaid syntax is correct
- Open browser console (F12) for error messages
- Try a simple diagram first (like the flowchart example)

### Changes not appearing after rebuild

**Steps:**
1. Run `npm run build` to rebuild
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Refresh the webpage where you're testing

## Development Testing

### Watch Mode

For active development, use watch mode:

```bash
npm run dev
```

This rebuilds automatically when you save changes. You still need to:
1. Reload the extension in Chrome
2. Refresh the test page

### Validation Test

Run the build validation test:

```bash
npm test
```

This verifies:
- All files are present
- manifest.json is valid
- JavaScript syntax is correct
- Mermaid is bundled properly

## Manual Testing Checklist

Use this checklist to ensure everything works:

- [ ] Extension loads without errors
- [ ] Context menu appears when text is selected
- [ ] Simple flowchart renders correctly
- [ ] Sequence diagram renders correctly
- [ ] Can zoom in/out with buttons
- [ ] Can zoom with mouse wheel
- [ ] Can pan by dragging on diagram
- [ ] Can move overlay by dragging header
- [ ] Can resize overlay by dragging corner
- [ ] Export to PNG works
- [ ] Close button closes overlay
- [ ] Works on test.html
- [ ] Works on a regular webpage
- [ ] No console errors

## Performance Testing

### Large Diagrams

Test with complex diagrams to ensure performance:

```
flowchart TD
    A[Start] --> B[Process 1]
    B --> C[Process 2]
    C --> D[Process 3]
    D --> E[Process 4]
    E --> F[Process 5]
    F --> G[End]
    B --> H[Alt Process]
    H --> I[Merge]
    C --> I
    I --> J[Continue]
    J --> F
```

Expected behavior:
- Renders within 2-3 seconds
- Smooth zoom and pan
- No lag in interactions

## Browser Compatibility

Tested on:
- Chrome 88+
- Edge 88+
- Brave (Chromium-based)
- Opera (Chromium-based)

## Security Testing

The extension:
- ✅ Uses no external CDNs at runtime
- ✅ Bundles all dependencies
- ✅ Has no eval() or unsafe code
- ✅ Requests minimal permissions
- ✅ Passes CodeQL security scan

## Next Steps

After testing:
1. Report any issues found
2. Verify all features work as expected
3. Test on different websites
4. Try various Mermaid diagram types
5. Check performance with complex diagrams

## Support

If you encounter issues:
1. Check the browser console for errors
2. Review the DEVELOPMENT.md guide
3. Ensure you're using the latest build
4. Try cleaning and rebuilding: `npm run clean && npm run build`
