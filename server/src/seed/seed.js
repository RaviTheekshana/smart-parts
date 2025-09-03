import "dotenv/config";
import mongoose from "mongoose";
import connect from "../config/db.js";
import User from "../models/User.js";
import Vehicle from "../models/Vehicle.js";
import Part from "../models/Part.js";
import Fitment from "../models/Fitment.js";
import Inventory from "../models/Inventory.js";
import bcrypt from "bcryptjs";

function id(x){ return new mongoose.Types.ObjectId(x); }

await connect();

await Promise.all([User.deleteMany({}), Vehicle.deleteMany({}), Part.deleteMany({}), Fitment.deleteMany({}), Inventory.deleteMany({})]);

// Users
const admin = await User.create({ email: "admin@example.com", passwordHash: await bcrypt.hash("admin123",8), role:"admin", profile:{name:"Admin"} });
const alice = await User.create({ email: "alice@example.com", passwordHash: await bcrypt.hash("alice123",8), role:"customer", profile:{name:"Alice"} });

// Vehicles
const vehicles = await Vehicle.insertMany([
  { make:"Toyota", model:"Corolla", year:2019, trim:"SE", engine:"1.8L", transmission:"AT" },
  { make:"Toyota", model:"Corolla", year:2019, trim:"SE", engine:"1.8L", transmission:"MT" },
  { make:"Honda", model:"Civic", year:2018, trim:"EX", engine:"2.0L", transmission:"AT" }
]);

// Parts
const parts = await Part.insertMany([
  { sku:"RAD-TOY-COR-18-AT", oemCode:"16400-XYZ", name:"Radiator Assembly", categoryPath:["Engine","Cooling"], brand:"Nissens", price:24500 },
  { sku:"BRK-PAD-COR-19", oemCode:"04465-ABC", name:"Front Brake Pads", categoryPath:["Brakes","Pads"], brand:"Advics", price:8500 },
  { sku:"OIL-FLTR-CIV-18", oemCode:"15400-PLM", name:"Oil Filter", categoryPath:["Engine","Filters"], brand:"Honda", price:1800 }
]);

// Fitments
await Fitment.insertMany([
  { partId: parts[0]._id, vehicleQuery: { make:"Toyota", model:"Corolla", year:2019, engine:"1.8L", transmission:"AT" } },
  { partId: parts[1]._id, vehicleQuery: { make:"Toyota", model:"Corolla", year:2019 } },
  { partId: parts[2]._id, vehicleQuery: { make:"Honda", model:"Civic", year:2018 } }
]);

// Inventory
await Inventory.insertMany([
  { partId: parts[0]._id, locationId:"LOC-A", qtyOnHand: 5 },
  { partId: parts[0]._id, locationId:"LOC-B", qtyOnHand: 3 },
  { partId: parts[1]._id, locationId:"LOC-A", qtyOnHand: 20 },
  { partId: parts[2]._id, locationId:"LOC-B", qtyOnHand: 12 }
]);

console.log("Seed complete");
process.exit(0);
