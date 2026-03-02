### **🚀 Medium Writer Helper**

**A browser extension to effortlessly create tables of contents and write in Dark Mode on Medium. ✍️**

---

### **The Problem**

Writing and navigating on Medium can be tedious:
1. **Manual Table of Contents**: Creating anchors for headings requires inspecting code, which breaks your writing flow.
2. **No Native Dark Mode**: Medium lacks an automatic dark mode for its web version, making it uncomfortable to write or read at night.

---

### **The Solution**

The **Medium Writer Helper** is a lightweight tool that enhances your Medium experience:

- **Table of Contents**: Instantly see all your headings (`h1`-`h4`) in the editor. One click to copy the anchor link or go directly to that section.
![Medium extension in action](example/example.png)

- **Universal Dark Mode**: Force a premium dark theme on any Medium page. It's automatic, persists as you navigate, and even syncs the extension's own interface.
![Dark Mode feature](example/dark-mode-example.png)

---

### **How It's Built**

The extension is built using the standard WebExtension API (Manifest V3):
- **Popup UI**: Built with HTML/CSS and themed with CSS variables for dark mode support.
- **Scripting API**: Injects logic to extract headings and handle navigation.
- **Content Scripts**: Automatically applies your Dark Mode preference on any Medium page using `chrome.storage`.
- **Message Passing**: Ensures the UI and the page sync instantly when toggling themes.

---

### **How to Install** 🛠️

1.  Open `chrome://extensions`.
2.  Enable **"Developer mode"**.
3.  Click **"Load unpacked"**.
4.  Select the folder containing this project.

The extension icon will now appear in your browser's toolbar.

