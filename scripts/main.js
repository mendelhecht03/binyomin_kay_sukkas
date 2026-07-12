const stage = document.querySelector(".stage");
const panels = Array.from(document.querySelectorAll(".stage-face"));
let isAnimating = false;
let activePanelIndex = panels.findIndex((panel) => panel.classList.contains("is-active"));
let wheelDelta = 0;
let touchStartY = null;

if (activePanelIndex < 0) {
  activePanelIndex = 0;
}

function isFormControl(element) {
  return Boolean(element.closest("input, textarea, select, button, a"));
}

function showPanel(panelIndex) {
  const currentPanel = document.querySelector(".stage-face.is-active");
  const nextPanel = panels[panelIndex];

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
  activePanelIndex = panelIndex;

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

function movePanel(direction) {
  const nextIndex = Math.min(
    Math.max(activePanelIndex + direction, 0),
    panels.length - 1,
  );

  showPanel(nextIndex);
}

function handleWheel(event) {
  if (!stage || !stage.contains(event.target) || isFormControl(event.target)) {
    return;
  }

  event.preventDefault();
  wheelDelta += event.deltaY;

  if (Math.abs(wheelDelta) < 70) {
    return;
  }

  movePanel(wheelDelta > 0 ? 1 : -1);
  wheelDelta = 0;
}

function handleTouchStart(event) {
  if (!stage || !stage.contains(event.target) || isFormControl(event.target)) {
    touchStartY = null;
    return;
  }

  touchStartY = event.touches[0].clientY;
}

function handleTouchEnd(event) {
  if (touchStartY === null || isFormControl(event.target)) {
    return;
  }

  const touchEndY = event.changedTouches[0].clientY;
  const travel = touchStartY - touchEndY;
  touchStartY = null;

  if (Math.abs(travel) < 45) {
    return;
  }

  movePanel(travel > 0 ? 1 : -1);
}

function handleKeydown(event) {
  if (!stage || isFormControl(document.activeElement)) {
    return;
  }

  const nextKeys = new Set(["ArrowDown", "PageDown", " "]);
  const previousKeys = new Set(["ArrowUp", "PageUp"]);

  if (nextKeys.has(event.key)) {
    event.preventDefault();
    movePanel(1);
  }

  if (previousKeys.has(event.key)) {
    event.preventDefault();
    movePanel(-1);
  }
}

if (stage && panels.length > 1) {
  window.addEventListener("wheel", handleWheel, { passive: false });
  window.addEventListener("touchstart", handleTouchStart, { passive: true });
  window.addEventListener("touchend", handleTouchEnd, { passive: true });
  window.addEventListener("keydown", handleKeydown);
}
