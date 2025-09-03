import { Router } from "express";
import { auth, requireRole } from "../middlewares/auth.js";
import Cart from "../models/Cart.js";
import Inventory from "../models/Inventory.js";
import Order from "../models/Order.js";
import Part from "../models/Part.js";

const r = Router();

// create order from cart
r.post("/checkout", auth(true), async (req, res) => {
  const cart = await Cart.findOne({ userId: req.user._id }).populate("items.partId");
  if (!cart || !cart.items.length) return res.status(400).json({ msg: "Cart empty" });

  // atomic reserve
  for (const it of cart.items) {
    const ok = await Inventory.updateOne(
      { partId: it.partId._id, locationId: it.selectedLocationId, qtyOnHand: { $gte: it.qty } },
      { $inc: { qtyOnHand: -it.qty, qtyReserved: +it.qty } }
    );
    if (ok.modifiedCount === 0) return res.status(409).json({ msg: `Out of stock: ${it.partId.sku}` });
  }

  const items = cart.items.map(it => ({
    partId: it.partId._id,
    qty: it.qty,
    priceAtOrder: it.partId.price,
    locationId: it.selectedLocationId
  }));
  const subtotal = items.reduce((s, i) => s + i.qty * (i.priceAtOrder || 0), 0);
  const totals = { subtotal, tax: 0, grand: subtotal };
  const order = await Order.create({ userId: req.user._id, items, totals });

  cart.items = [];
  await cart.save();
  res.json({ orderId: order._id, totals });
});

// my orders
r.get("/my", auth(true), async (req, res) => {
  const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(50);
  res.json({ orders });
});

// admin status change
r.patch("/:id/status", auth(true), requireRole("admin","dealer"), async (req, res) => {
  const { status } = req.body;
  const order = await Order.findByIdAndUpdate(req.params.id, { $set: { status } }, { new: true });
  res.json({ order });
});

export default r;
