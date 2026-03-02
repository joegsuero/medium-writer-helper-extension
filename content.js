const styleId = "medium-dark-mode-style";

function applyDarkMode(enabled) {
  let style = document.getElementById(styleId);
  if (enabled) {
    if (!style) {
      style = document.createElement("style");
      style.id = styleId;
      style.innerHTML = `
        html, body, .screenContent, main, article, .r {
          background-color: #121212 !important;
          color: #ffffff !important;
        }
        div, section, header, footer, nav, aside {
          background-color: transparent !important;
          color: inherit !important;
        }
        h1, h2, h3, h4, h5, h6, p, blockquote, li, span, a {
          color: #e5e5e5 !important;
        }
        /* Specific Medium UI fixes */
        .editable, [contenteditable="true"] {
          background-color: #121212 !important;
          color: #ffffff !important;
        }
        /* Navigation and top bars */
        .n, .m, .o, .p, .be.bf {
            background-color: #121212 !important;
        }
        /* Invert images slightly or keep them clear */
        img { opacity: 0.8; }
      `;
      document.documentElement.appendChild(style);
    }
  } else {
    if (style) {
      style.remove();
    }
  }
}

// Initial application
chrome.storage.local.get("darkMode", (data) => {
  if (data.darkMode) {
    applyDarkMode(true);
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "toggleDarkMode") {
    applyDarkMode(message.enabled);
  }
});
