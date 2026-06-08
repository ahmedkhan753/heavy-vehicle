/**
 * Cloudinary Configuration
 * ─────────────────────────
 * Sets up the Cloudinary SDK and exports a configured instance.
 * Also exports a helper for deleting images by public ID.
 */

const cloudinary = require("cloudinary").v2;
const { env }    = require("./env");

// Configure Cloudinary SDK with credentials from .env
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key:    env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure:     true, // Always use HTTPS URLs
});

/**
 * Upload a file buffer to Cloudinary
 * @param {Buffer} fileBuffer - The image buffer from multer
 * @param {Object} options    - Cloudinary upload options
 * @returns {Promise<Object>} - Cloudinary upload result
 */
function uploadToCloudinary(fileBuffer, options = {}) {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder:         env.CLOUDINARY_FOLDER,
      resource_type:  "image",
      // Auto-optimize: convert to WebP, auto quality
      format:         "webp",
      quality:        "auto:good",
      // Auto-resize: max 1200px wide, maintain aspect ratio
      transformation: [
        { width: 1200, height: 900, crop: "limit" },
        { fetch_format: "auto", quality: "auto" },
      ],
      ...options,
    };

    // Upload from buffer using upload_stream
    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          reject(new Error(`Cloudinary upload failed: ${error.message}`));
        } else {
          resolve(result);
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
}

/**
 * Delete an image from Cloudinary by its public ID
 * @param {string} publicId - The Cloudinary public ID of the image
 * @returns {Promise<Object>} - Deletion result
 */
async function deleteFromCloudinary(publicId) {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    throw new Error(`Cloudinary delete failed: ${error.message}`);
  }
}

/**
 * Generate a thumbnail URL for a given public ID
 * @param {string} publicId
 * @param {number} width
 * @param {number} height
 */
function getThumbnailUrl(publicId, width = 400, height = 300) {
  return cloudinary.url(publicId, {
    width,
    height,
    crop:         "fill",
    quality:      "auto",
    fetch_format: "auto",
  });
}

module.exports = {
  cloudinary,
  uploadToCloudinary,
  deleteFromCloudinary,
  getThumbnailUrl,
};
