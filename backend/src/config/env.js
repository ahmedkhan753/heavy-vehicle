/**
 * Environment Variable Validator
 * ────────────────────────────────
 * Runs at server startup. If any required variable is missing,
 * the server refuses to start — preventing silent failures in production.
 */

const REQUIRED_VARS = [
  "MONGODB_URI",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
];

function validateEnv() {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error("\n❌ MISSING ENVIRONMENT VARIABLES:");
    missing.forEach((key) => console.error(`   - ${key}`));
    console.error("\nAdd these to your .env file and restart.\n");
    process.exit(1);
  }

  // Warn about insecure defaults in production
  if (process.env.NODE_ENV === "production") {
    if (process.env.JWT_ACCESS_SECRET.length < 32) {
      console.error("❌ JWT_ACCESS_SECRET is too short for production. Use 64+ characters.");
      process.exit(1);
    }
    if (process.env.JWT_REFRESH_SECRET.length < 32) {
      console.error("❌ JWT_REFRESH_SECRET is too short for production. Use 64+ characters.");
      process.exit(1);
    }
  }

  console.log("✅ Environment variables validated");
}

module.exports = {
  validateEnv,
  env: {
    PORT:               parseInt(process.env.PORT) || 5000,
    NODE_ENV:           process.env.NODE_ENV || "development",
    IS_PRODUCTION:      process.env.NODE_ENV === "production",
    IS_DEVELOPMENT:     process.env.NODE_ENV === "development",
    ALLOWED_ORIGINS:    (process.env.ALLOWED_ORIGINS || "http://localhost:3000").split(","),

    // MongoDB
    MONGODB_URI:        process.env.MONGODB_URI,
    MONGODB_DB_NAME:    process.env.MONGODB_DB_NAME || "heavywheels",

    // JWT
    JWT_ACCESS_SECRET:  process.env.JWT_ACCESS_SECRET,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    JWT_ACCESS_EXPIRES: process.env.JWT_ACCESS_EXPIRES_IN  || "15m",
    JWT_REFRESH_EXPIRES:process.env.JWT_REFRESH_EXPIRES_IN || "30d",
    COOKIE_DOMAIN:      process.env.COOKIE_DOMAIN || "localhost",

    // Public URL of the frontend app (for building gateway redirect/cancel
    // URLs). Falls back to the first allowed origin.
    PUBLIC_APP_URL: process.env.PUBLIC_APP_URL ||
      (process.env.ALLOWED_ORIGINS || "http://localhost:3000").split(",")[0],

    // Safepay (card gateway) — OPTIONAL. When these are absent the card rail
    // stays dark (cardEnabled:false) and only the manual flow is offered, so
    // the server boots fine without them. Default to sandbox.
    SAFEPAY_ENVIRONMENT:    process.env.SAFEPAY_ENVIRONMENT || "sandbox",
    SAFEPAY_API_KEY:        process.env.SAFEPAY_API_KEY || "",
    SAFEPAY_SECRET_KEY:     process.env.SAFEPAY_SECRET_KEY || "",
    SAFEPAY_WEBHOOK_SECRET: process.env.SAFEPAY_WEBHOOK_SECRET || "",

    // Cloudinary
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY:    process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
    CLOUDINARY_FOLDER:     process.env.CLOUDINARY_FOLDER || "heavywheels/vehicles",
    MAX_IMAGE_SIZE_BYTES:  parseInt(process.env.MAX_IMAGE_SIZE_BYTES) || 8388608,
    MAX_IMAGES_PER_AD:     parseInt(process.env.MAX_IMAGES_PER_AD)   || 15,

    // Translation (Groq — OpenAI-compatible, free tier). When the key is
    // absent, translation is skipped gracefully and listings stay single-language.
    GROQ_API_KEY:    process.env.GROQ_API_KEY || "",
    GROQ_MODEL:      process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
    TRANSLATION_ENABLED: process.env.TRANSLATION_ENABLED !== "false",

    // Email
    EMAIL_SERVICE: process.env.EMAIL_SERVICE || "gmail",
    EMAIL_USER:    process.env.EMAIL_USER,
    EMAIL_PASS:    process.env.EMAIL_PASS,
    EMAIL_FROM:    process.env.EMAIL_FROM || "HeavyWheels <noreply@heavywheels.pk>",

    // Rate limiting
    RATE_LIMIT_WINDOW_MS:    parseInt(process.env.RATE_LIMIT_WINDOW_MS)    || 900000,
    RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    AUTH_RATE_LIMIT_MAX:     parseInt(process.env.AUTH_RATE_LIMIT_MAX)     || 10,

    // Google OAuth (optional — button stays hidden when unset)
    GOOGLE_CLIENT_ID:     process.env.GOOGLE_CLIENT_ID || "",
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "",

    // Admin
    ADMIN_EMAIL:    process.env.ADMIN_EMAIL,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    ADMIN_NAME:     process.env.ADMIN_NAME || "Admin",
  },
};
