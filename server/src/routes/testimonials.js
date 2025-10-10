import { Router } from "express";
import { auth } from "../middlewares/auth.js";
import Testimonial from "../models/Testimonial.js";
import Order from "../models/Order.js";

const r = Router();

/**
 * GET /api/testimonials/my?orderId=...
 * Return the current user's testimonial for a given order (if any)
 */
r.get("/my", auth(true), async (req, res) => {
  const { orderId } = req.query;
  if (!orderId) return res.status(400).json({ msg: "orderId required" });
  const t = await Testimonial.findOne({ userId: req.user._id, orderId });
  res.json({ testimonial: t || null });
});

/**
 * POST /api/testimonials
 * Create or update the current user's testimonial for an order
 * body: { orderId, rating (1-5), title?, body? }
 */
r.post("/", auth(true), async (req, res) => {
  const { orderId, rating, title, body } = req.body || {};
  const rInt = Number(rating);

  if (!orderId) return res.status(400).json({ msg: "orderId required" });
  if (!Number.isFinite(rInt) || rInt < 1 || rInt > 5) {
    return res.status(400).json({ msg: "rating must be 1..5" });
  }

  // Ensure order belongs to user
  const order = await Order.findOne({ _id: orderId, userId: req.user._id });
  if (!order) return res.status(403).json({ msg: "Not your order" });

  // Optionally only allow after payment
  // if (!["paid","fulfilled"].includes(order.status)) return res.status(409).json({ msg: "Order not paid/fulfilled" });

  const update = {
    rating: rInt,
    title: title ? String(title).slice(0, 120) : undefined,
    body: body ? String(body).slice(0, 2000) : undefined,
  };

  const t = await Testimonial.findOneAndUpdate(
    { userId: req.user._id, orderId },
    { $set: update },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  res.json({ testimonial: t });
});

/**
 * (Optional) GET /api/testimonials/stats
 * Returns overall rating stats (for dashboards or future)
 */
r.get("/stats", auth(true), async (_req, res) => {
  const agg = await Testimonial.aggregate([
    { $group: { _id: "$rating", count: { $sum: 1 } } },
  ]);
  const total = agg.reduce((s, x) => s + x.count, 0);
  const weighted =
    agg.reduce((s, x) => s + x._id * x.count, 0) / (total || 1);
  res.json({
    total,
    average: Number(weighted.toFixed(2)),
    breakdown: Object.fromEntries(agg.map((x) => [x._id, x.count])),
  });
});

export default r;
