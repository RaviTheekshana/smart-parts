"use client";

import useSWR from "swr";
import { api } from "@/lib/api";
import { useState } from "react";

type Row = {
  partId?: string;
  name?: string;
  sku?: string;
  brand?: string;
  totalQty: number;
  totalRevenue?: number;
};

export default function TopSellingTable() {
  const [limit, setLimit] = useState(5);
  const [since, setSince] = useState<string>("");
  const [statuses, setStatuses] = useState<string>("paid,fulfilled,completed");

  const qs = new URLSearchParams({
    limit: String(limit),
    statuses,
    ...(since ? { since } : {}),
  }).toString();

  const { data, error, isLoading } = useSWR<{ rows: Row[] }>(
    `/api/admin/analytics/top-selling?${qs}`,
    api
  );

  const rows = data?.rows ?? [];
  const fmtMoney = (n?: number) =>
    typeof n === "number"
      ? new Intl.NumberFormat(undefined, { style: "currency", currency: "LKR" }).format(n)
      : "—";

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <h3 className="text-lg font-semibold text-slate-900">Top-Selling Parts</h3>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={limit}
            onChange={(e) => (e.target.value && setLimit(Number(e.target.value)))}
            className="border rounded-xl px-2 py-1.5 text-sm"
          >
            {[5,10,20,50].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <input
            type="date"
            value={since}
            onChange={(e) => setSince(e.target.value)}
            className="border rounded-xl px-2 py-1.5 text-sm"
            title="Since (optional)"
          />
          <select
            value={statuses}
            onChange={(e) => setStatuses(e.target.value)}
            className="border rounded-xl px-2 py-1.5 text-sm"
            title="Statuses"
          >
            <option value="paid,fulfilled,completed">paid + fulfilled + completed</option>
            <option value="paid">paid only</option>
            <option value="fulfilled">fulfilled only</option>
            <option value="completed">completed only</option>
          </select>
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
              <th className="py-2 px-4 text-right">Units</th>
              <th className="py-2 px-4 text-right">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={`${r.partId || r.sku || i}`} className="border-b border-slate-200">
                <td className="py-2 px-4 font-mono">{r.sku ?? "—"}</td>
                <td className="py-2 px-4">{r.name ?? "—"}</td>
                <td className="py-2 px-4">{r.brand ?? "—"}</td>
                <td className="py-2 px-4 text-right">{r.totalQty}</td>
                <td className="py-2 px-4 text-right">{fmtMoney(r.totalRevenue)}</td>
              </tr>
            ))}
            {!isLoading && rows.length === 0 && (
              <tr><td className="py-4 px-4 text-center text-slate-500" colSpan={5}>No data.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
