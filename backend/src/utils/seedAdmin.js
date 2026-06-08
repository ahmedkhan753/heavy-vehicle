/**
 * Seed / promote an admin account
 * ───────────────────────────────
 * Run:  npm run seed:admin   (from the backend/ folder)
 *
 * Reads credentials from .env:
 *   ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME, ADMIN_PHONE (optional)
 *
 * The values in .env can be samples during development — replace them
 * with the real ones before production and re-run this script.
 *
 * Behaviour:
 *   - If a user with ADMIN_EMAIL exists → promote them to role "admin".
 *   - Otherwise → create a new admin user (password hashed by the model hook).
 */

require("dotenv").config();

const mongoose = require("mongoose");
const validator = require("validator");
const User = require("../models/User");

async function seedAdmin() {
  // Normalize the same way the auth routes do (.normalizeEmail()), so the
  // stored admin email matches what login will look up — otherwise a Gmail
  // address with dots/+tags would be unreachable at login.
  const rawEmail = (process.env.ADMIN_EMAIL || "").trim();
  const email = rawEmail ? validator.normalizeEmail(rawEmail) : "";
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || "HeavyWheels Admin";
  const phone = (process.env.ADMIN_PHONE || "03000000000").trim();

  if (!email || !password) {
    console.error("❌ ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI, {
    dbName: process.env.MONGODB_DB_NAME || "heavywheels",
  });

  try {
    const existing = await User.findOne({ email });

    if (existing) {
      if (existing.role === "admin") {
        console.log(`✅ ${email} is already an admin. Nothing to do.`);
      } else {
        existing.role = "admin";
        await existing.save({ validateBeforeSave: false });
        console.log(`✅ Promoted existing user ${email} to admin.`);
      }
    } else {
      await User.create({ name, email, phone, password, role: "admin" });
      console.log(`✅ Created admin user ${email}.`);
    }
  } catch (err) {
    console.error("❌ Seed failed:", err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

seedAdmin();
