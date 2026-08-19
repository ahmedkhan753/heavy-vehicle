/**
 * JWT Utilities
 * ──────────────
 * All token operations in one place.
 * Access tokens: short-lived (15m), sent in Authorization header
 * Refresh tokens: long-lived (30d), stored in HTTP-only cookie
 */

const jwt    = require("jsonwebtoken");
const crypto = require("crypto");
const { env } = require("../config/env");

/**
 * Hash a token (refresh / reset) with SHA-256 for storage at rest.
 * We never store the raw token in the database — only this digest —
 * so a database leak can't be used to hijack sessions.
 * @param {string} token
 * @returns {string} hex digest
 */
function hashToken(token) {
  return crypto.createHash("sha256").update(String(token)).digest("hex");
}

/**
 * Sign an access token
 * @param {Object} payload - { id, role }
 * @returns {string} JWT access token
 */
function signAccessToken(payload) {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES,
    issuer:    "heavywheels",
    audience:  "heavywheels-client",
  });
}

/**
 * Sign a refresh token
 * @param {Object} payload - { id }
 * @returns {string} JWT refresh token
 */
function signRefreshToken(payload) {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES,
    issuer:    "heavywheels",
    audience:  "heavywheels-client",
  });
}

/**
 * Verify an access token
 * @param {string} token
 * @returns {Object} Decoded payload
 * @throws {JsonWebTokenError|TokenExpiredError}
 */
function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET, {
    issuer:   "heavywheels",
    audience: "heavywheels-client",
  });
}

/**
 * Verify a refresh token
 * @param {string} token
 * @returns {Object} Decoded payload
 */
function verifyRefreshToken(token) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET, {
    issuer:   "heavywheels",
    audience: "heavywheels-client",
  });
}

// The `Domain` cookie attribute must be a registrable domain name — browsers
// reject it outright when set to a bare IP address, so on an IP-based
// deployment we omit it entirely and let the cookie default to host-only.
const IS_IP_ADDRESS = /^\d{1,3}(\.\d{1,3}){3}$/.test(env.COOKIE_DOMAIN);

/**
 * Set refresh token as HTTP-only cookie
 * @param {Object} res      - Express response object
 * @param {string} token    - Refresh token string
 */
function setRefreshCookie(res, token) {
  const MS_30_DAYS = 30 * 24 * 60 * 60 * 1000;

  res.cookie("hw_refresh_token", token, {
    httpOnly: true,                          // Not accessible via JS
    secure:   env.COOKIE_SECURE,             // HTTPS only when actually served over HTTPS
    sameSite: env.COOKIE_SECURE ? "strict" : "lax",
    maxAge:   MS_30_DAYS,
    ...(IS_IP_ADDRESS ? {} : { domain: env.COOKIE_DOMAIN }),
    path:     "/",
  });
}

/**
 * Clear the refresh token cookie
 * @param {Object} res - Express response object
 */
function clearRefreshCookie(res) {
  res.cookie("hw_refresh_token", "", {
    httpOnly: true,
    secure:   env.COOKIE_SECURE,
    sameSite: env.COOKIE_SECURE ? "strict" : "lax",
    maxAge:   0,
    ...(IS_IP_ADDRESS ? {} : { domain: env.COOKIE_DOMAIN }),
    path:     "/",
  });
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  setRefreshCookie,
  clearRefreshCookie,
  hashToken,
};
