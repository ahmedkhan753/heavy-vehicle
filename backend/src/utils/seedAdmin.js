/**
 * Seed / promote an admin account
 * ───────────────────────────────
 * Run:  npm run seed:admin   (from the backend/ folder)
 *
 * Reads credentials from .env:
 *   ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME, ADMIN_PHONE (optional)
 *
 * Behaviour:
 *   - If a user with ADMIN_EMAIL exists → promote them to role "admin".
 *   - Otherwise → create a new admin user (password hashed by the model hook).
 */

require("dotenv").config();

const mongoose = require("mongoose");
const validator = require("validator");
const User = require("../models/User");

async function syncAdminAccountFromEnv() {
  const rawEmail = (process.env.ADMIN_EMAIL || "").trim();
  const email = rawEmail ? validator.normalizeEmail(rawEmail) : "";
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || "HeavyWheels Admin";
  const phone = (process.env.ADMIN_PHONE || "03000000000").trim();

  if (!email || !password) {
    return null;
  }

  const existing = await User.findOne({ email });

  if (existing) {
    const needsUpdate =
      existing.role !== "admin" ||
      !existing.isEmailVerified ||
      !existing.isActive ||
      existing.isBanned;

    if (needsUpdate) {
      existing.role = "admin";
      existing.isEmailVerified = true;
      existing.isActive = true;
      existing.isBanned = false;
      await existing.save({ validateBeforeSave: false });
    }

    return existing;
  }

  const created = await User.create({
    name,
    email,
    phone,
    password,
    role: "admin",
    isEmailVerified: true,
    isActive: true,
    isBanned: false,
  });

  return created;
}

async function seedAdmin() {
  const rawEmail = (process.env.ADMIN_EMAIL || "").trim();
  const email = rawEmail ? validator.normalizeEmail(rawEmail) : "";
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error("❌ ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI, {
    dbName: process.env.MONGODB_DB_NAME || "heavywheels",
  });

  try {
    await syncAdminAccountFromEnv();
    console.log(`✅ Admin account synced for ${email}.`);
  } catch (err) {
    console.error("❌ Seed failed:", err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

module.exports = { seedAdmin, syncAdminAccountFromEnv };

if (require.main === module) {
  seedAdmin();
}
