import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { auth } from "../middlewares/auth.js";

const r = Router();

r.post("/register", async (req, res) => {
  const { email, password, role = "customer", name } = req.body;
  const exists = await User.findOne({ email });
  if (exists) return res.status(409).json({ msg: "Email exists" });
  const passwordHash = await bcrypt.hash(password, 8);
  const user = await User.create({ email, passwordHash, role, profile: { name } });
  res.json({ id: user._id });
});

r.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ msg: "Invalid" });
  const ok = await bcrypt.compare(password, user.passwordHash || "");
  if (!ok) return res.status(401).json({ msg: "Invalid" });
  const token = jwt.sign({ _id: user._id, role: user.role, email: user.email }, process.env.JWT_SECRET || "devsecret", { expiresIn: "7d" });
  res.json({ token });
});

r.get("/me", auth(true), async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("email role profile.name");
    if (!user) return res.status(404).json({ msg: "User not found" });
    res.json({ user });
  } catch (e) {
    console.error("auth/me error:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

export default r;
