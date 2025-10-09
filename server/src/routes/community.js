import { Router } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";

import { auth } from "../middlewares/auth.js";
import Post from "../models/Post.js";
import Answer from "../models/Answer.js";
import Vote from "../models/Vote.js";

const r = Router();

/* ---------- multer setup for images ---------- */
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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const ok = /image\/(png|jpeg|jpg|webp)/.test(file.mimetype);
    cb(ok ? null : new Error("Only images allowed"), ok);
  },
});

/* ---------- helpers ---------- */
function parsePartTags(input) {
  if (!input) return [];
  if (Array.isArray(input)) return input.filter(Boolean);
  if (typeof input === "string") {
    // JSON array or comma list
    try {
      if (input.trim().startsWith("[")) return JSON.parse(input);
    } catch {}
    return input.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

function parseVehicleTags(input) {
  if (!input) return {};
  if (typeof input === "object") return input;
  if (typeof input === "string") {
    try {
      return JSON.parse(input);
    } catch {
      return {};
    }
  }
  return {};
}

/* ============================================
   POSTS
   ============================================ */

// Create post (multipart to support image)
r.post("/posts", auth(true), upload.single("image"), async (req, res) => {
  try {
    const { title, body, vehicleTags, partTags } = req.body || {};
    if (!title || !String(title).trim()) {
      return res.status(400).json({ msg: "Title is required" });
    }

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

    const post = await Post.create({
      title: String(title).trim(),
      body: body ? String(body) : "",
      authorId: req.user._id,
      authorName: req.user.email,
      imageUrl,
      vehicleTags: parseVehicleTags(vehicleTags),
      partTags: parsePartTags(partTags),
      // published defaults true in model; keep or explicitly set:
      // published: true,
    });

    res.json({ post });
  } catch (err) {
    console.error("Create post error:", err);
    res.status(500).json({ msg: "Failed to create post" });
  }
});

// List posts
// Non-admins see only published; admins see all.
r.get("/posts", auth(false), async (req, res) => {
  try {
    const isAdmin = !!req.user && ["admin", "dealer"].includes(req.user.role);

    const q = {};
    if (!isAdmin) q.published = true;

    // Optional filters
    const { make, model, year, q: qtext } = req.query;

    if (make) q["vehicleTags.make"] = String(make);
    if (model) q["vehicleTags.model"] = String(model);

    if (year) {
      // if you store vehicleTags.yearFrom / yearTo
      const y = Number(year);
      q.$and = [
        { $or: [{ "vehicleTags.yearFrom": { $exists: false } }, { "vehicleTags.yearFrom": { $lte: y } }] },
        { $or: [{ "vehicleTags.yearTo": { $exists: false } }, { "vehicleTags.yearTo": { $gte: y } }] },
      ];
    }

    if (qtext) {
      const rx = new RegExp(String(qtext), "i");
      q.$or = [{ title: rx }, { body: rx }];
    }

    const posts = await Post.find(q)
      .sort({ createdAt: -1 })
      .limit(50)
      .select({
        title: 1,
        body: 1,
        imageUrl: 1,
        votes: 1,
        commentsCount: 1,
        authorName: 1,
        vehicleTags: 1,
        partTags: 1,
        published: 1,
        createdAt: 1,
      })
      .lean();

    res.json({ posts });
  } catch (err) {
    console.error("List posts error:", err);
    res.status(500).json({ msg: "Failed to list posts" });
  }
});

// Get single post + answers
r.get("/posts/:id", async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ msg: "Not found" });
  const answers = await Answer.find({ postId: post._id }).sort({ votes: -1, createdAt: 1 });
  res.json({ post, answers });
});

// Add answer
r.post("/posts/:id/answers", auth(true), async (req, res) => {
  const text = (req.body?.body || "").toString().trim();
  if (!text) return res.status(400).json({ msg: "Answer body required" });
  const ans = await Answer.create({ postId: req.params.id, authorId: req.user._id, body: text });
  // bump count (best effort)
  await Post.findByIdAndUpdate(req.params.id, { $inc: { commentsCount: 1 } }).catch(() => {});
  res.json({ answer: ans });
});

/* ============================================
   VOTES (kept as you had)
   ============================================ */

r.post("/votes", auth(true), async (req, res) => {
  const { targetType, targetId, value } = req.body || {};
  if (!["post", "answer"].includes(targetType)) {
    return res.status(400).json({ msg: "Invalid targetType" });
  }
  const val = Number(value) === -1 ? -1 : 1;

  const prev = await Vote.findOne({ targetType, targetId, userId: req.user._id });
  if (prev) return res.status(409).json({ msg: "Already voted" });

  const v = await Vote.create({ targetType, targetId, userId: req.user._id, value: val });

  const Model = targetType === "post" ? Post : Answer;
  await Model.findByIdAndUpdate(targetId, { $inc: { votes: val } });

  res.json({ vote: v });
});

export default r;
