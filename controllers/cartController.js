const { isValidProductId } = require("../models/Product");
const productStore = require("../services/productStore");
const {
  initializeCart,
  buildCartState,
} = require("../services/cartService");

const CART_NOTICE_KEY = "cartNotice";

const wantsJson = (req) => {
  const accept = req.get("accept") || "";
  return (
    req.get("X-Requested-With") === "XMLHttpRequest" ||
    accept.includes("application/json")
  );
};

const setCartNotice = (req, message, tone = "success") => {
  req.session[CART_NOTICE_KEY] = { message, tone };
};

const consumeCartNotice = (req) => {
  const notice = req.session[CART_NOTICE_KEY] || null;
  delete req.session[CART_NOTICE_KEY];
  return notice;
};

const renderCartError = (req, res, { statusCode, pageTitle, message, notFound = false }) => {
  if (wantsJson(req)) {
    return res.status(statusCode).json({
      success: false,
      message,
      cart: buildCartState(initializeCart(req)),
    });
  }

  if (notFound) {
    return res.status(statusCode).render("404", { pageTitle });
  }

  return res.status(statusCode).render("error", {
    pageTitle,
    statusCode,
    message,
  });
};

const sendCartResponse = (
  req,
  res,
  { statusCode = 200, message, redirectTo = "/cart", tone = "success" }
) => {
  if (wantsJson(req)) {
    return res.status(statusCode).json({
      success: true,
      message,
      redirectTo,
      cart: buildCartState(initializeCart(req)),
    });
  }

  setCartNotice(req, message, tone);
  return res.redirect(redirectTo);
};

const syncCartItem = (existingItem, product, quantity) => {
  existingItem.name = product.name;
  existingItem.price = product.price;
  existingItem.quantity = quantity;
  existingItem.image = product.images && product.images.length ? product.images[0] : "";
  existingItem.category = product.category;
  existingItem.maxQuantity = product.stock;
};

const renderCartPage = (req, res) => {
  const cart = initializeCart(req);
  const cartState = buildCartState(cart);

  res.render("cart", {
    pageTitle: "Cart",
    bodyClass: "default-page",
    mainClass: "site-main",
    cart: cartState,
    total: cartState.total,
    itemCount: cartState.itemCount,
    notice: consumeCartNotice(req),
  });
};

const addToCart = async (req, res, next) => {
  try {
    const { productId } = req.body;
    const parsedQuantity = Number.parseInt(req.body.quantity || "1", 10);
    const quantity = Number.isInteger(parsedQuantity) && parsedQuantity > 0 ? parsedQuantity : 1;

    if (!isValidProductId(productId)) {
      return renderCartError(req, res, {
        statusCode: 400,
        pageTitle: "Error",
        message: "Invalid product id.",
      });
    }

    const product = await productStore.getProductById(productId);

    if (!product) {
      return renderCartError(req, res, {
        statusCode: 404,
        pageTitle: "Product Not Found",
        message: "Product not found.",
        notFound: true,
      });
    }

    if (product.stock <= 0) {
      return renderCartError(req, res, {
        statusCode: 400,
        pageTitle: "Out of Stock",
        message: "This product is currently out of stock.",
      });
    }

    const cart = initializeCart(req);
    const existingItem = cart.items.find(
      (item) => item.productId === String(product._id)
    );

    const existingQuantity = existingItem ? existingItem.quantity : 0;
    if (existingQuantity + quantity > product.stock) {
      return renderCartError(req, res, {
        statusCode: 400,
        pageTitle: "Stock Limit Reached",
        message: "Requested quantity exceeds available stock.",
      });
    }

    if (existingItem) {
      syncCartItem(existingItem, product, existingQuantity + quantity);
    } else {
      cart.items.push({
        productId: String(product._id),
        name: product.name,
        price: product.price,
        quantity,
        image: product.images && product.images.length ? product.images[0] : "",
        category: product.category,
        maxQuantity: product.stock,
      });
    }

    req.session.cart = cart;

    return sendCartResponse(req, res, {
      statusCode: 200,
      message: `${product.name} added to cart.`,
      redirectTo: "/cart",
    });
  } catch (error) {
    next(error);
  }
};

const updateCartItem = async (req, res, next) => {
  try {
    const { productId } = req.body;
    const quantity = Number.parseInt(req.body.quantity || "0", 10);

    if (!isValidProductId(productId)) {
      return renderCartError(req, res, {
        statusCode: 400,
        pageTitle: "Error",
        message: "Invalid product id.",
      });
    }

    const cart = initializeCart(req);
    const existingItem = cart.items.find((item) => item.productId === productId);

    if (!existingItem) {
      return renderCartError(req, res, {
        statusCode: 404,
        pageTitle: "Cart Item Not Found",
        message: "This item is not currently in your cart.",
        notFound: true,
      });
    }

    if (!Number.isInteger(quantity)) {
      return renderCartError(req, res, {
        statusCode: 400,
        pageTitle: "Invalid Quantity",
        message: "Enter a valid quantity.",
      });
    }

    if (quantity <= 0) {
      cart.items = cart.items.filter((item) => item.productId !== productId);
      req.session.cart = cart;

      return sendCartResponse(req, res, {
        statusCode: 200,
        message: `${existingItem.name} removed from cart.`,
        redirectTo: "/cart",
      });
    }

    const product = await productStore.getProductById(productId);

    if (!product) {
      return renderCartError(req, res, {
        statusCode: 404,
        pageTitle: "Product Not Found",
        message: "This product is no longer available.",
        notFound: true,
      });
    }

    if (quantity > product.stock) {
      return renderCartError(req, res, {
        statusCode: 400,
        pageTitle: "Stock Limit Reached",
        message: `Only ${product.stock} item(s) are available right now.`,
      });
    }

    syncCartItem(existingItem, product, quantity);
    req.session.cart = cart;

    return sendCartResponse(req, res, {
      statusCode: 200,
      message: `${product.name} quantity updated.`,
      redirectTo: "/cart",
    });
  } catch (error) {
    next(error);
  }
};

const removeFromCart = (req, res) => {
  const { productId } = req.body;
  const cart = initializeCart(req);
  const itemToRemove = cart.items.find((item) => item.productId === productId);

  cart.items = cart.items.filter((item) => item.productId !== productId);
  req.session.cart = cart;

  return sendCartResponse(req, res, {
    statusCode: 200,
    message: itemToRemove
      ? `${itemToRemove.name} removed from cart.`
      : "Item removed from cart.",
    redirectTo: "/cart",
  });
};

module.exports = {
  renderCartPage,
  addToCart,
  updateCartItem,
  removeFromCart,
};
