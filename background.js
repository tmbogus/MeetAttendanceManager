// background.js

// Initialize defaults on install/update
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get({ extensionEnabled: true }, (stored) => {
    if (typeof stored.extensionEnabled !== 'boolean') {
      chrome.storage.local.set({ extensionEnabled: true });
    }
  });
});

// React to storage changes if needed (future hook for syncing)
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'local') return;
  if (changes.extensionEnabled) {
    // Optionally notify tabs about enable/disable state changes
    chrome.tabs.query({ url: 'https://meet.google.com/*' }, (tabs) => {
      for (const tab of tabs) {
        chrome.tabs.sendMessage(tab.id, {
          type: 'EXTENSION_STATE_CHANGED',
          enabled: changes.extensionEnabled.newValue,
        });
      }
    });
  }
});
  