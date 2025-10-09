// server/src/routes/posts.js
import { Router } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import Post from "../models/Post.js";
import { auth } from "../middlewares/auth.js";

// ensure uploads dir
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

const r = Router();

/** GET /api/posts (only published for non-admins) */
r.get("/", auth(false), async (req, res) => {
  const isAdmin = !!req.user && ["admin", "dealer"].includes(req.user.role);
  const q = isAdmin ? {} : { published: true };
  const posts = await Post.find(q)
    .sort({ createdAt: -1 })
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

  // Optional: add myVote if you keep votes per-user; skipping for brevity
  res.json({ posts });
});

/** POST /api/posts  (multipart) */
r.post("/", auth(true), upload.single("image"), async (req, res) => {
  const { title, body, partTags, vehicleTags } = req.body;

  const imgUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

  let parsedPartTags = [];
  try {
    // accept CSV ("tag1, tag2") OR JSON array
    if (typeof partTags === "string") {
      parsedPartTags = partTags.trim().startsWith("[")
        ? JSON.parse(partTags)
        : partTags.split(",").map((s) => s.trim()).filter(Boolean);
    } else if (Array.isArray(partTags)) {
      parsedPartTags = partTags;
    }
  } catch { /* ignore */ }

  let parsedVehicle = {};
  try {
    // expect JSON object: { make, model, yearFrom, yearTo, ... }
    if (vehicleTags && typeof vehicleTags === "string") parsedVehicle = JSON.parse(vehicleTags);
    else if (vehicleTags && typeof vehicleTags === "object") parsedVehicle = vehicleTags;
  } catch { /* ignore */ }

  const post = await Post.create({
    title,
    body,
    imageUrl: imgUrl,
    authorId: req.user._id,
    authorName: req.user.email,
    partTags: parsedPartTags,
    vehicleTags: parsedVehicle,
    published: true,
  });

  res.json({ post });
});

/** POST /api/posts/:id/vote  (simple +/- 1) */
r.post("/:id/vote", auth(true), async (req, res) => {
  const { delta } = req.body; // -1 or 1
  const d = Number(delta) === -1 ? -1 : 1;
  const post = await Post.findByIdAndUpdate(
    req.params.id,
    { $inc: { votes: d } },
    { new: true }
  );
  if (!post) return res.status(404).json({ msg: "Not found" });
  res.json({ votes: post.votes });
});

/** Comments endpoints (unchanged in your app) ... */

export default r;
