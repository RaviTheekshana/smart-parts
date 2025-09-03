import { Schema, model } from "mongoose";
const PostSchema = new Schema({
  authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  title: String,
  body: String,
  vehicleTags: { make: String, model: String, year: Number },
  partTags: [{ type: Schema.Types.ObjectId, ref: "Part" }],
  votes: { type: Number, default: 0 }
}, { timestamps: true });
PostSchema.index({ createdAt:-1 });
PostSchema.index({ "vehicleTags.make":1, "vehicleTags.model":1, "vehicleTags.year":1 });
export default model("Post", PostSchema);
