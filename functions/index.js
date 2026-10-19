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