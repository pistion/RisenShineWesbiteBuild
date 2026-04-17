const express = require("express");
const {
  renderCartPage,
  addToCart,
  removeFromCart,
} = require("../controllers/cartController");

const router = express.Router();

router.get("/", renderCartPage);
router.post("/add", addToCart);
router.post("/remove", removeFromCart);

module.exports = router;
