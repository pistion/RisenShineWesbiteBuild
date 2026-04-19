const { isValidProductId } = require("../models/Product");
const productStore = require("../services/productStore");

const getAllProducts = async (req, res, next) => {
  try {
    const products = await productStore.getAllProducts();
    res.status(200).json({ success: true, count: products.length, products });
  } catch (error) {
    next(error);
  }
};

const getSingleProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidProductId(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid product id" });
    }

    const product = await productStore.getProductById(id);

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.status(200).json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

const renderProductsPage = async (req, res, next) => {
  try {
    const products = await productStore.getAllProducts();
    res.render("products", {
      pageTitle: "Products",
      bodyClass: "catalog-page",
      mainClass: "site-main",
      products,
    });
  } catch (error) {
    next(error);
  }
};

const renderProductDetailPage = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidProductId(id)) {
      return res.status(404).render("404", { pageTitle: "Product Not Found" });
    }

    const product = await productStore.getProductById(id);

    if (!product) {
      return res.status(404).render("404", { pageTitle: "Product Not Found" });
    }

    const relatedProducts = (await productStore.getAllProducts())
      .filter((item) => String(item._id) !== String(product._id))
      .slice(0, 3);

    res.render("product-detail", {
      pageTitle: product.name,
      bodyClass: "catalog-page",
      mainClass: "site-main",
      product,
      relatedProducts,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllProducts,
  getSingleProduct,
  renderProductsPage,
  renderProductDetailPage,
};
