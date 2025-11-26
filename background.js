let tabTimes = {};

// When a tab is created
chrome.tabs.onCreated.addListener((tab) => {
  tabTimes[tab.id] = {
    startTime: Date.now(),
    seconds: 0
  };
  updateBadge(tab.id);
});

// When a tab is removed
chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabTimes[tabId]) {
    delete tabTimes[tabId];
  }
});

// Update time every second
setInterval(() => {
  const now = Date.now();
  for (let tabId in tabTimes) {
    let elapsed = Math.floor((now - tabTimes[tabId].startTime) / 1000);
    tabTimes[tabId].seconds = elapsed;
    updateBadge(parseInt(tabId));
  }
}, 1000);

// Update the badge text for a tab
function updateBadge(tabId) {
  chrome.tabs.get(tabId, (tab) => {
    if (chrome.runtime.lastError) return; // tab may be closed
    let totalSeconds = tabTimes[tabId] ? tabTimes[tabId].seconds : 0;
    let hours = Math.floor(totalSeconds / 3600);
    let minutes = Math.floor((totalSeconds % 3600) / 60);
    let seconds = totalSeconds % 60;

    let badgeText = '';
    if (hours > 0) {
      // Show H:MM if over 1 hour
      badgeText = `${hours}:${minutes.toString().padStart(2, '0')}`;
    } else {
      // Show MM:SS if less than 1 hour
      badgeText = `${minutes.toString().padStart(2,'0')}:${seconds.toString().padStart(2,'0')}`;
    }

    chrome.action.setBadgeText({ text: badgeText, tabId });
    chrome.action.setBadgeBackgroundColor({ color: '#4CAF50', tabId });
  });
}

// Provide data to popup (full HH:MM:SS with domain)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getTabTimes') {
    let formattedTimes = {};
    chrome.tabs.query({}, (tabs) => {
      for (let tab of tabs) {
        let tabData = tabTimes[tab.id];
        if (tabData) {
          let totalSeconds = tabData.seconds;
          let hours = Math.floor(totalSeconds / 3600);
          let minutes = Math.floor((totalSeconds % 3600) / 60);
          let seconds = totalSeconds % 60;
          let timeStr = `${hours.toString().padStart(2,'0')}:${minutes.toString().padStart(2,'0')}:${seconds.toString().padStart(2,'0')}`;
          let domain = '';
          try { domain = new URL(tab.url).hostname; } catch(e){ domain = tab.title || 'unknown'; }
          formattedTimes[domain] = {
            time: timeStr,
            tabId: tab.id,
            windowId: tab.windowId
          };
        }
      }
      sendResponse(formattedTimes);
    });
    return true;
  }
});

// Focus a specific tab when requested from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'focusTab' && request.tabId !== undefined) {
    chrome.tabs.update(request.tabId, { active: true });
    chrome.windows.update(request.windowId, { focused: true });
    sendResponse({ success: true });
  }
});
