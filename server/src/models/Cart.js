import { Schema, model } from "mongoose";
const CartSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", unique: true, required: true },
  selectedVehicle: Schema.Types.Mixed,
  items: [{
    partId: { type: Schema.Types.ObjectId, ref: "Part" },
    qty: { type: Number, default: 1 },
    selectedLocationId: String
  }]
}, { timestamps: true });
CartSchema.index({ userId:1 }, { unique:true });
export default model("Cart", CartSchema);
