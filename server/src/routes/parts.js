import { Router } from "express";
import Part from "../models/Part.js";
import Fitment from "../models/Fitment.js";
import Inventory from "../models/Inventory.js";

const r = Router();

/**
 * GET /api/parts
 * Filters:
 *   make, model, year, engine, transmission, trim (vehicle)
 *   category, brand, q (parts)
 */
r.get("/", async (req, res) => {
  // Build a fitment query from vehicle filters
  const fitQ = {};
  for (const k of ["make", "model", "engine", "transmission", "trim"]) {
    if (req.query[k]) fitQ[`vehicleQuery.${k}`] = req.query[k];
  }
  if (req.query.year) fitQ["vehicleQuery.year"] = Number(req.query.year);

  // If vehicle filters provided, constrain to those partIds; else show all parts.
  let partIdFilter = null;
  if (Object.keys(fitQ).length > 0) {
    const fitments = await Fitment.find(fitQ).select("partId");
    const ids = [...new Set(fitments.map(f => String(f.partId)))];
    partIdFilter = ids.length ? { _id: { $in: ids } } : { _id: { $in: [] } };
  }

  // Build the parts filter
  const f = { ...(partIdFilter || {}) };
  if (req.query.category) f.categoryPath = req.query.category;
  if (req.query.brand) f.brand = req.query.brand;
  if (req.query.q) f.name = new RegExp(req.query.q, "i");

  const parts = await Part.find(f).limit(100);

  // Attach simple total stock from Inventory
  const ids = parts.map(p => p._id);
  const inv = await Inventory.aggregate([
    { $match: { partId: { $in: ids } } },
    { $group: { _id: "$partId", total: { $sum: "$qtyOnHand" } } }
  ]);
  const invMap = Object.fromEntries(inv.map(i => [String(i._id), i.total]));
  const enriched = parts.map(p => ({ ...p.toObject(), stockTotal: invMap[String(p._id)] || 0 }));

  res.json({ parts: enriched, count: enriched.length });
});

/**
 * GET /api/parts/:id
 * Returns a single part with per-location stock.
 */
r.get("/:id", async (req, res) => {
  const id = req.params.id;
  const part = await Part.findById(id);
  if (!part) return res.status(404).json({ msg: "Not found" });
  const stock = await Inventory.find({ partId: part._id });
  res.json({ part, stock });
});

export default r;
