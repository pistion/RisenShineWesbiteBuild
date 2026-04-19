const {
  initializeCart,
  calculateItemCount,
  calculateTotal,
  clearCart,
} = require("../services/cartService");
const { isDatabaseConnected } = require("../config/runtime");
const { createOrder } = require("../services/orderStore");

const buildFormData = (body = {}) => ({
  name: String(body.name || "").trim(),
  email: String(body.email || "").trim(),
  phone: String(body.phone || "").trim(),
  address: String(body.address || "").trim(),
  city: String(body.city || "").trim(),
  country: String(body.country || "").trim(),
});

const renderCheckout = (res, payload) => {
  res.render("checkout", {
    pageTitle: "Checkout",
    bodyClass: "default-page",
    mainClass: "site-main",
    ...payload,
  });
};

const renderCheckoutPage = (req, res) => {
  const cart = initializeCart(req);
  const itemCount = calculateItemCount(cart.items);
  const subtotal = calculateTotal(cart.items);

  if (!cart.items.length) {
    return res.redirect("/cart");
  }

  renderCheckout(res, {
    cart,
    itemCount,
    subtotal,
    errors: [],
    formData: buildFormData(),
  });
};

const submitCheckout = async (req, res, next) => {
  try {
    const cart = initializeCart(req);
    const itemCount = calculateItemCount(cart.items);
    const subtotal = calculateTotal(cart.items);

    if (!cart.items.length) {
      return res.redirect("/cart");
    }

    const formData = buildFormData(req.body);
    const errors = [];

    if (formData.name.length < 2) {
      errors.push("Full name must be at least 2 characters.");
    }

    if (!formData.email.includes("@")) {
      errors.push("Enter a valid email address.");
    }

    if (formData.phone.length < 6) {
      errors.push("Phone number must be at least 6 characters.");
    }

    if (formData.address.length < 8) {
      errors.push("Address must be at least 8 characters.");
    }

    if (formData.city.length < 2) {
      errors.push("City must be at least 2 characters.");
    }

    if (formData.country.length < 2) {
      errors.push("Country must be at least 2 characters.");
    }

    if (errors.length) {
      return renderCheckout(res, {
        cart,
        itemCount,
        subtotal,
        errors,
        formData,
      });
    }

    const storedOrder = isDatabaseConnected()
      ? await createOrder({
          customer: formData,
          items: cart.items,
          subtotal,
          itemCount,
        })
      : null;

    const order = storedOrder || {
      id: `ORD-${Date.now().toString().slice(-8)}`,
      itemCount,
      subtotal,
      customer: formData,
      status: "demo",
    };

    clearCart(req);

    return res.render("order-status", {
      pageTitle: "Order Confirmed",
      bodyClass: "default-page",
      mainClass: "site-main",
      success: true,
      message: storedOrder
        ? "Checkout has been saved to PostgreSQL. Payments can be connected next."
        : "Checkout has been captured as a demo order. Connect PostgreSQL to store orders permanently.",
      order,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  renderCheckoutPage,
  submitCheckout,
};
