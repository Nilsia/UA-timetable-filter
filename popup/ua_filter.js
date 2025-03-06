/**
 * CSS to hide classes that do not match the request
 */
const hideHidden = `.hidden-ua {
                    display: none;
                  }`;

let myWindowId;
let css_inserted = false;
const input = document.querySelector("#popup-content-classes");
const add_id = "add-content-classes";
const delete_id = "delete-content-classes";
const validate_id = "popup-content-validate";


/**
 * Gets the current active tab
 */ 
function getActiveTab() {
  return browser.tabs.query({active: true, currentWindow: true});
}

/**
 * Stores the content of the input into the storage for future usage
 */
function storeData() {
  browser.tabs.query({windowId: myWindowId, active: true}).then((tabs) => {
    let contentToStore = {};
    contentToStore[tabs[0].url] = input.value;
    browser.storage.local.set(contentToStore);
  });
}

/**
 * Listen for clicks on the buttons, and send the appropriate message to
 * the content script in the page.
 */
function listenForClicks() {
  document.addEventListener("click", (e) => {
    /*
     * Remove all classes from view
     */
    function removeClass(tabs) {
      browser.tabs.sendMessage(tabs[0].id, {
        command: "remove",
        class: input.value
      })
    }

    /**
     * Handles the click of one of the buttons of the popup
     */
    function handleClick(tabs) {
      insertCSS();

      if (e.target.id == validate_id) {
        removeClass(tabs);
      } else if (e.target.id == add_id) {
        // removeClass seems called but is not called, bug !?
        storeData();
      } else if (e.target.id == delete_id) {
      
      }
    }

    /*
     * Insert the CSS if not inserted
     */
    function insertCSS() {
      if (!css_inserted) {
        css_inserted = true;
        browser.tabs.insertCSS({ code: hideHidden });
      }
    }

    /**
     * Just log the error to the console.
     */
    function reportError(error) {
      console.error(`Could not find classes: ${error}`);
    }

    if (e.target.tagName !== "BUTTON" || !e.target.closest("#popup-content")) {
      // Ignore when click is not on a button within <div id="popup-content">.
      return;
    }

    /*
     * Get the active tab and call the click function handler
     */ 
    browser.tabs
      .query({active: true, currentWindow: true})
      .then(handleClick)
      .catch(reportError);

  });


}

/**
 * There was an error executing the script.
 * Display the popup's error message, and hide the normal UI.
 */
function reportExecuteScriptError(error) {
  document.querySelector("#popup-content").classList.add("hidden");
  document.querySelector("#error-content").classList.remove("hidden");
  console.error(`Failed to execute beastify content script: ${error.message}`);
}

/**
 * When the popup loads, inject a content script into the active tab,
 * and add a click handler.
 * If we couldn't inject the script, handle the error.
 */
browser.tabs
  .executeScript({ file: "/content_scripts/filter.js" })
  .then(listenForClicks)
  .catch(reportExecuteScriptError);


/**
 * Initialize the input with the previous data saved if it exists otherwise set it as empty
 */
function initializeInput() {
  browser.tabs.query({windowId: myWindowId, active: true})
    .then((tabs) => {
      return browser.storage.local.get(tabs[0].url);
    })
    .then((storedInfo) => {
      const data = storedInfo[Object.keys(storedInfo)[0]];
      if (data) {
        input.value = data;
      } else {
        input.value = "";
      }
    });
}

/**
 * Get the current Window, stores it and the initialize the input
 */
browser.windows.getCurrent({populate: true}).then((windowInfo) => {
  myWindowId = windowInfo.id;
  initializeInput();
});
