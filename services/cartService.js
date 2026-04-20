const initializeCart = (req) => {
  if (!req.session.cart || !Array.isArray(req.session.cart.items)) {
    req.session.cart = { items: [] };
  }

  return req.session.cart;
};

const roundCurrency = (value) => Math.round((Number(value) || 0) * 100) / 100;

const normalizeCartItem = (item = {}) => {
  const price = roundCurrency(item.price);
  const quantity = Math.max(0, Number.parseInt(item.quantity || 0, 10) || 0);

  return {
    productId: String(item.productId || ""),
    name: String(item.name || ""),
    price,
    quantity,
    image: String(item.image || ""),
    category: String(item.category || ""),
    maxQuantity: Math.max(quantity, Number.parseInt(item.maxQuantity || 0, 10) || 0),
    lineTotal: roundCurrency(price * quantity),
  };
};

const calculateTotal = (items) => {
  return roundCurrency(
    items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0)
  );
};

const calculateItemCount = (items) => {
  return items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
};

const buildCartState = (cart) => {
  const items = (Array.isArray(cart.items) ? cart.items : [])
    .map(normalizeCartItem)
    .filter((item) => item.productId && item.quantity > 0);

  const itemCount = calculateItemCount(items);
  const total = calculateTotal(items);

  return {
    items,
    itemCount,
    subtotal: total,
    total,
    isEmpty: itemCount === 0,
  };
};

const clearCart = (req) => {
  req.session.cart = { items: [] };
  return req.session.cart;
};

module.exports = {
  initializeCart,
  normalizeCartItem,
  calculateTotal,
  calculateItemCount,
  buildCartState,
  clearCart,
};
