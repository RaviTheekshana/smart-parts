import mongoose from "mongoose";

const VoteSchema = new mongoose.Schema(
  {
    targetType: { type: String, enum: ["post", "answer"], required: true, index: true },
    targetId:   { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    userId:     { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    value:      { type: Number, enum: [-1, 0, 1], default: 0 }, // 0 = unvote
  },
  { timestamps: true }
);

// one vote per (target,user)
VoteSchema.index({ targetType: 1, targetId: 1, userId: 1 }, { unique: true });

const Vote = mongoose.models.Vote || mongoose.model("Vote", VoteSchema);
export default Vote;
