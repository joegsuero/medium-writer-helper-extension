document.addEventListener("DOMContentLoaded", () => {
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
