/**
 * Chat Controller
 * ───────────────
 * In-app buyer↔seller messaging (polling-based; no websockets).
 *
 *   startConversation → POST /api/chat/conversations            { vehicleId }
 *   listConversations → GET  /api/chat/conversations            (my inbox)
 *   unreadCount       → GET  /api/chat/unread
 *   getMessages       → GET  /api/chat/conversations/:id/messages  (marks read)
 *   sendMessage       → POST /api/chat/conversations/:id/messages  { text }
 */

const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const Vehicle = require("../models/Vehicle");
const { AppError } = require("../middleware/error.middleware");

const respond = (res, statusCode, data, message = "Success") =>
  res.status(statusCode).json({ success: true, message, data });

const sameId = (a, b) => String(a) === String(b);

// Buyer starts (or reopens) a conversation about a listing.
async function startConversation(req, res, next) {
  try {
    const { vehicleId } = req.body;
    const vehicle = await Vehicle.findById(vehicleId).select("title sellerId");
    if (!vehicle) return next(new AppError("Listing not found.", 404));

    if (sameId(vehicle.sellerId, req.user._id)) {
      return next(new AppError("You can't message your own listing.", 400));
    }

    let convo = await Conversation.findOne({ vehicle: vehicle._id, buyer: req.user._id });
    if (!convo) {
      convo = await Conversation.create({
        vehicle: vehicle._id,
        vehicleTitle: vehicle.title,
        buyer: req.user._id,
        seller: vehicle.sellerId,
      });
    }

    respond(res, 201, convo, "Conversation ready.");
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
      .populate("vehicle", "title images price")
      .lean();

    const data = convos.map((c) => {
      const isBuyer = sameId(c.buyer._id, me);
      return {
        _id: c._id,
        vehicle: c.vehicle,
        vehicleTitle: c.vehicleTitle,
        role: isBuyer ? "buyer" : "seller",
        other: isBuyer ? c.seller : c.buyer,
        lastMessage: c.lastMessage,
        lastMessageAt: c.lastMessageAt,
        unread: isBuyer ? c.buyerUnread : c.sellerUnread,
      };
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
      .populate("vehicle", "title images price");
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
      conversation: {
        _id: convo._id,
        vehicle: convo.vehicle,
        role: isBuyer ? "buyer" : "seller",
        other: isBuyer ? convo.seller : convo.buyer,
      },
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
