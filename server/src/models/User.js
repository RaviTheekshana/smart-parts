import { Schema, model } from "mongoose";
const UserSchema = new Schema({
  email: { type: String, unique: true, required: true },
  passwordHash: String,
  role: { type: String, enum: ["admin","dealer","mechanic","customer"], default: "customer" },
  profile: { name: String }
}, { timestamps: true });
export default model("User", UserSchema);
