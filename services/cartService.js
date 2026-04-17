const initializeCart = (req) => {
  if (!req.session.cart) {
    req.session.cart = { items: [] };
  }

  return req.session.cart;
};

const calculateTotal = (items) => {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
};

const calculateItemCount = (items) => {
  return items.reduce((sum, item) => sum + item.quantity, 0);
};

const clearCart = (req) => {
  req.session.cart = { items: [] };
  return req.session.cart;
};

module.exports = {
  initializeCart,
  calculateTotal,
  calculateItemCount,
  clearCart,
};
