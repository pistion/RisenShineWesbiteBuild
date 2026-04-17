const express = require("express");
const {
  renderProductsPage,
  renderProductDetailPage,
} = require("../controllers/productController");

const router = express.Router();

router.get("/", renderProductsPage);
router.get("/:id", renderProductDetailPage);

module.exports = router;
