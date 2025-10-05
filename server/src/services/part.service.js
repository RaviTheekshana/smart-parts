import Part from "../models/Part.js";

export async function create(data) {
  const doc = await Part.create(data);
  return doc.toObject();
}

export async function list({ q, brand, category, page = 1, limit = 20 } = {}) {
  const filter = {
    ...(brand && { brand }),
    ...(category && { categoryPath: category }),
  };
  if (q) {
    // simple text-like search on name/oemCode/sku
    filter.$or = [
      { name: new RegExp(q, "i") },
      { oemCode: new RegExp(q, "i") },
      { sku: new RegExp(q, "i") },
    ];
  }

  const cursor = Part.find(
    filter,
    { sku: 1, name: 1, brand: 1, categoryPath: 1, price: 1, images: { $slice: 1 } }
  )
    .sort({ _id: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  const [results, total] = await Promise.all([cursor, Part.countDocuments(filter)]);
  return { results, total, page, pages: Math.ceil(total / limit) };
}

export async function getById(id) {
  return Part.findById(id).lean();
}

export async function updateById(id, patch) {
  return Part.findByIdAndUpdate(id, { $set: patch }, { new: true, runValidators: true }).lean();
}

export async function removeById(id) {
  await Part.findByIdAndDelete(id);
  return { ok: true };
}

export async function setPrice(id, price) {
  return Part.findByIdAndUpdate(id, { $set: { price } }, { new: true }).lean();
}
