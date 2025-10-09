// server/src/routes/admin.parts.js
import { Router } from "express";
import { auth, requireRole } from "../middlewares/auth.js";
import Part from "../models/Part.js";
import Inventory from "../models/Inventory.js";
import multer from "multer";
import { parseString } from "fast-csv";

const r = Router();
r.use(auth(true), requireRole("admin", "dealer"));

/**
 * GET /api/admin/parts?query=&brand=&page=1&limit=20
 */
r.get("/parts", async (req, res) => {
  const { query = "", brand = "", page = 1, limit = 20 } = req.query;
  const q = {};
  if (query) q.$or = [
    { sku:   { $regex: query, $options: "i" } },
    { name:  { $regex: query, $options: "i" } },
    { brand: { $regex: query, $options: "i" } },
  ];
  if (brand) q.brand = brand;

  const pageNum = Math.max(1, Number(page));
  const pageSize = Math.min(100, Math.max(1, Number(limit)));
  const skip = (pageNum - 1) * pageSize;

  const [parts, total] = await Promise.all([
    Part.find(q).sort({ createdAt: -1 }).skip(skip).limit(pageSize).lean(),
    Part.countDocuments(q),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  res.json({ parts, total, page: pageNum, pageSize, totalPages });
});

/**
 * GET /api/admin/parts/:id
 */
r.get("/parts/:id", async (req, res) => {
  const part = await Part.findById(req.params.id).lean();
  if (!part) return res.status(404).json({ msg: "Not found" });
  res.json({ part });
});

/**
 * POST /api/admin/parts
 */
r.post("/parts", async (req, res) => {
  const { sku, name, brand, price } = req.body;
  if (!sku || !name) return res.status(400).json({ msg: "Missing fields" });
  const exists = await Part.findOne({ sku });
  if (exists) return res.status(409).json({ msg: "SKU exists" });
  const part = await Part.create({ sku, name, brand, price: Number(price || 0) });
  res.json({ part });
});

/**
 * PATCH /api/admin/parts/:id
 */
r.patch("/parts/:id", async (req, res) => {
  const { sku, name, brand, price } = req.body;
  const part = await Part.findById(req.params.id);
  if (!part) return res.status(404).json({ msg: "Not found" });
  if (sku) part.sku = sku;
  if (name) part.name = name;
  if (brand) part.brand = brand;
  if (price != null) part.price = Number(price);
  await part.save();
  res.json({ part });
});

/**
 * DELETE /api/admin/parts/:id
 */
r.delete("/parts/:id", async (req, res) => {
  const part = await Part.findByIdAndDelete(req.params.id);
  if (!part) return res.status(404).json({ msg: "Not found" });
  // (optional) also delete inventories: await Inventory.deleteMany({ partId: part._id });
  res.json({ msg: "Deleted" });
});

/**
 * CSV Import
 * POST /api/admin/parts/import?dryRun=true
 * CSV columns (header required):
 *   sku,name,brand,price,locationId,qtyOnHand
 * - Upserts Part by sku
 * - If locationId provided, upsert Inventory row
 */
const upload = multer({ storage: multer.memoryStorage() });

r.post("/parts/import", upload.single("file"), async (req, res) => {
  const { dryRun = "false" } = req.query;
  if (!req.file) return res.status(400).json({ msg: "No file uploaded" });

  try {
    const text = req.file.buffer.toString("utf8");
    const rows = await parseCsvText(text); // array of objects

    const errors = [];
    const partOps = [];
    const invOps = [];

    for (let i = 0; i < rows.length; i++) {
      const raw = rows[i];
      const sku = (raw.sku || "").trim();
      const name = (raw.name || "").trim();
      if (!sku || !name) {
        errors.push({ row: i + 1, msg: "Missing sku or name" });
        continue;
      }
      const brand = (raw.brand || "").trim();
      const price = Number(raw.price ?? 0);

      partOps.push({
        updateOne: {
          filter: { sku },
          update: { $set: { sku, name, brand, price } },
          upsert: true,
        },
      });

      // optional inventory
      const locationId = (raw.locationId || "").trim();
      const qtyOnHand = Number(raw.qtyOnHand ?? NaN);
      if (locationId) {
        if (!Number.isFinite(qtyOnHand)) {
          errors.push({ row: i + 1, msg: "Invalid qtyOnHand" });
        } else {
          // We'll resolve partId after the part upsert (second pass) or just leave an inventory upsert with sku pattern (simpler: do second pass)
          invOps.push({ sku, locationId, qtyOnHand });
        }
      }
    }

    if (String(dryRun) === "true") {
      return res.json({
        preview: {
          totalRows: rows.length,
          willUpsertParts: partOps.length,
          willUpsertInventories: invOps.length,
          errors,
          sample: rows.slice(0, 5),
        },
      });
    }

    // Execute part upserts
    const partResult = partOps.length ? await Part.bulkWrite(partOps) : null;

    // Now resolve sku -> partId for inventory ops
    if (invOps.length) {
      const skus = [...new Set(invOps.map((x) => x.sku))];
      const parts = await Part.find({ sku: { $in: skus } }, { _id: 1, sku: 1 }).lean();
      const map = new Map(parts.map((p) => [p.sku, p._id]));
      const invBulk = invOps
        .filter((x) => map.get(x.sku))
        .map((x) => ({
          updateOne: {
            filter: { partId: map.get(x.sku), locationId: x.locationId },
            update: { $setOnInsert: { qtyReserved: 0 }, $set: { qtyOnHand: x.qtyOnHand } },
            upsert: true,
          },
        }));
      if (invBulk.length) await Inventory.bulkWrite(invBulk);
    }

    res.json({
      ok: true,
      parts: partResult,
      errors,
    });
  } catch (e) {
    console.error("import parts error:", e);
    res.status(500).json({ msg: "Import failed" });
  }
});

// helper: parse CSV text to objects (expects a header row)
function parseCsvText(text) {
  return new Promise((resolve, reject) => {
    const out = [];
    parseString(text, { headers: true, ignoreEmpty: true, trim: true })
      .on("error", reject)
      .on("data", (row) => out.push(row))
      .on("end", () => resolve(out));
  });
}

/* ---------- INVENTORIES ---------- */

// list inventories for a part
r.get("/parts/:id/inventories", async (req, res) => {
  const rows = await Inventory.find({ partId: req.params.id }).sort({ locationId: 1 }).lean();
  res.json({ inventories: rows });
});

// upsert/replace a single inventory row
r.put("/parts/:id/inventories", async (req, res) => {
  const { locationId, qtyOnHand, eta } = req.body;
  if (!locationId) return res.status(400).json({ msg: "locationId required" });
  const doc = await Inventory.findOneAndUpdate(
    { partId: req.params.id, locationId },
    { $setOnInsert: { qtyReserved: 0 }, $set: { qtyOnHand: Number(qtyOnHand ?? 0), eta: eta || null } },
    { upsert: true, new: true }
  );
  res.json({ inventory: doc });
});

// delete a location row
r.delete("/parts/:id/inventories/:locationId", async (req, res) => {
  await Inventory.deleteOne({ partId: req.params.id, locationId: req.params.locationId });
  res.json({ ok: true });
});

/* ---------- FITMENTS ---------- */

// list fitments for a part
r.get("/parts/:id/fitments", async (req, res) => {
  const rows = await Fitment.find({ partId: req.params.id }).sort({ make: 1, model: 1, yearFrom: 1 }).lean();
  res.json({ fitments: rows });
});

// create one fitment
r.post("/parts/:id/fitments", async (req, res) => {
  const { make, model, yearFrom, yearTo, notes } = req.body;
  const f = await Fitment.create({
    partId: req.params.id,
    make: make?.trim(),
    model: model?.trim(),
    yearFrom: Number(yearFrom ?? 0),
    yearTo: Number(yearTo ?? yearFrom ?? 0),
    notes: notes?.trim(),
  });
  res.json({ fitment: f });
});

// delete one fitment
r.delete("/parts/:id/fitments/:fitmentId", async (req, res) => {
  await Fitment.deleteOne({ _id: req.params.fitmentId, partId: req.params.id });
  res.json({ ok: true });
});

export default r;
