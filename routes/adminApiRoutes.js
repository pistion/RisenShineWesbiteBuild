const express = require("express");
const {
  createProduct,
  updateProduct,
  deleteProduct,
  getOrder,
  updateOrderStatus,
} = require("../controllers/adminController");

const router = express.Router();

router.post("/products", createProduct);
router.put("/products/:id", updateProduct);
router.patch("/products/:id", updateProduct);
router.delete("/products/:id", deleteProduct);

router.get("/orders/:id", getOrder);
router.patch("/orders/:id/status", updateOrderStatus);

module.exports = router;
