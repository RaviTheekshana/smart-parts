import { Router } from "express";
import { auth, requireRole } from "../middlewares/auth.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

const r = Router();
r.use(auth(true), requireRole("admin")); // only admins

// 📦 GET /api/admin/users?query=&role=&page=1&limit=10
r.get("/users", async (req, res) => {
  const { query = "", role, page = 1, limit = 10 } = req.query;
  const q = {};
  if (query) q.email = { $regex: query, $options: "i" };
  if (role) q.role = role;

  const skip = (Number(page) - 1) * Number(limit);
  const [users, total] = await Promise.all([
    User.find(q).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
    User.countDocuments(q)
  ]);

  res.json({ users, total });
});

// 📦 GET /api/admin/users/:id
r.get("/users/:id", async (req, res) => {
  const user = await User.findById(req.params.id).lean();
  if (!user) return res.status(404).json({ msg: "User not found" });
  res.json({ user });
});

// 📦 POST /api/admin/users
r.post("/users", async (req, res) => {
  const { email, password, role = "customer", name } = req.body;
  if (!email || !password) return res.status(400).json({ msg: "Missing fields" });
  const exists = await User.findOne({ email });
  if (exists) return res.status(409).json({ msg: "Email exists" });

  const passwordHash = await bcrypt.hash(password, 8);
  const user = await User.create({
    email,
    passwordHash,
    role,
    profile: { name }
  });

  res.json({ user });
});

// 📦 PATCH /api/admin/users/:id
r.patch("/users/:id", async (req, res) => {
  const { email, role, name, password } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ msg: "User not found" });

  if (email) user.email = email;
  if (role) user.role = role;
  if (name) user.profile.name = name;
  if (password) user.passwordHash = await bcrypt.hash(password, 8);

  await user.save();
  res.json({ user });
});

// 📦 DELETE /api/admin/users/:id
r.delete("/users/:id", async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ msg: "User not found" });
  res.json({ msg: "Deleted" });
});

export default r;
