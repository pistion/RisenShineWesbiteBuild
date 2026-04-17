const express = require("express");
const {
  renderHome,
  renderAbout,
  renderContact,
} = require("../controllers/pageController");

const router = express.Router();

router.get("/", renderHome);
router.get("/about", renderAbout);
router.get("/contact", renderContact);

module.exports = router;
