import { Router } from "express";
import { auth } from "../middlewares/auth.js";
import Cart from "../models/Cart.js";

const r = Router();
r.use(auth(true));

r.get("/", async (req, res) => {
  const cart = await Cart.findOne({ userId: req.user._id }).populate("items.partId");
  res.json({ cart });
});

r.put("/", async (req, res) => {
  const { items = [], selectedVehicle = null } = req.body;
  const cart = await Cart.findOneAndUpdate(
    { userId: req.user._id },
    { $set: { items, selectedVehicle } },
    { upsert: true, new: true }
  );
  res.json({ cart });
});

// POST /api/cart/items  -> add or increment a single line
r.post("/items", async (req, res) => {
  const { partId, qty = 1, selectedLocationId = null } = req.body || {};
  if (!partId || qty <= 0) return res.status(400).json({ msg: "partId and positive qty required" });

  // get or create cart
  let cart = await Cart.findOne({ userId: req.user._id });
  if (!cart) cart = await Cart.create({ userId: req.user._id, items: [] });

  // merge by (partId + location)
  const idx = cart.items.findIndex(
    (it) => String(it.partId) === String(partId) && it.selectedLocationId === selectedLocationId
  );

  if (idx >= 0) cart.items[idx].qty += qty;
  else cart.items.push({ partId, qty, selectedLocationId });

  await cart.save();
  // return populated cart for convenience
  await cart.populate("items.partId");
  res.json({ cart });
});


export default r;
