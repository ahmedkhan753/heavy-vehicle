/**
 * Email Utility (Nodemailer)
 * ───────────────────────────
 * sendEmail       → generic send
 * sendWelcome     → new user welcome
 * sendPasswordReset → reset link
 * sendAdPosted    → confirmation when ad goes live
 */

const nodemailer = require("nodemailer");
const { env }    = require("../config/env");

// Create transporter once (reused for all emails)
let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    service: env.EMAIL_SERVICE,
    auth: {
      user: env.EMAIL_USER,
      pass: env.EMAIL_PASS,
    },
  });

  return transporter;
}

/**
 * Base send function
 * @param {{ to, subject, html, text }} options
 */
async function sendEmail({ to, subject, html, text }) {
  // Skip sending in development if email not configured
  if (env.IS_DEVELOPMENT && !env.EMAIL_USER) {
    console.log(`📧 [DEV] Email skipped → ${to}: ${subject}`);
    return;
  }

  const transport = getTransporter();

  await transport.sendMail({
    from:    env.EMAIL_FROM,
    to,
    subject,
    html,
    text: text || subject,
  });
}

/**
 * Email verification
 */
async function sendEmailVerification(user, token) {
  const verifyUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/verify?token=${token}`;

  await sendEmail({
    to:      user.email,
    subject: "Verify your email - HeavyWheels Pakistan",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#f4f6f9;padding:24px;border-radius:12px;">
        <div style="background:#070b14;border-radius:10px;padding:24px;text-align:center;margin-bottom:20px;">
          <h1 style="color:#f97316;font-size:28px;margin:0;letter-spacing:2px;">🚛 HEAVYWHEELS</h1>
        </div>
        <div style="background:#fff;border-radius:10px;padding:28px;">
          <h2 style="color:#1a1f2e;margin-top:0;">Verify Your Email</h2>
          <p style="color:#475569;line-height:1.7;">
            Hi ${user.name}, please click the button below to verify your email address. This link is valid for 24 hours.
          </p>
          <a href="${verifyUrl}" style="display:inline-block;background:#f97316;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;margin-top:16px;">
            Verify Email
          </a>
          <p style="color:#94a3b8;font-size:13px;margin-top:24px;">
            If you did not create an account, you can safely ignore this email.
          </p>
        </div>
      </div>
    `,
  });
}

/**
 * Welcome email after registration
 */
async function sendWelcome(user) {
  await sendEmail({
    to:      user.email,
    subject: "Welcome to HeavyWheels Pakistan 🚛",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#f4f6f9;padding:24px;border-radius:12px;">
        <div style="background:#070b14;border-radius:10px;padding:24px;text-align:center;margin-bottom:20px;">
          <h1 style="color:#f97316;font-size:28px;margin:0;letter-spacing:2px;">🚛 HEAVYWHEELS</h1>
        </div>
        <div style="background:#fff;border-radius:10px;padding:28px;">
          <h2 style="color:#1a1f2e;margin-top:0;">Welcome, ${user.name}!</h2>
          <p style="color:#475569;line-height:1.7;">
            Your account has been created successfully. You can now post free ads,
            browse 3,800+ listings, and connect with buyers and sellers across Pakistan.
          </p>
          <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}"
            style="display:inline-block;background:#f97316;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;margin-top:16px;">
            Browse Listings →
          </a>
          <p style="color:#94a3b8;font-size:13px;margin-top:24px;">
            Questions? Reply to this email or WhatsApp us at ${env.ADMIN_EMAIL}
          </p>
        </div>
      </div>
    `,
  });
}

/**
 * Password reset email
 */
async function sendPasswordReset(user, resetToken) {
  const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`;

  await sendEmail({
    to:      user.email,
    subject: "Reset Your HeavyWheels Password",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;">
        <h2>Password Reset Request</h2>
        <p>Hi ${user.name}, you requested to reset your password.</p>
        <p>Click the link below. This link expires in 1 hour.</p>
        <a href="${resetUrl}" style="display:inline-block;background:#f97316;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;">
          Reset Password
        </a>
        <p style="color:#94a3b8;font-size:13px;margin-top:20px;">
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}

/**
 * Ad posted confirmation
 */
async function sendAdPosted(user, vehicle) {
  await sendEmail({
    to:      user.email,
    subject: `Your ad is live: ${vehicle.title}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;">
        <h2>Your Ad is Now Live! 🎉</h2>
        <p>Hi ${user.name}, your listing "<strong>${vehicle.title}</strong>" is now live on HeavyWheels.</p>
        <p><strong>Price:</strong> PKR ${vehicle.priceDisplay}</p>
        <p><strong>City:</strong> ${vehicle.city}</p>
        <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/vehicle/${vehicle._id}"
          style="display:inline-block;background:#f97316;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;">
          View Your Listing →
        </a>
      </div>
    `,
  });
}

/**
 * Renewal reminder — sent daily in the final week before an ad is deleted.
 * @param {object} user      - seller (needs name, email)
 * @param {object} listing   - the Vehicle/Part doc (needs _id, title)
 * @param {number} daysLeft  - whole days until the ad is removed
 * @param {number} extendPrice - cost to extend the ad (PKR)
 */
async function sendRenewalReminder(user, listing, daysLeft, extendPrice) {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const urgency = daysLeft <= 1 ? "tomorrow" : `in ${daysLeft} days`;

  await sendEmail({
    to:      user.email,
    subject: `⏰ "${listing.title}" expires ${urgency} — renew to keep it live`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;">
        <h2 style="color:#1a1f2e;">Your ad is about to expire</h2>
        <p style="color:#475569;line-height:1.7;">
          Hi ${user.name}, your listing "<strong>${listing.title}</strong>" will be
          <strong>permanently deleted ${urgency}</strong> unless you renew it.
        </p>
        <p style="color:#475569;line-height:1.7;">
          Keep it live for another 30 days for just <strong>Rs ${Number(extendPrice || 0).toLocaleString("en-PK")}</strong>,
          or upgrade to a Pro plan and your ads never expire.
        </p>
        <a href="${base}/dashboard/my-ads"
          style="display:inline-block;background:#f97316;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;margin-top:8px;">
          Renew this ad →
        </a>
        <p style="color:#94a3b8;font-size:13px;margin-top:20px;">
          Tip: <a href="${base}/subscription-pricings" style="color:#f97316;">Pro and higher plans</a> keep your listings online indefinitely.
        </p>
      </div>
    `,
  });
}

/* ── Service requests (inspection, warranty) ── */

const SERVICE_LABEL = {
  inspection: "Vehicle Inspection",
  warranty: "Warranty Program",
};

const STATUS_LABEL = {
  pending: "Pending",
  "in-progress": "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
  rejected: "Rejected",
};

const serviceLabel = (type) => SERVICE_LABEL[type] || "Service";

// Confirmation to the user when they submit a request.
async function sendServiceRequestReceived(user, request) {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  await sendEmail({
    to: user.email,
    subject: `We received your ${serviceLabel(request.serviceType)} request (${request.reference})`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;">
        <h2 style="color:#1a1f2e;">Request received 🚛</h2>
        <p style="color:#475569;line-height:1.7;">
          Hi ${user.name}, we've received your <strong>${serviceLabel(request.serviceType)}</strong> request.
          Our team will be in touch shortly.
        </p>
        <p style="color:#475569;">Your reference number is <strong>${request.reference}</strong>.</p>
        <a href="${base}/dashboard/requests"
          style="display:inline-block;background:#f97316;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;margin-top:8px;">
          Track your request →
        </a>
      </div>
    `,
  });
}

// Alert to the admin inbox that a new request came in.
async function sendServiceRequestAdminAlert(request, user) {
  if (!env.ADMIN_EMAIL) return;
  await sendEmail({
    to: env.ADMIN_EMAIL,
    subject: `New ${serviceLabel(request.serviceType)} request — ${request.reference}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;">
        <h2>New service request</h2>
        <p><strong>Type:</strong> ${serviceLabel(request.serviceType)}</p>
        <p><strong>Reference:</strong> ${request.reference}</p>
        <p><strong>From:</strong> ${user.name} (${user.email}, ${request.contact?.phone || user.phone || "—"})</p>
        <p><strong>City:</strong> ${request.contact?.city || "—"}</p>
        <p><strong>Notes:</strong> ${request.notes || "—"}</p>
      </div>
    `,
  });
}

// Notify the user when an admin advances the request status.
async function sendServiceStatusUpdate(user, request) {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  await sendEmail({
    to: user.email,
    subject: `Your ${serviceLabel(request.serviceType)} request is now ${STATUS_LABEL[request.status] || request.status} (${request.reference})`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;">
        <h2 style="color:#1a1f2e;">Status update</h2>
        <p style="color:#475569;line-height:1.7;">
          Hi ${user.name}, your <strong>${serviceLabel(request.serviceType)}</strong> request
          (<strong>${request.reference}</strong>) is now
          <strong>${STATUS_LABEL[request.status] || request.status}</strong>.
        </p>
        <a href="${base}/dashboard/requests"
          style="display:inline-block;background:#f97316;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;margin-top:8px;">
          View details →
        </a>
      </div>
    `,
  });
}

// Inspection company partnership lead → admin inbox.
async function sendPartnershipLead(lead) {
  if (!env.ADMIN_EMAIL) return;
  await sendEmail({
    to: env.ADMIN_EMAIL,
    subject: `New inspection partnership lead — ${lead.company || lead.name}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;">
        <h2>Inspection partnership enquiry</h2>
        <p><strong>Name:</strong> ${lead.name || "—"}</p>
        <p><strong>Company:</strong> ${lead.company || "—"}</p>
        <p><strong>Email:</strong> ${lead.email || "—"}</p>
        <p><strong>Phone:</strong> ${lead.phone || "—"}</p>
        <p><strong>City:</strong> ${lead.city || "—"}</p>
        <p><strong>Message:</strong> ${lead.message || "—"}</p>
      </div>
    `,
  });
}

module.exports = {
  sendEmail,
  sendWelcome,
  sendEmailVerification,
  sendPasswordReset,
  sendAdPosted,
  sendRenewalReminder,
  sendServiceRequestReceived,
  sendServiceRequestAdminAlert,
  sendServiceStatusUpdate,
  sendPartnershipLead,
};
