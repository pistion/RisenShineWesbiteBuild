const mongoose = require("mongoose");
const { setDatabaseConnected } = require("./runtime");

const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI;

  if (!mongoURI) {
    console.warn("MONGODB_URI is not defined. Starting without a database connection.");
    setDatabaseConnected(false);
    return false;
  }

  try {
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 3000,
    });
    setDatabaseConnected(true);
    console.log("MongoDB connected successfully.");
    return true;
  } catch (error) {
    setDatabaseConnected(false);
    console.warn(`MongoDB unavailable. Starting in fallback mode: ${error.message}`);
    return false;
  }
};

module.exports = connectDB;
