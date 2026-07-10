const BUY_REQUEST_CONFIG = {
  whatsappNumber: "16692909004",
  emailAddress: "mendelhecht16@gmail.com",
};

const buyButtons = document.querySelectorAll("[data-buy-request]");

function buildBuyMessage(button) {
  const packageName = button.dataset.buyPackage || "Sukkah package";
  const packagePrice = button.dataset.buyPrice || "price to be confirmed";

  return [
    `Hi, I would like to buy the ${packageName}.`,
    `Listed price: ${packagePrice}.`,
    "Please contact me with the next steps.",
    `Page: ${window.location.href}`,
  ].join("\n");
}

function buildWhatsappWebUrl(message) {
  const phone = BUY_REQUEST_CONFIG.whatsappNumber.replace(/[^\d]/g, "");
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

function buildEmailUrl(button, message) {
  const packageName = button.dataset.buyPackage || "Sukkah package";
  const subject = `Buy request: ${packageName}`;

  return `mailto:${BUY_REQUEST_CONFIG.emailAddress}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
}

function openBuyRequest(button) {
  const message = buildBuyMessage(button);
  const emailUrl = buildEmailUrl(button, message);
  const whatsappWindow = window.open(buildWhatsappWebUrl(message), "_blank", "noopener");

  if (!whatsappWindow) {
    window.location.href = emailUrl;
  }
}

buyButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    event.preventDefault();
    openBuyRequest(button);
  });
});
