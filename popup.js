document.addEventListener("DOMContentLoaded", () => {
  const darkModeToggle = document.getElementById("dark-mode-toggle");

  // Load dark mode state
  chrome.storage.local.get("darkMode", (data) => {
    if (data.darkMode) {
      darkModeToggle.checked = true;
      document.body.classList.add("dark-mode");
      // Re-apply to Medium if already enable
      applyDarkModeToMedium(true);
    }
  });

  darkModeToggle.addEventListener("change", () => {
    const isEnabled = darkModeToggle.checked;
    chrome.storage.local.set({ darkMode: isEnabled });

    if (isEnabled) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }

    applyDarkModeToMedium(isEnabled);
  });

  function applyDarkModeToMedium(isEnabled) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (activeTab.url.includes("medium.com")) {
        chrome.scripting.executeScript({
          target: { tabId: activeTab.id },
          function: (enabled) => {
            const styleId = "medium-dark-mode-style";
            let style = document.getElementById(styleId);

            if (enabled) {
              if (!style) {
                style = document.createElement("style");
                style.id = styleId;
                // Generic dark mode CSS for Medium
                style.innerHTML = `
                  html, body, .screenContent, main, article {
                    background-color: #121212 !important;
                    color: #ffffff !important;
                  }
                  div, section, header, footer {
                    background-color: transparent !important;
                    color: inherit !important;
                  }
                  h1, h2, h3, h4, h5, h6, p, blockquote, li, span, a {
                    color: #e5e5e5 !important;
                  }
                  /* Fix for specific Medium editor elements */
                  .editable, [contenteditable="true"] {
                    background-color: #121212 !important;
                    color: #ffffff !important;
                  }
                  /* Invert images slightly or keep them clear */
                  img { opacity: 0.8; }
                `;
                document.head.appendChild(style);
              }
            } else {
              if (style) {
                style.remove();
              }
            }
          },
          args: [isEnabled],
        });
      }
    });
  }

  const getHeadingsLogic = () => {
    const headings = [];
    const headingElements = document.querySelectorAll("h1, h2, h3, h4");
    headingElements.forEach((heading) => {
      const headingName = heading.getAttribute("name");
      if (headingName && heading.innerText.trim()) {
        headings.push({
          text: heading.innerText.trim(),
          name: headingName,
        });
      }
    });
    return headings;
  };

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    const pageUrl = activeTab.url;

    if (pageUrl.includes("edit")) {
      chrome.scripting.executeScript(
        {
          target: { tabId: activeTab.id },
          function: getHeadingsLogic,
        },
        (results) => {
          if (results && results[0] && results[0].result) {
            displayHeadings(results[0].result, activeTab.id);
          } else {
            displayError("No headings were found.");
          }
        }
      );
    } else {
      displayError("This extension only works on Medium's post editing page.");
    }
  });

  function displayHeadings(headings, tabId) {
    const listContainer = document.getElementById("headings-list");
    listContainer.innerHTML = "";
    if (headings.length === 0) {
      displayError("No headings with anchor names were found in the editor.");
      return;
    }

    headings.forEach((heading) => {
      const listItem = document.createElement("li");
      const headingText = document.createElement("span");
      headingText.textContent = heading.text;

      const goButton = document.createElement("button");
      goButton.textContent = "Go";
      goButton.addEventListener("click", () => {
        chrome.scripting.executeScript({
          target: { tabId: tabId },
          function: (name) => {
            const heading = document.querySelector(`[name="${name}"]`);
            if (heading) {
              heading.scrollIntoView({ behavior: "smooth" });
            }
          },
          args: [heading.name],
        });
      });

      const copyButton = document.createElement("button");
      copyButton.textContent = "Copy Link";

      copyButton.addEventListener("click", () => {
        navigator.clipboard
          .writeText(`#${heading.name}`)
          .then(() => {
            copyButton.textContent = "Copied";
            copyButton.classList.add("copied");
            setTimeout(() => {
              copyButton.textContent = "Copy Link";
              copyButton.classList.remove("copied");
            }, 1500);
          })
          .catch((err) => {
            console.error("Error copying text: ", err);
          });
      });

      const buttonContainer = document.createElement("div");
      buttonContainer.appendChild(goButton);
      buttonContainer.appendChild(copyButton);

      listItem.appendChild(headingText);
      listItem.appendChild(buttonContainer);
      listContainer.appendChild(listItem);
    });
  }

  function displayError(message) {
    const listContainer = document.getElementById("headings-list");
    listContainer.innerHTML = "";
    const errorMessage = document.createElement("p");
    errorMessage.textContent = message;
    errorMessage.classList.add("error-message");
    listContainer.appendChild(errorMessage);
  }
});
