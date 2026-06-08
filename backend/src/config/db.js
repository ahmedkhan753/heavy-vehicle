/**
 * MongoDB Connection
 * ──────────────────
 * Connects to MongoDB with retry logic.
 * Logs connection status clearly.
 * Handles disconnect events gracefully.
 */

const mongoose = require("mongoose");
const { env }  = require("./env");

// Connection options
const MONGOOSE_OPTIONS = {
  dbName:              env.MONGODB_DB_NAME,
  maxPoolSize:         10,      // Max 10 concurrent connections
  serverSelectionTimeoutMS: 5000,  // Fail fast if can't connect (5s)
  socketTimeoutMS:     45000,   // Close sockets after 45s inactivity
};

let retryCount  = 0;
let isConnecting = false;      // Guard against overlapping connection attempts
let hasConnected = false;      // True once we've had at least one live connection
const MAX_RETRIES = 5;

async function connectDB() {
  // Prevent concurrent attempts — without this, the `disconnected` event
  // fired during a failed connect races with the scheduled retry below,
  // spawning overlapping loops and misleading logs.
  if (isConnecting || mongoose.connection.readyState === 1) return;
  isConnecting = true;

  try {
    await mongoose.connect(env.MONGODB_URI, MONGOOSE_OPTIONS);
    retryCount   = 0;
    hasConnected = true;
    console.log(`✅ MongoDB connected → ${env.MONGODB_DB_NAME}`);
  } catch (error) {
    retryCount++;
    console.error(`❌ MongoDB connection failed (attempt ${retryCount}/${MAX_RETRIES}):`, error.message);

    if (retryCount < MAX_RETRIES) {
      const delay = retryCount * 2000; // Backoff: 2s, 4s, 6s, 8s, 10s
      console.log(`   Retrying in ${delay / 1000}s...`);
      setTimeout(connectDB, delay);
    } else {
      console.error("   Max retries reached. Exiting.");
      process.exit(1);
    }
  } finally {
    isConnecting = false;
  }
}

// ── Connection event listeners ────────────────────────────────

mongoose.connection.on("connected", () => {
  console.log("📦 Mongoose connection established");
});

mongoose.connection.on("error", (err) => {
  console.error("❌ Mongoose connection error:", err.message);
});

mongoose.connection.on("disconnected", () => {
  // Only treat this as a reconnect trigger if we were genuinely connected
  // before. During the initial connect retry loop the driver emits
  // `disconnected` too, and reacting to it here would double up the retries.
  if (!hasConnected) return;
  console.warn("⚠️  Mongoose disconnected. Attempting reconnect...");
  retryCount = 0;
  connectDB();
});

// Graceful shutdown — close DB connection when process exits
process.on("SIGINT",  () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

async function gracefulShutdown(signal) {
  console.log(`\n🛑 ${signal} received. Closing MongoDB connection...`);
  await mongoose.connection.close();
  console.log("✅ MongoDB connection closed");
  process.exit(0);
}

module.exports = connectDB;
