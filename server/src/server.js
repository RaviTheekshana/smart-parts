import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import connect from "./config/db.js";
import Stripe from "stripe";
import jwt from "jsonwebtoken";
import Cart from "./models/Cart.js";
import Order from "./models/Order.js";
import adminUsers from "./routes/admin.users.js";
import adminParts from "./routes/admin.parts.js";
import adminOrders from "./routes/admin.orders.js";


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


app.use("/api/auth", (await import("./routes/auth.js")).default);
app.use("/api/vehicles", (await import("./routes/vehicles.js")).default);
app.use("/api/parts", (await import("./routes/parts.js")).default);
app.use("/api/cart", (await import("./routes/cart.js")).default);
app.use("/api/orders", (await import("./routes/orders.js")).default);
app.use("/api", (await import("./routes/community.js")).default);
app.use("/api/admin", (await import("./routes/admin.js")).default);
app.use("/api/posts", (await import("./routes/posts.js")).default);

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
          currency: "usd",
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
async function createOrderAndEmptyCart(userId, session, lineItems) {
  if (!userId) return;

  // Idempotency
  const existing = await Order.findOne({ "payment.sessionId": session.id });
  if (existing) return existing;

  const cart = await Cart.findOne({ userId }).populate("items.partId");
  if (!cart) return;

  const items = cart.items.map((it) => ({
    partId: it.partId._id,
    name: it.partId.name,
    price: Number(it.partId.price || 0),
    qty: it.qty,
    locationId: it.selectedLocationId || null,
  }));

  // compute totals as your UI expects
  const subtotal = items.reduce((sum, it) => sum + it.price * it.qty, 0);
  const tax = 0; // plug your tax calc here if needed
  const grand = subtotal + tax;

  // ---- status mapping: fit to your enum ----
  const allowed = (Order.schema?.path("status")?.enumValues || []).map(String);
  const stripePaymentStatus = String(session.payment_status || "paid").toLowerCase();
  let finalStatus =
    allowed.find((v) => v.toLowerCase() === stripePaymentStatus) ||
    allowed.find((v) => /paid|success|completed|complete/.test(v.toLowerCase())) ||
    allowed[0]; // fallback to first enum option or schema default

  const orderDoc = {
    userId,
    items,
    totals: { subtotal, tax, grand },   // <-- ✅ your schema
    payment: {
      provider: "stripe",
      sessionId: session.id,
      status: session.payment_status,   // keep the raw Stripe status here
      intentId: session.payment_intent || null,
    },
  };

  if (finalStatus) orderDoc.status = finalStatus;

  const order = await Order.create(orderDoc);

  // Empty cart
  cart.items = [];
  await cart.save();

  return order;
}

// ---------- boot ----------
const port = process.env.PORT || 3000;
app.listen(port, () => console.log("Server listening on", port));
