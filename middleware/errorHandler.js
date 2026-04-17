const notFound = (req, res, next) => {
  res.status(404);

  if (req.accepts("html")) {
    return res.render("404", {
      pageTitle: "Page Not Found",
      requestedUrl: req.originalUrl,
    });
  }

  const error = new Error(`Not found: ${req.originalUrl}`);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);

  if (req.accepts("html")) {
    return res.render("error", {
      pageTitle: "Server Error",
      statusCode,
      message: err.message || "Unexpected server error.",
    });
  }

  res.json({
    success: false,
    message: err.message || "Server error",
  });
};

module.exports = {
  notFound,
  errorHandler,
};
