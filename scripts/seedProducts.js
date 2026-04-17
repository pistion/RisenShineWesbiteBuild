require("dotenv").config();

const connectDB = require("../config/db");
const Product = require("../models/Product");

const sampleProducts = [
  {
    name: "Nimbus Running Shoes",
    price: 89.99,
    description:
      "Breathable daily running shoes with responsive cushioning for comfort and stability.",
    images: [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80",
    ],
    category: "Footwear",
    stock: 45,
  },
  {
    name: "Minimal Leather Backpack",
    price: 129.5,
    description:
      "A premium backpack with padded laptop sleeve, hidden pockets, and water-resistant lining.",
    images: [
      "https://images.unsplash.com/photo-1491637639811-60e2756cc1c7?auto=format&fit=crop&w=900&q=80",
    ],
    category: "Bags",
    stock: 18,
  },
  {
    name: "Smart Noise-Canceling Headphones",
    price: 219,
    description:
      "Wireless over-ear headphones with adaptive noise cancellation and 30-hour battery life.",
    images: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80",
    ],
    category: "Electronics",
    stock: 26,
  },
  {
    name: "Ceramic Pour-Over Coffee Set",
    price: 54.75,
    description:
      "Handcrafted ceramic dripper set designed for smooth, rich manual brew extraction.",
    images: [
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80",
    ],
    category: "Home",
    stock: 34,
  },
  {
    name: "Organic Cotton Hoodie",
    price: 64.2,
    description:
      "Soft heavyweight hoodie made from organic cotton with a relaxed modern fit.",
    images: [
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80",
    ],
    category: "Apparel",
    stock: 52,
  },
  {
    name: "Desk Lamp Pro",
    price: 72.99,
    description:
      "Dimmable LED desk lamp with touch controls, USB charging, and adjustable arm.",
    images: [
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=80",
    ],
    category: "Office",
    stock: 20,
  },
];

const seedProducts = async () => {
  try {
    const databaseConnected = await connectDB();

    if (!databaseConnected) {
      throw new Error(
        "MongoDB is unavailable. Start MongoDB or update MONGODB_URI before seeding."
      );
    }

    await Product.deleteMany({});
    await Product.insertMany(sampleProducts);

    console.log(`Seed complete: ${sampleProducts.length} products inserted.`);
    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error.message);
    process.exit(1);
  }
};

seedProducts();
