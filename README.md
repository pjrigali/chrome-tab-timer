# Tab Time Tracker Chrome Extension

**Track how long your tabs have been open in real time, with a badge and popup interface.**  

---

## Features

- **Real-time tab tracking:**  
  Tracks how long each tab has been open, even if it is inactive.  

- **Badge display:**  
  - Tabs under 1 hour: `MM:SS`  
  - Tabs over 1 hour: `H:MM`  
  - Updates every second automatically.

- **Popup interface:**  
  - Lists all open tabs with **domain names** instead of tab IDs.  
  - Displays full `HH:MM:SS` time for each tab.  
  - Tabs are **sorted by longest open time**.  
  - Modern card-style design with hover effects.  
  - Click a domain to **focus/activate that tab**.  

- **Optional future features:**  
  - Reset timer per tab (can be added).  
  - Persist tab times across browser restarts.  

---

## Installation Instructions

1. **Download or clone the repository**  
   Ensure you have all the files:  
  * manifest.json
  * background.js
  * popup.html
  * popup.js


2. **Open Chrome extensions page**  
Navigate to: `chrome://extensions/`

3. **Enable Developer Mode**  
Toggle the switch in the top-right corner.

4. **Load the extension**  
  - Click **Load unpacked**  
  - Select the folder containing the extension files.

5. **Pin the extension (optional)**  
  - Click the puzzle icon in the toolbar  
  - Pin “Tab Time Tracker” for easy access.

6. **Use the extension**  
  - Open multiple tabs.  
  - The badge will display time per tab.  
  - Click the extension icon to open the popup for a detailed list.

---

## How it Works

- **Background Script (`background.js`)**  
  - Tracks tab creation and removal.  
  - Updates elapsed time for all tabs every second.  
  - Updates tab badge dynamically in MM:SS or H:MM format.  
  - Handles popup requests and focusing tabs.  

- **Popup (`popup.html` + `popup.js`)**  
  - Displays all tabs with domain and full HH:MM:SS timer.  
  - Clickable domains focus the corresponding tab.  
  - Sorted by createdAt time.  
  - Stylish card design for easy readability.  

---

## Development Notes

- Compatible with **Chrome Manifest V3**.  
- Badge text limited to **4 characters**, hence MM:SS or H:MM formatting.  
- Tabs’ times reset on browser restart (optional: implement `chrome.storage.local` to persist).  
- Works with inactive tabs and background windows.  

---

## Future Enhancements

- ~~Add a **reset timer button** for each tab~~.  
- ~~Option to **persist timers across sessions**~~.  
- Customize **badge colors or popup theme**.  
- Export tab times to a file or clipboard.  

---

## License

This extension is open source. Feel free to modify and use it as needed.
