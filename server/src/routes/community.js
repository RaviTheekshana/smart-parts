import { Router } from "express";
import { auth } from "../middlewares/auth.js";
import Post from "../models/Post.js";
import Answer from "../models/Answer.js";
import Vote from "../models/Vote.js";

const r = Router();

// posts
r.post("/posts", auth(true), async (req, res) => {
  const { title, body, vehicleTags, partTags } = req.body;
  const post = await Post.create({ authorId: req.user._id, title, body, vehicleTags, partTags: partTags || [] });
  res.json({ post });
});

r.get("/posts", async (req, res) => {
  const q = {};
  if (req.query.make) q["vehicleTags.make"] = req.query.make;
  if (req.query.model) q["vehicleTags.model"] = req.query.model;
  if (req.query.year) q["vehicleTags.year"] = Number(req.query.year);
  if (req.query.q) q["$or"] = [{ title: new RegExp(req.query.q, "i") }, { body: new RegExp(req.query.q, "i") }];
  const posts = await Post.find(q).sort({ createdAt: -1 }).limit(50);
  res.json({ posts });
});

r.get("/posts/:id", async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ msg: "Not found" });
  const answers = await Answer.find({ postId: post._id }).sort({ votes: -1, createdAt: 1 });
  res.json({ post, answers });
});

r.post("/posts/:id/answers", auth(true), async (req, res) => {
  const ans = await Answer.create({ postId: req.params.id, authorId: req.user._id, body: req.body.body });
  res.json({ answer: ans });
});

// votes
r.post("/votes", auth(true), async (req, res) => {
  const { targetType, targetId, value } = req.body;
  const prev = await Vote.findOne({ targetType, targetId, userId: req.user._id });
  if (prev) return res.status(409).json({ msg: "Already voted" });
  const v = await Vote.create({ targetType, targetId, userId: req.user._id, value });
  // update counters
  const Model = targetType === "post" ? Post : Answer;
  await Model.findByIdAndUpdate(targetId, { $inc: { votes: value } });
  res.json({ vote: v });
});

export default r;
