/**
 * Auth Routes
 * POST /api/auth/register
 * POST /api/auth/login
 * POST /api/auth/logout
 * GET  /api/auth/me
 * POST /api/auth/refresh
 */

const express      = require("express");
const rateLimit    = require("express-rate-limit");
const { body }     = require("express-validator");
const {
  register, login, logout, me, refresh, forgotPassword, resetPassword,
} = require("../controllers/auth.controller");
const { protect }  = require("../middleware/auth.middleware");
const { env }      = require("../config/env");

const router = express.Router();

// Strict rate limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max:      env.AUTH_RATE_LIMIT_MAX,
  message: {
    success: false,
    message: "Too many login attempts. Please try again in 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders:   false,
});

// ── Validation rules ──────────────────────────────────────────

const registerValidation = [
  body("name")
    .trim()
    .notEmpty().withMessage("Name is required")
    .isLength({ min: 2, max: 60 }).withMessage("Name must be 2–60 characters"),

  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Please enter a valid email address")
    .normalizeEmail(),

  body("phone")
    .trim()
    .notEmpty().withMessage("Phone number is required")
    .matches(/^(\+92|0092|0)?[3][0-9]{9}$/).withMessage("Enter a valid Pakistani mobile number (e.g. 03001234567)"),

  body("password")
    .notEmpty().withMessage("Password is required")
    .isLength({ min: 8 }).withMessage("Password must be at least 8 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage("Password must contain uppercase, lowercase, and a number"),

  body("city")
    .trim()
    .notEmpty().withMessage("City is required"),

  body("address")
    .trim()
    .notEmpty().withMessage("Address is required")
    .isLength({ min: 5, max: 200 }).withMessage("Address must be 5–200 characters"),

  body("role")
    .optional()
    .isIn(["user", "dealer"]).withMessage("Role must be 'user' or 'dealer'"),
];

const loginValidation = [
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Please enter a valid email address")
    // Must match register's normalization (Gmail dot/sub-address stripping),
    // otherwise an account registered as e.g. "ab.cd@gmail.com" → stored
    // "abcd@gmail.com" can never be found at login. See also forgot-password.
    .normalizeEmail(),

  body("password")
    .notEmpty().withMessage("Password is required"),
];

const forgotPasswordValidation = [
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Please enter a valid email address")
    .normalizeEmail(),
];

const resetPasswordValidation = [
  body("token")
    .notEmpty().withMessage("Reset token is required"),

  body("password")
    .notEmpty().withMessage("Password is required")
    .isLength({ min: 8 }).withMessage("Password must be at least 8 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage("Password must contain uppercase, lowercase, and a number"),
];

// ── Routes ────────────────────────────────────────────────────

router.post("/register",        authLimiter, registerValidation,       register);
router.post("/login",           authLimiter, loginValidation,          login);
router.post("/forgot-password", authLimiter, forgotPasswordValidation, forgotPassword);
router.post("/reset-password",  authLimiter, resetPasswordValidation,  resetPassword);
router.post("/logout",          protect,                               logout);
router.get( "/me",              protect,                               me);
router.post("/refresh",                                                refresh);

module.exports = router;
