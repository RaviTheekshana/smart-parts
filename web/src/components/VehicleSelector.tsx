"use client";
import useSWR from "swr";
import { api } from "@/lib/api";
import React from "react";

export type VehicleSelection = {
  make?: string;
  model?: string;
  year?: number;
  engine?: string;
  transmission?: string;
  trim?: string;
};

type Props = {
  value?: VehicleSelection;
  onChange: (v: VehicleSelection) => void;
};

type FacetsResponse = {
  facets?: {
    makes?: string[];
    models?: string[];
    years?: number[];
  };
};

function useFacets(sel: VehicleSelection) {
  const params = new URLSearchParams();
  if (sel.make) params.set("make", sel.make);
  if (sel.model) params.set("model", sel.model);
  if (sel.year) params.set("year", String(sel.year));
  const key = "/api/vehicles" + (params.toString() ? `?${params.toString()}` : "");
  const { data, error, isLoading } = useSWR<FacetsResponse>(key, api);
  return { data, error, isLoading };
}

export default function VehicleSelector({ value, onChange }: Props) {
  const sel = value || {};
  const { data, error, isLoading } = useFacets(sel);
  const makes: string[] = data?.facets?.makes || [];
  const models: string[] = data?.facets?.models || [];
  const years: number[] = data?.facets?.years || [];

  function set<K extends keyof VehicleSelection>(k: K, v: VehicleSelection[K]) {
    const next = { ...sel, [k]: v };
    if (k === "make") {
      delete next.model; delete next.year; delete next.engine; delete next.transmission; delete next.trim;
    } else if (k === "model") {
      delete next.year; delete next.engine; delete next.transmission; delete next.trim;
    } else if (k === "year") {
      delete next.engine; delete next.transmission; delete next.trim;
    }
    onChange(next);
  }

  return (
    <div className="bg-white border rounded-xl p-4 mb-4">
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <label>
          <div>Make</div>
          <select value={sel.make || ""} onChange={(e)=>set("make", e.target.value || undefined)}>
            <option value="">All</option>
            {makes.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>
        <label>
          <div>Model</div>
          <select value={sel.model || ""} onChange={(e)=>set("model", e.target.value || undefined)} disabled={!sel.make}>
            <option value="">All</option>
            {models.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>
        <label>
          <div>Year</div>
          <select value={sel.year || ""} onChange={(e)=>set("year", e.target.value ? Number(e.target.value) : undefined)} disabled={!sel.model}>
            <option value="">All</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </label>
        <label>
          <div>Engine</div>
          <input placeholder="e.g., 1.8L" value={sel.engine || ""} onChange={(e)=>set("engine", e.target.value || undefined)} />
        </label>
        <label>
          <div>Transmission</div>
          <select value={sel.transmission || ""} onChange={(e)=>set("transmission", e.target.value || undefined)}>
            <option value="">Any</option>
            <option value="AT">AT</option>
            <option value="MT">MT</option>
            <option value="CVT">CVT</option>
          </select>
        </label>
        <label>
          <div>Trim</div>
          <input placeholder="e.g., SE" value={sel.trim || ""} onChange={(e)=>set("trim", e.target.value || undefined)} />
        </label>
      </div>
      {isLoading && <p className="text-sm text-gray-500 mt-2">Loading vehicle facets…</p>}
      {error && <p className="text-sm text-red-600 mt-2">Failed to load vehicle facets.</p>}
    </div>
  );
}
