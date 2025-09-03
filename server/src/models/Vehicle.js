import { Schema, model } from "mongoose";
const VehicleSchema = new Schema({
  make: String, model: String, year: Number, trim: String, engine: String, transmission: String,
  buildDate: { from: Date, to: Date }
}, { timestamps: true });
VehicleSchema.index({ make:1, model:1, year:1, trim:1, engine:1, transmission:1 });
export default model("Vehicle", VehicleSchema);
