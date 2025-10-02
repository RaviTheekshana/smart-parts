import "dotenv/config";
import mongoose from "mongoose";
import connect from "../config/db.js";
import Part from "../models/Part.js";
import Fitment from "../models/Fitment.js";
import Inventory from "../models/Inventory.js";

// ---------- Config ----------
const SEED_PREFIX   = process.env.SEED_PREFIX   || "SEED";  // used in SKU
const SEED_RESET    = process.env.SEED_RESET    === "1";    // delete previous batch first
const SEED_PARTS    = parseInt(process.env.SEED_PARTS || "400", 10); // how many parts
const LOCATIONS     = (process.env.SEED_LOCATIONS || "LOC-A,LOC-B,LOC-C").split(",");

// ---------- Helpers ----------
const rand = (a) => a[Math.floor(Math.random() * a.length)];
const rint = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

// ---------- Dataset ----------
const brands = ["Toyota","Nissens","Denso","Bosch","Advics","KYB","NGK","Mahle","Mann","Valeo","ACDelco"];
const categories = [
  ["Brakes","Pads"], ["Brakes","Rotors"], ["Brakes","Calipers"],
  ["Engine","Filters"], ["Engine","Cooling"], ["Engine","Belts"],
  ["Electrical","Charging"], ["Electrical","Ignition"],
  ["Suspension","Shocks"], ["Suspension","Struts"], ["Suspension","Control Arms"],
  ["Drivetrain","CV Joints"], ["Exhaust","Mufflers"], ["Body","Mirrors"]
];

const makes = ["Toyota","Honda","Nissan","Ford","BMW","Hyundai","Kia"];
const modelsByMake = {
  Toyota: ["Corolla","Camry","Yaris","RAV4"],
  Honda: ["Civic","Accord","Fit","CR-V"],
  Nissan: ["Sentra","Altima","Micra","Qashqai"],
  Ford: ["Focus","Fiesta","Fusion","Escape"],
  BMW: ["320i","330i","X1","X3"],
  Hyundai: ["Elantra","Sonata","i20","Tucson"],
  Kia: ["Rio","Cerato","Sportage","Seltos"]
};
const engines = ["1.2L","1.3L","1.5L","1.6L","1.8L","2.0L","2.5L","3.0L"];
const transmissions = ["AT","MT","CVT","DCT"];
const trims = ["Base","L","LE","SE","XLE","Sport","Premium"];
const years = range(2016, 2025);

// ---------- Main ----------
await connect();

if (SEED_RESET) {
  console.log("SEED_RESET=1 → removing previous seed batch...");
  const skuRegex = new RegExp(`^${SEED_PREFIX}-`);
  const parts = await Part.find({ sku: skuRegex }, { _id: 1 });
  const partIds = parts.map(p => p._id);
  await Promise.all([
    Part.deleteMany({ _id: { $in: partIds } }),
    Fitment.deleteMany({ partId: { $in: partIds } }),
    Inventory.deleteMany({ partId: { $in: partIds } }),
  ]);
  console.log(`Deleted previous batch: parts=${parts.length}`);
}

// Create parts
const parts = [];
for (let i = 0; i < SEED_PARTS; i++) {
  const cat = rand(categories);
  const brand = rand(brands);
  const sku = `${SEED_PREFIX}-${cat[0].slice(0,3).toUpperCase()}-${cat[1].slice(0,3).toUpperCase()}-${i}`;
  parts.push({
    sku,
    oemCode: `${rint(10000, 99999)}-OEM`,
    name: `${brand} ${cat[1]} ${sku}`,
    categoryPath: cat,
    brand,
    price: rint(1500, 120000),
    images: []
  });
}

let inserted = [];
try {
  inserted = await Part.insertMany(parts, { ordered: false });
  console.log("Inserted parts:", inserted.length);
} catch (e) {
  console.warn("Part insert warnings (likely duplicates skipped).");
  // In case of duplicates, still fetch all matching parts for the next steps
  const skuRegex = new RegExp(`^${SEED_PREFIX}-`);
  inserted = await Part.find({ sku: skuRegex }, { _id: 1, sku: 1 });
}

// Fitments: each part fits 1–4 random variants
const fitDocs = [];
for (const p of inserted) {
  const count = rint(1, 4);
  for (let k = 0; k < count; k++) {
    const make = rand(makes);
    const model = rand(modelsByMake[make]);
    const doc = {
      partId: p._id,
      vehicleQuery: {
        make,
        model,
        year: rand(years),
        engine: rand(engines),
        transmission: rand(transmissions),
      }
    };
    // sprinkle trims randomly
    if (Math.random() < 0.5) doc.vehicleQuery.trim = rand(trims);
    fitDocs.push(doc);
  }
}

try {
  const added = await Fitment.insertMany(fitDocs, { ordered: false });
  console.log("Inserted fitments:", added.length);
} catch (e) {
  console.warn("Fitment insert warnings (duplicates possible).");
}

// Inventories: upsert per (part, location)
const invOps = [];
for (const p of inserted) {
  for (const loc of LOCATIONS) {
    invOps.push({
      updateOne: {
        filter: { partId: p._id, locationId: loc },
        update: {
          $setOnInsert: { qtyReserved: 0 },
          $set: { qtyOnHand: rint(0, 80), eta: Math.random() < 0.2 ? new Date(`2025-${rint(1,12)}-${rint(1,28)}`) : null }
        },
        upsert: true
      }
    });
  }
}
if (invOps.length) {
  const invRes = await Inventory.bulkWrite(invOps);
  console.log("Inventory upserts:", invRes.upsertedCount ?? 0, "matches:", invRes.matchedCount ?? 0);
}

console.log("Seed complete.");
await mongoose.connection.close();
process.exit(0);
