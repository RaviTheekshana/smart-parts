// server/src/routes/posts.js
import { Router } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";

import { auth } from "../middlewares/auth.js";
import Post from "../models/Post.js";
import Comment from "../models/Comment.js";
import Vote from "../models/Vote.js";

const r = Router();

/* ---------------------- uploads setup ---------------------- */
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
    cb(ok ? null : new Error("Only images (png/jpeg/webp) allowed"), ok);
  },
});

/* ---------------------- helpers ---------------------- */
function parsePartTags(input) {
  if (!input) return [];
  if (Array.isArray(input)) return input.filter(Boolean);
  if (typeof input === "string") {
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
    try { return JSON.parse(input); } catch { return {}; }
  }
  return {};
}

/* =======================================================
   POSTS
   ======================================================= */

// List posts (non-admins see only published)
r.get("/", auth(false), async (req, res) => {
  const isAdmin = !!req.user && ["admin", "dealer"].includes(req.user.role);
  const q = {};
  if (!isAdmin) q.published = true;

  // Optional filters: q (text), make/model/year
  const { q: qtext, make, model, year } = req.query;
  if (qtext) {
    const rx = new RegExp(String(qtext), "i");
    q.$or = [{ title: rx }, { body: rx }];
  }
  if (make) q["vehicleTags.make"] = String(make);
  if (model) q["vehicleTags.model"] = String(model);
  if (year) {
    const y = Number(year);
    q.$and = [
      { $or: [{ "vehicleTags.yearFrom": { $exists: false } }, { "vehicleTags.yearFrom": { $lte: y } }] },
      { $or: [{ "vehicleTags.yearTo": { $exists: false } }, { "vehicleTags.yearTo": { $gte: y } }] },
    ];
  }

  const posts = await Post.find(q)
    .sort({ createdAt: -1 })
    .limit(50)
    .select({
      title: 1,
      body: 1,
      imageUrl: 1,           // relative path like "/uploads/..."
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
});

// Create post (multipart to support image)
r.post("/", auth(true), upload.single("image"), async (req, res) => {
  try {
    const { title, body, partTags, vehicleTags } = req.body || {};
    if (!title || !String(title).trim()) {
      return res.status(400).json({ msg: "Title is required" });
    }

    // store RELATIVE url (frontend should render `${NEXT_PUBLIC_API}${imageUrl}`)
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

    const post = await Post.create({
      title: String(title).trim(),
      body: body ? String(body) : "",
      authorId: req.user._id,
      authorName: req.user.email,
      imageUrl,
      partTags: parsePartTags(partTags),
      vehicleTags: parseVehicleTags(vehicleTags),
      // published defaults to true in the model; keep or set explicitly
      // published: true,
    });

    res.json({ post });
  } catch (err) {
    console.error("Create post error:", err);
    res.status(500).json({ msg: "Failed to create post" });
  }
});

// Get single post (optionally include things your UI needs)
r.get("/:id", async (req, res) => {
  const post = await Post.findById(req.params.id).lean();
  if (!post) return res.status(404).json({ msg: "Not found" });
  res.json({ post });
});

/* =======================================================
   COMMENTS
   ======================================================= */

// List comments for a post
r.get("/:id/comments", async (req, res) => {
  const postId = req.params.id;
  const comments = await Comment.find({ postId })
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();
  res.json({ comments });
});

// Add a comment
r.post("/:id/comments", auth(true), async (req, res) => {
  try {
    const postId = req.params.id;
    const text = (req.body?.text || "").toString().trim();
    if (!text) return res.status(400).json({ msg: "Comment text is required" });
    if (text.length > 2000) return res.status(400).json({ msg: "Comment too long (max 2000 chars)" });

    const post = await Post.findById(postId).lean();
    if (!post) return res.status(404).json({ msg: "Post not found" });

    const authorName = req.user?.email || req.user?.name || "User";

    const comment = await Comment.create({
      postId,
      userId: req.user._id,
      authorName,
      text,
    });

    // bump count (best effort)
    await Post.findByIdAndUpdate(postId, { $inc: { commentsCount: 1 } }).catch(() => {});
    res.json({ comment });
  } catch (e) {
    console.error("Create comment error:", e);
    res.status(500).json({ msg: "Failed to add comment" });
  }
});

/* =======================================================
   VOTES (simple +/- 1 on posts)
   ======================================================= */

// POST /posts/:id/vote
r.post("/:id/vote", auth(true), async (req, res) => {
  const postId = req.params.id;
  const userId = req.user._id;
  const delta = Number(req.body?.delta) === -1 ? -1 : 1;

  const post = await Post.findById(postId).select("_id votes");
  if (!post) return res.status(404).json({ msg: "Not found" });

  let vote = await Vote.findOne({ targetType: "post", targetId: postId, userId });

  // If no record, start from neutral (0)
  if (!vote) {
    // First-time single-step: neutral (0) -> delta (+1 or -1)
    await Vote.create({ targetType: "post", targetId: postId, userId, value: delta });
    const updated = await Post.findByIdAndUpdate(postId, { $inc: { votes: delta } }, { new: true });
    if (!updated) return res.status(404).json({ msg: "Not found" });
    return res.json({ votes: updated.votes, myVote: delta });
  }

  const prev = vote.value ?? 0;

  // Same direction -> no-op (idempotent)
  if (prev === delta) {
    const fresh = await Post.findById(postId).select("votes");
    if (!fresh) return res.status(404).json({ msg: "Not found" });
    return res.json({ votes: fresh.votes, myVote: prev, unchanged: true });
  }

  // Single-step transition
  // Up click (delta=+1): -1 -> 0 (diff +1), 0 -> +1 (diff +1)
  // Down click (delta=-1): +1 -> 0 (diff -1), 0 -> -1 (diff -1)
  let nextValue = prev;
  let diff = 0;

  if (delta === 1) {
    if (prev === -1) { nextValue = 0;  diff = +1; }
    else if (prev === 0) { nextValue = +1; diff = +1; }
  } else { // delta === -1
    if (prev === +1) { nextValue = 0;  diff = -1; }
    else if (prev === 0) { nextValue = -1; diff = -1; }
  }

  if (diff === 0) {
    const fresh = await Post.findById(postId).select("votes");
    if (!fresh) return res.status(404).json({ msg: "Not found" });
    return res.json({ votes: fresh.votes, myVote: prev, unchanged: true });
  }

  await Vote.updateOne({ _id: vote._id }, { $set: { value: nextValue } });
  const updated = await Post.findByIdAndUpdate(postId, { $inc: { votes: diff } }, { new: true });

  if (!updated) return res.status(404).json({ msg: "Not found" });
  return res.json({ votes: updated.votes, myVote: nextValue });
});



export default r;
