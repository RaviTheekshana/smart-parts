import { Schema, model } from "mongoose";
const InventorySchema = new Schema({
  partId: { type: Schema.Types.ObjectId, ref: "Part", required: true, index: true },
  locationId: { type: String, required: true },
  qtyOnHand: { type: Number, default: 0 },
  qtyReserved: { type: Number, default: 0 },
  eta: Date
}, { timestamps: true });
InventorySchema.index({ partId:1, locationId:1 }, { unique:true });
export default model("Inventory", InventorySchema);
