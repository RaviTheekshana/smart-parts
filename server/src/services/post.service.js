import Post from "../models/Post.js";

export async function create({ title, body, authorId, authorName, vehicleTags, partTags }) {
  const doc = await Post.create({ title, body, authorId, authorName, vehicleTags, partTags });
  return doc.toObject();
}

export async function list({ q, tag, page = 1, limit = 20 } = {}) {
  const filter = {};
  if (q) filter.$or = [{ title: new RegExp(q, "i") }, { body: new RegExp(q, "i") }];
  if (tag) filter.partTags = tag;

  const [rows, total] = await Promise.all([
    Post.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Post.countDocuments(filter),
  ]);
  return { results: rows, total, page, pages: Math.ceil(total / limit) };
}

export async function getById(id) {
  return Post.findById(id).lean();
}

export async function removeById(id) {
  await Post.findByIdAndDelete(id);
  return { ok: true };
}

export async function bumpCommentsCount(postId, delta = 1) {
  await Post.updateOne({ _id: postId }, { $inc: { commentsCount: delta } });
}
