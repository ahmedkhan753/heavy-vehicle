/**
 * Global Error Handler Middleware
 * ─────────────────────────────────
 * Catches all errors thrown in route handlers via next(err).
 * Returns consistent { success, message, errors, statusCode } shape.
 * Never leaks stack traces in production.
 */

const { env } = require("../config/env");

function errorMiddleware(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message    = err.message    || "Internal Server Error";
  let errors     = err.errors     || [];

  // ── Mongoose: Validation Error ────────────────────────────
  if (err.name === "ValidationError") {
    statusCode = 422;
    message    = "Validation failed";
    errors     = Object.values(err.errors).map((e) => ({
      field:   e.path,
      message: e.message,
    }));
  }

  // ── Mongoose: Duplicate Key (e.g. email already exists) ───
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || "field";
    message    = `${capitalise(field)} already exists`;
    errors     = [{ field, message }];
  }

  // ── Mongoose: Invalid ObjectId ────────────────────────────
  if (err.name === "CastError" && err.kind === "ObjectId") {
    statusCode = 400;
    message    = "Invalid ID format";
  }

  // ── JWT Errors ────────────────────────────────────────────
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message    = "Invalid token. Please login again.";
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message    = "Token has expired. Please login again.";
  }

  // ── Multer: File Too Large ────────────────────────────────
  if (err.code === "LIMIT_FILE_SIZE") {
    statusCode = 400;
    message    = "File is too large. Maximum size is 8MB.";
  }

  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    statusCode = 400;
    message    = "Unexpected file field in upload.";
  }

  // ── Log error in development ──────────────────────────────
  if (env.IS_DEVELOPMENT) {
    console.error("\n❌ ERROR:", {
      statusCode,
      message,
      stack: err.stack,
    });
  } else {
    // Production: only log 500s
    if (statusCode >= 500) {
      console.error("❌ SERVER ERROR:", err.message);
    }
  }

  // ── Send response ─────────────────────────────────────────
  res.status(statusCode).json({
    success:    false,
    message,
    code:       err.code && typeof err.code === "string" ? err.code : undefined,
    errors:     errors.length > 0 ? errors : undefined,
    // Only include stack trace in development
    stack:      env.IS_DEVELOPMENT ? err.stack : undefined,
  });
}

// ── Helper: Create AppError ───────────────────────────────────
class AppError extends Error {
  // `code` is an optional stable identifier (e.g. "PLAN_LIMIT_REACHED") for
  // errors the UI needs to react to specifically rather than just display.
  // Matching on the human message would break the moment it's reworded or
  // translated.
  constructor(message, statusCode = 500, errors = [], code = undefined) {
    super(message);
    this.statusCode = statusCode;
    this.errors     = errors;
    this.code       = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

function capitalise(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

module.exports = errorMiddleware;
module.exports.AppError = AppError;
