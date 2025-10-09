// server/src/models/Post.js
import mongoose from "mongoose";

const VehicleTagsSchema = new mongoose.Schema(
  {
    make: String,
    model: String,
    yearFrom: Number,
    yearTo: Number,
    trim: String,
    engine: String,
  },
  { _id: false }
);

const PostSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    body: { type: String },
    // author
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    authorName: { type: String },

    // engagement
    votes: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },

    // new fields
    imageUrl: { type: String },           // single image (keep simple)
    vehicleTags: { type: VehicleTagsSchema, default: {} },
    partTags: { type: [String], default: [] },

    // moderation
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.Post || mongoose.model("Post", PostSchema);
