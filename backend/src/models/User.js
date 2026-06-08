/**
 * User Model
 * ───────────
 * Covers both regular users and dealers.
 * Role field: "user" | "dealer" | "admin"
 */

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    // ── Basic Info ──────────────────────────────────────────
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [60, "Name cannot exceed 60 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email"],
    },

    phone: {
      type: String,
      required: [true, "Phone number is required"],
      unique: true,
      trim: true,
      match: [/^(\+92|0092|0)?[3][0-9]{9}$/, "Enter a valid Pakistani mobile number"],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false, // Never returned in queries by default
    },

    // ── Profile ─────────────────────────────────────────────
    avatar: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },

    city: {
      type: String,
      trim: true,
      default: "",
    },

    address: {
      type: String,
      trim: true,
      maxlength: [200, "Address cannot exceed 200 characters"],
      default: "",
    },

    role: {
      type: String,
      enum: ["user", "dealer", "admin"],
      default: "user",
    },

    // Current subscription tier. Kept in sync when a subscription is
    // activated (admin verify) or expires (maintenance sweep). Drives the
    // plan badge/theme on the account and on the user's listings.
    plan: {
      type: String,
      enum: ["free", "starter", "pro", "elite", "elitePro"],
      default: "free",
    },

    // ── Verification ─────────────────────────────────────────
    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    isPhoneVerified: {
      type: Boolean,
      default: false,
    },

    // Verified seller badge (manually set by admin)
    isVerifiedSeller: {
      type: Boolean,
      default: false,
    },

    // ── Account Status ───────────────────────────────────────
    isActive: {
      type: Boolean,
      default: true,
    },

    isBanned: {
      type: Boolean,
      default: false,
    },

    banReason: {
      type: String,
      default: "",
    },

    // ── Saved Ads ────────────────────────────────────────────
    savedAds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Vehicle",
      },
    ],

    // ── Stats ────────────────────────────────────────────────
    totalAds: {
      type: Number,
      default: 0,
    },

    totalViews: {
      type: Number,
      default: 0,
    },

    // ── Password Reset ───────────────────────────────────────
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },

    // ── Email Verification Token ─────────────────────────────
    emailVerifyToken: { type: String, select: false },
    emailVerifyExpires: { type: Date, select: false },

    // ── Refresh Token (stored as a SHA-256 hash, never the raw token) ─
    refreshToken: { type: String, select: false },

    // ── Brute-force protection ───────────────────────────────
    failedLoginAttempts: { type: Number, default: 0, select: false },
    lockUntil:           { type: Date,   select: false },

    // ── Last Login ───────────────────────────────────────────
    lastLoginAt: { type: Date },
    lastLoginIp: { type: String, select: false },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
    toJSON: {
      virtuals: true,
      transform: (_, ret) => {
        // Remove sensitive fields from JSON output
        delete ret.password;
        delete ret.refreshToken;
        delete ret.passwordResetToken;
        delete ret.passwordResetExpires;
        delete ret.emailVerifyToken;
        delete ret.emailVerifyExpires;
        delete ret.failedLoginAttempts;
        delete ret.lockUntil;
        delete ret.lastLoginIp;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// ── INDEXES ───────────────────────────────────────────────────
// NOTE: `unique: true` on email/phone already creates their indexes —
// declaring them again here would trigger Mongoose "duplicate index" warnings.
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });

// ── BRUTE-FORCE LOCKOUT CONFIG ───────────────────────────────
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MS   = 30 * 60 * 1000; // 30 minutes

// Matches a bcrypt hash ($2a/$2b/$2y, cost, then the 53-char salt+digest).
const BCRYPT_HASH_RE = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;

// ── VIRTUAL: Member since (formatted) ────────────────────────
userSchema.virtual("memberSince").get(function () {
  return this.createdAt?.getFullYear();
});

// ── VIRTUAL: Is the account currently locked? ────────────────
userSchema.virtual("isLocked").get(function () {
  return Boolean(this.lockUntil && this.lockUntil.getTime() > Date.now());
});

// ── PRE-SAVE: Hash password before saving ────────────────────
// NOTE: async pre hooks in Mongoose v9 are NOT passed a `next` callback —
// just await/return (or throw). Calling next() here threw "next is not a function".
userSchema.pre("save", async function () {
  // Only hash if password has been modified
  if (!this.isModified("password")) return;

  // Defensive guard against double-hashing: if the current value is already a
  // bcrypt hash (e.g. an already-hashed value got reassigned and marked dirty),
  // never hash it again — doing so would silently lock the user out.
  if (BCRYPT_HASH_RE.test(this.password)) return;

  const SALT_ROUNDS = 12;
  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
});

// ── METHOD: Compare password ──────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ── METHOD: Register a failed login attempt ──────────────────
// Increments the counter; locks the account once MAX_LOGIN_ATTEMPTS
// is reached. Returns how many attempts remain (0 means now locked).
userSchema.methods.registerFailedLogin = async function () {
  // If a previous lock has already expired, start counting fresh.
  if (this.lockUntil && this.lockUntil.getTime() <= Date.now()) {
    this.failedLoginAttempts = 0;
    this.lockUntil = undefined;
  }

  this.failedLoginAttempts = (this.failedLoginAttempts || 0) + 1;

  if (this.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS) {
    this.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
  }

  await this.save({ validateBeforeSave: false });
  return Math.max(0, MAX_LOGIN_ATTEMPTS - this.failedLoginAttempts);
};

// ── METHOD: Reset lockout state after a successful login ─────
userSchema.methods.resetLoginAttempts = async function () {
  if (this.failedLoginAttempts === 0 && !this.lockUntil) return;
  this.failedLoginAttempts = 0;
  this.lockUntil = undefined;
  await this.save({ validateBeforeSave: false });
};

userSchema.statics.MAX_LOGIN_ATTEMPTS = MAX_LOGIN_ATTEMPTS;
userSchema.statics.LOCK_DURATION_MS   = LOCK_DURATION_MS;

// ── METHOD: Get public profile (safe to send to client) ──────
userSchema.methods.getPublicProfile = function () {
  return {
    _id: this._id,
    name: this.name,
    phone: this.phone,
    city: this.city,
    avatar: this.avatar,
    role: this.role,
    isVerifiedSeller: this.isVerifiedSeller,
    totalAds: this.totalAds,
    memberSince: this.memberSince,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model("User", userSchema);
