(() => {
  /**
   * Check and set a global guard variable.
   * If this content script is injected into the same page again,
   * it will do nothing next time.
   */
  if (window.hasRun) {
    return;
  }

  // Initialization of variables
  window.hasRun = true;
  window.courses = "";
  window.follow_arrows = true;

  /**
   * Useful function to wait some seconds
   */
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Removes all courses from the view according to `classes`
   */
  function removeClass(classes) {
    input_groups = classes.split(";;").map((e) => e.trim());
    const classes_div = document.querySelectorAll("div.fc-title");
    for (const class_div of classes_div) {
        const splitted_content = class_div.innerText.split(" - ").map(e => e.trim());
        class_div.parentNode.parentNode.classList.add("hidden-ua");
        for (const data of splitted_content) {
          groups_page = data.split(", ").map((e) => e.trim());

          let contains = input_groups.some((e) => groups_page.includes(e));
          if (contains) {
            const inset = class_div.parentNode.parentNode.style.inset;
            const values = inset.split(" ");
            if (values.length == 4) {
            
              class_div.parentNode.parentNode.style.inset =
                values[0]
                + " 0% "
                + values[2]
                + " 0% " ;
            }
            class_div.parentNode.parentNode.classList.remove("hidden-ua");
            break;
          }
        }
    }
  }

  /**
   * Triggered when an arrow is clicked
   */
  function onArrowClicked() {
    if (window.follow_arrows) {
      sleep(400).then(() => {
        removeClass(window.courses);
      });
    }
  }

  /**
   * Listen for messages from the background script.
   */
  browser.runtime.onMessage.addListener((message) => {
    console.debug("received message");
    if (message.command === "remove") {
      window.courses = message.class;
      removeClass(message.class);
    } else if (message.command == "follow_arrows") {
      window.follow_arrows = message.follow;
      console.debug(window.follow_arrows);
    }
  });

  /**
   * Listens for click on the next arrow
   */
  document.querySelector(".fc-next-button").addEventListener("click", (event) => {
    onArrowClicked();
  });

  /**
   * Listens for click on the previous arrow
   */
  document.querySelector(".fc-prev-button").addEventListener("click", (event) => {
    onArrowClicked();
  });
})();

