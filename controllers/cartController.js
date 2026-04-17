const mongoose = require("mongoose");
const productStore = require("../services/productStore");
const {
  initializeCart,
  calculateTotal,
} = require("../services/cartService");

const renderCartPage = (req, res) => {
  const cart = initializeCart(req);
  const total = calculateTotal(cart.items);

  res.render("cart", {
    pageTitle: "Cart",
    bodyClass: "default-page",
    mainClass: "site-main",
    cart,
    total,
  });
};

const addToCart = async (req, res, next) => {
  try {
    const { productId } = req.body;
    const quantity = Math.max(1, Number.parseInt(req.body.quantity || "1", 10));

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).render("error", {
        pageTitle: "Error",
        statusCode: 400,
        message: "Invalid product id.",
      });
    }

    const product = await productStore.getProductById(productId);

    if (!product) {
      return res.status(404).render("404", { pageTitle: "Product Not Found" });
    }

    if (product.stock <= 0) {
      return res.status(400).render("error", {
        pageTitle: "Out of Stock",
        statusCode: 400,
        message: "This product is currently out of stock.",
      });
    }

    const cart = initializeCart(req);
    const existingItem = cart.items.find(
      (item) => item.productId === String(product._id)
    );

    const existingQuantity = existingItem ? existingItem.quantity : 0;
    if (existingQuantity + quantity > product.stock) {
      return res.status(400).render("error", {
        pageTitle: "Stock Limit Reached",
        statusCode: 400,
        message: "Requested quantity exceeds available stock.",
      });
    }

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({
        productId: String(product._id),
        name: product.name,
        price: product.price,
        quantity,
      });
    }

    req.session.cart = cart;
    res.redirect("/cart");
  } catch (error) {
    next(error);
  }
};

const removeFromCart = (req, res) => {
  const { productId } = req.body;
  const cart = initializeCart(req);

  cart.items = cart.items.filter((item) => item.productId !== productId);
  req.session.cart = cart;

  res.redirect("/cart");
};

module.exports = {
  renderCartPage,
  addToCart,
  removeFromCart,
};
