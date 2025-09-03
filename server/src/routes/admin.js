import { Router } from "express";
import { auth, requireRole } from "../middlewares/auth.js";
import Part from "../models/Part.js";
import Fitment from "../models/Fitment.js";
import Inventory from "../models/Inventory.js";

const r = Router();
r.use(auth(true), requireRole("admin","dealer"));

// Parts CRUD (minimal)
r.post("/parts", async (req, res) => {
  const part = await Part.create(req.body);
  res.json({ part });
});

// Fitments import (simple JSON array in body for assignment demo)
r.post("/fitments/import", async (req, res) => {
  const { items = [] } = req.body;
  const inserted = await Fitment.insertMany(items);
  res.json({ count: inserted.length });
});

// Inventories import
r.post("/inventories/import", async (req, res) => {
  const { items = [] } = req.body;
  const ops = items.map(i => ({
    updateOne: {
      filter: { partId: i.partId, locationId: i.locationId },
      update: { $setOnInsert: { qtyReserved: 0 }, $set: { eta: i.eta, qtyOnHand: i.qtyOnHand } },
      upsert: true
    }
  }));
  const result = await Inventory.bulkWrite(ops);
  res.json({ result });
});

export default r;
