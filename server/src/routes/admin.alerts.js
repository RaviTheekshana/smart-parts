import { Router } from "express";
import { auth, requireRole } from "../middlewares/auth.js";
import Inventory from "../models/Inventory.js";
import mongoose from "mongoose";

const r = Router();
r.use(auth(true), requireRole("admin", "dealer"));

/**
 * GET /api/admin/alerts/low-stock?defaultMin=5&limit=100&countOnly=0
 * Returns low stock rows joined with parts.
 * - defaultMin: fallback threshold if part.minStock is null/0
 * - countOnly: set to 1 to just get a {count}
 */
r.get("/alerts/low-stock", async (req, res) => {
  const defaultMin = Math.max(0, Number(req.query.defaultMin ?? 5));
  const limit = Math.min(500, Math.max(1, Number(req.query.limit ?? 100)));
  const countOnly = String(req.query.countOnly ?? "0") === "1";

  const pipeline = [
    { $lookup: {
        from: "parts",
        localField: "partId",
        foreignField: "_id",
        as: "part",
        pipeline: [
          { $project: { name: 1, sku: 1, brand: 1, minStock: 1, price: 1 } },
        ]
    }},
    { $unwind: "$part" },
    { $addFields: {
        available: { $subtract: ["$qtyOnHand", { $ifNull: ["$qtyReserved", 0] }] },
        threshold: { $cond: [
          { $or: [
            { $eq: [{ $ifNull: ["$part.minStock", 0] }, 0] },
            { $eq: ["$part.minStock", null] }
          ]},
          defaultMin,
          "$part.minStock"
        ]}
    }},
    // $expr to compare calculated fields
    { $match: { $expr: { $lte: ["$available", "$threshold"] } } },
  ];

  if (countOnly) {
    const result = await Inventory.aggregate([
      ...pipeline,
      { $count: "count" }
    ]);
    const count = result?.[0]?.count ?? 0;
    return res.json({ count });
  }

  const data = await Inventory.aggregate([
    ...pipeline,
    { $sort: { available: 1, "part.sku": 1 } },
    { $limit: limit },
    { $project: {
        _id: 1,
        partId: 1,
        locationId: 1,
        qtyOnHand: 1,
        qtyReserved: 1,
        available: 1,
        threshold: 1,
        eta: 1,
        "part._id": 1,
        "part.name": 1,
        "part.sku": 1,
        "part.brand": 1,
        "part.price": 1,
      }
    }
  ]);

  res.json({ items: data, defaultMin });
});

export default r;
