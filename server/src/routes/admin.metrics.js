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

r.get("/revenue/monthly", auth(true), requireRole("admin", "dealer"), async (req, res) => {
  try {
    const monthsBack = parseInt(req.query.months || "12"); // default last 12 months

    // Get start date of N months ago
    const since = new Date();
    since.setMonth(since.getMonth() - monthsBack);
    since.setDate(1); // beginning of month

    const result = await Order.aggregate([
      {
        $match: {
          status: "paid",
          "totals.grand": { $gt: 0 },
          createdAt: { $gte: since },
        },
      },
      {
        // group by year + month
        $group: {
          _id: {
            y: { $year: "$createdAt" },
            m: { $month: "$createdAt" },
          },
          total: { $sum: "$totals.grand" },
        },
      },
      { $sort: { "_id.y": 1, "_id.m": 1 } },
      {
        // format as { month: "2025-09", total: 12345 }
        $project: {
          _id: 0,
          month: {
            $concat: [
              { $toString: "$_id.y" },
              "-",
              {
                $cond: [
                  { $lt: ["$_id.m", 10] },
                  { $concat: ["0", { $toString: "$_id.m" }] },
                  { $toString: "$_id.m" },
                ],
              },
            ],
          },
          total: { $round: ["$total", 2] },
        },
      },
    ]);

    res.json({ revenue: result });
  } catch (err) {
    console.error("monthly revenue error:", err);
    res.status(500).json({ msg: "Failed to calculate revenue" });
  }
});

export default r;
