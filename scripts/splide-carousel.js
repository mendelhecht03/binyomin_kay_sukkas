document.addEventListener("DOMContentLoaded", () => {
  if (typeof Splide !== "undefined") {
    document.querySelectorAll(".splide").forEach((carousel) => {
      new Splide(carousel, {
        type: "slide",
        perPage: 3,
        perMove: 1,
        gap: "20px",
        drag: true,
        pagination: false,
        speed: 450,
        breakpoints: {
          900: {
            perPage: 2,
          },
          640: {
            perPage: 1,
            gap: "16px",
          },
        },
      }).mount();
    });
  }

  const carouselImages = document.querySelectorAll(".carousel-card img");

  if (!carouselImages.length) {
    return;
  }

  const lightbox = document.createElement("div");
  const figure = document.createElement("figure");
  const image = document.createElement("img");
  const caption = document.createElement("figcaption");
  const closeButton = document.createElement("button");
  let lastOpener = null;

  lightbox.className = "image-lightbox";
  lightbox.hidden = true;
  lightbox.setAttribute("role", "dialog");
  lightbox.setAttribute("aria-modal", "true");
  lightbox.setAttribute("aria-label", "Expanded sukkah photo");

  figure.className = "image-lightbox-figure";
  image.className = "image-lightbox-image";
  caption.className = "image-lightbox-caption";

  closeButton.className = "image-lightbox-close";
  closeButton.type = "button";
  closeButton.setAttribute("aria-label", "Close expanded photo");

  figure.append(image, caption);
  lightbox.append(closeButton, figure);
  document.body.append(lightbox);

  function openLightbox(opener) {
    lastOpener = opener;
    image.src = opener.currentSrc || opener.src;
    image.alt = opener.alt || "Expanded sukkah photo";
    caption.textContent = opener.alt || "Expanded sukkah photo";
    lightbox.hidden = false;
    document.body.classList.add("has-image-lightbox");
    closeButton.focus();
  }

  function closeLightbox() {
    lightbox.hidden = true;
    document.body.classList.remove("has-image-lightbox");
    image.removeAttribute("src");

    if (lastOpener) {
      lastOpener.focus();
    }
  }

  carouselImages.forEach((carouselImage) => {
    carouselImage.tabIndex = 0;
    carouselImage.setAttribute("role", "button");
    carouselImage.setAttribute("aria-label", `Enlarge ${carouselImage.alt}`);

    carouselImage.addEventListener("click", () => {
      openLightbox(carouselImage);
    });

    carouselImage.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }

      event.preventDefault();
      openLightbox(carouselImage);
    });
  });

  closeButton.addEventListener("click", closeLightbox);

  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) {
      closeLightbox();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !lightbox.hidden) {
      closeLightbox();
    }
  });
});
