let tabTimes = {};

// --- Tab creation & removal ---
chrome.tabs.onCreated.addListener((tab) => {
  tabTimes[tab.id] = { startTime: Date.now(), seconds: 0, createdAt: Date.now() };
  updateBadge(tab.id);
});

chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabTimes[tabId]) delete tabTimes[tabId];
});

// --- Update time & badge every second ---
setInterval(() => {
  const now = Date.now();
  for (let tabId in tabTimes) {
    let elapsed = Math.floor((now - tabTimes[tabId].startTime) / 1000);
    tabTimes[tabId].seconds = elapsed;
    updateBadge(parseInt(tabId));
  }
}, 1000);

// --- Save timers to storage every 5 seconds ---
setInterval(() => {
  chrome.storage.local.set({ tabTimes });
}, 5000);

// --- Update badge ---
function updateBadge(tabId) {
  chrome.tabs.get(tabId, (tab) => {
    if (chrome.runtime.lastError) return;
    let totalSeconds = tabTimes[tabId]?.seconds || 0;
    let hours = Math.floor(totalSeconds / 3600);
    let minutes = Math.floor((totalSeconds % 3600) / 60);
    let seconds = totalSeconds % 60;

    let badgeText = hours > 0
      ? `${hours}:${minutes.toString().padStart(2,'0')}` // H:MM
      : `${minutes.toString().padStart(2,'0')}:${seconds.toString().padStart(2,'0')}`; // MM:SS

    let color = totalSeconds >= 3600 ? '#f44336' : '#4CAF50';
    chrome.action.setBadgeText({ text: badgeText, tabId });
    chrome.action.setBadgeBackgroundColor({ color, tabId });
  });
}

// --- Load timers from storage on startup ---
chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.get('tabTimes', (result) => {
    if (result.tabTimes) {
      tabTimes = result.tabTimes;
      for (let id in tabTimes) {
        tabTimes[id].startTime = Number(tabTimes[id].startTime);
        updateBadge(Number(id));
      }
    }
  });
});

// --- Unified message listener ---
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'getTabTimes':
      let formattedTimes = {};
      chrome.tabs.query({}, (tabs) => {
        for (let tab of tabs) {
          let data = tabTimes[tab.id];
          if (data) {
            let totalSeconds = data.seconds;
            let hours = Math.floor(totalSeconds / 3600);
            let minutes = Math.floor((totalSeconds % 3600) / 60);
            let seconds = totalSeconds % 60;
            let timeStr = `${hours.toString().padStart(2,'0')}:${minutes.toString().padStart(2,'0')}:${seconds.toString().padStart(2,'0')}`;

            let domain = '';
            try { domain = new URL(tab.url).hostname; } 
            catch(e){ domain = tab.title || 'unknown'; }

            formattedTimes[domain] = { time: timeStr, tabId: tab.id, windowId: tab.windowId };
          }
        }
        sendResponse(formattedTimes);
      });
      return true; // async response

    case 'focusTab':
      if (request.tabId !== undefined) {
        chrome.tabs.update(request.tabId, { active: true });
        chrome.windows.update(request.windowId, { focused: true });
        sendResponse({ success: true });
      }
      break;

    case 'resetTimer':
      if (tabTimes[request.tabId]) {
        tabTimes[request.tabId].startTime = Date.now();
        tabTimes[request.tabId].seconds = 0;
        updateBadge(request.tabId);
        sendResponse({ success: true });
      }
      break;

    default:
      break;
  }
});


