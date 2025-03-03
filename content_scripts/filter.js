(() => {
  /**
   * Check and set a global guard variable.
   * If this content script is injected into the same page again,
   * it will do nothing next time.
   */
  if (window.hasRun) {
    return;
  }
  window.hasRun = true;

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
   * Listen for messages from the background script.
   */
  browser.runtime.onMessage.addListener((message) => {
    if (message.command === "remove") {
      removeClass(message.class);
    }
  });
})();

