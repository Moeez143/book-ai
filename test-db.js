const mongoose = require("mongoose");

console.log("Starting MongoDB test...");
console.log("MONGODB_URI exists:", !!process.env.MONGODB_URI);

mongoose
  .connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
  })
  .then(async () => {
    console.log("✅ MongoDB connected!");

    await mongoose.connection.db.admin().ping();

    console.log("✅ MongoDB ping successful!");

    await mongoose.disconnect();
  })
  .catch((error) => {
    console.error("❌ MongoDB connection failed:");
    console.error(error);
  });