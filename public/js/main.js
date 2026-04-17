(function () {
  const modal = document.getElementById("galleryModal");
  const feedback = document.getElementById("cartFeedback");

  if (modal) {
    const imageEl = document.getElementById("galleryImage");
    const titleEl = document.getElementById("galleryTitle");
    const countEl = document.getElementById("galleryCount");
    const prevBtn = document.getElementById("galleryPrev");
    const nextBtn = document.getElementById("galleryNext");

    let activeImages = [];
    let activeIndex = 0;

    const renderGallery = () => {
      if (!activeImages.length) {
        return;
      }

      imageEl.src = activeImages[activeIndex];
      countEl.textContent = `${activeIndex + 1} / ${activeImages.length}`;
      const showNav = activeImages.length > 1;
      prevBtn.style.display = showNav ? "inline-flex" : "none";
      nextBtn.style.display = showNav ? "inline-flex" : "none";
    };

    const openGallery = (images, title) => {
      activeImages = images;
      activeIndex = 0;
      titleEl.textContent = title || "Product Gallery";
      renderGallery();
      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    };

    const closeGallery = () => {
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    };

    document.querySelectorAll(".image-trigger").forEach((button) => {
      button.addEventListener("click", () => {
        try {
          const raw = button.getAttribute("data-gallery-images") || "";
          const images = JSON.parse(decodeURIComponent(raw));
          const validImages = Array.isArray(images) ? images.filter(Boolean) : [];

          if (validImages.length) {
            openGallery(validImages, button.getAttribute("data-gallery-title"));
          }
        } catch (error) {
          console.error("Unable to open gallery:", error);
        }
      });
    });

    modal.querySelectorAll("[data-gallery-close]").forEach((button) => {
      button.addEventListener("click", closeGallery);
    });

    prevBtn.addEventListener("click", () => {
      if (!activeImages.length) {
        return;
      }

      activeIndex = (activeIndex - 1 + activeImages.length) % activeImages.length;
      renderGallery();
    });

    nextBtn.addEventListener("click", () => {
      if (!activeImages.length) {
        return;
      }

      activeIndex = (activeIndex + 1) % activeImages.length;
      renderGallery();
    });

    document.addEventListener("keydown", (event) => {
      if (!modal.classList.contains("is-open")) {
        return;
      }

      if (event.key === "Escape") {
        closeGallery();
      }

      if (event.key === "ArrowLeft" && activeImages.length > 1) {
        activeIndex = (activeIndex - 1 + activeImages.length) % activeImages.length;
        renderGallery();
      }

      if (event.key === "ArrowRight" && activeImages.length > 1) {
        activeIndex = (activeIndex + 1) % activeImages.length;
        renderGallery();
      }
    });
  }

  if (feedback) {
    let feedbackTimer = null;

    const showFeedback = (message) => {
      feedback.textContent = message;
      feedback.classList.add("show");

      if (feedbackTimer) {
        clearTimeout(feedbackTimer);
      }

      feedbackTimer = setTimeout(() => {
        feedback.classList.remove("show");
      }, 1700);
    };

    const bumpCartCount = (quantity) => {
      const cartLink = document.querySelector(".cart-nav-link");

      if (!cartLink) {
        return;
      }

      const match = (cartLink.textContent || "").match(/\((\d+)\)/);
      if (!match) {
        return;
      }

      const current = Number(match[1]) || 0;
      const nextCount = current + (Number(quantity) || 1);
      cartLink.textContent = cartLink.textContent.replace(/\(\d+\)/, `(${nextCount})`);
    };

    document.querySelectorAll(".js-add-cart-form").forEach((form) => {
      form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const submitButton = form.querySelector("button[type='submit']");
        const quantityField = form.querySelector("[name='quantity']");
        if (!submitButton || submitButton.disabled) {
          return;
        }

        const originalText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = "Adding...";

        try {
          const formData = new URLSearchParams(new FormData(form));
          const response = await fetch(form.action, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: formData.toString(),
          });

          if (!response.ok) {
            throw new Error("Request failed");
          }

          const quantityValue = quantityField
            ? quantityField.value || "1"
            : submitButton.dataset.quantity || "1";

          showFeedback(`${submitButton.dataset.productName || "Item"} added to cart`);
          bumpCartCount(quantityValue);
          submitButton.textContent = "Added";

          setTimeout(() => {
            submitButton.textContent = originalText;
          }, 1000);
        } catch (error) {
          showFeedback("Unable to add item right now");
          submitButton.textContent = originalText;
        } finally {
          submitButton.disabled = false;
        }
      });
    });
  }
})();
