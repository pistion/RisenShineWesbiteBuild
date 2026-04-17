const express = require("express");
const {
  renderCheckoutPage,
  submitCheckout,
} = require("../controllers/checkoutController");

const router = express.Router();

router.get("/", renderCheckoutPage);
router.post("/", submitCheckout);

module.exports = router;
