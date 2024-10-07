// contentScript.js

// Utility function to get user status from storage
function getUserStatus(username, callback) {
    chrome.storage.local.get(['bannedUsers', 'allowedUsers'], (result) => {
      const { bannedUsers = [], allowedUsers = [] } = result;
      if (bannedUsers.includes(username)) {
        callback('banned');
      } else if (allowedUsers.includes(username)) {
        callback('allowed');
      } else {
        callback('neutral');
      }
    });
  }
  
  // Function to add status indicators and action buttons
  function addStatusIndicators() {
    // Replace with the actual selector for the attendance list
    const attendanceList = document.querySelector('.a-D-Ja'); // Example selector
  
    if (attendanceList) {
      // Replace with the actual selector for participant entries
      const participants = attendanceList.querySelectorAll('.ZjFb7c'); // Example selector
  
      participants.forEach(participant => {
        // Avoid adding indicators and buttons multiple times
        if (!participant.querySelector('.status-indicator')) {
          const usernameElement = participant.querySelector('.ZjFb7c'); // Replace with actual selector
          const username = usernameElement ? usernameElement.textContent.trim() : 'Unknown';
  
          // Create status indicator
          const statusIndicator = document.createElement('span');
          statusIndicator.className = 'status-indicator';
          statusIndicator.style.marginLeft = '8px';
  
          // Determine user status
          getUserStatus(username, (status) => {
            switch (status) {
              case 'banned':
                statusIndicator.style.backgroundColor = 'red';
                break;
              case 'allowed':
                statusIndicator.style.backgroundColor = 'green';
                break;
              default:
                statusIndicator.style.backgroundColor = 'yellow';
            }
          });
  
          participant.appendChild(statusIndicator);
  
          // Add Ban and Allow buttons
          addActionButtons(participant, username);
        }
      });
    }
  }
  
  // Function to add Ban and Allow buttons
  function addActionButtons(participant, username) {
    // Create Ban button
    const banButton = document.createElement('button');
    banButton.textContent = 'Ban';
    banButton.className = 'ban-button';
    banButton.style.marginLeft = '5px';
    banButton.style.padding = '2px 5px';
    banButton.style.fontSize = '12px';
    banButton.style.cursor = 'pointer';
    banButton.style.backgroundColor = '#e74c3c';
    banButton.style.color = '#fff';
    banButton.style.border = 'none';
    banButton.style.borderRadius = '3px';
  
    banButton.addEventListener('click', () => {
      banUser(username);
      updateStatusIndicator(username, 'banned');
      alert(`User "${username}" has been banned successfully.`);
    });
  
    // Create Allow button
    const allowButton = document.createElement('button');
    allowButton.textContent = 'Allow';
    allowButton.className = 'allow-button';
    allowButton.style.marginLeft = '5px';
    allowButton.style.padding = '2px 5px';
    allowButton.style.fontSize = '12px';
    allowButton.style.cursor = 'pointer';
    allowButton.style.backgroundColor = '#2ecc71';
    allowButton.style.color = '#fff';
    allowButton.style.border = 'none';
    allowButton.style.borderRadius = '3px';
  
    allowButton.addEventListener('click', () => {
      allowUser(username);
      updateStatusIndicator(username, 'allowed');
      alert(`User "${username}" has been allowed successfully.`);
    });
  
    participant.appendChild(banButton);
    participant.appendChild(allowButton);
  }
  
  // Function to ban a user
  function banUser(username) {
    chrome.storage.local.get(['bannedUsers'], (result) => {
      const banned = result.bannedUsers || [];
      if (!banned.includes(username)) {
        banned.push(username);
        chrome.storage.local.set({ bannedUsers: banned }, () => {
          console.log(`User "${username}" has been banned.`);
          // Optionally, implement logic to remove the user from the meeting
        });
      }
    });
  }
  
  // Function to allow a user
  function allowUser(username) {
    chrome.storage.local.get(['allowedUsers'], (result) => {
      const allowed = result.allowedUsers || [];
      if (!allowed.includes(username)) {
        allowed.push(username);
        chrome.storage.local.set({ allowedUsers: allowed }, () => {
          console.log(`User "${username}" has been allowed.`);
          // Optionally, implement logic to re-enable user access
        });
      }
    });
  }
  
  // Function to update the status indicator's color
  function updateStatusIndicator(username, status) {
    // Replace with the actual selector for the attendance list
    const attendanceList = document.querySelector('.a-D-Ja'); // Example selector
  
    if (attendanceList) {
      // Replace with the actual selector for participant entries
      const participants = attendanceList.querySelectorAll('.ZjFb7c'); // Example selector
  
      participants.forEach(participant => {
        const usernameElement = participant.querySelector('.ZjFb7c'); // Replace with actual selector
        const currentUsername = usernameElement ? usernameElement.textContent.trim() : 'Unknown';
  
        if (currentUsername === username) {
          const indicator = participant.querySelector('.status-indicator');
          if (indicator) {
            switch (status) {
              case 'banned':
                indicator.style.backgroundColor = 'red';
                break;
              case 'allowed':
                indicator.style.backgroundColor = 'green';
                break;
              default:
                indicator.style.backgroundColor = 'yellow';
            }
          }
        }
      });
    }
  }
  
  // Initial injection of indicators and buttons
  addStatusIndicators();
  
  // Observe DOM changes to update indicators and buttons in real-time
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        addStatusIndicators();
      }
    });
  });
  
  // Start observing the body for changes
  observer.observe(document.body, { childList: true, subtree: true });
  