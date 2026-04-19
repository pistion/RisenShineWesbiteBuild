const { getPool, query } = require("../config/db");
const { isDatabaseConnected } = require("../config/runtime");
const { isValidOrderStatus, serializeOrderForDb } = require("../models/Order");

const ORDER_SELECT_SQL = `
  SELECT
    id,
    customer_name,
    customer_email,
    customer_phone,
    address,
    city,
    country,
    subtotal,
    item_count,
    currency,
    status,
    created_at,
    updated_at
  FROM orders
`;

const mapOrderRecord = (record = {}, items = []) => ({
  id: String(record.id),
  itemCount: Number(record.item_count || 0),
  subtotal: Number(record.subtotal || 0),
  currency: String(record.currency || "USD"),
  status: String(record.status || "pending"),
  createdAt: record.created_at ? new Date(record.created_at) : new Date(),
  updatedAt: record.updated_at ? new Date(record.updated_at) : new Date(),
  customer: {
    name: String(record.customer_name || ""),
    email: String(record.customer_email || ""),
    phone: String(record.customer_phone || ""),
    address: String(record.address || ""),
    city: String(record.city || ""),
    country: String(record.country || ""),
  },
  items: items.map((item) => ({
    id: Number(item.id || 0),
    productId: String(item.product_id || ""),
    name: String(item.product_name || ""),
    price: Number(item.price || 0),
    quantity: Number(item.quantity || 0),
  })),
});

const assertDatabaseConnection = () => {
  if (!isDatabaseConnected()) {
    throw new Error("PostgreSQL is not connected.");
  }
};

const createOrder = async ({ customer, items, subtotal, itemCount }) => {
  assertDatabaseConnection();

  const pool = getPool();
  const client = await pool.connect();
  const payload = serializeOrderForDb({ customer, items, subtotal, itemCount });

  try {
    await client.query("BEGIN");

    await client.query(
      `
        INSERT INTO orders (
          id,
          customer_name,
          customer_email,
          customer_phone,
          address,
          city,
          country,
          subtotal,
          item_count,
          currency,
          status,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
      `,
      [
        payload.order.id,
        payload.order.customerName,
        payload.order.customerEmail,
        payload.order.customerPhone,
        payload.order.address,
        payload.order.city,
        payload.order.country,
        payload.order.subtotal,
        payload.order.itemCount,
        payload.order.currency,
        payload.order.status,
      ]
    );

    for (const item of payload.items) {
      await client.query(
        `
          INSERT INTO order_items (
            order_id,
            product_id,
            product_name,
            price,
            quantity,
            updated_at
          )
          VALUES ($1, $2, $3, $4, $5, NOW())
        `,
        [
          payload.order.id,
          item.productId,
          item.productName,
          item.price,
          item.quantity,
        ]
      );
    }

    await client.query("COMMIT");

    return {
      id: payload.order.id,
      itemCount: payload.order.itemCount,
      subtotal: payload.order.subtotal,
      customer,
      status: payload.order.status,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const getOrderById = async (id) => {
  assertDatabaseConnection();

  const { rows } = await query(
    `${ORDER_SELECT_SQL}
     WHERE id = $1
     LIMIT 1`,
    [id]
  );

  if (!rows[0]) {
    return null;
  }

  const itemResult = await query(
    `
      SELECT id, product_id, product_name, price, quantity
      FROM order_items
      WHERE order_id = $1
      ORDER BY id ASC
    `,
    [id]
  );

  return mapOrderRecord(rows[0], itemResult.rows);
};

const updateOrderStatus = async (id, status) => {
  assertDatabaseConnection();

  if (!isValidOrderStatus(status)) {
    throw new Error("Invalid order status.");
  }

  const { rows } = await query(
    `
      UPDATE orders
      SET status = $2, updated_at = NOW()
      WHERE id = $1
      RETURNING id, customer_name, customer_email, customer_phone, address, city, country, subtotal, item_count, currency, status, created_at, updated_at
    `,
    [id, String(status).trim().toLowerCase()]
  );

  return rows[0] ? mapOrderRecord(rows[0]) : null;
};

module.exports = {
  createOrder,
  getOrderById,
  updateOrderStatus,
};
