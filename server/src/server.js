import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import connect from "./config/db.js";
import Stripe from "stripe";
import jwt from "jsonwebtoken";
import Cart from "./models/Cart.js";
import Order from "./models/Order.js";
import Inventory from "./models/Inventory.js";
import adminUsers from "./routes/admin.users.js";
import adminParts from "./routes/admin.parts.js";
import adminOrders from "./routes/admin.orders.js";
import adminPosts from "./routes/admin.posts.js";
import adminTestimonials from "./routes/admin.testimonials.js";
import path from "node:path";

// ---------- init ----------
const app = express();
await connect();

app.use(cors());
app.use(morgan("dev"));

// ---------- Stripe ----------
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

// ⚠️ Webhook MUST see raw body. Mount BEFORE express.json()
app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  try {
    const event = stripe.webhooks.constructEvent(
      req.body, // Buffer
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const userId = session.client_reference_id || session.metadata?.userId || null;

      // (optional) get line items
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100 });

      await createOrderAndEmptyCart(userId, session, lineItems);
    }

    return res.json({ received: true });
  } catch (err) {
    console.error("Webhook verification error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

// AFTER webhook: parse JSON for all other routes
app.use(express.json());

// ---------- Auth middleware ----------
function auth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.id || payload._id || payload.userId };
    next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

// ---------- Your existing routes ----------
app.use("/api/admin", (await import("./routes/admin.metrics.js")).default);
app.use("/api/admin", adminUsers);
app.use("/api/admin", adminParts);
app.use("/api/admin", adminOrders);
app.use("/api/admin", adminPosts);
app.use("/api/admin", adminTestimonials);
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use("/api/auth", (await import("./routes/auth.js")).default);
app.use("/api/vehicles", (await import("./routes/vehicles.js")).default);
app.use("/api/parts", (await import("./routes/parts.js")).default);
app.use("/api/cart", (await import("./routes/cart.js")).default);
app.use("/api/orders", (await import("./routes/orders.js")).default);
app.use("/api", (await import("./routes/community.js")).default);
app.use("/api/admin", (await import("./routes/admin.js")).default);
app.use("/api/posts", (await import("./routes/posts.js")).default);
app.use("/api/testimonials", (await import("./routes/testimonials.js")).default);
app.use("/api/admin", (await import("./routes/admin.alerts.js")).default);


// ---------- Stripe Checkout (build from REAL cart) ----------
app.post("/api/payments/checkout", auth, async (req, res) => {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001";
    const userId = String(req.user.id);

    // 1) Load user's cart w/ trusted DB prices
    const cart = await Cart.findOne({ userId }).populate("items.partId");
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    // 2) Build line items
    const line_items = cart.items.map((it) => {
      const part = it.partId; // populated doc
      const unit = Math.round(Number(part?.price || 0) * 100); // cents
      return {
        quantity: it.qty,
        price_data: {
          currency: "lkr",
          unit_amount: unit,
          product_data: {
            name: part?.name || "Part",
            metadata: {
              partId: String(part?._id || ""),
              locationId: it.selectedLocationId || "",
            },
          },
        },
      };
    });

    // 3) Create session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      client_reference_id: userId, // read it in webhook
      metadata: { userId },
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout/cancel`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    res.status(500).json({ error: err.message || "Failed to create session" });
  }
});

// replace /api/orders/finalize handler body:
app.post("/api/orders/finalize", auth, async (req, res) => {
  try {
    const { session_id } = req.body;
    if (!session_id) return res.status(400).json({ error: "session_id required" });

    // Just fetch; don't create here
    const existing = await Order.findOne({ "payment.sessionId": session_id });
    if (existing) return res.json({ ok: true, orderId: existing._id });

    // still not created by webhook → tell UI to keep polling
    return res.status(202).json({ processing: true });
  } catch (err) {
    console.error("Finalize lookup error:", err);
    res.status(500).json({ error: "Failed to finalize lookup" });
  }
});


// ---------- Helpers ----------
async function createOrderAndEmptyCart(userId, session /*, lineItems */) {
  try {
    // --- idempotency: if the order for this Stripe session already exists, exit
    const existing = await Order.findOne({ "payment.sessionId": session.id });
    if (existing) return existing;

    // --- normalize userId to match your schema
    const UserId =
      (Order.schema?.paths?.userId?.instance === "ObjectID" && mongoose.isValidObjectId(userId))
        ? new mongoose.Types.ObjectId(userId)
        : userId;

    // --- load cart with parts
    const cart = await Cart.findOne({ userId: UserId }).populate("items.partId");
    if (!cart || cart.items.length === 0) {
      console.warn("[createOrderAndEmptyCart] Cart empty or not found for", userId);
      return null;
    }

    // --- build snapshot for order
    const items = cart.items.map((it) => ({
      partId: it.partId._id,
      name: it.partId.name,
      price: Number(it.partId.price || 0),
      qty: it.qty,
      locationId: it.selectedLocationId || null,
    }));

    const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);
    const tax = 0;
    const grand = subtotal + tax;

    // --- choose final status (keep your existing enum handling)
    const allowed = (Order.schema?.path("status")?.enumValues || []).map(String);
    const stripePaymentStatus = String(session.payment_status || "paid").toLowerCase();
    const finalStatus =
      allowed.find((v) => v.toLowerCase() === stripePaymentStatus) ||
      allowed.find((v) => /paid|success|completed|complete/.test(v.toLowerCase())) ||
      undefined;

    // --- 1) decrease qtyOnHand per item (only this; nothing else)
    for (const it of items) {
      const upd = await Inventory.updateOne(
        {
          partId: it.partId,
          locationId: it.locationId,
          qtyOnHand: { $gte: it.qty }, // guard against oversell
        },
        { $inc: { qtyOnHand: -it.qty } }
      );

      if (upd.modifiedCount === 0) {
        // if any line can’t be fulfilled, bail out (don’t create order, don’t clear cart)
        console.error("[Inventory] Out of stock:", it.partId?.toString?.(), "need", it.qty);
        throw new Error(`OUT_OF_STOCK:${it.partId}`);
      }
    }

    // --- 2) create order
    const order = await Order.create({
      userId: UserId,
      items,
      totals: { subtotal, tax, grand },
      status: finalStatus,
      payment: {
        provider: "stripe",
        sessionId: session.id,
        status: session.payment_status,
        intentId: session.payment_intent || null,
      },
    });

    // --- 3) empty cart
    cart.items = [];
    await cart.save();

    return order;
  } catch (err) {
    console.error("createOrderAndEmptyCart error:", err?.message || err);
    return null;
  }
}

// ---------- boot ----------
const port = process.env.PORT || 3000;
app.listen(port, () => console.log("Server listening on", port));
