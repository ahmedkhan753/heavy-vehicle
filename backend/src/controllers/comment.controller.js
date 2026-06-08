/**
 * Comment Controller
 * ──────────────────
 *   list   → GET    /api/comments?vehicleId=...   (public)
 *   create → POST   /api/comments                 (auth)
 *   remove → DELETE /api/comments/:id             (author | listing owner | admin)
 */

const Comment = require("../models/Comment");
const Vehicle = require("../models/Vehicle");
const { AppError } = require("../middleware/error.middleware");

const respond = (res, statusCode, data, message = "Success") =>
  res.status(statusCode).json({ success: true, message, data });

const sameId = (a, b) => String(a) === String(b);

// Public list for a listing, annotated with whether each author is the seller.
async function list(req, res, next) {
  try {
    const { vehicleId } = req.query;
    if (!vehicleId) return next(new AppError("vehicleId is required.", 400));

    const vehicle = await Vehicle.findById(vehicleId).select("sellerId").lean();
    if (!vehicle) return next(new AppError("Listing not found.", 404));

    const comments = await Comment.find({ vehicle: vehicleId })
      .sort({ createdAt: 1 })
      .populate("user", "name avatar")
      .lean();

    const data = comments.map((c) => ({
      ...c,
      isSeller: sameId(c.user?._id, vehicle.sellerId),
    }));

    respond(res, 200, data);
  } catch (err) {
    next(err);
  }
}

// Post a comment / reply / offer.
async function create(req, res, next) {
  try {
    const { vehicleId, parentId } = req.body;
    const text = String(req.body.text || "").trim();
    if (!text) return next(new AppError("Comment cannot be empty.", 400));
    if (text.length > 1000) return next(new AppError("Comment is too long.", 400));

    const vehicle = await Vehicle.findById(vehicleId).select("_id").lean();
    if (!vehicle) return next(new AppError("Listing not found.", 404));

    // Replies attach to a top-level comment on the same listing.
    let parent = null;
    if (parentId) {
      parent = await Comment.findById(parentId).select("vehicle parentId").lean();
      if (!parent || !sameId(parent.vehicle, vehicleId)) {
        return next(new AppError("Invalid parent comment.", 400));
      }
      if (parent.parentId) return next(new AppError("Replies can only be one level deep.", 400));
    }

    let offerAmount = null;
    if (req.body.offerAmount !== undefined && req.body.offerAmount !== null && req.body.offerAmount !== "") {
      const amt = Number(req.body.offerAmount);
      if (!Number.isFinite(amt) || amt <= 0) return next(new AppError("Invalid offer amount.", 400));
      offerAmount = Math.round(amt);
    }

    const comment = await Comment.create({
      vehicle: vehicleId,
      user: req.user._id,
      text,
      offerAmount,
      parentId: parentId || null,
    });

    const populated = await comment.populate("user", "name avatar");
    respond(res, 201, populated, "Comment posted.");
  } catch (err) {
    next(err);
  }
}

// Delete a comment (and its direct replies). Author, listing owner, or admin.
async function remove(req, res, next) {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return next(new AppError("Comment not found.", 404));

    const isAuthor = sameId(comment.user, req.user._id);
    const isAdmin = req.user.role === "admin";
    let isOwner = false;
    if (!isAuthor && !isAdmin) {
      const vehicle = await Vehicle.findById(comment.vehicle).select("sellerId").lean();
      isOwner = vehicle && sameId(vehicle.sellerId, req.user._id);
    }
    if (!isAuthor && !isAdmin && !isOwner) {
      return next(new AppError("You can't delete this comment.", 403));
    }

    await Comment.deleteMany({ $or: [{ _id: comment._id }, { parentId: comment._id }] });
    respond(res, 200, { deleted: true }, "Comment deleted.");
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create, remove };
