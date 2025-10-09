"use client";
import { useMemo, useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { api } from "@/lib/api";
import VehicleSelectorModern, { VehicleSelection } from "@/components/VehicleSelector";
import { Search, Package, Warehouse, ChevronRight } from "lucide-react";

function qs(params: Record<string, any>) {
  const u = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") u.set(k, String(v));
  });
  const s = u.toString();
  return s ? "?" + s : "";
}

function formatPrice(p?: number) {
  if (typeof p !== "number") return "-";
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "LKR", maximumFractionDigits: 0 }).format(p);
}

export default function ModernCatalogPage() {
  const [vehicle, setVehicle] = useState<VehicleSelection>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Build API key from vehicle facets
  const partsKey = useMemo(() => {
    const query = qs({
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      engine: vehicle.engine,
      transmission: vehicle.transmission,
      trim: vehicle.trim
    });
    return "/api/parts" + query;
  }, [vehicle]);

  // Define the expected shape of the API response
  type PartsResponse = { parts: any[] };

  // Fetch parts from backend
  const { data = { parts: [] }, error, isLoading } = useSWR<PartsResponse>(partsKey, api);
  const parts: any[] = data.parts;

  // Categories from the API results
  const categories = useMemo(() => {
    const allCats = new Set<string>();
    for (const p of parts) {
      // p.categoryPath is an array like ["Engine","Filters"]
      const cat = Array.isArray(p.categoryPath) ? p.categoryPath.join(" / ") : (p.category || "Other");
      allCats.add(cat);
    }
    return ["all", ...Array.from(allCats).sort()];
  }, [parts]);

  // Client-side filter (search + category)
  const filteredParts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return parts.filter(p => {
      const name = (p.name || "").toLowerCase();
      const sku  = (p.sku || "").toLowerCase();
      const cat  = Array.isArray(p.categoryPath) ? p.categoryPath.join(" / ") : (p.category || "");
      const matchesSearch = !term || name.includes(term) || sku.includes(term);
      const matchesCategory = selectedCategory === "all" || cat === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [parts, searchTerm, selectedCategory]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Hero */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Auto Parts Catalog</h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Find the perfect parts for your vehicle with our comprehensive catalog
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 pb-16">
        {/* Vehicle Selector */}
        <VehicleSelectorModern value={vehicle} onChange={setVehicle} />

        {/* Search + Category pills (separated) */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6 border border-slate-200 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by part name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap gap-2 overflow-x-auto pb-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {cat === "all" ? "All Parts" : cat}
            </button>
          ))}
        </div>
      </div>


        {/* Results header */}
        <div className="flex items-center justify-between mb-6">
          {isLoading ? (
            <h3 className="text-lg font-semibold text-slate-800">Loading parts…</h3>
          ) : error ? (
            <h3 className="text-lg font-semibold text-red-600">Error loading parts</h3>
          ) : (
            <h3 className="text-lg font-semibold text-slate-800">
              {filteredParts.length} {filteredParts.length === 1 ? "Part" : "Parts"} Found
            </h3>
          )}
        </div>

        {/* Parts grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredParts.map((p) => {
            const cat = Array.isArray(p.categoryPath) ? p.categoryPath.join(" / ") : (p.category || "Other");
            const stock = p.stockTotal ?? 0;
            const stockClass = stock > 50 ? "text-green-600" : stock > 20 ? "text-yellow-600" : "text-red-600";
            return (
              <div key={p._id} className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-slate-200 overflow-hidden group">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="w-5 h-5 text-blue-600" />
                        <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">{cat}</span>
                      </div>
                      <h4 className="text-lg font-bold text-slate-800 mb-1 group-hover:text-blue-600 transition-colors">{p.name}</h4>
                      <p className="text-sm text-slate-500 font-mono">{p.sku}</p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Brand</span>
                      <span className="font-semibold text-slate-800">{p.brand || "-"}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 flex items-center gap-1">
                        <Warehouse className="w-4 h-4" />
                        Stock
                      </span>
                      <span className={`font-semibold ${stockClass}`}>{stock} units</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                    <div className="text-2xl font-bold text-blue-600">
                      {typeof p.price === "number" ? formatPrice(p.price) : (p.price || "$—")}
                    </div>
                    <Link
                      href={`/parts/${p._id}`}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-600/30"
                    >
                      View Details
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {!isLoading && !error && filteredParts.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
              <Package className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">No Parts Found</h3>
            <p className="text-slate-600">Try adjusting your filters or search terms</p>
          </div>
        )}
      </div>
    </div>
  );
}
