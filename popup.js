// popup.js

document.addEventListener('DOMContentLoaded', () => {
    const banAddButton = document.getElementById('ban-add');
    const banUsernameInput = document.getElementById('ban-username');
    const bannedUsersContainer = document.getElementById('banned-users');
  
    const allowAddButton = document.getElementById('allow-add');
    const allowUsernameInput = document.getElementById('allow-username');
    const allowedUsersContainer = document.getElementById('allowed-users');
  
    // Load and display banned users
    function loadBannedUsers() {
      chrome.storage.local.get(['bannedUsers'], (result) => {
        const banned = result.bannedUsers || [];
        bannedUsersContainer.innerHTML = '';
        banned.forEach(user => {
          const userItem = document.createElement('div');
          userItem.className = 'user-item';
          userItem.textContent = user;
  
          const removeBtn = document.createElement('button');
          removeBtn.className = 'remove-button';
          removeBtn.textContent = 'Remove';
          removeBtn.addEventListener('click', () => {
            removeUser('bannedUsers', user);
          });
  
          userItem.appendChild(removeBtn);
          bannedUsersContainer.appendChild(userItem);
        });
      });
    }
  
    // Load and display allowed users
    function loadAllowedUsers() {
      chrome.storage.local.get(['allowedUsers'], (result) => {
        const allowed = result.allowedUsers || [];
        allowedUsersContainer.innerHTML = '';
        allowed.forEach(user => {
          const userItem = document.createElement('div');
          userItem.className = 'user-item';
          userItem.textContent = user;
  
          const removeBtn = document.createElement('button');
          removeBtn.className = 'remove-button';
          removeBtn.textContent = 'Remove';
          removeBtn.addEventListener('click', () => {
            removeUser('allowedUsers', user);
          });
  
          userItem.appendChild(removeBtn);
          allowedUsersContainer.appendChild(userItem);
        });
      });
    }
  
    // Add user to the specified list
    function addUser(listKey, username) {
      if (!username) return;
      chrome.storage.local.get([listKey], (result) => {
        const list = result[listKey] || [];
        if (!list.includes(username)) {
          list.push(username);
          chrome.storage.local.set({ [listKey]: list }, () => {
            if (listKey === 'bannedUsers') {
              loadBannedUsers();
              // Update status indicators in the active tab
              updateStatusInTab(username, 'banned');
            } else if (listKey === 'allowedUsers') {
              loadAllowedUsers();
              // Update status indicators in the active tab
              updateStatusInTab(username, 'allowed');
            }
          });
        }
      });
    }
  
    // Remove user from the specified list
    function removeUser(listKey, username) {
      chrome.storage.local.get([listKey], (result) => {
        let list = result[listKey] || [];
        list = list.filter(user => user !== username);
        chrome.storage.local.set({ [listKey]: list }, () => {
          if (listKey === 'bannedUsers') {
            loadBannedUsers();
            // Update status indicators in the active tab
            updateStatusInTab(username, 'neutral');
          } else if (listKey === 'allowedUsers') {
            loadAllowedUsers();
            // Update status indicators in the active tab
            updateStatusInTab(username, 'neutral');
          }
        });
      });
    }
  
    // Update status indicators in the active tab
    function updateStatusInTab(username, status) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        if (activeTab && activeTab.url.startsWith("https://meet.google.com/")) {
          chrome.scripting.executeScript({
            target: { tabId: activeTab.id },
            func: updateStatusIndicatorInPage,
            args: [username, status]
          })
          .then(() => {
            console.log(`Status for "${username}" updated to "${status}".`);
          })
          .catch(err => console.error('Status update injection failed:', err));
        }
      });
    }
  
    // Function to be injected into the page to update status indicators
    function updateStatusIndicatorInPage(username, status) {
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
  
    // Event listeners for adding users
    banAddButton.addEventListener('click', () => {
      const username = banUsernameInput.value.trim();
      if (username) {
        addUser('bannedUsers', username);
        banUsernameInput.value = '';
      }
    });
  
    allowAddButton.addEventListener('click', () => {
      const username = allowUsernameInput.value.trim();
      if (username) {
        addUser('allowedUsers', username);
        allowUsernameInput.value = '';
      }
    });
  
    // Initial load of users
    loadBannedUsers();
    loadAllowedUsers();
  });
  