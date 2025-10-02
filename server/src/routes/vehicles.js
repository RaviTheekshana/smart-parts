import { Router } from "express";
import Fitment from "../models/Fitment.js";   // <-- use Fitment for facets

const r = Router();

// GET /api/vehicles?make=&model=&year=
r.get("/", async (req, res) => {
  const { make, model } = req.query;

  // facet lists from fitments
  const makes  = await Fitment.distinct("vehicleQuery.make");
  const models = make
    ? await Fitment.distinct("vehicleQuery.model", { "vehicleQuery.make": make })
    : [];
  const years  = make && model
    ? await Fitment.distinct("vehicleQuery.year", {
        "vehicleQuery.make": make,
        "vehicleQuery.model": model
      })
    : [];

  // (optional) you can also return some example “vehicles” if the UI needs them
  res.json({ vehicles: [], facets: { makes, models, years } });
});

export default r;
