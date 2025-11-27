const tabList = document.getElementById('tabList');
const copyBtn = document.getElementById('copyBtn');
const downloadCsvBtn = document.getElementById('downloadCsvBtn');


function createHeaderRow() {
  const header = document.createElement('div');
  header.className = 'tab-row header-row';

  const domainHeader = document.createElement('div');
  domainHeader.textContent = 'Domain';
  domainHeader.className = 'tab-col domain-col';

  const openHeader = document.createElement('div');
  openHeader.textContent = 'Open Time';
  openHeader.className = 'tab-col open-col';

  const activeHeader = document.createElement('div');
  activeHeader.textContent = 'Active Time';
  activeHeader.className = 'tab-col active-col';

  const resetHeader = document.createElement('div');
  resetHeader.textContent = 'Reset';
  resetHeader.className = 'tab-col reset-col';

  header.appendChild(domainHeader);
  header.appendChild(openHeader);
  header.appendChild(activeHeader);
  header.appendChild(resetHeader);
  tabList.appendChild(header);
}


function updateTabList() {
  chrome.runtime.sendMessage({ action: 'getTabTimes' }, (tabTimes) => {
    tabList.innerHTML = '';
    createHeaderRow();

    // Sort by creation time
    let entries = Object.entries(tabTimes);
    entries.sort((a, b) => a[1].createdAt - b[1].createdAt);

    for (let [domain, data] of entries) {
      const row = document.createElement('div');
      row.className = 'tab-row';

      // Domain clickable
      const domainDiv = document.createElement('div');
      domainDiv.className = 'tab-col domain-col';
      domainDiv.textContent = domain;
      domainDiv.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'focusTab', tabId: data.tabId, windowId: data.windowId });
      });

      // Open time
      const openDiv = document.createElement('div');
      openDiv.className = 'tab-col open-col';
      openDiv.textContent = `${data.secondsOpen}s`;

      // Active time
      const activeDiv = document.createElement('div');
      activeDiv.className = 'tab-col active-col';
      activeDiv.textContent = `${data.secondsActive}s`;

      // Reset button
      const resetDiv = document.createElement('div');
      resetDiv.className = 'tab-col reset-col';
      const resetBtn = document.createElement('button');
      resetBtn.textContent = 'Reset';
      resetBtn.title = 'Reset timer';
      resetBtn.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'resetTimer', tabId: data.tabId });
      });
      resetDiv.appendChild(resetBtn);

      row.appendChild(domainDiv);
      row.appendChild(openDiv);
      row.appendChild(activeDiv);
      row.appendChild(resetDiv);
      tabList.appendChild(row);
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
// DOWNLOAD CSV
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

// Update the popup every second
setInterval(updateTabList, 1000);
updateTabList();
