require("dotenv").config();

const connectDB = require("../config/db");
const { closePool } = require("../config/db");

const initDb = async () => {
  try {
    const databaseConnected = await connectDB();

    if (!databaseConnected) {
      throw new Error(
        "PostgreSQL is unavailable. Start PostgreSQL or update DATABASE_URL before initializing."
      );
    }

    console.log("Database schema is ready.");
    process.exitCode = 0;
  } catch (error) {
    console.error("Database init failed:", error.message);
    process.exitCode = 1;
  } finally {
    await closePool();
  }
};

initDb();
