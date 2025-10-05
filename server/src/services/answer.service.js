import Answer from "../models/Answer.js";

export async function add({ postId, authorId, body }) {
  const doc = await Answer.create({ postId, authorId, body });
  return doc.toObject();
}

export async function listByPost(postId, { page = 1, limit = 20, sort = "-accepted,-votes,-createdAt" } = {}) {
  const sortObj = sort
    .split(",")
    .reduce((acc, k) => ({ ...acc, [k.replace("-", "")]: k.startsWith("-") ? -1 : 1 }), {});
  const [rows, total] = await Promise.all([
    Answer.find({ postId }).sort(sortObj).skip((page - 1) * limit).limit(limit).lean(),
    Answer.countDocuments({ postId }),
  ]);
  return { results: rows, total, page, pages: Math.ceil(total / limit) };
}

export async function accept(postId, answerId) {
  // one accepted answer per post
  await Answer.updateMany({ postId, accepted: true }, { $set: { accepted: false } });
  await Answer.updateOne({ _id: answerId, postId }, { $set: { accepted: true } });
  return { ok: true };
}
