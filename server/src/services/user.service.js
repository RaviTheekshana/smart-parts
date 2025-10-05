import User from "../models/User.js";

export async function create(data) {
  const doc = await User.create(data);
  return doc.toObject();
}

export async function list({ page = 1, limit = 20, role } = {}) {
  const q = { ...(role && { role }) };
  const [results, total] = await Promise.all([
    User.find(q).sort({ _id: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    User.countDocuments(q),
  ]);
  return { results, total, page, pages: Math.ceil(total / limit) };
}

export async function getById(id) {
  return User.findById(id).lean();
}

export async function updateById(id, patch) {
  return User.findByIdAndUpdate(id, { $set: patch }, { new: true, runValidators: true }).lean();
}

export async function removeById(id) {
  await User.findByIdAndDelete(id);
  return { ok: true };
}
