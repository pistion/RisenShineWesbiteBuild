const express = require("express");
const {
  renderCartPage,
  addToCart,
  updateCartItem,
  removeFromCart,
} = require("../controllers/cartController");

const router = express.Router();

router.get("/", renderCartPage);
router.post("/add", addToCart);
router.post("/update", updateCartItem);
router.post("/remove", removeFromCart);

module.exports = router;
