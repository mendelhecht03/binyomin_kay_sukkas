const requiredCheckboxGroups = document.querySelectorAll("[data-required-checkbox-group]");

function updateCheckboxGroupValidity(group) {
  const groupName = group.dataset.requiredCheckboxGroup;
  const checkboxes = Array.from(group.querySelectorAll(`input[name="${groupName}"]`));
  const firstCheckbox = checkboxes[0];

  if (!firstCheckbox) {
    return;
  }

  const hasCheckedOption = checkboxes.some((checkbox) => checkbox.checked);
  firstCheckbox.setCustomValidity(hasCheckedOption ? "" : "Choose at least one option.");
}

requiredCheckboxGroups.forEach((group) => {
  const groupName = group.dataset.requiredCheckboxGroup;
  const checkboxes = group.querySelectorAll(`input[name="${groupName}"]`);

  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      updateCheckboxGroupValidity(group);
    });
  });

  updateCheckboxGroupValidity(group);
});
