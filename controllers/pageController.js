const productStore = require("../services/productStore");

const renderHome = async (req, res, next) => {
  try {
    const products = await productStore.getAllProducts();

    res.render("home", {
      pageTitle: "Rise&Shine",
      bodyClass: "home-showcase",
      mainClass: "site-main",
      products: products.slice(0, 6),
    });
  } catch (error) {
    next(error);
  }
};

const renderAbout = (req, res) => {
  res.render("about", {
    pageTitle: "About",
    bodyClass: "default-page",
    mainClass: "site-main",
  });
};

const renderContact = (req, res) => {
  res.render("contact", {
    pageTitle: "Contact",
    bodyClass: "default-page",
    mainClass: "site-main",
  });
};

module.exports = {
  renderHome,
  renderAbout,
  renderContact,
};
