/**
 * Upload Controller
 * ──────────────────
 * uploadImage   → POST /api/upload/image   (single)
 * uploadImages  → POST /api/upload/images  (multiple)
 * deleteImage   → DELETE /api/upload/delete
 */

const { uploadToCloudinary, deleteFromCloudinary } = require("../config/cloudinary");
const { AppError } = require("../middleware/error.middleware");
const { env }      = require("../config/env");

// ── Standard response helper ──────────────────────────────────
const respond = (res, statusCode, data, message = "Success") =>
  res.status(statusCode).json({ success: true, message, data });

// ─────────────────────────────────────────────────────────────
// UPLOAD SINGLE IMAGE
// POST /api/upload/image
// Requires: protect middleware + handleSingleUpload middleware
// ─────────────────────────────────────────────────────────────
async function uploadImage(req, res, next) {
  try {
    if (!req.file) {
      return next(new AppError("No image file provided.", 400));
    }

    // File is in memory buffer from multer
    const result = await uploadToCloudinary(req.file.buffer, {
      folder: `${env.CLOUDINARY_FOLDER}/${req.user._id}`,
    });

    respond(res, 201, {
      url:       result.secure_url,
      publicId:  result.public_id,
      width:     result.width,
      height:    result.height,
      format:    result.format,
      size:      result.bytes,
    }, "Image uploaded successfully");

  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
// UPLOAD MULTIPLE IMAGES
// POST /api/upload/images
// Requires: protect + handleMultipleUpload middleware
// ─────────────────────────────────────────────────────────────
async function uploadImages(req, res, next) {
  try {
    if (!req.files || req.files.length === 0) {
      return next(new AppError("No image files provided.", 400));
    }

    if (req.files.length > env.MAX_IMAGES_PER_AD) {
      return next(
        new AppError(`Maximum ${env.MAX_IMAGES_PER_AD} images allowed per listing.`, 400)
      );
    }

    // Upload all images to Cloudinary in parallel
    const uploadPromises = req.files.map((file) =>
      uploadToCloudinary(file.buffer, {
        folder: `${env.CLOUDINARY_FOLDER}/${req.user._id}`,
      })
    );

    const results = await Promise.all(uploadPromises);

    const images = results.map((result) => ({
      url:      result.secure_url,
      publicId: result.public_id,
      width:    result.width,
      height:   result.height,
    }));

    respond(res, 201, { images, count: images.length }, "Images uploaded successfully");

  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
// DELETE IMAGE
// DELETE /api/upload/delete
// Body: { publicId: "heavywheels/vehicles/..." }
// Requires: protect middleware
// ─────────────────────────────────────────────────────────────
async function deleteImage(req, res, next) {
  try {
    const { publicId } = req.body;

    if (!publicId) {
      return next(new AppError("publicId is required.", 400));
    }

    // Security: only allow deleting from the heavywheels folder
    if (!publicId.startsWith("heavywheels/")) {
      return next(new AppError("Invalid publicId.", 403));
    }

    await deleteFromCloudinary(publicId);

    res.status(200).json({
      success: true,
      message: "Image deleted successfully",
      data:    null,
    });

  } catch (err) {
    next(err);
  }
}

module.exports = { uploadImage, uploadImages, deleteImage };
