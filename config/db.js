const { Pool } = require("pg");
const { setDatabaseConnected } = require("./runtime");
const { ensureSchema } = require("./schema");

let pool = null;

const buildPool = () => {
  if (pool || !process.env.DATABASE_URL) {
    return pool;
  }

  const sslEnabled =
    process.env.DATABASE_SSL === "true" ||
    (process.env.NODE_ENV === "production" &&
      process.env.DATABASE_SSL !== "false");

  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: sslEnabled ? { rejectUnauthorized: false } : false,
  });

  return pool;
};

const getPool = () => buildPool();

const query = (text, params = []) => {
  const activePool = buildPool();

  if (!activePool) {
    throw new Error(
      "DATABASE_URL is not configured. PostgreSQL queries are unavailable."
    );
  }

  return activePool.query(text, params);
};

const closePool = async () => {
  if (!pool) {
    return;
  }

  await pool.end();
  pool = null;
};

const connectDB = async () => {
  if (!process.env.DATABASE_URL) {
    console.warn(
      "DATABASE_URL is not defined. Starting without a PostgreSQL connection."
    );
    setDatabaseConnected(false);
    return false;
  }

  try {
    const activePool = buildPool();
    await activePool.query("SELECT 1");
    await ensureSchema(activePool);

    setDatabaseConnected(true);
    console.log("PostgreSQL connected successfully.");
    return true;
  } catch (error) {
    setDatabaseConnected(false);
    console.warn(
      `PostgreSQL unavailable. Starting in fallback mode: ${error.message}`
    );
    return false;
  }
};

module.exports = connectDB;
module.exports.getPool = getPool;
module.exports.query = query;
module.exports.closePool = closePool;
