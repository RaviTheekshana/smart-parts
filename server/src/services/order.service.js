import mongoose from "mongoose";
import Order from "../models/Order.js";
import { reserveStock, releaseReserved, commitReserved } from "./inventory.service.js";
import Cart from "../models/Cart.js";

export async function placeOrderFromCart(userId) {
  const session = await mongoose.startSession();
  let order;
  try {
    await session.withTransaction(async () => {
      const cart = await Cart.findOne({ userId }).lean();
      if (!cart || !cart.items?.length) throw new Error("Cart is empty");

      // Reserve stock for each item at chosen location
      for (const it of cart.items) {
        if (!it.selectedLocationId) throw new Error("Location required for each cart item");
        await reserveStock(session, { partId: it.partId, locationId: it.selectedLocationId, qty: it.qty });
      }

      const items = cart.items.map(it => ({
        partId: it.partId,
        qty: it.qty,
        priceAtOrder: undefined, // optional: set from Part.price if needed by caller
        locationId: it.selectedLocationId,
      }));

      const totals = computeTotals(items); // stub—replace if you have tax/shipping logic

      [order] = await Order.create(
        [{ userId, items, totals, status: "pending" }],
        { session }
      );

      // Clear cart after creating order (still inside txn)
      await Cart.updateOne({ userId }, { $set: { items: [] } }, { session });
    });
    return order.toObject();
  } finally {
    session.endSession();
  }
}

export async function markPaid(orderId) {
  return Order.findByIdAndUpdate(orderId, { $set: { status: "paid" } }, { new: true }).lean();
}

export async function cancel(orderId) {
  // release any reserved quantities back (best-effort; no session here)
  const ord = await Order.findById(orderId).lean();
  if (!ord) return null;
  for (const it of ord.items) {
    await releaseReserved(null, { partId: it.partId, locationId: it.locationId, qty: it.qty });
  }
  return Order.findByIdAndUpdate(orderId, { $set: { status: "cancelled" } }, { new: true }).lean();
}

export async function fulfill(orderId) {
  const ord = await Order.findById(orderId).lean();
  if (!ord) return null;
  for (const it of ord.items) {
    await commitReserved(null, { partId: it.partId, locationId: it.locationId, qty: it.qty });
  }
  return Order.findByIdAndUpdate(orderId, { $set: { status: "fulfilled" } }, { new: true }).lean();
}

export async function list({ userId, status, page = 1, limit = 20 } = {}) {
  const q = { ...(userId && { userId }), ...(status && { status }) };
  const [rows, total] = await Promise.all([
    Order.find(q).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Order.countDocuments(q),
  ]);
  return { results: rows, total, page, pages: Math.ceil(total / limit) };
}

function computeTotals(items) {
  const subtotal = items.reduce((s, it) => s + (it.priceAtOrder || 0) * (it.qty || 0), 0);
  const tax = 0;
  const grand = subtotal + tax;
  return { subtotal, tax, grand };
}
