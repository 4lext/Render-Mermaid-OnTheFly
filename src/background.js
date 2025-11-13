// Create context menu item when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'renderMermaid',
    title: 'Render Mermaid',
    contexts: ['selection']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'renderMermaid' && info.selectionText) {
    // Send the selected text to the content script
    chrome.tabs.sendMessage(tab.id, {
      action: 'renderMermaid',
      mermaidCode: info.selectionText
    });
  }
});
