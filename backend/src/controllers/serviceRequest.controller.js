/**
 * Service Request Controller
 * ──────────────────────────
 * Generic handler for all booking-style services (ownership transfer first).
 *
 * User:
 *   create   → POST  /api/service-requests
 *   getMine  → GET   /api/service-requests/mine
 *   getOne   → GET   /api/service-requests/:id
 *   cancel   → PATCH /api/service-requests/:id/cancel
 * Admin:
 *   adminList         → GET   /api/service-requests/admin
 *   adminUpdateStatus → PATCH /api/service-requests/admin/:id/status
 */

const mongoose = require("mongoose");
const { validationResult } = require("express-validator");
const ServiceRequest = require("../models/ServiceRequest");
const { SERVICE_TYPES, STATUSES } = ServiceRequest;
const { AppError } = require("../middleware/error.middleware");
const {
  sendServiceRequestReceived,
  sendServiceRequestAdminAlert,
  sendServiceStatusUpdate,
} = require("../utils/email");

const respond = (res, statusCode, data, message = "Success") =>
  res.status(statusCode).json({ success: true, message, data });

const checkValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
    return false;
  }
  return true;
};

// ── USER: create a request ────────────────────────────────────
async function create(req, res, next) {
  try {
    if (!checkValidation(req, res)) return;
    const { serviceType, vehicleId, vehicleInfo, contact, notes, details } = req.body;

    if (!SERVICE_TYPES.includes(serviceType)) {
      return next(new AppError("Invalid service type.", 400));
    }

    const doc = await ServiceRequest.create({
      serviceType,
      user: req.user._id,
      vehicle: vehicleId && mongoose.isValidObjectId(vehicleId) ? vehicleId : null,
      vehicleInfo: {
        make: vehicleInfo?.make || "",
        model: vehicleInfo?.model || "",
        year: Number(vehicleInfo?.year) || null,
        registrationNumber: vehicleInfo?.registrationNumber || "",
      },
      contact: {
        name: contact?.name || req.user.name || "",
        phone: contact?.phone || req.user.phone || "",
        city: contact?.city || req.user.city || "",
      },
      notes: notes || "",
      details: details && typeof details === "object" ? details : {},
    });

    // Emails are best-effort — never block the request on delivery.
    sendServiceRequestReceived(req.user, doc).catch(() => {});
    sendServiceRequestAdminAlert(doc, req.user).catch(() => {});

    respond(res, 201, doc, "Request submitted successfully.");
  } catch (err) {
    next(err);
  }
}

// ── USER: my requests ─────────────────────────────────────────
async function getMine(req, res, next) {
  try {
    const filter = { user: req.user._id };
    if (req.query.type) filter.serviceType = req.query.type;

    const items = await ServiceRequest.find(filter)
      .sort({ createdAt: -1 })
      .populate("vehicle", "title price city")
      .lean();

    respond(res, 200, items);
  } catch (err) {
    next(err);
  }
}

// ── USER/ADMIN: a single request ──────────────────────────────
async function getOne(req, res, next) {
  try {
    const doc = await ServiceRequest.findById(req.params.id)
      .populate("vehicle", "title price city")
      .lean();

    if (!doc) return next(new AppError("Request not found.", 404));

    const isOwner = doc.user.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== "admin") {
      return next(new AppError("You are not allowed to view this request.", 403));
    }

    respond(res, 200, doc);
  } catch (err) {
    next(err);
  }
}

// ── USER: cancel ──────────────────────────────────────────────
async function cancel(req, res, next) {
  try {
    const doc = await ServiceRequest.findById(req.params.id);
    if (!doc) return next(new AppError("Request not found.", 404));
    if (doc.user.toString() !== req.user._id.toString()) {
      return next(new AppError("You can only cancel your own requests.", 403));
    }
    if (!["pending", "in-progress"].includes(doc.status)) {
      return next(new AppError("This request can no longer be cancelled.", 400));
    }

    doc.status = "cancelled";
    doc.history.push({ status: "cancelled", note: "Cancelled by user", at: new Date() });
    await doc.save();

    respond(res, 200, doc, "Request cancelled.");
  } catch (err) {
    next(err);
  }
}

// ── ADMIN: list ───────────────────────────────────────────────
async function adminList(req, res, next) {
  try {
    const filter = {};
    if (req.query.type) filter.serviceType = req.query.type;
    if (req.query.status) filter.status = req.query.status;

    const items = await ServiceRequest.find(filter)
      .sort({ createdAt: -1 })
      .limit(Math.min(200, parseInt(req.query.limit) || 100))
      .populate("user", "name email phone")
      .populate("vehicle", "title price")
      .lean();

    respond(res, 200, items);
  } catch (err) {
    next(err);
  }
}

// ── ADMIN: update status ──────────────────────────────────────
async function adminUpdateStatus(req, res, next) {
  try {
    if (!checkValidation(req, res)) return;
    const { status, note } = req.body;
    if (!STATUSES.includes(status)) {
      return next(new AppError("Invalid status.", 400));
    }

    const doc = await ServiceRequest.findById(req.params.id).populate("user", "name email");
    if (!doc) return next(new AppError("Request not found.", 404));

    doc.status = status;
    doc.history.push({ status, note: note || "", at: new Date() });
    await doc.save();

    if (doc.user?.email) {
      sendServiceStatusUpdate(doc.user, doc).catch(() => {});
    }

    respond(res, 200, doc, "Status updated.");
  } catch (err) {
    next(err);
  }
}

module.exports = { create, getMine, getOne, cancel, adminList, adminUpdateStatus };
