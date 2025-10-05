import Fitment from "../models/Fitment.js";

export async function addToPart(partId, vehicleQuery, constraints) {
  const doc = await Fitment.create({ partId, vehicleQuery, constraints });
  return doc.toObject();
}

export async function listByPart(partId, { page = 1, limit = 50 } = {}) {
  const q = { partId };
  const [rows, total] = await Promise.all([
    Fitment.find(q).sort({ _id: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Fitment.countDocuments(q),
  ]);
  return { results: rows, total, page, pages: Math.ceil(total / limit) };
}

export async function remove(id) {
  await Fitment.findByIdAndDelete(id);
  return { ok: true };
}

// find parts that match a concrete vehicle object, via pre-computed fitments
export async function searchPartIdsForVehicle({ make, model, year, engine, transmission }) {
  const q = {
    ...(make && { "vehicleQuery.make": make }),
    ...(model && { "vehicleQuery.model": model }),
    ...(typeof year === "number" && { "vehicleQuery.year": year }),
    ...(engine && { "vehicleQuery.engine": engine }),
    ...(transmission && { "vehicleQuery.transmission": transmission }),
  };
  const rows = await Fitment.find(q, { partId: 1 }).lean();
  return [...new Set(rows.map(r => String(r.partId)))];
}
