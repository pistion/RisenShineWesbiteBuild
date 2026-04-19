const createProductId = () =>
  `prod-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;

const isValidProductId = (value) => {
  if (typeof value !== "string") {
    return false;
  }

  const normalized = value.trim();
  return normalized.length > 0 && normalized.length <= 120;
};

const normalizeProductInput = (product = {}) => ({
  name: String(product.name || "").trim(),
  price: Number(product.price || 0),
  description: String(product.description || "").trim(),
  images: Array.isArray(product.images) ? product.images.filter(Boolean) : [],
  category: String(product.category || "").trim(),
  stock: Number.parseInt(product.stock || 0, 10),
});

const mapProductRecord = (record = {}) => ({
  _id: String(record.id),
  name: String(record.name || ""),
  price: Number(record.price || 0),
  description: String(record.description || ""),
  images: Array.isArray(record.images) ? record.images.filter(Boolean) : [],
  category: String(record.category || ""),
  stock: Number(record.stock || 0),
  createdAt: record.created_at ? new Date(record.created_at) : new Date(),
  updatedAt: record.updated_at ? new Date(record.updated_at) : new Date(),
});

const serializeProductForDb = (product = {}) => {
  const normalized = normalizeProductInput(product);

  return {
    id: String(product._id || product.id || createProductId()),
    ...normalized,
    createdAt: product.createdAt ? new Date(product.createdAt) : new Date(),
    updatedAt: product.updatedAt ? new Date(product.updatedAt) : new Date(),
  };
};

module.exports = {
  createProductId,
  isValidProductId,
  mapProductRecord,
  normalizeProductInput,
  serializeProductForDb,
};
