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
const { sendPasswordReset, sendEmailVerification } = require("../utils/email");
const { syncAdminAccountFromEnv } = require("../utils/seedAdmin");
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

    // Generate verification token
    const rawToken = crypto.randomBytes(32).toString("hex");
    user.emailVerifyToken = hashToken(rawToken);
    user.emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    user.isEmailVerified = false;
    await user.save({ validateBeforeSave: false });

    try {
      await sendEmailVerification(user, rawToken);
    } catch (mailErr) {
      console.error("⚠️  Email verification failed to send:", mailErr.message);
    }

    const payload = {
      requiresEmailVerification: true,
      message: "Account created successfully. Please check your email to verify your account before logging in.",
    };

    if (env.IS_DEVELOPMENT) {
      payload.devVerifyToken = rawToken;
      payload.devVerifyUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/verify?token=${rawToken}`;
    }

    respond(res, 201, payload, "Account created. Please verify your email.");

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
    const emailLower = (email || "").toLowerCase();
    const envAdminEmail = (env.ADMIN_EMAIL || "").trim().toLowerCase();
    const isBuiltInAdminLogin = envAdminEmail && emailLower === envAdminEmail && env.ADMIN_PASSWORD && password === env.ADMIN_PASSWORD;

    if (isBuiltInAdminLogin) {
      await syncAdminAccountFromEnv();
    }

    // Find user — select normally-hidden fields needed for auth + lockout
    let user = await User.findOne({ email: emailLower })
      .select("+password +refreshToken +failedLoginAttempts +lockUntil");

    // Generic message — never reveal whether the email exists
    if (!user) {
      if (isBuiltInAdminLogin) {
        user = await User.create({
          name: env.ADMIN_NAME || "HeavyWheels Admin",
          email: envAdminEmail,
          phone: "03000000000",
          password: env.ADMIN_PASSWORD,
          role: "admin",
          isEmailVerified: true,
          isActive: true,
          isBanned: false,
        });
      } else {
        return next(new AppError("Invalid email or password.", 401));
      }
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
    const isMatch = isBuiltInAdminLogin || (await user.comparePassword(password));
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
    // The built-in env admin is always allowed in, even when SMTP is off or the
    // account has not been manually verified in the dashboard. Other users still
    // need the normal email verification flow.
//    if (!user.isEmailVerified && user.role !== "admin" && !isBuiltInAdminLogin) {
  //    return res.status(403).json({
    //    success: false,
      //  requiresEmailVerification: true,
      //  message: "Please verify your email address before logging in. Check your inbox or request a new verification link.",
     // });
   // }

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
        bio: user.bio,
        whatsapp: user.whatsapp,
        links: user.links,
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

    const generateTokenPayload = (user) => ({
      _id:              user._id,
      name:             user.name,
      email:            user.email,
      phone:            user.phone,
      city:             user.city,
      address:          user.address,
      role:             user.role,
      plan:             user.plan,
      avatar:           user.avatar,
      bio:              user.bio,
      whatsapp:         user.whatsapp,
      links:            user.links,
      isVerifiedSeller: user.isVerifiedSeller,
      isEmailVerified:  user.isEmailVerified,
      isPhoneVerified:  user.isPhoneVerified,
    });

    respond(res, 200, {
      ...generateTokenPayload(user),
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

// ─────────────────────────────────────────────────────────────
// VERIFY EMAIL
// POST /api/auth/verify-email   { token }
// ─────────────────────────────────────────────────────────────
async function verifyEmail(req, res, next) {
  try {
    const { token } = req.body;
    if (!token) return next(new AppError("Verification token is required.", 400));

    const user = await User.findOne({
      emailVerifyToken: hashToken(token),
      emailVerifyExpires: { $gt: new Date() },
    }).select("+emailVerifyToken +emailVerifyExpires");

    if (!user) {
      return next(new AppError("This verification link is invalid or has expired.", 400));
    }

    user.isEmailVerified = true;
    user.emailVerifyToken = undefined;
    user.emailVerifyExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      success: true,
      message: "Email verified successfully. You can now log in.",
    });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
// RESEND VERIFICATION EMAIL
// POST /api/auth/resend-verification   { email }
// ─────────────────────────────────────────────────────────────
async function resendVerificationEmail(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) return next(new AppError("Email is required.", 400));

    const user = await User.findOne({ email: email.toLowerCase() });
    
    // Generic message to avoid email enumeration
    const genericMessage = "If an unverified account with that email exists, a new verification link has been sent.";

    if (!user || user.isEmailVerified) {
      return res.status(200).json({ success: true, message: genericMessage });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    user.emailVerifyToken = hashToken(rawToken);
    user.emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    try {
      await sendEmailVerification(user, rawToken);
    } catch (mailErr) {
      console.error("⚠️  Email verification failed to send:", mailErr.message);
    }

    const payload = { success: true, message: genericMessage };

    if (env.IS_DEVELOPMENT) {
      payload.devVerifyToken = rawToken;
      payload.devVerifyUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/verify?token=${rawToken}`;
    }

    return res.status(200).json(payload);
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
// GOOGLE LOGIN
// POST /api/auth/google   { credential }
// Receives the Google ID token from the frontend GSI button,
// verifies it server-side, and finds-or-creates the user.
// ─────────────────────────────────────────────────────────────
async function googleLogin(req, res, next) {
  try {
    const { credential } = req.body;
    if (!credential) {
      return next(new AppError("Google credential is required.", 400));
    }

    if (!env.GOOGLE_CLIENT_ID) {
      return next(new AppError("Google login is not configured on this server.", 501));
    }

    // Verify the ID token with Google
    const { OAuth2Client } = require("google-auth-library");
    const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);

    let ticket;
    try {
      ticket = await client.verifyIdToken({
        idToken: credential,
        audience: env.GOOGLE_CLIENT_ID,
      });
    } catch (verifyErr) {
      console.error("⚠️  Google token verification failed:", verifyErr.message);
      return next(new AppError("Invalid Google credential. Please try again.", 401));
    }

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    if (!email) {
      return next(new AppError("Google account does not have an email address.", 400));
    }

    // ── Find or create the user ──────────────────────────────
    let user = await User.findOne({
      $or: [{ googleId }, { email: email.toLowerCase() }],
    }).select("+password");

    if (user) {
      // Existing user — link Google if not already linked
      if (!user.googleId) {
        user.googleId = googleId;
      }
      // Update avatar if user doesn't have one
      if (picture && (!user.avatar || !user.avatar.url)) {
        user.avatar = { url: picture, publicId: "" };
      }
    } else {
      // New user — create account (no password needed)
      user = new User({
        name: name || email.split("@")[0],
        email: email.toLowerCase().trim(),
        phone: "",          // Will be prompted to complete later
        googleId,
        isEmailVerified: true, // Google already verified the email
        avatar: picture ? { url: picture, publicId: "" } : undefined,
        role: "user",
        city: "",
        address: "",
      });
    }

    // Account status checks
    if (user.isBanned) {
      return next(new AppError("Your account has been suspended. Contact support.", 403));
    }
    if (user.isActive === false) {
      return next(new AppError("Your account is inactive. Contact support.", 403));
    }

    // Generate tokens
    const accessToken = signAccessToken({ id: user._id || undefined, role: user.role });
    const refreshToken = signRefreshToken({ id: user._id || undefined });

    // Save (creates new doc or updates existing)
    user.refreshToken = hashToken(refreshToken);
    user.lastLoginAt = new Date();
    user.lastLoginIp = req.ip;
    user.isEmailVerified = true; // Google always verifies email
    await user.save({ validateBeforeSave: false });

    // If this was a new user, re-sign tokens with the real _id
    const finalAccessToken = user._id
      ? signAccessToken({ id: user._id, role: user.role })
      : accessToken;
    const finalRefreshToken = user._id
      ? signRefreshToken({ id: user._id })
      : refreshToken;

    if (user._id && finalRefreshToken !== refreshToken) {
      user.refreshToken = hashToken(finalRefreshToken);
      await user.save({ validateBeforeSave: false });
    }

    setRefreshCookie(res, finalRefreshToken);

    respond(res, 200, {
      accessToken: finalAccessToken,
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
        bio: user.bio,
        whatsapp: user.whatsapp,
        links: user.links,
      },
    }, "Logged in with Google successfully");

  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
// FACEBOOK LOGIN
// POST /api/auth/facebook   { accessToken }
// Receives the user access token from the frontend's FB.login() call,
// verifies it server-side against our own app (so a token minted for a
// different Facebook app can't be replayed here), and finds-or-creates
// the user. Mirrors googleLogin exactly — same shape, same
// phone-completion-later behavior, same account-linking-by-email.
// ─────────────────────────────────────────────────────────────
async function facebookLogin(req, res, next) {
  try {
    const { accessToken: fbToken } = req.body;
    if (!fbToken) {
      return next(new AppError("Facebook access token is required.", 400));
    }

    if (!env.FACEBOOK_APP_ID || !env.FACEBOOK_APP_SECRET) {
      return next(new AppError("Facebook login is not configured on this server.", 501));
    }

    // Verify the token was actually issued for OUR app before trusting it —
    // without this, any valid Facebook token from any app could be replayed
    // here to impersonate whichever user it belongs to.
    const appAccessToken = `${env.FACEBOOK_APP_ID}|${env.FACEBOOK_APP_SECRET}`;
    let debugData;
    try {
      const debugRes = await fetch(
        `https://graph.facebook.com/debug_token?input_token=${encodeURIComponent(fbToken)}&access_token=${encodeURIComponent(appAccessToken)}`
      );
      const debugJson = await debugRes.json();
      debugData = debugJson.data;
    } catch (verifyErr) {
      console.error("⚠️  Facebook token verification request failed:", verifyErr.message);
      return next(new AppError("Couldn't verify the Facebook credential. Please try again.", 401));
    }

    if (!debugData?.is_valid || String(debugData.app_id) !== String(env.FACEBOOK_APP_ID)) {
      return next(new AppError("Invalid Facebook credential. Please try again.", 401));
    }

    const facebookId = debugData.user_id;

    // Now fetch the actual profile using the user's own token.
    const profileRes = await fetch(
      `https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${encodeURIComponent(fbToken)}`
    );
    const profile = await profileRes.json();

    if (!profile.email) {
      return next(new AppError("Your Facebook account needs a verified email address to sign in this way.", 400));
    }

    const email = String(profile.email).toLowerCase().trim();
    const name = profile.name || email.split("@")[0];
    const picture = profile.picture?.data?.url;

    // ── Find or create the user ──────────────────────────────
    let user = await User.findOne({
      $or: [{ facebookId }, { email }],
    }).select("+password");

    if (user) {
      if (!user.facebookId) {
        user.facebookId = facebookId;
      }
      if (picture && (!user.avatar || !user.avatar.url)) {
        user.avatar = { url: picture, publicId: "" };
      }
    } else {
      user = new User({
        name,
        email,
        phone: "",          // Will be prompted to complete later
        facebookId,
        isEmailVerified: true, // Facebook already verified the email
        avatar: picture ? { url: picture, publicId: "" } : undefined,
        role: "user",
        city: "",
        address: "",
      });
    }

    if (user.isBanned) {
      return next(new AppError("Your account has been suspended. Contact support.", 403));
    }
    if (user.isActive === false) {
      return next(new AppError("Your account is inactive. Contact support.", 403));
    }

    const accessToken = signAccessToken({ id: user._id || undefined, role: user.role });
    const refreshToken = signRefreshToken({ id: user._id || undefined });

    user.refreshToken = hashToken(refreshToken);
    user.lastLoginAt = new Date();
    user.lastLoginIp = req.ip;
    user.isEmailVerified = true;
    await user.save({ validateBeforeSave: false });

    const finalAccessToken = user._id
      ? signAccessToken({ id: user._id, role: user.role })
      : accessToken;
    const finalRefreshToken = user._id
      ? signRefreshToken({ id: user._id })
      : refreshToken;

    if (user._id && finalRefreshToken !== refreshToken) {
      user.refreshToken = hashToken(finalRefreshToken);
      await user.save({ validateBeforeSave: false });
    }

    setRefreshCookie(res, finalRefreshToken);

    respond(res, 200, {
      accessToken: finalAccessToken,
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
        bio: user.bio,
        whatsapp: user.whatsapp,
        links: user.links,
      },
    }, "Logged in with Facebook successfully");

  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, logout, me, refresh, forgotPassword, resetPassword, verifyEmail, resendVerificationEmail, googleLogin, facebookLogin };
