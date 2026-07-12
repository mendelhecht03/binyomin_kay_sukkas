const CONTACT_CONFIG = {
  emailAddress: "mendelhecht16@gmail.com",
  whatsappNumber: "16692909004",
};

const contactForm = document.querySelector("[data-contact-form]");
const methodButtons = document.querySelectorAll("[data-contact-method]");
const contactToastElement = document.querySelector("[data-contact-toast]");
const contactToastTitle = document.querySelector("[data-contact-toast-title]");
const contactToastBody = document.querySelector("[data-contact-toast-body]");
let selectedContactMethod = "";

function showContactToast(title, message, type) {
  if (!contactToastElement || !contactToastTitle || !contactToastBody) {
    return;
  }

  contactToastElement.classList.toggle("is-success", type === "success");
  contactToastElement.classList.toggle("is-error", type === "error");
  contactToastTitle.textContent = title;
  contactToastBody.textContent = message;

  if (!window.bootstrap?.Toast) {
    contactToastElement.hidden = false;
    contactToastElement.classList.add("show");
    return;
  }

  const toast = bootstrap.Toast.getOrCreateInstance(contactToastElement, {
    delay: 4500,
  });

  toast.show();
}

function setContactMethod(method) {
  selectedContactMethod = method;

  methodButtons.forEach((button) => {
    const isSelected = button.dataset.contactMethod === method;
    button.classList.toggle("is-selected", isSelected);
    button.setAttribute("aria-pressed", String(isSelected));
  });

  const messageInput = contactForm?.elements.message;

  if (!messageInput) {
    return;
  }

  if (method === "email") {
    messageInput.placeholder = "Write the email message you want to send.";
    return;
  }

  messageInput.placeholder = "Write the Whatsapp message you want to send.";
}

function buildMessage(name, message) {
  const cleanName = name.trim();
  const cleanMessage = message.trim();

  if (!cleanName) {
    return cleanMessage;
  }

  return `Name: ${cleanName}\n\n${cleanMessage}`;
}

function openEmail(message) {
  const subject = encodeURIComponent("Website contact request");
  const body = encodeURIComponent(message);
  window.location.href = `mailto:${CONTACT_CONFIG.emailAddress}?subject=${subject}&body=${body}`;
}

function openWhatsapp(message) {
  const phone = CONTACT_CONFIG.whatsappNumber.replace(/[^\d]/g, "");
  const encodedMessage = encodeURIComponent(message);
  const whatsappWindow = window.open(`https://wa.me/${phone}?text=${encodedMessage}`, "_blank", "noopener");

  if (!whatsappWindow) {
    throw new Error("Whatsapp window was blocked.");
  }
}

methodButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setContactMethod(button.dataset.contactMethod);
  });
});

if (contactForm) {
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = contactForm.elements.name?.value || "";
    const message = contactForm.elements.message?.value || "";
    const builtMessage = buildMessage(name, message);

    if (!selectedContactMethod) {
      showContactToast("Choose a method", "Select Email or Whatsapp before sending.", "error");
      return;
    }

    if (!builtMessage.trim()) {
      showContactToast("Message missing", "Write a message before sending.", "error");
      return;
    }

    try {
      if (selectedContactMethod === "email") {
        openEmail(builtMessage);
        showContactToast("Email ready", "Your email app was opened with the message.", "success");
        return;
      }

      openWhatsapp(builtMessage);
      showContactToast("Whatsapp ready", "Whatsapp was opened with the message.", "success");
    } catch (error) {
      showContactToast("Could not send", "The message window could not be opened. Please try the other option.", "error");
    }
  });
}
