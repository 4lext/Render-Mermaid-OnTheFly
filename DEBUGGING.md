# Debugging Guide

This guide will help you troubleshoot issues with the Render Mermaid OnTheFly extension.

## How to Access Browser Console

The extension outputs detailed debug messages to the browser console. To view them:

1. **Open Developer Tools**
   - Press `F12` on your keyboard, OR
   - Right-click anywhere on the page → "Inspect", OR
   - Menu → More Tools → Developer Tools

2. **Go to Console Tab**
   - Click the "Console" tab at the top of the developer tools panel

3. **Filter Messages**
   - Type `[Mermaid` in the console filter box to see only extension messages

## Debug Message Prefixes

The extension uses prefixed log messages for easy identification:

- `[Mermaid Extension]` - Messages from the background script (service worker)
- `[Mermaid Content]` - Messages from the content script (running on the page)

## Common Issues and Solutions

### 1. "Could not establish connection. Receiving end does not exist"

**What it means:** The content script wasn't ready when the background script tried to communicate.

**Solution (Fixed in v1.1.0):**
- The extension now checks if the content script is ready
- If not ready, it will automatically inject the scripts
- No action needed from users

**Debug messages to look for:**
```
[Mermaid Extension] Checking if content script is ready...
[Mermaid Extension] Content script not ready, injecting scripts...
[Mermaid Extension] CSS injected
[Mermaid Extension] Content script injected
```

### 2. "Failed to load Mermaid library"

**What it means:** The Mermaid.js library couldn't be loaded from the CDN.

**Possible causes:**
1. No internet connection
2. CDN is blocked by firewall/network
3. Content Security Policy restrictions

**Debug messages to look for:**
```
[Mermaid Content] Starting to load Mermaid library...
[Mermaid Content] Error loading Mermaid script: [error details]
```

**Solutions:**
- Check your internet connection
- Try on a different network
- Check if your network blocks cdn.jsdelivr.net
- If using corporate network, contact IT about allowing cdn.jsdelivr.net

### 3. Diagram Doesn't Render / Shows Error

**What it means:** The Mermaid syntax is invalid or there's a rendering issue.

**Debug messages to look for:**
```
[Mermaid Content] Error rendering diagram: [error details]
[Mermaid Content] Error details: { message: '...', stack: '...' }
```

**Solutions:**
- Verify your Mermaid syntax is correct
- Test your diagram at https://mermaid.live
- Check the error message in the console for specific syntax errors
- Look at the code preview shown in the error overlay

### 4. Context Menu Doesn't Appear

**What it means:** The extension isn't properly installed or Chrome isn't detecting the selection.

**Debug messages to look for:**
```
[Mermaid Extension] Installing context menu...
[Mermaid Extension] Context menu created successfully
```

**Solutions:**
- Ensure text is selected before right-clicking
- Reload the extension in chrome://extensions/
- Refresh the page you're testing on
- Check if extension is enabled

### 5. Overlay Appears But Is Empty

**What it means:** The overlay was created but diagram rendering failed.

**Debug messages to look for:**
```
[Mermaid Content] Overlay elements created and appended to body
[Mermaid Content] Starting to render diagram...
[Mermaid Content] Error rendering diagram: [error details]
```

**Solutions:**
- Check console for specific error messages
- Ensure the selected text contains valid Mermaid code
- Try with a simple diagram first (like the examples in test.html)

## Step-by-Step Debugging Process

If you encounter an issue, follow these steps:

### Step 1: Open Console
Open browser console (F12) and go to Console tab

### Step 2: Clear Console
Click the "Clear console" button (🚫 icon) to start fresh

### Step 3: Try the Action
Select text and right-click → "Render Mermaid"

### Step 4: Review Messages
Look at the console messages in order. The extension will log each step:

**Expected message flow:**
```
[Mermaid Extension] Context menu clicked
[Mermaid Extension] Selected text: [preview]
[Mermaid Extension] Tab ID: [number]
[Mermaid Extension] Checking if content script is ready...
[Mermaid Content] Ping received, responding with ready status
[Mermaid Extension] Sending render message...
[Mermaid Content] Message received: {action: 'renderMermaid', ...}
[Mermaid Content] Render request received
[Mermaid Content] createMermaidOverlay called
[Mermaid Content] Loading Mermaid library...
[Mermaid Content] Mermaid library loaded successfully
[Mermaid Content] Creating overlay elements...
[Mermaid Content] Starting to render diagram...
[Mermaid Content] Diagram rendered successfully
[Mermaid Content] Overlay creation complete!
```

### Step 5: Identify Where It Fails
Find the last successful message and the first error message. The problem occurred between these two points.

### Step 6: Check Error Details
If there's an error, the console will show detailed information:
- Error message
- Error stack trace
- Context about what was being attempted

## Testing with Examples

Use the provided `test.html` file to test the extension with known-good examples:

1. Open `test.html` in Chrome
2. Open console (F12)
3. Select one of the example diagrams
4. Right-click → "Render Mermaid"
5. Watch the console messages

If examples work but your diagram doesn't, the issue is with your Mermaid syntax.

## Checking Extension Status

### View Service Worker Console

The background script runs as a service worker. To view its console:

1. Go to `chrome://extensions/`
2. Find "Render Mermaid OnTheFly"
3. Click "service worker" or "Inspect views: service worker"
4. This opens a dedicated console for the background script

### Verify Content Script Loaded

To check if content script is loaded on a page:

1. Open console on the page
2. Type: `chrome.runtime.onMessage.hasListeners()`
3. Or look for the initialization message:
   ```
   [Mermaid Content] Script loaded
   [Mermaid Content] Content script ready
   ```

## Network Issues

If Mermaid library fails to load:

### Check Network Tab
1. Open DevTools → Network tab
2. Try rendering a diagram
3. Look for request to `cdn.jsdelivr.net`
4. Check if it succeeded (status 200) or failed

### Test CDN Accessibility
Open this URL in your browser:
https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js

If it doesn't load, your network is blocking the CDN.

## Reporting Issues

If you've followed this guide and still have issues, please report with:

1. **Browser version**: Chrome version from chrome://version/
2. **Extension version**: From chrome://extensions/
3. **Console logs**: Copy all messages with `[Mermaid` prefix
4. **Network logs**: Screenshot from Network tab if relevant
5. **Sample code**: The Mermaid code you were trying to render
6. **Steps to reproduce**: Exact steps to trigger the issue

## Advanced: Content Security Policy Issues

Some websites have strict Content Security Policy (CSP) that may block:
- Loading external scripts (Mermaid from CDN)
- Inline styles
- eval() usage

**Symptoms:**
- Console shows CSP violation errors
- Extension works on some sites but not others

**Solutions:**
- This is a website restriction, not an extension bug
- Extension cannot bypass CSP for security reasons
- Try on a different website or local HTML file

## Version History

### v1.1.0
- Added comprehensive debugging throughout
- Fixed "Could not establish connection" error
- Improved Mermaid library loading (switched to UMD version)
- Added automatic content script injection
- Added ping/ready check system
- Added detailed error messages

### v1.0.0
- Initial release
