import "dotenv/config";
import connect from "../config/db.js";
import Part from "../models/Part.js";
import Fitment from "../models/Fitment.js";
import Inventory from "../models/Inventory.js";

await connect();

const brands = ["Toyota","Nissens","Denso","Bosch","Advics","KYB","NGK"];
const categories = [
  ["Brakes","Pads"], ["Brakes","Rotors"],
  ["Engine","Filters"], ["Engine","Cooling"],
  ["Electrical","Charging"], ["Suspension","Shocks"], ["Suspension","Struts"]
];

function rand(a){ return a[Math.floor(Math.random()*a.length)]; }
function rint(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }

const makes = ["Toyota","Honda"];
const models = { Toyota:["Corolla","Yaris"], Honda:["Civic","Fit"] };
const engines = ["1.3L","1.5L","1.8L","2.0L"];
const transmissions = ["AT","MT","CVT"];
const years = [2018,2019,2020,2021];

const parts = [];
for (let i=0; i<150; i++) {
  const cat = rand(categories);
  const brand = rand(brands);
  const sku = `${cat[0].slice(0,3).toUpperCase()}-${cat[1].slice(0,3).toUpperCase()}-${i}`;
  parts.push({
    sku, oemCode: `${rint(10000,99999)}-OEM`,
    name: `${brand} ${cat[1]} ${sku}`,
    categoryPath: cat, brand, price: rint(1500, 90000), images:[]
  });
}
const inserted = await Part.insertMany(parts, { ordered:false });
console.log("Inserted parts:", inserted.length);

// Fitments: each part fits 1–3 random variants
const fitDocs = [];
inserted.forEach(p => {
  const count = rint(1,3);
  for (let k=0;k<count;k++){
    const make = rand(makes);
    const model = rand(models[make]);
    fitDocs.push({
      partId: p._id,
      vehicleQuery: {
        make, model,
        year: rand(years),
        engine: rand(engines),
        transmission: rand(transmissions)
      }
    });
  }
});
await Fitment.insertMany(fitDocs, { ordered:false });
console.log("Inserted fitments:", fitDocs.length);

// Inventory across two locations
const invOps = inserted.flatMap(p => ([
  { partId: p._id, locationId:"LOC-A", qtyOnHand: rint(0,50) },
  { partId: p._id, locationId:"LOC-B", qtyOnHand: rint(0,50) }
]));
await Inventory.insertMany(invOps, { ordered:false });
console.log("Inserted inventory rows:", invOps.length);

process.exit(0);
