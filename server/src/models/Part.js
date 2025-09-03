import { Schema, model } from "mongoose";
const PartSchema = new Schema({
  sku: { type: String, unique: true, required: true },
  oemCode: String,
  name: String,
  categoryPath: [String],
  specs: Schema.Types.Mixed,
  brand: String,
  price: Number,
  images: [String]
}, { timestamps: true });
PartSchema.index({ categoryPath:1 });
export default model("Part", PartSchema);
