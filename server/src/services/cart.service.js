import Cart from "../models/Cart.js";

export async function getOrCreate(userId) {
  let cart = await Cart.findOne({ userId }).lean();
  if (!cart) {
    const created = await Cart.create({ userId, items: [] });
    cart = created.toObject();
  }
  return cart;
}

export async function setSelectedVehicle(userId, vehicleObj) {
  const doc = await Cart.findOneAndUpdate(
    { userId },
    { $set: { selectedVehicle: vehicleObj } },
    { upsert: true, new: true }
  ).lean();
  return doc;
}

export async function addItem(userId, { partId, qty = 1, selectedLocationId }) {
  const doc = await Cart.findOneAndUpdate(
    { userId, "items.partId": { $ne: partId } },
    { $push: { items: { partId, qty, selectedLocationId } } },
    { upsert: true, new: true }
  ).lean();

  if (!doc) {
    // item exists → increment qty
    return Cart.findOneAndUpdate(
      { userId, "items.partId": partId },
      { $inc: { "items.$.qty": qty }, ...(selectedLocationId && { $set: { "items.$.selectedLocationId": selectedLocationId } }) },
      { new: true }
    ).lean();
  }
  return doc;
}

export async function updateQty(userId, partId, qty) {
  if (qty <= 0) return removeItem(userId, partId);
  return Cart.findOneAndUpdate(
    { userId, "items.partId": partId },
    { $set: { "items.$.qty": qty } },
    { new: true }
  ).lean();
}

export async function removeItem(userId, partId) {
  return Cart.findOneAndUpdate(
    { userId },
    { $pull: { items: { partId } } },
    { new: true }
  ).lean();
}

export async function clear(userId) {
  return Cart.findOneAndUpdate({ userId }, { $set: { items: [] } }, { new: true }).lean();
}
