import mongoose from "mongoose";

export default async function connect() {
  const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/parts";
  await mongoose.connect(uri);
  console.log("Mongo connected:", uri);
}
