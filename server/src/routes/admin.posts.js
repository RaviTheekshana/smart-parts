// server/src/routes/admin.posts.js
import { Router } from "express";
import { auth, requireRole } from "../middlewares/auth.js";
import Post from "../models/Post.js";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";

const r = Router();
r.use(auth(true), requireRole("admin", "dealer"));

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const id = Math.random().toString(36).slice(2);
    const ext = path.extname(file.originalname || "").toLowerCase();
    cb(null, `${Date.now()}_${id}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /image\/(png|jpeg|jpg|webp)/.test(file.mimetype);
    cb(ok ? null : new Error("Only images allowed"), ok);
  },
});

/** List with filters */
r.get("/posts", async (req, res) => {
  const { query = "", status = "" } = req.query;
  const q = {};
  if (query) q.title = { $regex: query, $options: "i" };
  if (status === "published") q.published = true;
  if (status === "hidden") q.published = false;

  const posts = await Post.find(q).sort({ createdAt: -1 }).limit(200).lean();
  res.json({ posts });
});

r.get("/posts/:id", async (req, res) => {
  const post = await Post.findById(req.params.id).lean();
  if (!post) return res.status(404).json({ msg: "Not found" });
  res.json({ post });
});

r.patch("/posts/:id", async (req, res) => {
  const { title, body, vehicleTags, partTags, published } = req.body;
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ msg: "Not found" });

  if (title != null) post.title = title;
  if (body != null) post.body = body;
  if (vehicleTags != null) post.vehicleTags = vehicleTags;
  if (partTags != null) post.partTags = partTags;
  if (published != null) post.published = !!published;

  await post.save();
  res.json({ post });
});

r.delete("/posts/:id", async (req, res) => {
  await Post.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

/** Replace image */
r.post("/posts/:id/image", upload.single("image"), async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ msg: "Not found" });

  // delete old file (best effort)
  if (post.imageUrl && post.imageUrl.startsWith("/uploads/")) {
    const p = path.join(process.cwd(), post.imageUrl);
    fs.promises.unlink(p).catch(() => {});
  }

  post.imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
  await post.save();
  res.json({ imageUrl: post.imageUrl });
});

/** Remove image */
r.delete("/posts/:id/image", async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ msg: "Not found" });

  if (post.imageUrl && post.imageUrl.startsWith("/uploads/")) {
    const p = path.join(process.cwd(), post.imageUrl);
    await fs.promises.unlink(p).catch(() => {});
  }
  post.imageUrl = undefined;
  await post.save();
  res.json({ ok: true });
});


export default r;
