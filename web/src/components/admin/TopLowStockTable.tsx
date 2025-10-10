"use client";

import useSWR from "swr";
import { api } from "@/lib/api";
import { useState, useMemo } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

type LowRow = {
  _id: string;
  partId: string;
  locationId?: string;
  qtyOnHand: number;
  qtyReserved?: number;
  available: number;
  threshold: number;
  eta?: string;
  part: {
    _id: string;
    name?: string;
    sku?: string;
    brand?: string;
    price?: number;
  };
};

export default function TopLowStockTable() {
  const [defaultMin, setDefaultMin] = useState(5);
  const [limit, setLimit] = useState<number>(5);          // <— default 5
  const [hideZero, setHideZero] = useState<boolean>(true); // <— default hide zeros
  const [zeroCap, setZeroCap] = useState<number>(5);       // <— if showing zeros, cap how many

  // Ask server for 'limit' rows sorted by availability, then we filter client-side if needed
  const qs = new URLSearchParams({
    defaultMin: String(defaultMin),
    limit: String(limit),
  }).toString();

  const { data, error, isLoading, mutate } = useSWR<{ items: LowRow[]; defaultMin: number }>(
    `/api/admin/alerts/low-stock?${qs}`,
    api
  );

  const rawRows = data?.items ?? [];

  // Client-side shaping: hide zeros OR cap zeros (so you don't drown in 75 zero rows)
  const rows = useMemo(() => {
    if (hideZero) {
      return rawRows.filter(r => (r.available ?? 0) > 0);
    }
    // zero-cap logic
    const zeros: LowRow[] = [];
    const nonZeros: LowRow[] = [];
    for (const r of rawRows) {
      if ((r.available ?? 0) <= 0) zeros.push(r);
      else nonZeros.push(r);
    }
    const keptZeros = zeros.slice(0, Math.max(0, zeroCap));
    return [...keptZeros, ...nonZeros];
  }, [rawRows, hideZero, zeroCap]);

  const badgeClass = (avail: number, thr: number) =>
    avail <= 0
      ? "bg-rose-100 text-rose-700 border-rose-200"
      : avail <= Math.max(1, Math.floor(thr / 2))
      ? "bg-amber-100 text-amber-700 border-amber-200"
      : "bg-yellow-100 text-yellow-700 border-yellow-200";

  const fmtDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString() : "—");

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-amber-100 text-amber-700 inline-flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">Top Low-Stock Items</h3>
          <span className="text-xs text-slate-500">(sorted by lowest available)</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm text-slate-600">Limit</label>
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="border rounded-xl px-2 py-1.5 text-sm"
            title="How many rows to fetch"
          >
            {[5, 10, 50, 100].map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>

          {/* <label className="text-sm text-slate-600 ml-2">Default Min</label>
          <input
            type="number"
            value={defaultMin}
            onChange={(e) => setDefaultMin(Math.max(0, Number(e.target.value) || 0))}
            className="w-24 border rounded-xl px-2 py-1.5 text-sm"
            title="Fallback threshold if Part.minStock is empty"
          /> */}

          <label className="inline-flex items-center gap-2 ml-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={hideZero}
              onChange={(e) => setHideZero(e.target.checked)}
              className="h-4 w-4"
            />
            Hide zero-available
          </label>

          {!hideZero && (
            <>
              <label className="text-sm text-slate-600 ml-2">Zero cap</label>
              <input
                type="number"
                value={zeroCap}
                onChange={(e) => setZeroCap(Math.max(0, Number(e.target.value) || 0))}
                className="w-20 border rounded-xl px-2 py-1.5 text-sm"
                title="Maximum zero-available rows to show"
              />
            </>
          )}

          <button
            onClick={() => mutate()}
            className="ml-2 inline-flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-1.5 text-sm hover:bg-slate-50"
          >
            <RefreshCcw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {error && <div className="text-sm text-red-600">Failed to load.</div>}
      {isLoading && <div className="text-sm text-slate-500">Loading…</div>}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-600">
              <th className="py-2 px-4">SKU</th>
              <th className="py-2 px-4">Name</th>
              <th className="py-2 px-4">Brand</th>
              <th className="py-2 px-4">Location</th>
              <th className="py-2 px-4 text-right">On&nbsp;Hand</th>
              <th className="py-2 px-4 text-right">Reserved</th>
              <th className="py-2 px-4 text-right">Available</th>
              <th className="py-2 px-4 text-right">Min</th>
              <th className="py-2 px-4">ETA</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r._id} className="border-b border-slate-200">
                <td className="py-2 px-4 font-mono">{r.part.sku ?? "—"}</td>
                <td className="py-2 px-4">{r.part.name ?? "—"}</td>
                <td className="py-2 px-4">{r.part.brand ?? "—"}</td>
                <td className="py-2 px-4">{r.locationId ?? "—"}</td>
                <td className="py-2 px-4 text-right">{r.qtyOnHand ?? 0}</td>
                <td className="py-2 px-4 text-right">{r.qtyReserved ?? 0}</td>
                <td className="py-2 px-4 text-right">
                  <span
                    className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full border ${badgeClass(
                      r.available,
                      r.threshold
                    )}`}
                  >
                    {r.available}
                  </span>
                </td>
                <td className="py-2 px-4 text-right">{r.threshold}</td>
                <td className="py-2 px-4">{fmtDate(r.eta)}</td>
              </tr>
            ))}

            {!isLoading && rows.length === 0 && (
              <tr>
                <td className="py-4 px-4 text-center text-slate-500" colSpan={9}>
                  No low-stock items 🎉
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
