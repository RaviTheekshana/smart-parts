// server/src/routes/posts.js
import express from "express";
import mongoose from "mongoose";
import Post from "../models/Post.js";
import Vote from "../models/Vote.js";
import Comment from "../models/Comment.js";
import { auth } from "../middlewares/auth.js";

const router = express.Router();

// GET all posts
router.get("/", auth(false), async (req, res) => {
  const posts = await Post.find({}).sort({ createdAt: -1 }).limit(50).lean();

  // attach myVote if logged in
  let myVotes = {};
  if (req.user) {
    const ids = posts.map((p) => p._id);
    const rows = await Vote.find(
      { targetType: "post", targetId: { $in: ids }, userId: req.user._id },
      { targetId: 1, value: 1 }
    ).lean();
    rows.forEach((v) => (myVotes[String(v.targetId)] = v.value));
  }

  const result = posts.map((p) => ({
    ...p,
    myVote: myVotes[String(p._id)] ?? 0,
    commentsCount: p.commentsCount ?? 0,
  }));

  res.json({ posts: result });
});

// POST new post
router.post("/", auth(true), async (req, res) => {
  const { title, body } = req.body;
  const post = await Post.create({
    authorId: req.user._id,
    authorName: req.user.name || req.user.email,
    title,
    body,
  });
  res.json({ post });
});

// POST vote toggle
router.post("/:id/vote", auth(true), async (req, res) => {
  const delta = req.body.delta === 1 ? 1 : -1;
  const postId = new mongoose.Types.ObjectId(req.params.id);

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const prev = await Vote.findOne({
        targetType: "post",
        targetId: postId,
        userId: req.user._id,
      }).session(session);

      const prevVal = prev?.value ?? 0;
      const nextVal = prevVal === delta ? 0 : delta;
      const diff = nextVal - prevVal;

      await Vote.updateOne(
        { targetType: "post", targetId: postId, userId: req.user._id },
        { $set: { value: nextVal } },
        { upsert: true, session }
      );

      if (diff !== 0) {
        await Post.updateOne({ _id: postId }, { $inc: { votes: diff } }, { session });
      }
    });

    const post = await Post.findById(postId).lean();
    const myVote = await Vote.findOne({
      targetType: "post",
      targetId: postId,
      userId: req.user._id,
    }).lean();

    res.json({ votes: post?.votes ?? 0, myVote: myVote?.value ?? 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Vote failed" });
  } finally {
    session.endSession();
  }
});

// GET comments
router.get("/:id/comments", async (req, res) => {
  const comments = await Comment.find({ postId: req.params.id })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();
  res.json({ comments });
});

// POST comment
router.post("/:id/comments", auth(true), async (req, res) => {
  const text = String(req.body?.text || "").trim();
  if (!text) return res.status(400).json({ msg: "Text required" });

  const comment = await Comment.create({
    postId: req.params.id,
    userId: req.user._id,
    authorName: req.user.name || req.user.email,
    text,
  });
  await Post.findByIdAndUpdate(req.params.id, { $inc: { commentsCount: 1 } });
  res.json(comment);
});

export default router;
