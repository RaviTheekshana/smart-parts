import { Schema, model } from "mongoose";
const OrderSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required:true },
  items: [{
    partId: { type: Schema.Types.ObjectId, ref: "Part" },
    qty: Number,
    priceAtOrder: Number,
    locationId: String
  }],
  totals: { subtotal: Number, tax: Number, grand: Number },
  status: { type: String, enum: ["pending","paid","cancelled","fulfilled"], default: "pending" }
}, { timestamps: true });
OrderSchema.index({ userId:1, createdAt:-1 });
export default model("Order", OrderSchema);
