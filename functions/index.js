const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const Stripe = require("stripe");
const Razorpay = require("razorpay");
const crypto = require("crypto");

// ── Stripe Initialization ─────────────────────────────────────
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "dummy_stripe_key");

// ── Razorpay Gateway Initialization ───────────────────────────
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "rzp_test_lootforward_2026";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "dummy_razorpay_secret_key";

const razorpay = new Razorpay({
    key_id: RAZORPAY_KEY_ID,
    key_secret: RAZORPAY_KEY_SECRET
});

// Helper for CORS preflight
function handleCors(req, res) {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");

    if (req.method === "OPTIONS") {
        res.status(204).send("");
        return true;
    }
    return false;
}

// ── 1. Stripe PaymentIntent Endpoint ──────────────────────────
exports.createPaymentIntent = onRequest(async (req, res) => {
    if (handleCors(req, res)) return;

    try {
        const { amount, recipientId } = req.body;

        if (!amount || amount <= 0) {
            res.status(400).json({ error: "Invalid donation amount." });
            return;
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100),
            currency: "usd",
            metadata: { recipientId }
        });

        res.status(200).json({
            clientSecret: paymentIntent.client_secret,
        });
    } catch (error) {
        logger.error("Stripe Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// ── 2. Razorpay Order Generation Endpoint ─────────────────────
// Initializes an order with amount in paise, currency INR, and unique receipt reference
exports.createRazorpayOrder = onRequest(async (req, res) => {
    if (handleCors(req, res)) return;

    if (req.method !== "POST") {
        res.status(405).json({ error: "Method Not Allowed. Use POST." });
        return;
    }

    try {
        const { amount, recipientId, donorName, notes } = req.body;

        if (!amount || isNaN(amount) || Number(amount) < 1) {
            res.status(400).json({ error: "Invalid donation amount. Minimum ₹1.00 INR is required." });
            return;
        }

        // Generate tamper-resistant receipt reference
        const receipt = `rcpt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        const amountInPaise = Math.round(Number(amount) * 100);

        const orderOptions = {
            amount: amountInPaise,
            currency: "INR",
            receipt: receipt,
            payment_capture: 1, // Auto-capture payment upon successful authorization
            notes: {
                recipientId: String(recipientId || "general_hub"),
                donorName: String(donorName || "Anonymous Gamer"),
                platform: "LootForward",
                ...(notes && typeof notes === "object" ? notes : {})
            }
        };

        const order = await razorpay.orders.create(orderOptions);
        logger.info("Created Razorpay Order:", { orderId: order.id, amount: order.amount, receipt });

        res.status(200).json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            receipt: order.receipt,
            keyId: RAZORPAY_KEY_ID
        });

    } catch (error) {
        logger.error("Razorpay Order Creation Error:", error);
        res.status(500).json({
            error: error.message || "Failed to initialize payment order with gateway."
        });
    }
});

// ── 3. Razorpay Payment Signature Verification Endpoint ───────
// Cryptographically validates the HMAC SHA-256 signature to prevent spoofing
exports.verifyPaymentSignature = onRequest(async (req, res) => {
    if (handleCors(req, res)) return;

    if (req.method !== "POST") {
        res.status(405).json({ error: "Method Not Allowed. Use POST." });
        return;
    }

    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            recipientId,
            amount
        } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            res.status(400).json({
                error: "Missing required verification parameters (order_id, payment_id, signature)."
            });
            return;
        }

        // Generate expected signature using Razorpay Key Secret
        const generatedSignature = crypto
            .createHmac("sha256", RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");

        // Use timingSafeEqual to avoid timing attack vulnerabilities
        const expectedBuffer = Buffer.from(generatedSignature, "utf-8");
        const receivedBuffer = Buffer.from(razorpay_signature, "utf-8");

        const isValid = expectedBuffer.length === receivedBuffer.length &&
            crypto.timingSafeEqual(expectedBuffer, receivedBuffer);

        if (!isValid) {
            logger.warn("Razorpay Signature Mismatch:", {
                orderId: razorpay_order_id,
                paymentId: razorpay_payment_id
            });
            res.status(400).json({
                verified: false,
                error: "Cryptographic signature verification failed. Untrusted payment payload."
            });
            return;
        }

        const auditTicket = `PENDING_AUDIT_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
        logger.info("Razorpay Payment Verified Successfully:", {
            orderId: razorpay_order_id,
            paymentId: razorpay_payment_id,
            auditTicket
        });

        res.status(200).json({
            verified: true,
            status: "success",
            message: "Payment cryptographically verified.",
            paymentId: razorpay_payment_id,
            orderId: razorpay_order_id,
            ticketId: auditTicket,
            amount: amount,
            verifiedAt: new Date().toISOString()
        });

    } catch (error) {
        logger.error("Razorpay Signature Verification Error:", error);
        res.status(500).json({
            verified: false,
            error: error.message || "Failed to verify payment signature."
        });
    }
});

// ── 4. Automated Recipient Approval Notifications (Firebase Cloud Functions v2) ──
// Triggered automatically whenever a recipient record in the 'recipients' collection is updated.
// Listens for status transition: before.status !== 'approved' && after.status === 'approved'
const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const nodemailer = require("nodemailer");

// Nodemailer SMTP / SendGrid Transporter
// Secure credentials read directly from environment variables: EMAIL_USER and EMAIL_PASS
const mailTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.sendgrid.net",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
        user: process.env.EMAIL_USER || process.env.SMTP_USER || "apikey",
        pass: process.env.EMAIL_PASS || process.env.SMTP_PASS || process.env.SENDGRID_API_KEY || "dummy_key"
    }
});

exports.onRecipientApproved = onDocumentUpdated("recipients/{recipientId}", async (event) => {
    const beforeData = event.data?.before?.data();
    const afterData = event.data?.after?.data();
    const recipientId = event.params.recipientId;

    if (!beforeData || !afterData) {
        logger.warn(`No document snapshot data found for recipient ${recipientId}`);
        return null;
    }

    // State transition guard: Fires specifically when status moves from 'pending' to 'approved'
    if (beforeData.status !== "pending" || afterData.status !== "approved") {
        return null;
    }

    const recipientEmail = afterData.email;
    const recipientName = afterData.name || "Community Partner";
    const targetItem = afterData.targetItem || "Gaming Hardware & Peripherals";
    const portalUrl = process.env.APP_BASE_URL || "https://lootforward.vercel.app/#recipients";

    logger.info(`Recipient ${recipientId} ("${recipientName}") approved. Initiating email dispatch to ${recipientEmail}`);

    if (!recipientEmail || !recipientEmail.includes("@")) {
        logger.warn(`No valid email address for recipient ${recipientId}. Aborting notification.`);
        return null;
    }

    const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Application Approved - LootForward</title>
  <style>
    body { background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f3f4f6; margin: 0; padding: 24px; }
    .card { max-width: 600px; margin: 0 auto; background: #131926; border: 1px solid #2d3748; border-radius: 12px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #00f2fe 0%, #4facfe 100%); padding: 32px 24px; text-align: center; }
    .header h1 { margin: 0; color: #050b14; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; }
    .body { padding: 32px 24px; }
    .badge { display: inline-block; background: rgba(0, 242, 254, 0.15); color: #00f2fe; padding: 6px 14px; border-radius: 20px; font-family: monospace; font-size: 13px; font-weight: bold; margin-bottom: 20px; }
    .step-box { background: #1a2234; border-left: 4px solid #00f2fe; border-radius: 6px; padding: 14px 18px; margin: 16px 0; }
    .btn { display: inline-block; background: #00f2fe; color: #050b14 !important; text-decoration: none; font-weight: bold; padding: 14px 28px; border-radius: 8px; margin-top: 24px; text-align: center; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #718096; border-top: 1px solid #1a2234; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>🎮 Application Approved!</h1>
      <p style="margin: 8px 0 0 0; color: #081a2e; font-size: 15px; font-weight: 600;">Welcome to the LootForward Community Network</p>
    </div>
    <div class="body">
      <div class="badge">RECIPIENT ID: ${recipientId}</div>
      <h2 style="margin-top: 0; color: #ffffff;">Congratulations, ${recipientName}!</h2>
      <p style="color: #cbd5e1; line-height: 1.6;">
        Your application for community gaming gear assistance (<strong>${targetItem}</strong>) has been verified and officially approved by the LootForward audit network. Your organization is now live on our public directory and Leaflet GIS map.
      </p>

      <h3 style="color: #00f2fe; margin-top: 28px; font-size: 16px; text-transform: uppercase; letter-spacing: 0.5px;">Next Steps for Claiming Physical Gear:</h3>
      
      <div class="step-box">
        <strong>1. Locate Assigned Drop-off Hubs:</strong>
        <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 14px;">Browse the interactive map to locate partner game stores and hubs holding available gear allocated for your region.</p>
      </div>

      <div class="step-box">
        <strong>2. Match with Cryptographic Claim Codes:</strong>
        <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 14px;">When equipment is dropped off, an 8-character claim code and QR pass are generated to guarantee anti-fraud chain of custody.</p>
      </div>

      <div class="step-box">
        <strong>3. Confirm Hand-Off in Portal:</strong>
        <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 14px;">Submit the item's claim code in the LootForward Claim Verification portal to lock the equipment and update platform metrics.</p>
      </div>

      <div style="text-align: center;">
        <a href="${portalUrl}" class="btn">View Recipient Portal &amp; Live Map</a>
      </div>
    </div>
    <div class="footer">
      <p>LootForward Anti-Fraud Gaming Equipment Network · Automated Verification System</p>
      <p style="margin: 0;">Sent automatically to ${recipientEmail} upon verified status approval.</p>
    </div>
  </div>
</body>
</html>
    `;

    try {
        const mailOptions = {
            from: process.env.EMAIL_FROM || '"LootForward Operations" <notifications@lootforward.org>',
            to: recipientEmail,
            subject: `🎉 Approved: ${recipientName} is now live on LootForward!`,
            html: emailHtml
        };

        const info = await mailTransporter.sendMail(mailOptions);
        logger.info(`Successfully dispatched approval email to ${recipientEmail}:`, {
            messageId: info.messageId,
            recipientId
        });
        return { success: true, messageId: info.messageId };
    } catch (mailError) {
        logger.error(`Error sending approval email to ${recipientEmail}:`, mailError);
        return { error: mailError.message };
    }
});