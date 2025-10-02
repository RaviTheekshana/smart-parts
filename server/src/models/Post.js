import mongoose from "mongoose";

const PostSchema = new mongoose.Schema({
  title: { type: String, required: true },
  body: { type: String },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  authorName: { type: String },
  votes: { type: Number, default: 0 },
  commentsCount: { type: Number, default: 0 },
  vehicleTags: { type: Object },   // keep if you use in filters
  partTags: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now },
});

const Post = mongoose.models.Post || mongoose.model("Post", PostSchema);
export default Post;
