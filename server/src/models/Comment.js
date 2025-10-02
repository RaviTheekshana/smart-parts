import mongoose from "mongoose";

const CommentSchema = new mongoose.Schema({
  postId:     { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true, index: true },
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  authorName: { type: String },
  text:       { type: String, required: true, trim: true, maxlength: 2000 },
  createdAt:  { type: Date, default: Date.now },
});

const Comment = mongoose.models.Comment || mongoose.model("Comment", CommentSchema);
export default Comment;
