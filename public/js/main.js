(function () {
  const modal = document.getElementById("galleryModal");
  const feedback = document.getElementById("cartFeedback");
  const navToggle = document.querySelector("[data-nav-toggle]");
  const navShell = document.querySelector("[data-nav-shell]");
  const favoriteButtons = document.querySelectorAll("[data-favorite-id]");

  if (favoriteButtons.length) {
    const storageKey = "rise-n-reign-favorites";
    const readFavorites = () => {
      try {
        const saved = window.localStorage.getItem(storageKey);
        const parsed = saved ? JSON.parse(saved) : [];
        return Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        return [];
      }
    };

    const writeFavorites = (favorites) => {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(favorites));
      } catch (error) {
        // Ignore storage write failures so the UI still works in private mode.
      }
    };

    let favorites = readFavorites();

    favoriteButtons.forEach((button) => {
      const favoriteId = button.dataset.favoriteId;
      const syncButtonState = () => {
        const isActive = favorites.includes(favoriteId);
        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-pressed", isActive ? "true" : "false");
      };

      syncButtonState();

      button.addEventListener("click", () => {
        if (!favoriteId) {
          return;
        }

        favorites = favorites.includes(favoriteId)
          ? favorites.filter((id) => id !== favoriteId)
          : [...favorites, favoriteId];

        writeFavorites(favorites);
        syncButtonState();
      });
    });
  }

  if (navToggle && navShell) {
    const topbarInner = navToggle.closest(".topbar-inner");
    const mobileQuery = window.matchMedia("(max-width: 991.98px)");

    const closeNav = () => {
      if (!topbarInner) {
        return;
      }

      topbarInner.classList.remove("is-nav-open");
      navToggle.setAttribute("aria-expanded", "false");
    };

    const toggleNav = () => {
      if (!topbarInner || !mobileQuery.matches) {
        return;
      }

      const isOpen = topbarInner.classList.toggle("is-nav-open");
      navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    };

    navToggle.addEventListener("click", toggleNav);

    navShell.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeNav);
    });

    mobileQuery.addEventListener("change", (event) => {
      if (!event.matches) {
        closeNav();
      }
    });
  }

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
    const feedbackStorageKey = "rise-n-reign-cart-feedback";
    let feedbackTimer = null;

    const showFeedback = (message) => {
      if (!message) {
        return;
      }

      feedback.textContent = message;
      feedback.classList.add("show");

      if (feedbackTimer) {
        clearTimeout(feedbackTimer);
      }

      feedbackTimer = setTimeout(() => {
        feedback.classList.remove("show");
      }, 1700);
    };

    const queueFeedback = (message) => {
      if (!message) {
        return;
      }

      try {
        window.sessionStorage.setItem(feedbackStorageKey, message);
      } catch (error) {
        // Ignore storage failures.
      }
    };

    const consumeQueuedFeedback = () => {
      try {
        const message = window.sessionStorage.getItem(feedbackStorageKey);
        if (!message) {
          return;
        }

        window.sessionStorage.removeItem(feedbackStorageKey);
        showFeedback(message);
      } catch (error) {
        // Ignore storage failures.
      }
    };

    const updateCartCount = (count) => {
      const cartLink = document.querySelector(".cart-nav-link");

      if (!cartLink || !Number.isFinite(Number(count))) {
        return;
      }

      const nextCount = Number(count);
      const nextLabel = `Cart (${nextCount})`;
      const match = (cartLink.textContent || "").match(/\(\d+\)/);

      if (match) {
        cartLink.textContent = cartLink.textContent.replace(/\(\d+\)/, `(${nextCount})`);
        return;
      }

      cartLink.textContent = nextLabel;
    };

    const readResponsePayload = async (response) => {
      const contentType = response.headers.get("content-type") || "";

      if (contentType.includes("application/json")) {
        return response.json();
      }

      const text = await response.text();
      return {
        success: response.ok,
        message: text,
      };
    };

    const postForm = async (form) => {
      const formData = new URLSearchParams(new FormData(form));
      const response = await fetch(form.action, {
        method: form.method || "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: formData.toString(),
      });

      const payload = await readResponsePayload(response);

      if (!response.ok || payload.success === false) {
        throw new Error(payload.message || "Unable to update your cart right now.");
      }

      return payload;
    };

    const handlePendingButton = (button, text) => {
      const originalText = button.textContent;
      button.disabled = true;
      button.textContent = text;

      return () => {
        button.disabled = false;
        button.textContent = originalText;
      };
    };

    consumeQueuedFeedback();

    document.querySelectorAll(".js-add-cart-form").forEach((form) => {
      form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const submitButton = form.querySelector("button[type='submit']");
        if (!submitButton || submitButton.disabled) {
          return;
        }

        const originalText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = "Adding...";

        try {
          const payload = await postForm(form);
          const successMessage =
            payload.message || `${submitButton.dataset.productName || "Item"} added to cart.`;

          updateCartCount(payload.cart && payload.cart.itemCount);
          showFeedback(successMessage);
          submitButton.textContent = "Added";

          window.setTimeout(() => {
            submitButton.textContent = originalText;
          }, 1000);
        } catch (error) {
          showFeedback(error.message || "Unable to add item right now.");
          submitButton.textContent = originalText;
        } finally {
          submitButton.disabled = false;
        }
      });
    });

    document.querySelectorAll(".js-cart-update-form").forEach((form) => {
      form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const submitButton = form.querySelector("button[type='submit']");
        if (!submitButton || submitButton.disabled) {
          return;
        }

        const resetButton = handlePendingButton(submitButton, "Updating...");

        try {
          const payload = await postForm(form);
          updateCartCount(payload.cart && payload.cart.itemCount);
          queueFeedback(payload.message || "Cart updated.");
          window.location.reload();
        } catch (error) {
          showFeedback(error.message || "Unable to update cart right now.");
          resetButton();
        }
      });
    });

    document.querySelectorAll(".js-cart-remove-form").forEach((form) => {
      form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const submitButton = form.querySelector("button[type='submit']");
        if (!submitButton || submitButton.disabled) {
          return;
        }

        const resetButton = handlePendingButton(submitButton, "Removing...");

        try {
          const payload = await postForm(form);
          updateCartCount(payload.cart && payload.cart.itemCount);
          queueFeedback(payload.message || "Item removed from cart.");
          window.location.reload();
        } catch (error) {
          showFeedback(error.message || "Unable to remove item right now.");
          resetButton();
        }
      });
    });
  }
})();
