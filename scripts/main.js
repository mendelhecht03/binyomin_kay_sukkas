const stage = document.querySelector(".stage");
const panels = document.querySelectorAll(".stage-face");
const panelButtons = document.querySelectorAll("[data-show-panel]");
let isAnimating = false;

function showPanel(panelName) {
  const currentPanel = document.querySelector(".stage-face.is-active");
  const nextPanel = document.querySelector(`#${panelName}-panel`);

  if (!nextPanel || currentPanel === nextPanel || isAnimating) {
    return;
  }

  isAnimating = true;
  panels.forEach((panel) => {
    panel.classList.remove("is-entering", "is-exiting");
  });

  nextPanel.classList.add("is-entering");
  nextPanel.setAttribute("aria-hidden", "false");

  nextPanel.offsetWidth;

  currentPanel.classList.add("is-exiting");
  currentPanel.classList.remove("is-active");
  nextPanel.classList.remove("is-entering");
  nextPanel.classList.add("is-active");

  panelButtons.forEach((button) => {
    const isSelected = button.dataset.showPanel === panelName && panelName !== "home";

    button.classList.toggle("is-selected", isSelected);
  });

  function finishAnimation(event) {
    if (event.propertyName !== "transform") {
      return;
    }

    nextPanel.removeEventListener("transitionend", finishAnimation);
    currentPanel.classList.remove("is-exiting");
    currentPanel.setAttribute("aria-hidden", "true");
    isAnimating = false;
  }

  nextPanel.addEventListener("transitionend", finishAnimation);
}

panelButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    if (!document.querySelector(`#${button.dataset.showPanel}-panel`)) {
      return;
    }

    event.preventDefault();
    showPanel(button.dataset.showPanel);
  });
});
