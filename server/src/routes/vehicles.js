import { Router } from "express";
import Vehicle from "../models/Vehicle.js";
const r = Router();

// GET /api/vehicles?make=&model=&year=  -> facets & list
r.get("/", async (req, res) => {
  const q = {};
  if (req.query.make) q.make = req.query.make;
  if (req.query.model) q.model = req.query.model;
  if (req.query.year) q.year = Number(req.query.year);
  const vehicles = await Vehicle.find(q).limit(200);
  const facets = {
    makes: await Vehicle.distinct("make"),
    models: req.query.make ? await Vehicle.distinct("model", { make: req.query.make }) : [],
    years: req.query.model ? await Vehicle.distinct("year", { make: req.query.make, model: req.query.model }) : []
  };
  res.json({ vehicles, facets });
});

export default r;
