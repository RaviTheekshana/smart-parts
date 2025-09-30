"use client";
import useSWR from "swr";
import { api } from "@/lib/api";
import Link from "next/link";
import { useMemo, useState } from "react";
import VehicleSelector, { VehicleSelection } from "@/components/VehicleSelector";

function qs(params: Record<string, any>) {
  const u = new URLSearchParams();
  Object.entries(params).forEach(([k,v])=>{
    if (v !== undefined && v !== null && v !== "") u.set(k, String(v));
  });
  const s = u.toString();
  return s ? "?" + s : "";
}

export default function CatalogPage() {
  const [vehicle, setVehicle] = useState<VehicleSelection>({});

  const partsKey = useMemo(() => {
    const query = qs({
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      engine: vehicle.engine,
      transmission: vehicle.transmission
    });
    return "/api/parts" + query;
  }, [vehicle]);

  type PartsResponse = { parts: any[] };
  const { data, error, isLoading } = useSWR<PartsResponse>(partsKey, api);
  const parts = data?.parts || [];

  return (
    <div className="min-h-screen mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:items-center lg:gap-12 lg:px-8 lg:py-28">
      <h1 className="text-2xl font-bold my-4">Catalog</h1>
      <VehicleSelector value={vehicle} onChange={setVehicle} />

      {isLoading && <div className="text-gray-600">Loading parts…</div>}
      {error && <div className="text-red-600">Failed to load parts</div>}

      <div className="grid gap-3">
        {parts.map((p:any)=>
          <div key={p._id} className="bg-white border rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold">{p.name} <span className="text-gray-500 font-normal">({p.sku})</span></div>
                <div className="text-sm text-gray-600">Brand: {p.brand} · Stock: {p.stockTotal}</div>
              </div>
              <Link className="text-sm px-3 py-1.5 rounded-md bg-gray-900 text-white" href={`/parts/${p._id}`}>View</Link>
            </div>
          </div>
        )}
        {parts.length === 0 && !isLoading && <p className="text-gray-600">No parts matched. Try changing filters.</p>}
      </div>
    </div>
  );
}
