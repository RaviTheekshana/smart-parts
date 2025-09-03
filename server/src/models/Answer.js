import { Schema, model } from "mongoose";
const AnswerSchema = new Schema({
  postId: { type: Schema.Types.ObjectId, ref: "Post", required: true },
  authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  body: String,
  votes: { type: Number, default: 0 },
  accepted: { type: Boolean, default: false }
}, { timestamps: true });
AnswerSchema.index({ postId:1, votes:-1, createdAt:1 });
export default model("Answer", AnswerSchema);
