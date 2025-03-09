/**
 * CSS to hide classes that do not match the request
 */
const hideHidden = `.hidden-ua {
                    display: none;
                  }`;

let myWindowId;
let css_inserted = false;
const input = document.querySelector("#popup-content-classes");
const title = document.querySelector(".fc-title1");
const select = document.querySelector("#popup-content-options");
const follow_arrows_id = "follow-arrows";
const follow_arrows_checkbox = document.querySelector("#" + follow_arrows_id);
const add_id = "add-content-classes";
const delete_id = "delete-content-classes";
const validate_id = "popup-content-validate";

/**
 * Sends a message hide courses or not when the arrows are clicked
 */
function sendFollowArrows(tabs, follow) {
  browser.tabs.sendMessage(tabs[0].id, {
    command: "follow_arrows",
    follow: follow
  });
}


/**
 * Gets the current active tab
 */ 
function getActiveTab() {
  return browser.tabs.query({active: true, currentWindow: true});
}

/**
 * Initializes storage structure if not initialized, this function will just put an empty object inside it
 */
function initializeData() {
  browser.tabs.query({windowId: myWindowId, active: true}).then((tabs) => {
      return browser.storage.local.get(tabs[0].url);
    }).then((storedInfo) => {
      if (!storedInfo) {
        browser.storage.local.set({});
      }
    });
}
initializeData();

/**
 * Gets the actual data stored as a Map, JSON.parse is called
 */
function getActualData() {
  return browser.tabs.query({windowId: myWindowId, active: true})
    .then((tabs) => {
      return browser.storage.local.get(tabs[0].url);
    })
    .then((storedInfo) => {
      if (storedInfo) {
        const data = storedInfo[Object.keys(storedInfo)[0]];
        if (data) {
          return JSON.parse(data);
        } else {
          return new Object();
        }
      }
      return new Object();
    });
}

/**
 * Fetches the courses that the user wants to filter, returns an Array
 */
function getCoursesFiltered(){
  return getActualData().then((data) => {
    if (data && data["courses_filtered"]) {
      return data["courses_filtered"];
    } else {
      return [];
    }
  })
}

/**
 * Sets any field of the root storage
 */
function setFieldStorage(key, value) {
  browser.tabs.query({windowId: myWindowId, active: true}).then((tabs) => {
    getActualData().then((data) => {
      data[key] = value;
      let contentToStore = {};
      contentToStore[tabs[0].url] = JSON.stringify(data);
      browser.storage.local.set(contentToStore);
    });
  });
}

/**
 * Sets the current Data, the paramater must be an array
 */
function setCoursesFiltered(array) {
  setFieldStorage("courses_filtered", array)
}

/**
 * Adds the content of the input into the all previous input stored for future usage
 */
function addCourseToData(course) {
  browser.tabs.query({windowId: myWindowId, active: true}).then((tabs) => {
    getCoursesFiltered().then((courses) => {
      courses.splice(0, 0, course);
      setCoursesFiltered(courses);
    })
  });
}

/**
 * Checks if the value has already been stored
 */
function isStored(value) {
  return getCoursesFiltered().then((data) => {
    return data.includes(value);
  })
}


/**
 * Clears all options of selec
 */
function clearSelect() {
  while (select.firstChild) {
    select.removeChild(select.lastChild);
  }
}

/**
 * Inserts a new option at the first place
 */
function insertNewOption(value) {
  for (child of select.children) {
    child.value = parseInt(child.value, 10) + 1;
  }
  const option = document.createElement("option");
  option.value = 0;
  option.textContent = value;
  if (select.children.length == 0) {
    select.append(option);
  } else {
    select.insertBefore(option, select.children[0]);
  }
  select.value = 0;
}


/**
 * Initialize the input with the previous data saved if it exists otherwise set it as empty
 */
function initializeInput() {
  getCoursesFiltered().then((data) => {
    if (data.length != 0) {
      input.value = data[0];
    } else {
      input.value = "";
    }
  });
}

/**
 * Sets follows arrows into the storage
 */
function setFollowArrowsStorage(follow_arrows) {
  setFieldStorage("follow_arrows", follow_arrows);
}

/**
 * Initializes follow arrows checkbox
 */
function initializeFollowArrowsCheckbox() {
  getActualData().then((data) => {
    if (data) {
      if (data["follow_arrows"] === true) {
        follow_arrows_checkbox.checked = true;
      } else if (data["follow_arrows"] === false) {
        follow_arrows_checkbox.checked = false;
        getActiveTab().then((tabs) => {
          sendFollowArrows(tabs, false);
        })
      } else {
        follow_arrows_checkbox.checked = true;
        setFollowArrowsStorage(true);
      }
    }
  })
}

/**
 * Triggered when an option from the select is clicked
 */
function onOptionSelected(event) {
  getCoursesFiltered().then((data) => {
    const index = parseInt(event.target.value, 10);
    if(data[index]) {
      input.value = data[index];
      document.querySelector("#" + validate_id).click();
    }
  })
}

/**
 * Initializes the select following the previous input that the user saved
 */
function initializeSelect() {
  getCoursesFiltered().then((data) => {
    for (let i = 0; i < data.length; i++) {
      const option = document.createElement("option");
      option.value = i;
      option.textContent = data[i];
      option.addEventListener("click", onOptionSelected);
      select.append(option)
    }
  })
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
        isStored(input.value).then((stored) => {
          if (!stored) {
            insertNewOption(input.value);
            addCourseToData(input.value);
          }
        });
      } else if (e.target.id == delete_id) {
        getCoursesFiltered().then((data) => {
          setCoursesFiltered(data.filter((e) => e != input.value));
          clearSelect();
          initializeInput();
          initializeSelect();
        })
      } else if (e.target.id == follow_arrows_id) {
        setFollowArrowsStorage(follow_arrows_checkbox.checked);
        sendFollowArrows(tabs, follow_arrows_checkbox.checked);
      } else {
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
  console.error(`Failed to execute filter content script: ${error.message}`);
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
 * Get the current Window, stores it and the initialize the input
 */
browser.windows.getCurrent({populate: true}).then((windowInfo) => {
  myWindowId = windowInfo.id;
  initializeInput();
  initializeSelect();
  initializeFollowArrowsCheckbox();
});


