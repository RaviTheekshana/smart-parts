import mongoose from "mongoose";

const TestimonialSchema = new mongoose.Schema(
  {
    userId:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    orderId:  { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    rating:   { type: Number, min: 1, max: 5, required: true },
    title:    { type: String, trim: true, maxlength: 120 },
    body:     { type: String, trim: true, maxlength: 2000 },
    published:{ type: Boolean, default: true }, // visible on public sections if you add a public feed
  },
  { timestamps: true }
);

// 1 testimonial per user per order
TestimonialSchema.index({ userId: 1, orderId: 1 }, { unique: true });

export default mongoose.models.Testimonial || mongoose.model("Testimonial", TestimonialSchema);
