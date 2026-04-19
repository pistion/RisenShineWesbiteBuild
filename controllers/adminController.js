const { isDatabaseConnected } = require("../config/runtime");
const { isValidProductId } = require("../models/Product");
const { isValidOrderStatus } = require("../models/Order");
const productStore = require("../services/productStore");
const orderStore = require("../services/orderStore");

const buildProductInput = (body = {}) => ({
  name: String(body.name || "").trim(),
  price: Number(body.price),
  description: String(body.description || "").trim(),
  images: Array.isArray(body.images)
    ? body.images
        .map((image) => String(image || "").trim())
        .filter(Boolean)
    : typeof body.images === "string" && body.images.trim()
    ? [body.images.trim()]
    : [],
  category: String(body.category || "").trim(),
  stock: Number.parseInt(body.stock ?? 0, 10),
});

const validateProductInput = (product) => {
  const errors = [];

  if (product.name.length < 2) {
    errors.push("Product name must be at least 2 characters.");
  }

  if (!Number.isFinite(product.price) || product.price < 0) {
    errors.push("Price must be a valid number greater than or equal to 0.");
  }

  if (product.description.length < 10) {
    errors.push("Description must be at least 10 characters.");
  }

  if (product.category.length < 2) {
    errors.push("Category must be at least 2 characters.");
  }

  if (!Number.isInteger(product.stock) || product.stock < 0) {
    errors.push("Stock must be a whole number greater than or equal to 0.");
  }

  return errors;
};

const ensureDatabaseAvailable = (res) => {
  if (isDatabaseConnected()) {
    return true;
  }

  res.status(503).json({
    success: false,
    message:
      "PostgreSQL is not connected. Connect your hosted database before using write or order management endpoints.",
  });

  return false;
};

const createProduct = async (req, res, next) => {
  if (!ensureDatabaseAvailable(res)) {
    return;
  }

  try {
    const productInput = buildProductInput(req.body);
    const errors = validateProductInput(productInput);

    if (errors.length) {
      return res.status(400).json({ success: false, errors });
    }

    const product = await productStore.createProduct(productInput);

    res.status(201).json({
      success: true,
      message: "Product created successfully.",
      product,
    });
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  if (!ensureDatabaseAvailable(res)) {
    return;
  }

  try {
    const { id } = req.params;

    if (!isValidProductId(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid product id." });
    }

    const productInput = buildProductInput(req.body);
    const errors = validateProductInput(productInput);

    if (errors.length) {
      return res.status(400).json({ success: false, errors });
    }

    const product = await productStore.updateProduct(id, productInput);

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found." });
    }

    res.status(200).json({
      success: true,
      message: "Product updated successfully.",
      product,
    });
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  if (!ensureDatabaseAvailable(res)) {
    return;
  }

  try {
    const { id } = req.params;

    if (!isValidProductId(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid product id." });
    }

    const deleted = await productStore.deleteProduct(id);

    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found." });
    }

    res.status(200).json({
      success: true,
      message: "Product deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};

const getOrder = async (req, res, next) => {
  if (!ensureDatabaseAvailable(res)) {
    return;
  }

  try {
    const { id } = req.params;
    const order = await orderStore.getOrderById(id);

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found." });
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

const updateOrderStatus = async (req, res, next) => {
  if (!ensureDatabaseAvailable(res)) {
    return;
  }

  try {
    const { id } = req.params;
    const status = String(req.body.status || "").trim().toLowerCase();

    if (!isValidOrderStatus(status)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid order status. Use pending, processing, paid, fulfilled, or cancelled.",
      });
    }

    const order = await orderStore.updateOrderStatus(id, status);

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found." });
    }

    res.status(200).json({
      success: true,
      message: "Order status updated successfully.",
      order,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProduct,
  updateProduct,
  deleteProduct,
  getOrder,
  updateOrderStatus,
};
