/**
 * Auth Controller
 * ────────────────
 * register  → create account + send tokens
 * login     → verify credentials + send tokens
 * logout    → clear refresh cookie
 * me        → get current user
 * refresh   → issue new access token from refresh cookie
 */

const crypto = require("crypto");
const { validationResult } = require("express-validator");
const User = require("../models/User");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  setRefreshCookie,
  clearRefreshCookie,
  hashToken,
} = require("../utils/jwt");
const { sendPasswordReset } = require("../utils/email");
const { env } = require("../config/env");
const { AppError } = require("../middleware/error.middleware");

// ── Standard API response helper ─────────────────────────────
const respond = (res, statusCode, data, message = "Success") =>
  res.status(statusCode).json({ success: true, message, data });

// ─────────────────────────────────────────────────────────────
// REGISTER
// POST /api/auth/register
// ─────────────────────────────────────────────────────────────
async function register(req, res, next) {
  try {
    // Check validation errors from express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        success: false,
        message: "Validation failed",
        errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
      });
    }

    const { name, email, phone, password, role, city, address } = req.body;

    // Check if email already registered
    const emailExists = await User.findOne({ email: email.toLowerCase() });
    if (emailExists) {
      return next(new AppError("An account with this email already exists.", 409));
    }

    // Check if phone already registered
    const phoneExists = await User.findOne({ phone });
    if (phoneExists) {
      return next(new AppError("An account with this phone number already exists.", 409));
    }

    // Only allow user/dealer roles on registration (not admin)
    const allowedRoles = ["user", "dealer"];
    const userRole = allowedRoles.includes(role) ? role : "user";

    // Create user (password hashed in pre-save hook)
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      password,
      role: userRole,
      city: (city || "").trim().toLowerCase(),
      address: (address || "").trim(),
    });

    // Generate tokens
    const accessToken = signAccessToken({ id: user._id, role: user.role });
    const refreshToken = signRefreshToken({ id: user._id });

    // Store hashed refresh token on user (never the raw token)
    user.refreshToken = hashToken(refreshToken);
    user.lastLoginAt = new Date();
    user.lastLoginIp = req.ip;
    await user.save({ validateBeforeSave: false });

    // Set refresh token in HTTP-only cookie
    setRefreshCookie(res, refreshToken);

    respond(res, 201, {
      accessToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        plan: user.plan,
        city: user.city,
        avatar: user.avatar,
        isVerifiedSeller: user.isVerifiedSeller,
      },
    }, "Account created successfully");

  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
// LOGIN
// POST /api/auth/login
// ─────────────────────────────────────────────────────────────
async function login(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        success: false,
        message: "Validation failed",
        errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
      });
    }

    const { email, password } = req.body;

    // Find user — select normally-hidden fields needed for auth + lockout
    const user = await User.findOne({ email: email.toLowerCase() })
      .select("+password +refreshToken +failedLoginAttempts +lockUntil");

    // Generic message — never reveal whether the email exists
    if (!user) {
      return next(new AppError("Invalid email or password.", 401));
    }

    // ── Account currently locked? ────────────────────────────
    if (user.isLocked) {
      const minutesLeft = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
      return res.status(423).json({
        success: false,
        locked:  true,
        lockedUntil: user.lockUntil,
        message: `Too many failed attempts. This account is locked for ${minutesLeft} more minute${minutesLeft === 1 ? "" : "s"}. Try again later or reset your password.`,
      });
    }

    // ── Verify password ──────────────────────────────────────
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      const attemptsRemaining = await user.registerFailedLogin();

      if (attemptsRemaining === 0) {
        return res.status(423).json({
          success: false,
          locked:  true,
          lockedUntil: user.lockUntil,
          message: "Too many failed attempts. This account has been locked for 30 minutes. Try again later or reset your password.",
        });
      }

      return res.status(401).json({
        success: false,
        attemptsRemaining,
        message: `Invalid email or password. ${attemptsRemaining} attempt${attemptsRemaining === 1 ? "" : "s"} remaining before the account is locked.`,
      });
    }

    // ── Account status checks ────────────────────────────────
    if (user.isBanned) {
      return next(new AppError("Your account has been suspended. Contact support.", 403));
    }

    if (!user.isActive) {
      return next(new AppError("Your account is inactive. Contact support.", 403));
    }

    // Successful login — clear any failed-attempt state
    await user.resetLoginAttempts();

    // Generate tokens
    const accessToken = signAccessToken({ id: user._id, role: user.role });
    const refreshToken = signRefreshToken({ id: user._id });

    // Update user record (store hashed refresh token)
    user.refreshToken = hashToken(refreshToken);
    user.lastLoginAt = new Date();
    user.lastLoginIp = req.ip;
    await user.save({ validateBeforeSave: false });

    // Set HTTP-only cookie
    setRefreshCookie(res, refreshToken);

    respond(res, 200, {
      accessToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        plan: user.plan,
        city: user.city,
        avatar: user.avatar,
        isVerifiedSeller: user.isVerifiedSeller,
        totalAds: user.totalAds,
      },
    }, "Logged in successfully");

  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
// LOGOUT
// POST /api/auth/logout
// ─────────────────────────────────────────────────────────────
async function logout(req, res, next) {
  try {
    // Clear refresh token from DB if user is authenticated
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, { refreshToken: "" });
    }

    // Clear the cookie
    clearRefreshCookie(res);

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
      data: null,
    });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
// GET CURRENT USER
// GET /api/auth/me
// Requires: protect middleware
// ─────────────────────────────────────────────────────────────
async function me(req, res, next) {
  try {
    // req.user is attached by protect middleware
    const user = await User.findById(req.user._id);

    if (!user) {
      return next(new AppError("User not found.", 404));
    }

    respond(res, 200, {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      plan: user.plan,
      city: user.city,
      avatar: user.avatar,
      isVerifiedSeller: user.isVerifiedSeller,
      isEmailVerified: user.isEmailVerified,
      totalAds: user.totalAds,
      savedAds: user.savedAds,
      createdAt: user.createdAt,
    });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
// REFRESH TOKEN
// POST /api/auth/refresh
// ─────────────────────────────────────────────────────────────
async function refresh(req, res, next) {
  try {
    // Get refresh token from HTTP-only cookie
    const token = req.cookies?.hw_refresh_token;

    if (!token) {
      return next(new AppError("No refresh token found. Please login.", 401));
    }

    // Verify the refresh token
    const decoded = verifyRefreshToken(token);

    // Find user and check the stored hash matches this token
    const user = await User.findById(decoded.id).select("+refreshToken");

    if (!user || !user.refreshToken || user.refreshToken !== hashToken(token)) {
      clearRefreshCookie(res);
      return next(new AppError("Invalid refresh token. Please login again.", 401));
    }

    if (user.isBanned || !user.isActive) {
      clearRefreshCookie(res);
      return next(new AppError("Account suspended or inactive.", 403));
    }

    // Issue new tokens (token rotation)
    const newAccessToken = signAccessToken({ id: user._id, role: user.role });
    const newRefreshToken = signRefreshToken({ id: user._id });

    // Store new refresh token (hashed)
    user.refreshToken = hashToken(newRefreshToken);
    await user.save({ validateBeforeSave: false });

    // Set new cookie
    setRefreshCookie(res, newRefreshToken);

    respond(res, 200, { accessToken: newAccessToken }, "Token refreshed");

  } catch (err) {
    // If refresh token is expired or invalid, clear cookie
    clearRefreshCookie(res);
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
// FORGOT PASSWORD
// POST /api/auth/forgot-password   { email }
// Always responds the same way to avoid leaking which emails exist.
// ─────────────────────────────────────────────────────────────
async function forgotPassword(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        success: false,
        message: "Validation failed",
        errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
      });
    }

    const { email } = req.body;
    const genericMessage =
      "If an account with that email exists, a password reset link has been sent.";

    const user = await User.findOne({ email: email.toLowerCase() });

    // No user → respond generically (no enumeration), do nothing.
    if (!user) {
      return res.status(200).json({ success: true, message: genericMessage });
    }

    // Create a raw token for the email + store only its hash in the DB.
    const rawToken = crypto.randomBytes(32).toString("hex");
    user.passwordResetToken   = hashToken(rawToken);
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save({ validateBeforeSave: false });

    try {
      await sendPasswordReset(user, rawToken);
    } catch (mailErr) {
      console.error("⚠️  Password reset email failed:", mailErr.message);
    }

    const payload = { success: true, message: genericMessage };

    // Dev fallback: surface the token + ready-to-use link in development so
    // the flow is testable even when SMTP isn't configured. Never in production.
    if (env.IS_DEVELOPMENT) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
      payload.devResetToken = rawToken;
      payload.devResetUrl   = `${siteUrl}/auth/reset-password?token=${rawToken}`;
    }

    return res.status(200).json(payload);
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
// RESET PASSWORD
// POST /api/auth/reset-password   { token, password }
// ─────────────────────────────────────────────────────────────
async function resetPassword(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        success: false,
        message: "Validation failed",
        errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
      });
    }

    const { token, password } = req.body;

    const user = await User.findOne({
      passwordResetToken:   hashToken(token),
      passwordResetExpires: { $gt: new Date() },
    }).select("+passwordResetToken +passwordResetExpires");

    if (!user) {
      return next(new AppError("This reset link is invalid or has expired. Please request a new one.", 400));
    }

    // Set the new password (hashed by the pre-save hook) and clear reset state.
    user.password = password;
    user.passwordResetToken   = undefined;
    user.passwordResetExpires = undefined;

    // Security: clear lockout and invalidate all existing sessions.
    user.failedLoginAttempts = 0;
    user.lockUntil   = undefined;
    user.refreshToken = "";
    await user.save();

    clearRefreshCookie(res);

    return res.status(200).json({
      success: true,
      message: "Password reset successfully. Please log in with your new password.",
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, logout, me, refresh, forgotPassword, resetPassword };
