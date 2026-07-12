const CONTACT_CONFIG = {
  emailAddress: "mendelhecht16@gmail.com",
};

const contactForm = document.querySelector("[data-contact-form]");
const contactToastElement = document.querySelector("[data-contact-toast]");
const contactToastTitle = document.querySelector("[data-contact-toast-title]");
const contactToastBody = document.querySelector("[data-contact-toast-body]");

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

if (contactForm) {
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = contactForm.elements.name?.value || "";
    const message = contactForm.elements.message?.value || "";
    const builtMessage = buildMessage(name, message);

    if (!builtMessage.trim()) {
      showContactToast("Message missing", "Write a message before sending.", "error");
      return;
    }

    try {
      openEmail(builtMessage);
      showContactToast("Email ready", "Your email app was opened with the message.", "success");
    } catch (error) {
      showContactToast("Could not send", "Your email app could not be opened. Please use one of the contact buttons above.", "error");
    }
  });
}
