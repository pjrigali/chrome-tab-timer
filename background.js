let tabTimes = {};
let activeTabs = {};        // windowId -> tabId
let focusedWindowId = null; // currently focused window

// --- Tab creation ---
chrome.tabs.onCreated.addListener((tab) => {
  tabTimes[tab.id] = {
    startTime: Date.now(),
    secondsOpen: 0,
    secondsActive: 0,
    createdAt: Date.now(),
    lastUpdate: Date.now()
  };
  updateBadge(tab.id, 0); // badge shows secondsOpen
});

// --- Tab removal ---
chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabTimes[tabId]) delete tabTimes[tabId];
});

// --- Track active tab per window ---
chrome.tabs.onActivated.addListener(({ tabId, windowId }) => {
  activeTabs[windowId] = tabId;
});

// --- Track focused window ---
chrome.windows.onFocusChanged.addListener((windowId) => {
  focusedWindowId = windowId === chrome.windows.WINDOW_ID_NONE ? null : windowId;
});

// --- Update timers every second ---
setInterval(() => {
  const now = Date.now();

  for (let tabId in tabTimes) {
    const data = tabTimes[tabId];

    // Update total open time
    data.secondsOpen = Math.floor((now - data.startTime) / 1000);

    // Update active time only if tab is active in focused window
    if (focusedWindowId !== null && activeTabs[focusedWindowId] === parseInt(tabId)) {
      let elapsed = Math.floor((now - (data.lastUpdate || data.startTime)) / 1000);
      data.secondsActive += elapsed;
    }

    // Update lastUpdate for accurate active time tracking
    data.lastUpdate = now;

    // Badge shows only open time
    updateBadge(parseInt(tabId), data.secondsOpen);
  }
}, 1000);

// --- Save timers to storage every 5 seconds ---
setInterval(() => {
  chrome.storage.local.set({ tabTimes });
}, 5000);

// --- Update badge ---
function updateBadge(tabId, secondsOpen) {
  chrome.tabs.get(tabId, (tab) => {
    if (chrome.runtime.lastError) return;

    const hours = Math.floor(secondsOpen / 3600);
    const minutes = Math.floor((secondsOpen % 3600) / 60);
    const seconds = secondsOpen % 60;

    const badgeText = hours > 0
      ? `${hours}:${minutes.toString().padStart(2,'0')}` // H:MM
      : `${minutes.toString().padStart(2,'0')}:${seconds.toString().padStart(2,'0')}`; // MM:SS

    const color = secondsOpen >= 3600 ? '#f44336' : '#4CAF50';
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
        tabTimes[id].secondsOpen = Number(tabTimes[id].secondsOpen || 0);
        tabTimes[id].secondsActive = Number(tabTimes[id].secondsActive || 0);
        tabTimes[id].lastUpdate = Number(tabTimes[id].lastUpdate || Date.now());
        updateBadge(Number(id), tabTimes[id].secondsOpen);
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
            let totalSeconds = data.secondsOpen;
            let hours = Math.floor(totalSeconds / 3600);
            let minutes = Math.floor((totalSeconds % 3600) / 60);
            let seconds = totalSeconds % 60;
            let timeStr = `${hours.toString().padStart(2,'0')}:${minutes.toString().padStart(2,'0')}:${seconds.toString().padStart(2,'0')}`;

            let domain = '';
            try {
              domain = new URL(tab.url).hostname.replace(/^www\./, '');
            } catch (e) {
              domain = tab.title || 'unknown';
            }

            formattedTimes[domain] = {
              time: timeStr,
              secondsOpen: data.secondsOpen,
              secondsActive: data.secondsActive,
              tabId: tab.id,
              windowId: tab.windowId,
              url: tab.url,
              createdAt: data.createdAt
            };
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
        tabTimes[request.tabId].secondsOpen = 0;
        tabTimes[request.tabId].secondsActive = 0;
        tabTimes[request.tabId].lastUpdate = Date.now();
        updateBadge(request.tabId, 0);
        sendResponse({ success: true });
      }
      break;

    case 'copyTabTimes':
      chrome.tabs.query({}, (tabs) => {
        let text = '';
        let csv = 'tabId,windowId,domain,url,createdAtISO,secondsOpen,secondsActive\n';

        for (let tab of tabs) {
          const data = tabTimes[tab.id];
          if (!data) continue;

          let domain = '';
          try {
            domain = new URL(tab.url).hostname.replace(/^www\./, '');
          } catch (e) {
            domain = tab.title || 'unknown';
          }

          const isoCreated = new Date(data.createdAt || data.startTime).toISOString();

          // Plain text output (single line per tab)
          text += `${tab.id}, ${tab.windowId}, ${domain}, ${tab.url}, ${isoCreated}, ${data.secondsOpen}, ${data.secondsActive}\n`;

          // CSV format
          csv += `${tab.id},${tab.windowId},${domain},"${tab.url}",${isoCreated},${data.secondsOpen},${data.secondsActive}\n`;
        }

        sendResponse({ text, csv });
      });
      return true;

    default:
      break;
  }
});
