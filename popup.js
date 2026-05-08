document.addEventListener("DOMContentLoaded", () => {
  const darkModeToggle = document.getElementById("dark-mode-toggle");
  const statsSection = document.getElementById("stats-section");
  const storiesSection = document.getElementById("stories-section");
  const headingsSection = document.getElementById("headings-section");
  const downloadBtn = document.getElementById("download-stats-btn");
  const storiesDownloadBtn = document.getElementById("download-stories-btn");
  const statsStatus = document.getElementById("stats-status");
  const storiesStatus = document.getElementById("stories-status");
  const statsInfo = document.getElementById("stats-info");
  const storiesInfo = document.getElementById("stories-info");
  const headingsList = document.getElementById("headings-list");

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
      if (activeTab && activeTab.id) {
        // Send message to content script
        chrome.tabs.sendMessage(activeTab.id, {
          action: "toggleDarkMode",
          enabled: isEnabled,
        }).catch(err => {
          console.log("Could not send message to content script:", err);
        });
      }
    });
  }

  // Stats download functionality
  function downloadStatsAsCSV(stats) {
    if (!stats || stats.length === 0) {
      showStatsStatus("No data to download", "error");
      return;
    }

    // CSV headers
    const headers = ["Title", "Post ID", "URL", "Views", "Reads", "Presentations", "Published Date", "Read Time"];

    // Convert stats to CSV rows
    const rows = stats.map(story => [
      escapeCSV(story.title),
      story.postId,
      story.postUrl,
      story.views,
      story.reads,
      story.presentations,
      escapeCSV(story.publishedDate), // Escape commas in date (e.g., "Apr 25, 2026")
      escapeCSV(story.readTime)       // Escape for consistency
    ]);

    // Combine headers and rows
    const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");

    // Add BOM for UTF-8 support in Excel
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });

    // Generate filename with timestamp
    const date = new Date();
    const timestamp = date.toISOString().split("T")[0];
    const filename = `medium-stats-${timestamp}.csv`;

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showStatsStatus(`Downloaded ${stats.length} stories successfully!`, "success");
    statsInfo.textContent = `File: ${filename}`;
  }

  function escapeCSV(text) {
    if (!text) return "";
    // Escape quotes and wrap in quotes if contains comma or newline
    let escaped = text.replace(/"/g, '""');
    if (escaped.includes(",") || escaped.includes("\n") || escaped.includes("\r")) {
      escaped = `"${escaped}"`;
    }
    return escaped;
  }

  function showStatsStatus(message, type) {
    statsStatus.textContent = message;
    statsStatus.className = `stats-status ${type}`;
    if (type === "success") {
      setTimeout(() => {
        statsStatus.textContent = "";
        statsStatus.className = "stats-status";
      }, 3000);
    }
  }

  function extractAndDownloadStats() {
    downloadBtn.disabled = true;
    downloadBtn.textContent = "Extracting...";
    showStatsStatus("Reading stats from page...", "");

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (!activeTab || !activeTab.id) {
        showStatsStatus("Could not access the page", "error");
        downloadBtn.disabled = false;
        downloadBtn.textContent = "Download CSV";
        return;
      }

      chrome.tabs.sendMessage(activeTab.id, { action: "extractStats" }, (response) => {
        downloadBtn.disabled = false;
        downloadBtn.textContent = "Download CSV";

        if (chrome.runtime.lastError) {
          showStatsStatus("Error: Could not extract stats", "error");
          console.error(chrome.runtime.lastError);
          return;
        }

        if (response && response.stats) {
          if (response.stats.length === 0) {
            showStatsStatus("No stories found. Make sure you're on the Stats page.", "error");
          } else {
            downloadStatsAsCSV(response.stats);
          }
        } else {
          showStatsStatus("Error extracting stats", "error");
        }
      });
    });
  }

  // Download button click handler
  downloadBtn.addEventListener("click", extractAndDownloadStats);

  // Stories download functions
  function downloadStoriesAsCSV(stories) {
    if (!stories || stories.length === 0) {
      showStoriesStatus("No data to download", "error");
      return;
    }

    // CSV headers
    const headers = ["Post ID", "Claps", "Comments", "Image URL", "Publication"];

    // Convert stories to CSV rows
    const rows = stories.map(story => [
      story.postId,
      story.claps,
      story.comments,
      escapeCSV(story.imageUrl),
      escapeCSV(story.publication)
    ]);

    // Combine headers and rows
    const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");

    // Add BOM for UTF-8 support in Excel
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });

    // Generate filename with timestamp
    const date = new Date();
    const timestamp = date.toISOString().split("T")[0];
    const filename = `medium-stories-${timestamp}.csv`;

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showStoriesStatus(`Downloaded ${stories.length} stories successfully! Check console (F12) for debug details.`, "success");
    storiesInfo.textContent = `File: ${filename} (${stories.length} stories)`;
  }

  function showStoriesStatus(message, type) {
    storiesStatus.textContent = message;
    storiesStatus.className = `stats-status ${type}`;
    if (type === "success") {
      setTimeout(() => {
        storiesStatus.textContent = "";
        storiesStatus.className = "stats-status";
      }, 3000);
    }
  }

  function extractAndDownloadStories() {
    storiesDownloadBtn.disabled = true;
    storiesDownloadBtn.textContent = "Extracting...";
    showStoriesStatus("Reading stories data from page...", "");

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (!activeTab || !activeTab.id) {
        showStoriesStatus("Could not access the page", "error");
        storiesDownloadBtn.disabled = false;
        storiesDownloadBtn.textContent = "Download Stories CSV";
        return;
      }

      chrome.tabs.sendMessage(activeTab.id, { action: "extractStoriesData" }, (response) => {
        storiesDownloadBtn.disabled = false;
        storiesDownloadBtn.textContent = "Download Stories CSV";

        if (chrome.runtime.lastError) {
          showStoriesStatus("Error: Could not extract stories data", "error");
          console.error(chrome.runtime.lastError);
          return;
        }

        if (response && response.stories) {
          if (response.stories.length === 0) {
            showStoriesStatus("No stories found. Make sure you're on the Stories page.", "error");
          } else {
            console.log(`Popup: Received ${response.stories.length} stories`);
            downloadStoriesAsCSV(response.stories);

            // Check if extraction seems incomplete (arbitrary threshold: 15+)
            if (response.stories.length < 25 && response.stories.length > 10) {
              setTimeout(() => {
                showStoriesStatus(
                  `Downloaded ${response.stories.length} stories. If you have more posts, scroll down on the page and download again.`,
                  "success"
                );
              }, 3500);
            }
          }
        } else {
          showStoriesStatus("Error extracting stories data", "error");
        }
      });
    });
  }

  // Stories download button click handler
  storiesDownloadBtn.addEventListener("click", extractAndDownloadStories);

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

  // Check page type and show appropriate section
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    if (!activeTab || !activeTab.id) return;

    // First check if it's a Medium page via content script
    chrome.tabs.sendMessage(activeTab.id, { action: "checkMedium" }, (response) => {
      if (chrome.runtime.lastError || !response || !response.isMedium) {
        // Show headings section with error (default behavior for non-Medium pages)
        headingsSection.classList.remove("hidden");
        displayError("This doesn't seem to be a Medium page.");
        return;
      }

      // Check if we're on the stats page
      if (response.isStatsPage) {
        // Show stats section, hide headings section
        statsSection.classList.add("visible");
        headingsSection.classList.add("hidden");
        return;
      }

      // Check if we're on the stories page
      if (response.isStoriesPage) {
        // Show stories section, hide headings section
        storiesSection.classList.add("visible");
        headingsSection.classList.add("hidden");
        return;
      }

      // If it is Medium editor, show table of contents
      if (response.isEditor) {
        headingsSection.classList.remove("hidden");
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
        // Medium page but not editor - show headings section with message
        headingsSection.classList.remove("hidden");
        displayError("The table of contents only works on Medium's post editing page.");
      }
    });
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
