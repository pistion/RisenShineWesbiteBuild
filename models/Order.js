const ALLOWED_ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "fulfilled",
  "cancelled",
];

const ALLOWED_PAYMENT_STATUSES = [
  "pending",
  "authorized",
  "paid",
  "failed",
  "refunded",
  "cancelled",
];

const createOrderId = () =>
  `ORD-${Date.now().toString().slice(-8)}-${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;

const createOrderNumber = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();

  return `RS-${year}${month}${day}-${suffix}`;
};

const isValidOrderStatus = (value) =>
  ALLOWED_ORDER_STATUSES.includes(String(value || "").trim().toLowerCase());

const isValidPaymentStatus = (value) =>
  ALLOWED_PAYMENT_STATUSES.includes(String(value || "").trim().toLowerCase());

const serializeOrderForDb = ({ customer = {}, notes = "" } = {}) => ({
  order: {
    id: createOrderId(),
    orderNumber: createOrderNumber(),
    customerName: String(customer.name || "").trim(),
    customerEmail: String(customer.email || "").trim(),
    customerPhone: String(customer.phone || "").trim(),
    address: String(customer.address || "").trim(),
    city: String(customer.city || "").trim(),
    country: String(customer.country || "").trim(),
    notes: String(notes || "").trim(),
    currency: "PGK",
    status: "pending",
    paymentStatus: "pending",
    paymentProvider: null,
    paymentReference: null,
    shippingAmount: 0,
  },
});

module.exports = {
  ALLOWED_ORDER_STATUSES,
  ALLOWED_PAYMENT_STATUSES,
  createOrderNumber,
  isValidOrderStatus,
  isValidPaymentStatus,
  serializeOrderForDb,
};
