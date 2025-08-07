// contentScript.js

(function () {
  if (window.__meetAdminInitialized) return;
  window.__meetAdminInitialized = true;

  const EXT_ATTRIBUTE = 'data-meet-admin-enhanced';
  const BUTTON_CLASS_BAN = 'ban-button';
  const BUTTON_CLASS_ALLOW = 'allow-button';
  const INDICATOR_CLASS = 'status-indicator';
  const TOAST_CONTAINER_CLASS = 'admin-toast-container';

  let extensionEnabled = true;
  let mutationObserver = null;
  let scheduledRefreshId = null;

  // Potential selectors for participant list and entries (best-effort, resilient to minor changes)
  const ATTENDANCE_ROOT_SELECTORS = [
    '.a-D-Ja',
    '[role="list"]',
    '[data-panel-id="bbbYaf"]', // sometimes used for people panel
  ];

  const PARTICIPANT_ENTRY_SELECTORS = [
    '.ZjFb7c',
    '[role="listitem"]',
  ];

  const USERNAME_SELECTORS = [
    '.ZjFb7c',
    '[data-self-name]',
    '[aria-label]'
  ];

  function debounceRefresh(delayMs = 150) {
    if (scheduledRefreshId) {
      clearTimeout(scheduledRefreshId);
      scheduledRefreshId = null;
    }
    scheduledRefreshId = setTimeout(() => {
      scheduledRefreshId = null;
      refreshUI();
    }, delayMs);
  }

  function getAttendanceRoot() {
    for (const selector of ATTENDANCE_ROOT_SELECTORS) {
      const el = document.querySelector(selector);
      if (el) return el;
    }
    return null;
  }

  function getParticipants(root) {
    if (!root) return [];
    let entries = [];
    for (const selector of PARTICIPANT_ENTRY_SELECTORS) {
      entries = root.querySelectorAll(selector);
      if (entries && entries.length) break;
    }
    return Array.from(entries);
  }

  function extractUsername(participantEl) {
    // Try known selectors, then fallback to trimmed text
    for (const selector of USERNAME_SELECTORS) {
      const el = participantEl.querySelector(selector);
      if (el && el.textContent) {
        const name = el.textContent.trim();
        if (name) return name;
      }
      if (el && el.getAttribute) {
        const aria = el.getAttribute('aria-label');
        if (aria) return aria.trim();
      }
    }
    const text = participantEl.textContent || '';
    return text.split('\n')[0].trim() || 'Unknown';
  }

  function ensureToastContainer() {
    let container = document.querySelector(`.${TOAST_CONTAINER_CLASS}`);
    if (!container) {
      container = document.createElement('div');
      container.className = TOAST_CONTAINER_CLASS;
      document.body.appendChild(container);
    }
    return container;
  }

  function showToast(message, type = 'info', durationMs = 2500) {
    const container = ensureToastContainer();
    const toast = document.createElement('div');
    toast.className = `admin-toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-4px)';
      setTimeout(() => toast.remove(), 250);
    }, durationMs);
  }

  function getLists() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['bannedUsers', 'allowedUsers'], (result) => {
        resolve({
          bannedUsers: result.bannedUsers || [],
          allowedUsers: result.allowedUsers || [],
        });
      });
    });
  }

  function getExtensionEnabled() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['extensionEnabled'], (result) => {
        resolve(typeof result.extensionEnabled === 'boolean' ? result.extensionEnabled : true);
      });
    });
  }

  function setUserStatus(username, nextStatus) {
    // Ensure mutual exclusivity between lists
    chrome.storage.local.get(['bannedUsers', 'allowedUsers'], (result) => {
      let banned = result.bannedUsers || [];
      let allowed = result.allowedUsers || [];

      banned = banned.filter((u) => u !== username);
      allowed = allowed.filter((u) => u !== username);

      if (nextStatus === 'banned') banned.push(username);
      if (nextStatus === 'allowed') allowed.push(username);

      chrome.storage.local.set({ bannedUsers: banned, allowedUsers: allowed }, () => {
        showToast(`"${username}" marked as ${nextStatus}`, nextStatus === 'banned' ? 'error' : nextStatus === 'allowed' ? 'success' : 'info');
      });
    });
  }

  function computeStatus(username, lists) {
    if (lists.bannedUsers.includes(username)) return 'banned';
    if (lists.allowedUsers.includes(username)) return 'allowed';
    return 'neutral';
  }

  function removeInjectedUI() {
    document.querySelectorAll(`[${EXT_ATTRIBUTE}="1"]`).forEach((el) => {
      el.remove();
    });
  }

  function addActionButtons(container, username) {
    const banButton = document.createElement('button');
    banButton.textContent = 'Ban';
    banButton.className = BUTTON_CLASS_BAN;
    banButton.addEventListener('click', (e) => {
      e.stopPropagation();
      setUserStatus(username, 'banned');
    });

    const allowButton = document.createElement('button');
    allowButton.textContent = 'Allow';
    allowButton.className = BUTTON_CLASS_ALLOW;
    allowButton.addEventListener('click', (e) => {
      e.stopPropagation();
      setUserStatus(username, 'allowed');
    });

    container.appendChild(banButton);
    container.appendChild(allowButton);
  }

  function ensureEnhancements(participantEl, username, status) {
    // Create a small inline container to hold indicator and buttons
    let uiContainer = participantEl.querySelector(`[${EXT_ATTRIBUTE}="1"]`);
    if (!uiContainer) {
      uiContainer = document.createElement('span');
      uiContainer.setAttribute(EXT_ATTRIBUTE, '1');
      uiContainer.style.marginLeft = '8px';
      uiContainer.style.display = 'inline-flex';
      uiContainer.style.alignItems = 'center';

      const indicator = document.createElement('span');
      indicator.className = INDICATOR_CLASS;
      uiContainer.appendChild(indicator);

      addActionButtons(uiContainer, username);

      participantEl.appendChild(uiContainer);
    }

    const indicator = uiContainer.querySelector(`.${INDICATOR_CLASS}`);
    if (indicator) {
      indicator.style.backgroundColor = status === 'banned' ? 'red' : status === 'allowed' ? 'green' : 'yellow';
      indicator.title = `Status: ${status}`;
    }
  }

  async function refreshUI() {
    if (!extensionEnabled) {
      removeInjectedUI();
      return;
    }

    const root = getAttendanceRoot();
    if (!root) return;

    const lists = await getLists();
    const participants = getParticipants(root);

    for (const el of participants) {
      // Avoid enhancing non-user tiles by requiring some text
      const username = extractUsername(el);
      if (!username || username === 'Unknown') continue;
      ensureEnhancements(el, username, computeStatus(username, lists));
    }
  }

  function startObserving() {
    if (mutationObserver) return;
    mutationObserver = new MutationObserver(() => debounceRefresh(200));
    mutationObserver.observe(document.body, { childList: true, subtree: true });
  }

  function stopObserving() {
    if (mutationObserver) {
      mutationObserver.disconnect();
      mutationObserver = null;
    }
  }

  async function init() {
    extensionEnabled = await getExtensionEnabled();
    if (extensionEnabled) startObserving();
    debounceRefresh(0);
  }

  // Listen for storage changes (banned/allowed lists or enable toggle)
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local') return;
    if (changes.extensionEnabled) {
      extensionEnabled = changes.extensionEnabled.newValue;
      if (!extensionEnabled) {
        stopObserving();
        removeInjectedUI();
        showToast('Meet Admin Overlay disabled', 'info');
      } else {
        startObserving();
        debounceRefresh(0);
        showToast('Meet Admin Overlay enabled', 'success');
      }
      return;
    }
    if (changes.bannedUsers || changes.allowedUsers) {
      debounceRefresh(50);
    }
  });

  // Also react to runtime messages from background (redundant but harmless)
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg && msg.type === 'EXTENSION_STATE_CHANGED') {
      extensionEnabled = !!msg.enabled;
      if (!extensionEnabled) {
        stopObserving();
        removeInjectedUI();
      } else {
        startObserving();
        debounceRefresh(0);
      }
    }
  });

  init();
})();
  