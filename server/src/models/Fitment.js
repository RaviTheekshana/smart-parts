import { Schema, model } from "mongoose";
const FitmentSchema = new Schema({
  partId: { type: Schema.Types.ObjectId, ref: "Part", required: true, index: true },
  vehicleQuery: Schema.Types.Mixed, // e.g. { make, model, year: { $in:[...] }, engine, transmission }
  constraints: Schema.Types.Mixed
}, { timestamps: true });
FitmentSchema.index({ "vehicleQuery.make":1, "vehicleQuery.model":1, "vehicleQuery.year":1, "vehicleQuery.engine":1, "vehicleQuery.transmission":1 });
export default model("Fitment", FitmentSchema);
