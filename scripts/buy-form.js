const packageSelect = document.querySelector("[data-package-select]");
const buyForm = document.querySelector(".buy-form");

if (packageSelect) {
  const params = new URLSearchParams(window.location.search);
  const selectedPackage = params.get("package");

  if (selectedPackage) {
    packageSelect.value = selectedPackage;
  }
}

if (buyForm) {
  buyForm.addEventListener("submit", (event) => {
    event.preventDefault();
  });
}
