/**
 * Upload Routes
 * POST   /api/upload/image    → single image
 * POST   /api/upload/images   → multiple images
 * DELETE /api/upload/delete   → delete image
 */

const express  = require("express");
const { uploadImage, uploadImages, deleteImage } = require("../controllers/upload.controller");
const { protect }  = require("../middleware/auth.middleware");
const { handleSingleUpload, handleMultipleUpload } = require("../middleware/upload.middleware");

const router = express.Router();

// All upload routes require authentication
router.post("/image",   protect, handleSingleUpload,   uploadImage);
router.post("/images",  protect, handleMultipleUpload,  uploadImages);
router.delete("/delete",protect,                        deleteImage);

module.exports = router;
