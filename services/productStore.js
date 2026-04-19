const { query } = require("../config/db");
const { isDatabaseConnected } = require("../config/runtime");
const {
  isValidProductId,
  mapProductRecord,
  serializeProductForDb,
} = require("../models/Product");
const sampleProducts = require("../data/sampleProducts");

const PRODUCT_SELECT_SQL = `
  SELECT id, name, price, description, images, category, stock, created_at, updated_at
  FROM products
`;

const sortByNewest = (products) =>
  [...products].sort(
    (left, right) => new Date(right.createdAt) - new Date(left.createdAt)
  );

const assertDatabaseConnection = () => {
  if (!isDatabaseConnected()) {
    throw new Error("PostgreSQL is not connected.");
  }
};

const getAllProducts = async () => {
  if (isDatabaseConnected()) {
    const { rows } = await query(
      `${PRODUCT_SELECT_SQL}
       ORDER BY created_at DESC`
    );

    return rows.map(mapProductRecord);
  }

  return sortByNewest(sampleProducts);
};

const getProductById = async (id) => {
  if (isDatabaseConnected()) {
    const { rows } = await query(
      `${PRODUCT_SELECT_SQL}
       WHERE id = $1
       LIMIT 1`,
      [id]
    );

    return rows[0] ? mapProductRecord(rows[0]) : null;
  }

  return sampleProducts.find((product) => product._id === id) || null;
};

const createProduct = async (input) => {
  assertDatabaseConnection();

  const product = serializeProductForDb(input);
  const { rows } = await query(
    `
      INSERT INTO products (
        id,
        name,
        price,
        description,
        images,
        category,
        stock,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9)
      RETURNING id, name, price, description, images, category, stock, created_at, updated_at
    `,
    [
      product.id,
      product.name,
      product.price,
      product.description,
      JSON.stringify(product.images),
      product.category,
      product.stock,
      product.createdAt,
      product.updatedAt,
    ]
  );

  return mapProductRecord(rows[0]);
};

const updateProduct = async (id, input) => {
  assertDatabaseConnection();

  if (!isValidProductId(id)) {
    throw new Error("Invalid product id.");
  }

  const product = serializeProductForDb({ ...input, id });
  const { rows } = await query(
    `
      UPDATE products
      SET
        name = $2,
        price = $3,
        description = $4,
        images = $5::jsonb,
        category = $6,
        stock = $7,
        updated_at = NOW()
      WHERE id = $1
      RETURNING id, name, price, description, images, category, stock, created_at, updated_at
    `,
    [
      id,
      product.name,
      product.price,
      product.description,
      JSON.stringify(product.images),
      product.category,
      product.stock,
    ]
  );

  return rows[0] ? mapProductRecord(rows[0]) : null;
};

const updateProductStock = async (id, stock) => {
  assertDatabaseConnection();

  if (!isValidProductId(id)) {
    throw new Error("Invalid product id.");
  }

  const normalizedStock = Math.max(0, Number.parseInt(stock || 0, 10));
  const { rows } = await query(
    `
      UPDATE products
      SET stock = $2, updated_at = NOW()
      WHERE id = $1
      RETURNING id, name, price, description, images, category, stock, created_at, updated_at
    `,
    [id, normalizedStock]
  );

  return rows[0] ? mapProductRecord(rows[0]) : null;
};

const deleteProduct = async (id) => {
  assertDatabaseConnection();

  if (!isValidProductId(id)) {
    throw new Error("Invalid product id.");
  }

  const result = await query("DELETE FROM products WHERE id = $1", [id]);
  return result.rowCount > 0;
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  updateProductStock,
  deleteProduct,
};
