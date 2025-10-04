// server/src/routes/admin.metrics.js
import { Router } from "express";
import { auth, requireRole } from "../middlewares/auth.js";
import User from "../models/User.js";
import Part from "../models/Part.js";
import Order from "../models/Order.js";

const r = Router();

// GET /api/admin/metrics
r.get("/metrics", auth(true), requireRole("admin"), async (req, res) => {
  try {
    const [users, parts, orders, paidOrders] = await Promise.all([
      User.countDocuments({}),
      Part.countDocuments({}),
      Order.countDocuments({}),
      Order.countDocuments({ status: "paid" }),
    ]);

    const since = new Date();
    since.setDate(since.getDate() - 30);

    const revenueAgg = await Order.aggregate([
      { $match: { createdAt: { $gte: since }, "totals.grand": { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: "$totals.grand" } } },
      { $project: { _id: 0, total: 1 } },
    ]);
    const revenue30d = { total: revenueAgg[0]?.total ?? 0 };

    const ordersByStatus = await Order.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $project: { _id: 0, status: "$_id", count: 1 } },
    ]);

    const recentOrdersDocs = await Order.find({})
      .sort({ createdAt: -1 })
      .limit(6)
      .lean();

    // decorate with user email and grand total
    const userIds = [...new Set(recentOrdersDocs.map((o) => String(o.userId)))];
    const usersMap = new Map(
      (await User.find({ _id: { $in: userIds } }, { email: 1 }).lean()).map((u) => [String(u._id), u.email])
    );

    const recentOrders = recentOrdersDocs.map((o) => ({
      _id: String(o._id),
      status: o.status,
      grand: o.totals?.grand,
      createdAt: o.createdAt,
      userEmail: usersMap.get(String(o.userId)),
    }));

    const recentUsers = await User.find({}, { email: 1, role: 1, createdAt: 1 })
      .sort({ createdAt: -1 })
      .limit(6)
      .lean();

    res.json({
      metrics: {
        counts: { users, parts, orders, paidOrders },
        revenue30d,
        ordersByStatus,
        recentOrders,
        recentUsers: recentUsers.map((u) => ({ ...u, _id: String(u._id) })),
      },
    });
  } catch (e) {
    console.error("admin metrics error:", e);
    res.status(500).json({ error: "Failed to load metrics" });
  }
});

export default r;
