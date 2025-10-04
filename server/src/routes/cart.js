import { Router } from "express";
import { auth } from "../middlewares/auth.js";
import Cart from "../models/Cart.js";

const r = Router();

// Require auth for everything in this router
r.use(auth(true));

/**
 * GET /api/cart
 */
r.get("/", async (req, res) => {
  const userId = String(req.user._id); // ✅ consistent
  const cart = await Cart.findOne({ userId }).populate("items.partId");
  res.json({ cart });
});

/**
 * PUT /api/cart/items
 * Body: { partId: string, qty: number, selectedLocationId?: string }
 * - Updates quantity for an existing item
 * - If qty <= 0, removes the item
 * - Returns the updated (populated) cart
 */
r.put("/items", async (req, res) => {
  try {
    const { partId, qty, selectedLocationId } = req.body || {};
    const nextQty = Number(qty);

    if (!partId || Number.isNaN(nextQty)) {
      return res.status(400).json({ error: "partId and numeric qty are required" });
    }

    const userId = String(req.user._id); // ✅ consistent
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }

    // Find matching line (by partId + optional location)
    const idx = cart.items.findIndex(
      (it) =>
        String(it.partId) === String(partId) &&
        (selectedLocationId ? it.selectedLocationId === selectedLocationId : true)
    );

    if (idx === -1) {
      return res.status(404).json({ error: "Item not in cart" });
    }

    if (nextQty <= 0) {
      cart.items.splice(idx, 1);
    } else {
      cart.items[idx].qty = nextQty;
    }

    await cart.save();
    cart = await cart.populate("items.partId");
    return res.json({ cart });
  } catch (e) {
    console.error("PUT /api/cart/items error:", e);
    return res.status(500).json({ error: "Failed to update cart item" });
  }
});

/**
 * POST /api/cart/items
 * Body: { partId: string, qty?: number, selectedLocationId?: string|null }
 * - Adds or increments a line
 */
r.post("/items", async (req, res) => {
  try {
    const { partId, qty = 1, selectedLocationId = null } = req.body || {};
    const addQty = Math.max(1, Number(qty) || 1);

    if (!partId) return res.status(400).json({ msg: "partId required" });

    const userId = String(req.user._id); // ✅ consistent
    let cart = await Cart.findOne({ userId });
    if (!cart) cart = await Cart.create({ userId, items: [] });

    // Merge by (partId + location)
    const idx = cart.items.findIndex(
      (it) => String(it.partId) === String(partId) && String(it.selectedLocationId || "") === String(selectedLocationId || "")
    );

    if (idx >= 0) cart.items[idx].qty += addQty;
    else cart.items.push({ partId, qty: addQty, selectedLocationId });

    await cart.save();
    await cart.populate("items.partId");
    res.json({ cart });
  } catch (e) {
    console.error("POST /api/cart/items error:", e);
    res.status(500).json({ error: "Failed to add to cart" });
  }
});

/**
 * DELETE /api/cart/items
 * Body: { partId: string, selectedLocationId?: string|null }
 * - Removes a specific item from the cart
 */
r.delete("/items", async (req, res) => {
  try {
    const { partId, selectedLocationId } = req.body || {};
    if (!partId) {
      return res.status(400).json({ error: "partId required" });
    }

    const userId = String(req.user._id);
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }

    // Find index of item (match by partId + optional location)
    const idx = cart.items.findIndex(
      (it) =>
        String(it.partId) === String(partId) &&
        (selectedLocationId ? it.selectedLocationId === selectedLocationId : true)
    );

    if (idx === -1) {
      return res.status(404).json({ error: "Item not in cart" });
    }

    // Remove item
    cart.items.splice(idx, 1);
    await cart.save();
    await cart.populate("items.partId");

    return res.json({ cart });
  } catch (e) {
    console.error("DELETE /api/cart/items error:", e);
    return res.status(500).json({ error: "Failed to delete cart item" });
  }
});


export default r;
