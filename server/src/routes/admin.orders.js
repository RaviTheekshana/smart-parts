import { Router } from "express";
import { auth, requireRole } from "../middlewares/auth.js";
import Order from "../models/Order.js";
import Part from "../models/Part.js";
import Stripe from "stripe";

const r = Router();
r.use(auth(true), requireRole("admin", "dealer"));

/**
 * GET /api/admin/orders?query=&status=&page=1&limit=20
 * query matches order _id (last 6) or user email (if populated) or part name
 */
r.get("/orders", async (req, res) => {
  const { query = "", status = "", page = 1, limit = 20 } = req.query;

  const filter = {};
  if (status) filter.status = status;

  const pageNum = Math.max(1, Number(page));
  const pageSize = Math.min(100, Math.max(1, Number(limit)));
  const skip = (pageNum - 1) * pageSize;

  // Basic query; for complex search, use aggregation
  const agg = [
    { $match: filter },
    { $sort: { createdAt: -1 } },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
  ];

  if (query) {
    agg.push({
      $match: {
        $or: [
          { "user.email": { $regex: query, $options: "i" } },
          { _id: { $regex: query, $options: "i" } }, // if you use string ids
        ],
      },
    });
  }

  agg.push({ $facet: {
    rows: [{ $skip: skip }, { $limit: pageSize }],
    meta: [{ $count: "total" }]
  }});

  const out = await Order.aggregate(agg);
  const rows = out[0]?.rows ?? [];
  const total = out[0]?.meta?.[0]?.total ?? 0;

  res.json({
    orders: rows.map(o => ({
      _id: o._id,
      userEmail: o.user?.email,
      status: o.status,
      grand: o.totals?.grand ?? 0,
      createdAt: o.createdAt,
    })),
    total,
    page: pageNum,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });
});

/** GET /api/admin/orders/:id  */
r.get("/orders/:id", async (req, res) => {
  const o = await Order.findById(req.params.id).lean();
  if (!o) return res.status(404).json({ msg: "Not found" });

  // hydrate item names if missing
  const needsNames = o.items?.some(i => !i.name);
  if (needsNames) {
    const ids = o.items.map(i => i.partId).filter(Boolean);
    const parts = await Part.find({ _id: { $in: ids } }, { _id: 1, name: 1, sku: 1 }).lean();
    const map = new Map(parts.map(p => [String(p._id), p]));
    o.items = o.items.map(i => ({
      ...i,
      name: i.name || map.get(String(i.partId))?.name,
      sku: map.get(String(i.partId))?.sku,
    }));
  }

  res.json({ order: o });
});

/** PATCH /api/admin/orders/:id/status  (pending|paid|cancelled|fulfilled) */
r.patch("/orders/:id/status", async (req, res) => {
  const { status } = req.body;
  const allow = ["pending", "paid", "cancelled", "fulfilled"];
  if (!allow.includes(status)) return res.status(400).json({ msg: "Invalid status" });

  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { $set: { status } },
    { new: true }
  );
  if (!order) return res.status(404).json({ msg: "Not found" });
  res.json({ order });
});

/** (Optional) POST /api/admin/orders/:id/refund  — Stripe refund */
r.post("/orders/:id/refund", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).lean();
    if (!order) return res.status(404).json({ msg: "Not found" });
    if (order.payment?.provider !== "stripe") {
      return res.status(400).json({ msg: "Not a Stripe order" });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });
    // Refund by payment_intent if you saved it, or by charge id via session expand
    const intentId = order.payment?.intentId;
    if (!intentId) return res.status(400).json({ msg: "Missing payment intent id" });

    const refund = await stripe.refunds.create({ payment_intent: intentId });
    // Optionally mark status
    await Order.findByIdAndUpdate(order._id, { $set: { status: "cancelled" } });

    res.json({ refundId: refund.id, status: "cancelled" });
  } catch (e) {
    console.error("refund error", e);
    res.status(500).json({ msg: "Refund failed" });
  }
});

/**
 * GET /api/admin/analytics/top-selling?limit=10&statuses=paid,fulfilled,completed
 * Optional: since=YYYY-MM-DD   (limit to recent window)
 */
r.get("/analytics/top-selling", async (req, res) => {
  try {
    const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 10)));
    const statuses = String(req.query.statuses ?? "paid,fulfilled,completed")
      .split(",").map(s => s.trim()).filter(Boolean);

    const sinceStr = String(req.query.since ?? "").trim();
    const since = sinceStr ? new Date(sinceStr) : null;

    const match = { status: { $in: statuses } };
    if (since) match.createdAt = { $gte: since };

    const rows = await Order.aggregate([
      { $match: match },
      {
        $set: {
          items: {
            $cond: [
              { $isArray: "$items" },
              "$items",
              [{ $ifNull: ["$items", null] }]
            ]
          }
        }
      },
      { $unwind: "$items" },
      {
        $addFields: {
          _qty:   { $toDouble: { $ifNull: ["$items.qty", 0] } },
          _price: { $toDouble: { $ifNull: [
            "$items.priceAtOrder", "$items.price", "$items.unitPrice", "$items.priceEach", 0
          ] } }
        }
      },
      {
        $group: {
          _id: "$items.partId",
          totalQty:     { $sum: "$_qty" },
          totalRevenue: { $sum: { $multiply: ["$_qty", "$_price"] } }
        }
      },
      { $sort: { totalQty: -1, totalRevenue: -1 } },
      { $limit: limit },
      {
        $lookup: { from: "parts", localField: "_id", foreignField: "_id", as: "part" }
      },
      { $unwind: { path: "$part", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          partId: "$_id",
          sku: "$part.sku",
          name: "$part.name",
          brand: "$part.brand",
          totalQty: 1,
          totalRevenue: { $round: ["$totalRevenue", 2] }
        }
      }
    ]);

    res.json({ rows });
  } catch (e) {
    console.error("top-selling error:", e);
    res.status(500).json({ msg: "Failed to compute top selling" });
  }
});




export default r;
