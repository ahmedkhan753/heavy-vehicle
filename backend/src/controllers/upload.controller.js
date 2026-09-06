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

    // Uploads land in `${CLOUDINARY_FOLDER}/${req.user._id}/...` (see
    // uploadImage/uploadImages above), so the owner is encoded in the path.
    // Checking only the "heavywheels/" prefix — as this did — let any signed-in
    // user delete any other seller's photos: public IDs are visible in every
    // listing's image URLs, and Cloudinary is the only copy. Admins keep the
    // ability to remove anything, for moderation.
    const expectedPrefix = `${env.CLOUDINARY_FOLDER}/${req.user._id}/`;

    if (req.user.role !== "admin" && !publicId.startsWith(expectedPrefix)) {
      return next(new AppError("You can only delete your own images.", 403));
    }

    // Admins are still confined to this app's own folder tree, so a stray
    // call can never reach unrelated assets in the Cloudinary account.
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
