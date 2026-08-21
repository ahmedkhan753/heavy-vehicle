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

    // ── Destructive-work guards ───────────────────────────────
    // The hourly maintenance sweep permanently deletes expired listings and
    // their Cloudinary images, and emails real sellers. That must only ever
    // run from the real deployment — never from a laptop that happens to be
    // pointed at the same database. Opt in explicitly to run it anywhere
    // else (e.g. RUN_MAINTENANCE_SWEEPS=true against a scratch database).
    RUN_MAINTENANCE_SWEEPS:
      process.env.RUN_MAINTENANCE_SWEEPS === "true" ||
      (process.env.NODE_ENV === "production" && process.env.RUN_MAINTENANCE_SWEEPS !== "false"),

    // Same reasoning for outbound mail: a dev run should not be able to send
    // to real users' inboxes just because it inherited production SMTP
    // credentials from a copied .env.
    ALLOW_OUTBOUND_EMAIL:
      process.env.ALLOW_OUTBOUND_EMAIL === "true" ||
      (process.env.NODE_ENV === "production" && process.env.ALLOW_OUTBOUND_EMAIL !== "false"),

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

    // A "Secure" cookie is silently dropped by the browser on a plain-HTTP
    // origin, so basing it on NODE_ENV alone breaks sessions on any
    // production deployment that isn't (yet) behind HTTPS — e.g. a bare
    // VPS IP. Derive it from the actual scheme of the public app URL
    // instead, with an explicit env override for edge cases.
    COOKIE_SECURE: process.env.COOKIE_SECURE !== undefined
      ? process.env.COOKIE_SECURE === "true"
      : (process.env.PUBLIC_APP_URL ||
         (process.env.ALLOWED_ORIGINS || "http://localhost:3000").split(",")[0]
        ).startsWith("https://"),

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
    GROQ_MODEL:      process.env.GROQ_MODEL || "openai/gpt-oss-120b",
    TRANSLATION_ENABLED: process.env.TRANSLATION_ENABLED !== "false",

    // Email
    EMAIL_SERVICE: process.env.EMAIL_SERVICE || "gmail",
    EMAIL_USER:    process.env.EMAIL_USER,
    EMAIL_PASS:    process.env.EMAIL_PASS,
    EMAIL_FROM:    process.env.EMAIL_FROM || "HeavyWheels <noreply@heavywheels.pk>",

    // Rate limiting
    RATE_LIMIT_WINDOW_MS:    parseInt(process.env.RATE_LIMIT_WINDOW_MS)    || 900000,
    // 100 was sized for a handful of requests per visit, but a single active
    // session (browsing + the dashboard/admin panel, each screen firing
    // several API calls) legitimately exceeds that within 15 minutes even
    // for one honest user — raised accordingly.
    RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 400,
    AUTH_RATE_LIMIT_MAX:     parseInt(process.env.AUTH_RATE_LIMIT_MAX)     || 10,

    // Google OAuth (optional — button stays hidden when unset)
    GOOGLE_CLIENT_ID:     process.env.GOOGLE_CLIENT_ID || "",
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "",

    // Facebook Login (optional — same pattern as Google, button stays
    // hidden until a real Meta app's credentials are set).
    FACEBOOK_APP_ID:     process.env.FACEBOOK_APP_ID || "",
    FACEBOOK_APP_SECRET: process.env.FACEBOOK_APP_SECRET || "",

    // Admin
    ADMIN_EMAIL:    process.env.ADMIN_EMAIL,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    ADMIN_NAME:     process.env.ADMIN_NAME || "Admin",
  },
};
