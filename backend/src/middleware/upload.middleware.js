/**
 * Upload Middleware (Multer)
 * ──────────────────────────
 * Uses memory storage — files are kept in buffer and
 * sent directly to Cloudinary without saving to disk.
 */

const multer   = require("multer");
const { env }  = require("../config/env");
const { AppError } = require("./error.middleware");

// Allowed MIME types
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Memory storage — no disk writes
const storage = multer.memoryStorage();

// File filter — only allow images
function fileFilter(req, file, cb) {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        "Invalid file type. Only JPG, PNG, and WebP images are allowed.",
        400
      ),
      false
    );
  }
}

// Single image upload
const uploadSingle = multer({
  storage,
  fileFilter,
  limits: { fileSize: env.MAX_IMAGE_SIZE_BYTES },
}).single("image");

// Multiple images upload (up to MAX_IMAGES_PER_AD)
const uploadMultiple = multer({
  storage,
  fileFilter,
  limits: {
    fileSize:  env.MAX_IMAGE_SIZE_BYTES,
    files:     env.MAX_IMAGES_PER_AD,
  },
}).array("images", env.MAX_IMAGES_PER_AD);

// Wrap multer to handle errors consistently
function handleSingleUpload(req, res, next) {
  uploadSingle(req, res, (err) => {
    if (err) return next(err);
    next();
  });
}

function handleMultipleUpload(req, res, next) {
  uploadMultiple(req, res, (err) => {
    if (err) return next(err);
    next();
  });
}

module.exports = { handleSingleUpload, handleMultipleUpload };
