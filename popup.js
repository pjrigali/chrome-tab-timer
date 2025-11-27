const tabList = document.getElementById('tabList');
const copyBtn = document.getElementById('copyBtn');
const downloadCsvBtn = document.getElementById('downloadCsvBtn');

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


// ------------------------------------------------------
// COPY TO CLIPBOARD
// ------------------------------------------------------
copyBtn.addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'copyTabTimes' }, (response) => {
    if (!response || !response.text) {
      console.error("No text returned from background.");
      return;
    }

    navigator.clipboard.writeText(response.text)
      .then(() => alert("Tab details copied to clipboard!"))
      .catch(err => console.error("Clipboard error:", err));
  });
});


// ------------------------------------------------------
// DOWNLOAD CSV (NEW)
// ------------------------------------------------------
downloadCsvBtn.addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'copyTabTimes' }, (response) => {
    if (!response || !response.csv) {
      console.error("No CSV returned from background.");
      return;
    }

    // Create a downloadable CSV blob
    const blob = new Blob([response.csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    // Generate temporary download link
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tab_times.csv';
    document.body.appendChild(a);
    a.click();

    // Cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
});

// Update every second
setInterval(updateTabList, 1000);
updateTabList();
