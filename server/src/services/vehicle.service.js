import Vehicle from "../models/Vehicle.js";

export async function search({ make, model, year, trim, engine, transmission, page = 1, limit = 20 } = {}) {
  const q = {
    ...(make && { make }),
    ...(model && { model }),
    ...(Number.isInteger(year) && { year }),
    ...(trim && { trim }),
    ...(engine && { engine }),
    ...(transmission && { transmission }),
  };
  const [rows, total] = await Promise.all([
    Vehicle.find(q).sort({ make: 1, model: 1, year: 1 }).skip((page - 1) * limit).limit(limit).lean(),
    Vehicle.countDocuments(q),
  ]);
  return { results: rows, total, page, pages: Math.ceil(total / limit) };
}

export async function distinctModels(make) {
  return Vehicle.distinct("model", { make });
}

export async function distinctYears(make, model) {
  return Vehicle.distinct("year", { make, model });
}
