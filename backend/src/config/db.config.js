const mongoose = require("mongoose");

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error("MONGODB_URI is undefined or empty.");
    return;
  }

  try {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB successfully");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
  }
};

module.exports = connectDB;
