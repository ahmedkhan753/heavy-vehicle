/**
 * Auth Doctor — manual recovery tool for login problems.
 * Run from the backend/ folder. Talks to the database in your .env.
 *
 *   node scripts/auth-doctor.js inspect <email>
 *       Show an account's auth state (lock status, failed attempts, whether
 *       the stored password is a valid bcrypt hash). Reveals no secrets.
 *
 *   node scripts/auth-doctor.js unlock <email>
 *       Clear a lockout + failed-attempt counter so the user can try again.
 *
 *   node scripts/auth-doctor.js set-password <email> <newPassword>
 *       Set a new password (hashed correctly via the model). Use this to
 *       recover an account whose stored hash got corrupted. Also clears any
 *       lockout and invalidates existing sessions.
 *
 * The new password must be 8+ chars with an uppercase, lowercase, and a digit.
 */

require("dotenv").config();
const mongoose = require("mongoose");
const validator = require("validator");
const User = require("../src/models/User");
const Vehicle = require("../src/models/Vehicle");
const Part = require("../src/models/Part");

const BCRYPT_HASH_RE = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;
const STRONG_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

async function main() {
  const [cmd, email, newPassword] = process.argv.slice(2);
  // Normalize the same way auth routes do, so an email with Gmail dots/+tags
  // resolves to the stored (normalized) address.
  const raw = (email || "").trim();
  const e = raw ? validator.normalizeEmail(raw) : "";

  if (!cmd || !e) {
    console.log("Usage: node scripts/auth-doctor.js <inspect|unlock|set-password|delete> <email> [newPassword]");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB_NAME || "heavywheels" });

  try {
    const user = await User.findOne({ email: e }).select("+password +failedLoginAttempts +lockUntil");
    if (!user) {
      console.log(`No account found for ${e}`);
      return;
    }

    if (cmd === "inspect") {
      console.log({
        email: user.email,
        hashLooksValidBcrypt: BCRYPT_HASH_RE.test(user.password || ""),
        hashLength: (user.password || "").length,
        failedLoginAttempts: user.failedLoginAttempts || 0,
        locked: Boolean(user.lockUntil && user.lockUntil.getTime() > Date.now()),
        lockUntil: user.lockUntil || null,
        isActive: user.isActive,
        isBanned: user.isBanned,
        updatedAt: user.updatedAt,
      });
      return;
    }

    if (cmd === "unlock") {
      user.failedLoginAttempts = 0;
      user.lockUntil = undefined;
      await user.save({ validateBeforeSave: false });
      console.log(`Unlocked ${user.email}. They can log in again now.`);
      return;
    }

    if (cmd === "set-password") {
      if (!STRONG_RE.test(newPassword || "")) {
        console.log("New password must be 8+ chars with uppercase, lowercase, and a digit.");
        process.exit(1);
      }
      user.password = newPassword;          // pre-save hook hashes it once
      user.failedLoginAttempts = 0;
      user.lockUntil = undefined;
      user.refreshToken = "";               // force re-login everywhere
      await user.save();
      console.log(`Password reset for ${user.email}. Log in with the new password.`);
      return;
    }

    if (cmd === "delete") {
      // Guard: refuse to delete an account that still owns listings, to avoid
      // orphaning data. Move/sell those first if you really mean to.
      const [vehicles, parts] = await Promise.all([
        Vehicle.countDocuments({ sellerId: user._id }),
        Part.countDocuments({ sellerId: user._id }),
      ]);
      if (vehicles + parts > 0) {
        console.log(`Refusing to delete ${user.email}: it still has ${vehicles} vehicle + ${parts} part listing(s).`);
        process.exit(1);
      }
      await User.deleteOne({ _id: user._id });
      console.log(`Deleted account ${user.email} (role: ${user.role}).`);
      return;
    }

    console.log(`Unknown command "${cmd}".`);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
