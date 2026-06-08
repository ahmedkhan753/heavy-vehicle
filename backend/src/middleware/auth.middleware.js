/**
 * Auth Middleware
 * ───────────────
 * protect     → requires valid JWT, attaches req.user
 * optionalAuth→ attaches req.user if token present, but doesn't block
 * restrictTo  → role-based access control
 */

const User                      = require("../models/User");
const { verifyAccessToken }     = require("../utils/jwt");
const { AppError }              = require("./error.middleware");

/**
 * Protect route — requires a valid access token
 * Token can be in:
 *   1. Authorization: Bearer <token>  (primary)
 *   2. Cookie: hw_access_token        (fallback)
 */
async function protect(req, res, next) {
  try {
    let token = null;

    // 1. Check Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // 2. Fallback: check cookie
    if (!token && req.cookies?.hw_access_token) {
      token = req.cookies.hw_access_token;
    }

    if (!token) {
      return next(new AppError("You are not logged in. Please login to continue.", 401));
    }

    // Verify token
    const decoded = verifyAccessToken(token);

    // Check user still exists and isn't banned
    const user = await User.findById(decoded.id).select("+refreshToken");

    if (!user) {
      return next(new AppError("The account belonging to this token no longer exists.", 401));
    }

    if (user.isBanned) {
      return next(new AppError("Your account has been suspended. Please contact support.", 403));
    }

    if (!user.isActive) {
      return next(new AppError("Your account is inactive. Please contact support.", 403));
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Optional auth — attaches user if token is valid, but doesn't block
 * Used for routes where auth enhances the response but isn't required
 * e.g. vehicle listing — logged-in users see if they've saved the ad
 */
async function optionalAuth(req, res, next) {
  try {
    let token = null;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token && req.cookies?.hw_access_token) {
      token = req.cookies.hw_access_token;
    }

    if (!token) return next(); // No token — continue without user

    const decoded = verifyAccessToken(token);
    const user    = await User.findById(decoded.id);

    if (user && !user.isBanned && user.isActive) {
      req.user = user;
    }

    next();
  } catch {
    // Token invalid — just continue without user, don't block
    next();
  }
}

/**
 * Restrict to specific roles
 * Usage: router.delete("/...", protect, restrictTo("admin"), handler)
 * @param {...string} roles - Allowed roles
 */
function restrictTo(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError("You are not logged in.", 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action.", 403)
      );
    }

    next();
  };
}

/**
 * Verify the user owns the resource
 * Attaches ownership check — used for edit/delete vehicle
 * @param {string} ownerField - Field name in the document that holds owner ID (default: "sellerId")
 */
function isOwner(ownerField = "sellerId") {
  return (req, res, next) => {
    if (!req.resource) {
      return next(new AppError("Resource not found for ownership check.", 404));
    }

    const ownerId = req.resource[ownerField]?.toString();
    const userId  = req.user._id?.toString();

    if (ownerId !== userId && req.user.role !== "admin") {
      return next(
        new AppError("You can only modify your own listings.", 403)
      );
    }

    next();
  };
}

module.exports = { protect, optionalAuth, restrictTo, isOwner };
