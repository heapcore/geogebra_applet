(() => {
  const bindEvents = () => {
    const modeForm = document.getElementById("modeForm");
    const inputForm = document.getElementById("inputForm");
    const runButton = document.getElementById("runParserBtn");
    const resetButton = document.getElementById("resetAppletBtn");
    const printButton = document.getElementById("printCommandsBtn");

    if (modeForm) {
      modeForm.addEventListener("submit", (event) => event.preventDefault());
    }
    if (inputForm) {
      inputForm.addEventListener("submit", (event) => event.preventDefault());
    }
    if (runButton) {
      runButton.addEventListener("click", () => runParser());
    }
    if (resetButton) {
      resetButton.addEventListener("click", () => appletDeleteAll());
    }
    if (printButton) {
      printButton.addEventListener("click", () => printCommands());
    }
  };

  window.addEventListener("DOMContentLoaded", bindEvents);
})();
