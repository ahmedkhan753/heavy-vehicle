/**
 * Chat Controller
 * ───────────────
 * In-app buyer↔seller messaging (polling-based; no websockets). Works for
 * either listing kind — the caller says which via `listingType`, since the
 * page it's called from already knows (a vehicle page never messages about
 * a part). No cross-collection lookup needed.
 *
 *   startConversation → POST /api/chat/conversations            { listingId, listingType }
 *   listConversations → GET  /api/chat/conversations            (my inbox)
 *   unreadCount       → GET  /api/chat/unread
 *   getMessages       → GET  /api/chat/conversations/:id/messages  (marks read)
 *   sendMessage       → POST /api/chat/conversations/:id/messages  { text }
 */

const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const Vehicle = require("../models/Vehicle");
const Part = require("../models/Part");
const { AppError } = require("../middleware/error.middleware");

const respond = (res, statusCode, data, message = "Success") =>
  res.status(statusCode).json({ success: true, message, data });

const sameId = (a, b) => String(a) === String(b);

const LISTING_MODELS = { vehicle: Vehicle, part: Part };

// Lowercase on the wire, capitalized in the DB (Mongoose refPath needs the
// exact model name to resolve `.populate("listing")`).
const toModelType = (t) => (String(t || "vehicle").toLowerCase() === "part" ? "Part" : "Vehicle");
const toWireType = (t) => String(t || "Vehicle").toLowerCase();

// listingType lowercased for the API response.
const toWire = (convo) => ({ ...convo, listingType: toWireType(convo.listingType) });

// Buyer starts (or reopens) a conversation about a listing.
async function startConversation(req, res, next) {
  try {
    // `vehicleId` kept as a fallback for a brief window during rolling deploys.
    const listingId = req.body.listingId || req.body.vehicleId;
    const listingType = toModelType(req.body.listingType);
    if (!listingId) return next(new AppError("listingId is required.", 400));

    const Model = LISTING_MODELS[listingType.toLowerCase()];
    const listing = await Model.findById(listingId).select("title sellerId");
    if (!listing) return next(new AppError("Listing not found.", 404));

    if (sameId(listing.sellerId, req.user._id)) {
      return next(new AppError("You can't message your own listing.", 400));
    }

    let convo = await Conversation.findOne({ listing: listing._id, listingType, buyer: req.user._id });
    if (!convo) {
      convo = await Conversation.create({
        listing: listing._id,
        listingType,
        listingTitle: listing.title,
        buyer: req.user._id,
        seller: listing.sellerId,
      });
    }

    respond(res, 201, toWire(convo.toObject()), "Conversation ready.");
  } catch (err) {
    next(err);
  }
}

// My inbox — conversations where I'm the buyer or the seller.
async function listConversations(req, res, next) {
  try {
    const me = req.user._id;
    const convos = await Conversation.find({ $or: [{ buyer: me }, { seller: me }] })
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .populate("buyer", "name avatar")
      .populate("seller", "name avatar")
      .populate("listing", "title images price")
      .lean();

    const data = convos.map((c) => {
      const isBuyer = sameId(c.buyer._id, me);
      return toWire({
        _id: c._id,
        listing: c.listing,
        listingType: c.listingType,
        listingTitle: c.listingTitle,
        role: isBuyer ? "buyer" : "seller",
        other: isBuyer ? c.seller : c.buyer,
        lastMessage: c.lastMessage,
        lastMessageAt: c.lastMessageAt,
        unread: isBuyer ? c.buyerUnread : c.sellerUnread,
      });
    });

    respond(res, 200, data);
  } catch (err) {
    next(err);
  }
}

// Total unread across my conversations (for the navbar badge).
async function unreadCount(req, res, next) {
  try {
    const me = req.user._id;
    const convos = await Conversation.find({ $or: [{ buyer: me }, { seller: me }] })
      .select("buyer buyerUnread sellerUnread")
      .lean();
    const total = convos.reduce(
      (sum, c) => sum + (sameId(c.buyer, me) ? c.buyerUnread || 0 : c.sellerUnread || 0),
      0
    );
    respond(res, 200, { unread: total });
  } catch (err) {
    next(err);
  }
}

// Load a thread and mark it read for the requester.
async function getMessages(req, res, next) {
  try {
    const convo = await Conversation.findById(req.params.id)
      .populate("buyer", "name avatar")
      .populate("seller", "name avatar")
      .populate("listing", "title images price");
    if (!convo) return next(new AppError("Conversation not found.", 404));

    const me = req.user._id;
    const isBuyer = sameId(convo.buyer._id, me);
    const isSeller = sameId(convo.seller._id, me);
    if (!isBuyer && !isSeller) return next(new AppError("Not your conversation.", 403));

    const messages = await Message.find({ conversation: convo._id })
      .sort({ createdAt: 1 })
      .limit(500)
      .lean();

    // Clear my unread counter.
    if (isBuyer && convo.buyerUnread > 0) { convo.buyerUnread = 0; await convo.save(); }
    if (isSeller && convo.sellerUnread > 0) { convo.sellerUnread = 0; await convo.save(); }

    respond(res, 200, {
      conversation: toWire({
        _id: convo._id,
        listing: convo.listing,
        listingType: convo.listingType,
        role: isBuyer ? "buyer" : "seller",
        other: isBuyer ? convo.seller : convo.buyer,
      }),
      messages,
    });
  } catch (err) {
    next(err);
  }
}

// Post a message into a thread.
async function sendMessage(req, res, next) {
  try {
    const text = String(req.body.text || "").trim();
    if (!text) return next(new AppError("Message cannot be empty.", 400));
    if (text.length > 2000) return next(new AppError("Message is too long.", 400));

    const convo = await Conversation.findById(req.params.id);
    if (!convo) return next(new AppError("Conversation not found.", 404));

    const me = req.user._id;
    const isBuyer = sameId(convo.buyer, me);
    const isSeller = sameId(convo.seller, me);
    if (!isBuyer && !isSeller) return next(new AppError("Not your conversation.", 403));

    const msg = await Message.create({ conversation: convo._id, sender: me, text });

    convo.lastMessage = text.slice(0, 200);
    convo.lastMessageAt = new Date();
    convo.lastSender = me;
    if (isBuyer) convo.sellerUnread += 1;
    else convo.buyerUnread += 1;
    await convo.save();

    respond(res, 201, msg, "Sent.");
  } catch (err) {
    next(err);
  }
}

module.exports = { startConversation, listConversations, unreadCount, getMessages, sendMessage };
