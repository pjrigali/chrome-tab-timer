const tabList = document.getElementById('tabList');
const copyBtn = document.getElementById('copyBtn');

function updateTabList() {
  chrome.runtime.sendMessage({ action: 'getTabTimes' }, (tabTimes) => {
    tabList.innerHTML = '';

    // Sort by longest time
    let entries = Object.entries(tabTimes);
    entries.sort((a, b) => a[1].createdAt - b[1].createdAt);

    for (let [domain, data] of entries) {
      const li = document.createElement('li');
      li.className = 'tab-item';

      // Domain clickable to focus tab
      const domainSpan = document.createElement('span');
      domainSpan.className = 'tab-domain';
      domainSpan.textContent = domain;
      domainSpan.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'focusTab', tabId: data.tabId, windowId: data.windowId });
      });

      // Time display
      const timeSpan = document.createElement('span');
      timeSpan.className = 'tab-time';
      timeSpan.textContent = data.time;

      // Reset button
      const resetBtn = document.createElement('button');
      resetBtn.className = 'reset-btn';
      resetBtn.textContent = 'Reset';
      resetBtn.title = 'Reset timer';
      resetBtn.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'resetTimer', tabId: data.tabId });
      });

      li.appendChild(domainSpan);
      li.appendChild(timeSpan);
      li.appendChild(resetBtn);
      tabList.appendChild(li);
    }
  });
}

// Copy all tab times to clipboard
copyBtn.addEventListener('click', () => {
  // Get the tab times from background
  chrome.runtime.sendMessage({ action: 'getTabTimes' }, (tabTimes) => {
    let text = '';
    for (let domain in tabTimes) {
      text += `${domain}: ${tabTimes[domain].time}\n`;
    }

    // Copy in the popup context (works reliably)
    navigator.clipboard.writeText(text).then(() => {
      alert('Tab times copied to clipboard!');
    }).catch(err => console.error('Clipboard error:', err));
  });
});

// Update every second
setInterval(updateTabList, 1000);
updateTabList();
