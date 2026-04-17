const Product = require("../models/Product");
const { isDatabaseConnected } = require("../config/runtime");
const sampleProducts = require("../data/sampleProducts");

const sortByNewest = (products) => {
  return [...products].sort(
    (left, right) => new Date(right.createdAt) - new Date(left.createdAt)
  );
};

const getAllProducts = async () => {
  if (isDatabaseConnected()) {
    return Product.find({}).sort({ createdAt: -1 }).lean();
  }

  return sortByNewest(sampleProducts);
};

const getProductById = async (id) => {
  if (isDatabaseConnected()) {
    return Product.findById(id).lean();
  }

  return sampleProducts.find((product) => product._id === id) || null;
};

module.exports = {
  getAllProducts,
  getProductById,
};
