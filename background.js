// Create context menu item when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  console.log('[Mermaid Extension] Installing context menu...');
  chrome.contextMenus.create({
    id: 'renderMermaid',
    title: 'Render Mermaid',
    contexts: ['selection']
  }, () => {
    if (chrome.runtime.lastError) {
      console.error('[Mermaid Extension] Error creating context menu:', chrome.runtime.lastError);
    } else {
      console.log('[Mermaid Extension] Context menu created successfully');
    }
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'renderMermaid' && info.selectionText) {
    console.log('[Mermaid Extension] Context menu clicked');
    console.log('[Mermaid Extension] Selected text:', info.selectionText.substring(0, 100) + '...');
    console.log('[Mermaid Extension] Tab ID:', tab.id);

    try {
      // First, try to ping the content script to see if it's ready
      console.log('[Mermaid Extension] Checking if content script is ready...');

      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'ping'
      }).catch(error => {
        console.log('[Mermaid Extension] Content script not responding, will try to inject');
        return null;
      });

      if (!response || response.status !== 'ready') {
        console.log('[Mermaid Extension] Content script not ready, injecting scripts...');

        // Inject CSS first
        await chrome.scripting.insertCSS({
          target: { tabId: tab.id },
          files: ['styles.css']
        });
        console.log('[Mermaid Extension] CSS injected');

        // Then inject JS
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });
        console.log('[Mermaid Extension] Content script injected');

        // Wait a bit for initialization
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Now send the render message
      console.log('[Mermaid Extension] Sending render message...');
      await chrome.tabs.sendMessage(tab.id, {
        action: 'renderMermaid',
        mermaidCode: info.selectionText
      });
      console.log('[Mermaid Extension] Render message sent successfully');

    } catch (error) {
      console.error('[Mermaid Extension] Error:', error);
      console.error('[Mermaid Extension] Error details:', {
        message: error.message,
        stack: error.stack
      });

      // Show error notification to user
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Mermaid Render Error',
        message: 'Failed to render diagram. Check console for details.'
      });
    }
  }
});
