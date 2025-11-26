const tabList = document.getElementById('tabList');

function updateTabList() {
  chrome.runtime.sendMessage({ action: 'getTabTimes' }, (tabTimes) => {
    tabList.innerHTML = '';

    // Sort by time descending
    let entries = Object.entries(tabTimes);
    entries.sort((a, b) => {
      const timeA = a[1].time.split(':').reduce((acc, t) => acc*60 + parseInt(t), 0);
      const timeB = b[1].time.split(':').reduce((acc, t) => acc*60 + parseInt(t), 0);
      return timeB - timeA; // longest first
    });

    for (let [domain, data] of entries) {
      let li = document.createElement('li');
      li.className = 'tab-item';

      let domainLink = document.createElement('a');
      domainLink.className = 'tab-domain';
      domainLink.href = '#';
      domainLink.textContent = domain;
      domainLink.addEventListener('click', () => {
        // Tell background to focus this tab
        chrome.runtime.sendMessage({ 
          action: 'focusTab', 
          tabId: data.tabId, 
          windowId: data.windowId 
        });
      });

      let timeSpan = document.createElement('span');
      timeSpan.className = 'tab-time';
      timeSpan.textContent = data.time;

      li.appendChild(domainLink);
      li.appendChild(timeSpan);
      tabList.appendChild(li);
    }
  });
}

// Update every second
setInterval(updateTabList, 1000);
updateTabList();
