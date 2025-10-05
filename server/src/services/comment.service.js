import Comment from "../models/Comment.js";
import { bumpCommentsCount } from "./post.service.js";

export async function add({ postId, userId, authorName, text }) {
  const doc = await Comment.create({ postId, userId, authorName, text });
  await bumpCommentsCount(postId, +1);
  return doc.toObject();
}

export async function listByPost(postId, { page = 1, limit = 20 } = {}) {
  const [rows, total] = await Promise.all([
    Comment.find({ postId }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Comment.countDocuments({ postId }),
  ]);
  return { results: rows, total, page, pages: Math.ceil(total / limit) };
}

export async function remove(id) {
  const c = await Comment.findByIdAndDelete(id).lean();
  if (c?.postId) await bumpCommentsCount(c.postId, -1);
  return { ok: true };
}
