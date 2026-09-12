const mongoose = require("mongoose");

// Cached across invocations of the same warm serverless container (Vercel) so we don't
// open a new MongoDB connection on every request; a no-op extra check for traditional
// long-running hosts (Render, local dev) where this only ever runs once anyway.
let cached = global._mongooseConn;
if (!cached) {
  cached = global._mongooseConn = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    mongoose.set("strictQuery", true);
    cached.promise = mongoose.connect(process.env.MONGO_URI).then((m) => {
      console.log("MongoDB connected");
      return m;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

module.exports = connectDB;
