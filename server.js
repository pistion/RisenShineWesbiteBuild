require("dotenv").config();

const path = require("path");
const express = require("express");
const session = require("express-session");

const connectDB = require("./config/db");
const { isDatabaseConnected } = require("./config/runtime");

const requestLogger = require("./middleware/logger");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const pageRoutes = require("./routes/pageRoutes");
const productRoutes = require("./routes/productRoutes");
const productApiRoutes = require("./routes/productApiRoutes");
const adminApiRoutes = require("./routes/adminApiRoutes");
const cartRoutes = require("./routes/cartRoutes");
const checkoutRoutes = require("./routes/checkoutRoutes");

const app = express();
const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || "super-secret-key";

const resolveNavActive = (pathname) => {
  if (pathname === "/") return "home";
  if (pathname.startsWith("/products")) return "products";
  if (pathname.startsWith("/about")) return "about";
  if (pathname.startsWith("/contact")) return "contact";
  if (pathname.startsWith("/cart") || pathname.startsWith("/checkout")) {
    return "cart";
  }

  return "";
};

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.locals.formatCurrency = (value) => {
  const amount = Number(value || 0);

  if (Number.isInteger(amount)) {
    return `K${amount}`;
  }

  return `K${amount.toFixed(2)}`;
};

app.use(requestLogger);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    name: "ecom.sid",
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  })
);

app.use((req, res, next) => {
  const cart = req.session.cart || { items: [] };

  res.locals.cartItemCount = cart.items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  res.locals.navActive = resolveNavActive(req.path);
  res.locals.fallbackMode = !isDatabaseConnected();

  next();
});

app.use("/", pageRoutes);
app.use("/products", productRoutes);
app.use("/api/products", productApiRoutes);
app.use("/api/admin", adminApiRoutes);
app.use("/cart", cartRoutes);
app.use("/checkout", checkoutRoutes);

app.use(notFound);
app.use(errorHandler);

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);

      if (!isDatabaseConnected()) {
        console.log("Using fallback sample data (PostgreSQL not connected)");
      }
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
