import { Router } from "express";
import { auth, requireRole } from "../middlewares/auth.js";
import Testimonial from "../models/Testimonial.js";
import mongoose from "mongoose";

const r = Router();
r.use(auth(true), requireRole("admin","dealer"));

/**
 * GET /api/admin/testimonials?query=&rating=&published=&page=1&limit=20
 */
r.get("/testimonials", async (req, res) => {
  const { query = "", rating = "", published = "", page = "1", limit = "20" } = req.query;

  const q = {};
  if (query) {
    // search in title/body
    const rx = new RegExp(String(query), "i");
    q.$or = [{ title: rx }, { body: rx }];
  }
  if (rating) q.rating = Number(rating);
  if (published === "true") q.published = true;
  if (published === "false") q.published = false;

  const p = Math.max(1, Number(page));
  const l = Math.min(100, Math.max(1, Number(limit)));

  const [items, total] = await Promise.all([
    Testimonial.find(q)
      .sort({ createdAt: -1 })
      .skip((p - 1) * l)
      .limit(l)
      .lean(),
    Testimonial.countDocuments(q),
  ]);

  res.json({ items, total, page: p, limit: l });
});

/** GET /api/admin/testimonials/:id */
r.get("/testimonials/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ msg: "Bad id" });
  const t = await Testimonial.findById(req.params.id).lean();
  if (!t) return res.status(404).json({ msg: "Not found" });
  res.json({ testimonial: t });
});

/** PATCH /api/admin/testimonials/:id */
r.patch("/testimonials/:id", async (req, res) => {
  const { rating, title, body, published } = req.body || {};
  const update = {};
  if (rating != null) update.rating = Math.max(1, Math.min(5, Number(rating)));
  if (title != null) update.title = String(title).slice(0, 120);
  if (body != null) update.body = String(body).slice(0, 2000);
  if (published != null) update.published = !!published;

  const t = await Testimonial.findByIdAndUpdate(req.params.id, { $set: update }, { new: true });
  if (!t) return res.status(404).json({ msg: "Not found" });
  res.json({ testimonial: t });
});

/** DELETE /api/admin/testimonials/:id */
r.delete("/testimonials/:id", async (req, res) => {
  await Testimonial.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

export default r;
