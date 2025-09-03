import { Schema, model } from "mongoose";
const VoteSchema = new Schema({
  targetType: { type: String, enum: ["post","answer"], required: true },
  targetId: { type: Schema.Types.ObjectId, required: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  value: { type: Number, enum: [1,-1], required: true }
}, { timestamps: true });
VoteSchema.index({ targetType:1, targetId:1, userId:1 }, { unique:true });
export default model("Vote", VoteSchema);
