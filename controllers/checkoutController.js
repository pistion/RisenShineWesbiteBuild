const {
  initializeCart,
  buildCartState,
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
  notes: String(body.notes || "").trim(),
});

const renderCheckout = (res, payload) => {
  const subtotal = Number(payload.subtotal || 0);
  const shippingAmount = Number(payload.shippingAmount || 0);

  res.render("checkout", {
    pageTitle: "Checkout",
    bodyClass: "default-page",
    mainClass: "site-main",
    shippingAmount,
    totalAmount: subtotal + shippingAmount,
    ...payload,
  });
};

const renderCheckoutPage = (req, res) => {
  const cart = initializeCart(req);
  const cartState = buildCartState(cart);

  if (!cartState.items.length) {
    return res.redirect("/cart");
  }

  renderCheckout(res, {
    cart: cartState,
    itemCount: cartState.itemCount,
    subtotal: cartState.total,
    shippingAmount: 0,
    errors: [],
    formData: buildFormData(),
  });
};

const submitCheckout = async (req, res, next) => {
  try {
    const cart = initializeCart(req);
    const cartState = buildCartState(cart);

    if (!cartState.items.length) {
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
        cart: cartState,
        itemCount: cartState.itemCount,
        subtotal: cartState.total,
        shippingAmount: 0,
        errors,
        formData,
      });
    }

    const databaseConnected = isDatabaseConnected();
    let order;

    if (databaseConnected) {
      try {
        order = await createOrder({
          customer: formData,
          items: cartState.items,
          notes: formData.notes,
        });
      } catch (error) {
        if (error.isUserFacing) {
        return renderCheckout(res, {
          cart: cartState,
          itemCount: cartState.itemCount,
          subtotal: cartState.total,
          shippingAmount: 0,
          errors: [error.message],
          formData,
        });
      }

        throw error;
      }
    } else {
      order = {
        id: `ORD-${Date.now().toString().slice(-8)}`,
        orderNumber: `LOCAL-${Date.now().toString().slice(-6)}`,
        itemCount: cartState.itemCount,
        subtotal: cartState.total,
        shippingAmount: 0,
        totalAmount: cartState.total,
        currency: "PGK",
        status: "pending",
        paymentStatus: "pending",
        customer: formData,
        notes: formData.notes,
        placedAt: new Date(),
        items: cartState.items,
      };
    }

    clearCart(req);

    return res.render("order-status", {
      pageTitle: "Order Received",
      bodyClass: "default-page",
      mainClass: "site-main",
      success: true,
      message: databaseConnected
        ? "Your order has been received and saved successfully."
        : "Your order has been received in preview mode. Connect PostgreSQL to store it permanently.",
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
