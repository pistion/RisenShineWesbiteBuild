const { getPool, query } = require("../config/db");
const { isDatabaseConnected } = require("../config/runtime");
const { isValidOrderStatus, serializeOrderForDb } = require("../models/Order");

const ORDER_SELECT_SQL = `
  SELECT
    id,
    order_number,
    customer_name,
    customer_email,
    customer_phone,
    address,
    city,
    country,
    notes,
    subtotal,
    shipping_amount,
    total_amount,
    item_count,
    currency,
    status,
    payment_status,
    payment_provider,
    payment_reference,
    placed_at,
    created_at,
    updated_at
  FROM orders
`;

const roundCurrency = (value) => Math.round((Number(value) || 0) * 100) / 100;

const createUserFacingError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.isUserFacing = true;
  error.statusCode = statusCode;
  return error;
};

const mapOrderRecord = (record = {}, items = []) => ({
  id: String(record.id),
  orderNumber: String(record.order_number || ""),
  itemCount: Number(record.item_count || 0),
  subtotal: Number(record.subtotal || 0),
  shippingAmount: Number(record.shipping_amount || 0),
  totalAmount: Number(record.total_amount || 0),
  currency: String(record.currency || "PGK"),
  status: String(record.status || "pending"),
  paymentStatus: String(record.payment_status || "pending"),
  paymentProvider: record.payment_provider || null,
  paymentReference: record.payment_reference || null,
  notes: String(record.notes || ""),
  placedAt: record.placed_at ? new Date(record.placed_at) : new Date(),
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
    category: String(item.product_category || ""),
    image: String(item.product_image || ""),
    unitPrice: Number(item.unit_price || 0),
    quantity: Number(item.quantity || 0),
    lineTotal: Number(item.line_total || 0),
  })),
});

const assertDatabaseConnection = () => {
  if (!isDatabaseConnected()) {
    throw new Error("PostgreSQL is not connected.");
  }
};

const getLockedProduct = async (client, productId) => {
  const { rows } = await client.query(
    `
      SELECT id, name, price, images, category, stock
      FROM products
      WHERE id = $1
      FOR UPDATE
    `,
    [productId]
  );

  return rows[0] || null;
};

const createOrder = async ({ customer, items, notes }) => {
  assertDatabaseConnection();

  if (!Array.isArray(items) || !items.length) {
    throw createUserFacingError("Your cart is empty.", 400);
  }

  const pool = getPool();
  const client = await pool.connect();
  const payload = serializeOrderForDb({ customer, notes });

  try {
    await client.query("BEGIN");

    const normalizedItems = [];
    let itemCount = 0;
    let subtotal = 0;

    for (const item of items) {
      const productId = String(item.productId || "").trim();
      const quantity = Number.parseInt(item.quantity || 0, 10);

      if (!productId || quantity <= 0) {
        continue;
      }

      const product = await getLockedProduct(client, productId);

      if (!product) {
        throw createUserFacingError("One of the products in your cart is no longer available.", 404);
      }

      const availableStock = Number(product.stock || 0);
      if (availableStock < quantity) {
        throw createUserFacingError(
          `${product.name} only has ${availableStock} item(s) available right now.`,
          400
        );
      }

      const unitPrice = roundCurrency(product.price);
      const lineTotal = roundCurrency(unitPrice * quantity);

      normalizedItems.push({
        productId: String(product.id),
        productName: String(product.name || ""),
        productCategory: String(product.category || ""),
        productImage:
          Array.isArray(product.images) && product.images.length ? String(product.images[0]) : "",
        unitPrice,
        quantity,
        lineTotal,
      });

      itemCount += quantity;
      subtotal = roundCurrency(subtotal + lineTotal);
    }

    if (!normalizedItems.length) {
      throw createUserFacingError("Your cart is empty.", 400);
    }

    const shippingAmount = payload.order.shippingAmount;
    const totalAmount = roundCurrency(subtotal + shippingAmount);

    await client.query(
      `
        INSERT INTO orders (
          id,
          order_number,
          customer_name,
          customer_email,
          customer_phone,
          address,
          city,
          country,
          notes,
          subtotal,
          shipping_amount,
          total_amount,
          item_count,
          currency,
          status,
          payment_status,
          payment_provider,
          payment_reference,
          placed_at,
          updated_at
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9,
          $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW(), NOW()
        )
      `,
      [
        payload.order.id,
        payload.order.orderNumber,
        payload.order.customerName,
        payload.order.customerEmail,
        payload.order.customerPhone,
        payload.order.address,
        payload.order.city,
        payload.order.country,
        payload.order.notes,
        subtotal,
        shippingAmount,
        totalAmount,
        itemCount,
        payload.order.currency,
        payload.order.status,
        payload.order.paymentStatus,
        payload.order.paymentProvider,
        payload.order.paymentReference,
      ]
    );

    for (const item of normalizedItems) {
      await client.query(
        `
          INSERT INTO order_items (
            order_id,
            product_id,
            product_name,
            product_category,
            product_image,
            unit_price,
            quantity,
            line_total,
            updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        `,
        [
          payload.order.id,
          item.productId,
          item.productName,
          item.productCategory,
          item.productImage,
          item.unitPrice,
          item.quantity,
          item.lineTotal,
        ]
      );

      await client.query(
        `
          UPDATE products
          SET stock = stock - $2, updated_at = NOW()
          WHERE id = $1
        `,
        [item.productId, item.quantity]
      );
    }

    await client.query("COMMIT");

    return {
      id: payload.order.id,
      orderNumber: payload.order.orderNumber,
      itemCount,
      subtotal,
      shippingAmount,
      totalAmount,
      currency: payload.order.currency,
      status: payload.order.status,
      paymentStatus: payload.order.paymentStatus,
      paymentProvider: payload.order.paymentProvider,
      paymentReference: payload.order.paymentReference,
      placedAt: new Date(),
      customer: {
        name: payload.order.customerName,
        email: payload.order.customerEmail,
        phone: payload.order.customerPhone,
        address: payload.order.address,
        city: payload.order.city,
        country: payload.order.country,
      },
      notes: payload.order.notes,
      items: normalizedItems,
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
      SELECT
        id,
        product_id,
        product_name,
        product_category,
        product_image,
        unit_price,
        quantity,
        line_total
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
      RETURNING
        id,
        order_number,
        customer_name,
        customer_email,
        customer_phone,
        address,
        city,
        country,
        notes,
        subtotal,
        shipping_amount,
        total_amount,
        item_count,
        currency,
        status,
        payment_status,
        payment_provider,
        payment_reference,
        placed_at,
        created_at,
        updated_at
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
