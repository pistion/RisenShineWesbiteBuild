const ALLOWED_ORDER_STATUSES = [
  "pending",
  "processing",
  "paid",
  "fulfilled",
  "cancelled",
];

const createOrderId = () =>
  `ORD-${Date.now().toString().slice(-8)}-${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;

const isValidOrderStatus = (value) =>
  ALLOWED_ORDER_STATUSES.includes(String(value || "").trim().toLowerCase());

const serializeOrderForDb = ({
  customer = {},
  subtotal = 0,
  itemCount = 0,
  items = [],
} = {}) => ({
  order: {
    id: createOrderId(),
    customerName: String(customer.name || "").trim(),
    customerEmail: String(customer.email || "").trim(),
    customerPhone: String(customer.phone || "").trim(),
    address: String(customer.address || "").trim(),
    city: String(customer.city || "").trim(),
    country: String(customer.country || "").trim(),
    subtotal: Number(subtotal || 0),
    itemCount: Number.parseInt(itemCount || 0, 10),
    currency: "USD",
    status: "pending",
  },
  items: items.map((item) => ({
    productId: String(item.productId || ""),
    productName: String(item.name || "").trim(),
    price: Number(item.price || 0),
    quantity: Number.parseInt(item.quantity || 0, 10),
  })),
});

module.exports = {
  ALLOWED_ORDER_STATUSES,
  isValidOrderStatus,
  serializeOrderForDb,
};
