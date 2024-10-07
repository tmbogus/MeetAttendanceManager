// background.js

// Listen for the extension icon being clicked
chrome.action.onClicked.addListener((tab) => {
    // Ensure the active tab is a Google Meet page
    if (tab.url && tab.url.startsWith("https://meet.google.com/")) {
      // Inject CSS for styling the overlay and UI elements
      chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ['contentStyle.css']
      })
      .then(() => {
        console.log('Content CSS injected.');
      })
      .catch(err => console.error('CSS injection failed:', err));
  
      // Inject the content script to manipulate the DOM
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['contentScript.js']
      })
      .then(() => {
        console.log('Attendance overlay injected.');
      })
      .catch(err => console.error('Script injection failed:', err));
    } else {
      console.warn('Active tab is not a Google Meet page.');
      // Optionally, notify the user that the extension only works on Google Meet
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Meet Admin Overlay',
        message: 'This extension only works on Google Meet pages.',
        priority: 2
      });
    }
  });
  