import mongoose from "mongoose";
import Inventory from "../models/Inventory.js";

export async function getAvailability(partId) {
  return Inventory.find({ partId }).lean();
}

export async function upsertLocationStock({ partId, locationId, qtyOnHand = 0, qtyReserved = 0, eta }) {
  await Inventory.updateOne(
    { partId, locationId },
    { $set: { qtyOnHand, qtyReserved, ...(eta && { eta }) } },
    { upsert: true }
  );
  return getByPartAndLocation(partId, locationId);
}

export async function getByPartAndLocation(partId, locationId) {
  return Inventory.findOne({ partId, locationId }).lean();
}

export async function reserveStock(session, { partId, locationId, qty }) {
  // decrease on-hand, increase reserved atomically
  const res = await Inventory.updateOne(
    { partId, locationId, qtyOnHand: { $gte: qty } },
    { $inc: { qtyOnHand: -qty, qtyReserved: qty } },
    { session }
  );
  if (!res.modifiedCount) throw new Error(`Insufficient stock at ${locationId}`);
}

export async function releaseReserved(session, { partId, locationId, qty }) {
  await Inventory.updateOne(
    { partId, locationId, qtyReserved: { $gte: qty } },
    { $inc: { qtyOnHand: qty, qtyReserved: -qty } },
    { session }
  );
}

export async function commitReserved(session, { partId, locationId, qty }) {
  // when fulfilling, just drop reserved (already removed from on-hand at reservation time)
  await Inventory.updateOne(
    { partId, locationId, qtyReserved: { $gte: qty } },
    { $inc: { qtyReserved: -qty } },
    { session }
  );
}
