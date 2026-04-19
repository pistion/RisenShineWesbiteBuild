require("dotenv").config();

const connectDB = require("../config/db");
const { closePool, getPool } = require("../config/db");
const sampleProducts = require("../data/sampleProducts");
const { serializeProductForDb } = require("../models/Product");

const UPSERT_PRODUCT_SQL = `
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
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    description = EXCLUDED.description,
    images = EXCLUDED.images,
    category = EXCLUDED.category,
    stock = EXCLUDED.stock,
    updated_at = NOW()
`;

const seedProducts = async () => {
  let client;

  try {
    const databaseConnected = await connectDB();

    if (!databaseConnected) {
      throw new Error(
        "PostgreSQL is unavailable. Start PostgreSQL or update DATABASE_URL before seeding."
      );
    }

    client = await getPool().connect();
    await client.query("BEGIN");

    for (const sourceProduct of sampleProducts) {
      const product = serializeProductForDb(sourceProduct);

      await client.query(UPSERT_PRODUCT_SQL, [
        product.id,
        product.name,
        product.price,
        product.description,
        JSON.stringify(product.images),
        product.category,
        product.stock,
        product.createdAt,
        product.updatedAt,
      ]);
    }

    await client.query("COMMIT");
    console.log(
      `Seed complete: ${sampleProducts.length} sample products inserted or updated.`
    );
    process.exitCode = 0;
  } catch (error) {
    if (client) {
      await client.query("ROLLBACK");
    }

    console.error("Seed failed:", error.message);
    process.exitCode = 1;
  } finally {
    if (client) {
      client.release();
    }

    await closePool();
  }
};

seedProducts();
