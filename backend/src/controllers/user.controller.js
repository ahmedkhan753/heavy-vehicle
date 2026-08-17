/**
 * User Controller
 * ────────────────
 * getProfile    → GET    /api/users/profile
 * updateProfile → PUT    /api/users/profile
 * getSavedAds   → GET    /api/users/saved
 * saveAd        → POST   /api/users/saved/:vehicleId
 * unsaveAd      → DELETE /api/users/saved/:vehicleId
 * changePassword→ PUT    /api/users/password
 */

const { validationResult } = require("express-validator");
const User                 = require("../models/User");
const Vehicle              = require("../models/Vehicle");
const Part                 = require("../models/Part");
const { uploadToCloudinary, deleteFromCloudinary } = require("../config/cloudinary");
const { AppError }         = require("../middleware/error.middleware");
const { env }              = require("../config/env");

const respond = (res, statusCode, data, message = "Success") =>
  res.status(statusCode).json({ success: true, message, data });

// ─────────────────────────────────────────────────────────────
// GET PROFILE
// GET /api/users/profile
// Requires: protect
// ─────────────────────────────────────────────────────────────
async function getProfile(req, res, next) {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path:   "savedAds",
        select: "title shortTitle price priceDisplay year city condition make type images createdAt status",
        match:  { status: "active" }, // Only return active saved listings
      });

    if (!user) return next(new AppError("User not found.", 404));

    // Live count of listings actually visible on the site (status "active"
    // AND not past expiresAt). Deleted, sold, expired or pending ads never
    // count — unlike totalAds, which is a lifetime counter.
    const now = new Date();
    const [activeVehicles, activeParts] = await Promise.all([
      Vehicle.countDocuments({ sellerId: user._id, status: "active", expiresAt: { $gt: now } }),
      Part.countDocuments({ sellerId: user._id, status: "active", expiresAt: { $gt: now } }),
    ]);

    respond(res, 200, {
      _id:              user._id,
      name:             user.name,
      email:            user.email,
      phone:            user.phone,
      city:             user.city,
      address:          user.address,
      role:             user.role,
      avatar:           user.avatar,
      isVerifiedSeller: user.isVerifiedSeller,
      isEmailVerified:  user.isEmailVerified,
      isPhoneVerified:  user.isPhoneVerified,
      totalAds:         user.totalAds,
      activeAds:        activeVehicles + activeParts,
      savedAds:         user.savedAds,
      bio:              user.bio,
      whatsapp:         user.whatsapp,
      links:            user.links,
      createdAt:        user.createdAt,
    });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
// UPDATE PROFILE
// PUT /api/users/profile
// Requires: protect
// ─────────────────────────────────────────────────────────────
async function updateProfile(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        success: false,
        message: "Validation failed",
        errors:  errors.array().map((e) => ({ field: e.path, message: e.msg })),
      });
    }

    // Only allow updating these fields
    const ALLOWED_UPDATES = ["name", "city", "address", "bio", "whatsapp", "links"];
    const updates = {};
    ALLOWED_UPDATES.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === "links" && typeof req.body[field] === "string") {
          try {
            updates[field] = JSON.parse(req.body[field]);
          } catch {
            updates[field] = [req.body[field]]; // fallback to single item array
          }
        } else {
          updates[field] = typeof req.body[field] === "string"
            ? req.body[field].trim()
            : req.body[field];
        }
      }
    });

    // Handle avatar upload if file provided
    if (req.file) {
      // Delete old avatar from Cloudinary if it exists
      const currentUser = await User.findById(req.user._id);
      if (currentUser.avatar?.publicId) {
        await deleteFromCloudinary(currentUser.avatar.publicId).catch(() => {});
      }

      // Upload new avatar
      const result = await uploadToCloudinary(req.file.buffer, {
        folder:         `heavywheels/avatars`,
        transformation: [{ width: 200, height: 200, crop: "fill", gravity: "face" }],
      });

      updates.avatar = {
        url:      result.secure_url,
        publicId: result.public_id,
      };
    }

    if (Object.keys(updates).length === 0) {
      return next(new AppError("No valid fields provided for update.", 400));
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    respond(res, 200, {
      _id:     user._id,
      name:    user.name,
      email:   user.email,
      phone:   user.phone,
      city:    user.city,
      address: user.address,
      avatar:  user.avatar,
      bio:     user.bio,
      whatsapp:user.whatsapp,
      links:   user.links,
      role:    user.role,
    }, "Profile updated successfully");

  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
// GET SAVED ADS
// GET /api/users/saved
// Requires: protect
// ─────────────────────────────────────────────────────────────
async function getSavedAds(req, res, next) {
  try {
    const user = await User.findById(req.user._id).populate({
      path:   "savedAds",
      select: "title shortTitle price priceDisplay year city condition make model type images seller createdAt status",
      match:  { status: "active" },
      options:{ sort: { createdAt: -1 } },
    });

    if (!user) return next(new AppError("User not found.", 404));

    // Filter out null values (listings that were deleted)
    const activeSaved = user.savedAds.filter(Boolean);

    respond(res, 200, { saved: activeSaved, count: activeSaved.length });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
// SAVE AD (add to favourites)
// POST /api/users/saved/:vehicleId
// Requires: protect
// ─────────────────────────────────────────────────────────────
async function saveAd(req, res, next) {
  try {
    const { vehicleId } = req.params;

    // Check vehicle exists
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) return next(new AppError("Listing not found.", 404));

    // Check not already saved
    const user = await User.findById(req.user._id);
    if (user.savedAds.includes(vehicleId)) {
      return respond(res, 200, null, "Already saved");
    }

    // Add to saved
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { savedAds: vehicleId },
    });

    respond(res, 200, null, "Ad saved successfully");
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
// UNSAVE AD (remove from favourites)
// DELETE /api/users/saved/:vehicleId
// Requires: protect
// ─────────────────────────────────────────────────────────────
async function unsaveAd(req, res, next) {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { savedAds: req.params.vehicleId },
    });

    res.status(200).json({ success: true, message: "Ad removed from saved", data: null });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
// CHANGE PASSWORD
// PUT /api/users/password
// Requires: protect
// ─────────────────────────────────────────────────────────────
async function changePassword(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        success: false,
        message: "Validation failed",
        errors:  errors.array().map((e) => ({ field: e.path, message: e.msg })),
      });
    }

    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.user._id).select("+password");

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return next(new AppError("Current password is incorrect.", 400));
    }

    // Update password (pre-save hook will hash it)
    user.password = newPassword;
    await user.save();

    respond(res, 200, null, "Password changed successfully");
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getProfile,
  updateProfile,
  getSavedAds,
  saveAd,
  unsaveAd,
  changePassword,
};
