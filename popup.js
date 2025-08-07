// popup.js

document.addEventListener('DOMContentLoaded', () => {
  const toggleEnabled = document.getElementById('toggle-enabled');
  const exportBtn = document.getElementById('export-data');
  const importBtn = document.getElementById('import-data');
  const importFile = document.getElementById('import-file');

  const banAddButton = document.getElementById('ban-add');
  const banUsernameInput = document.getElementById('ban-username');
  const bannedUsersContainer = document.getElementById('banned-users');

  const allowAddButton = document.getElementById('allow-add');
  const allowUsernameInput = document.getElementById('allow-username');
  const allowedUsersContainer = document.getElementById('allowed-users');

  function unique(list) {
    return Array.from(new Set(list.filter(Boolean).map((s) => s.trim()).filter(Boolean)));
  }

  // Load initial state
  chrome.storage.local.get(['bannedUsers', 'allowedUsers', 'extensionEnabled'], (result) => {
    const banned = unique(result.bannedUsers || []);
    const allowed = unique(result.allowedUsers || []);
    const enabled = typeof result.extensionEnabled === 'boolean' ? result.extensionEnabled : true;

    toggleEnabled.checked = enabled;

    renderList('bannedUsers', banned, bannedUsersContainer);
    renderList('allowedUsers', allowed, allowedUsersContainer);
  });

  // Render list helper
  function renderList(listKey, list, container) {
    container.innerHTML = '';
    list.forEach((user) => {
      const userItem = document.createElement('div');
      userItem.className = 'user-item';

      const label = document.createElement('span');
      label.textContent = user;

      const removeBtn = document.createElement('button');
      removeBtn.className = 'remove-button';
      removeBtn.textContent = 'Remove';
      removeBtn.addEventListener('click', () => removeUser(listKey, user));

      userItem.appendChild(label);
      userItem.appendChild(removeBtn);
      container.appendChild(userItem);
    });
  }

  // Add user to the specified list, ensuring exclusivity
  function addUser(listKey, username) {
    const clean = (username || '').trim();
    if (!clean) return;

    chrome.storage.local.get(['bannedUsers', 'allowedUsers'], (result) => {
      let banned = unique(result.bannedUsers || []);
      let allowed = unique(result.allowedUsers || []);

      banned = banned.filter((u) => u !== clean);
      allowed = allowed.filter((u) => u !== clean);

      if (listKey === 'bannedUsers') banned.push(clean);
      if (listKey === 'allowedUsers') allowed.push(clean);

      chrome.storage.local.set({ bannedUsers: unique(banned), allowedUsers: unique(allowed) }, () => {
        if (listKey === 'bannedUsers') {
          renderList('bannedUsers', banned, bannedUsersContainer);
          updateStatusInTab(clean, 'banned');
        } else {
          renderList('allowedUsers', allowed, allowedUsersContainer);
          updateStatusInTab(clean, 'allowed');
        }
      });
    });
  }

  // Remove user from the specified list
  function removeUser(listKey, username) {
    chrome.storage.local.get([listKey], (result) => {
      let list = unique(result[listKey] || []);
      list = list.filter((user) => user !== username);
      chrome.storage.local.set({ [listKey]: list }, () => {
        if (listKey === 'bannedUsers') {
          renderList('bannedUsers', list, bannedUsersContainer);
          updateStatusInTab(username, 'neutral');
        } else if (listKey === 'allowedUsers') {
          renderList('allowedUsers', list, allowedUsersContainer);
          updateStatusInTab(username, 'neutral');
        }
      });
    });
  }

  // Update status indicators in the active tab (best-effort)
  function updateStatusInTab(username, status) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (!activeTab || !activeTab.url || !activeTab.url.startsWith('https://meet.google.com/')) return;
      chrome.tabs.sendMessage(activeTab.id, { type: 'STATUS_UPDATE', username, status });
    });
  }

  // Toggle enable state
  toggleEnabled.addEventListener('change', () => {
    chrome.storage.local.set({ extensionEnabled: !!toggleEnabled.checked });
  });

  // Import/export
  exportBtn.addEventListener('click', () => {
    chrome.storage.local.get(['bannedUsers', 'allowedUsers'], (result) => {
      const payload = {
        bannedUsers: unique(result.bannedUsers || []),
        allowedUsers: unique(result.allowedUsers || []),
        exportedAt: new Date().toISOString(),
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'meet-admin-overlay-export.json';
      a.click();
      URL.revokeObjectURL(url);
    });
  });

  importBtn.addEventListener('click', () => importFile.click());
  importFile.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result || '{}'));
        const banned = unique(Array.isArray(data.bannedUsers) ? data.bannedUsers : []);
        const allowed = unique(Array.isArray(data.allowedUsers) ? data.allowedUsers : []);
        chrome.storage.local.set({ bannedUsers: banned, allowedUsers: allowed }, () => {
          renderList('bannedUsers', banned, bannedUsersContainer);
          renderList('allowedUsers', allowed, allowedUsersContainer);
        });
      } catch (err) {
        console.error('Failed to import list:', err);
      }
    };
    reader.readAsText(file);
    importFile.value = '';
  });

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
});
  