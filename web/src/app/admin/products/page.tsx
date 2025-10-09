"use client";

import useSWR from "swr";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus, Edit, Trash2, RefreshCcw, Upload } from "lucide-react";

type Part = {
  _id: string;
  sku: string;
  name: string;
  brand?: string;
  price?: number;
  createdAt?: string;
};

export default function ProductsPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const { data, mutate, isLoading } = useSWR<{
  parts: Part[]; total: number; page: number; pageSize: number; totalPages: number;
    }>(`/api/admin/parts?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`, api);

    const totalPages = data?.totalPages ?? 1;

  const parts = data?.parts || [];
  const fmt = (v?: number) =>
    typeof v === "number"
      ? new Intl.NumberFormat(undefined, { style: "currency", currency: "LKR" }).format(v)
      : "-";

  async function handleDelete(id: string) {
    if (!confirm("Delete this part?")) return;
    await api(`/api/admin/parts/${id}`, { method: "DELETE" });
    mutate();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Products</h1>
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search sku, name, brand..."
            className="border rounded-xl px-3 py-2 text-sm"
          />
          <button
            onClick={() => router.push("/admin/products/import")}
            className="inline-flex items-center gap-2 border px-3 py-2 rounded-xl text-sm"
          >
            <Upload className="w-4 h-4" /> Import CSV
          </button>
          <button
            onClick={() => router.push("/admin/products/new")}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-xl text-sm"
          >
            <Plus className="w-4 h-4" /> New
          </button>
          <button
            onClick={() => mutate()}
            className="inline-flex items-center gap-2 border px-3 py-2 rounded-xl text-sm"
          >
            <RefreshCcw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-600">
              <th className="py-2 px-4">SKU</th>
              <th className="py-2 px-4">Name</th>
              <th className="py-2 px-4">Brand</th>
              <th className="py-2 px-4">Price</th>
              <th className="py-2 px-4">Created</th>
              <th className="py-2 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {parts.map((p) => (
              <tr key={p._id} className="border-b border-slate-200 hover:bg-gray-100">
                <td className="py-2 px-4 font-mono">{p.sku}</td>
                <td className="py-2 px-4">{p.name}</td>
                <td className="py-2 px-4">{p.brand ?? "—"}</td>
                <td className="py-2 px-4">{fmt(p.price)}</td>
                <td className="py-2 px-4">{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "—"}</td>
                <td className="py-2 px-4 text-right space-x-2">
                  <button
                    onClick={() => router.push(`/admin/products/${p._id}`)}
                    className="inline-flex items-center text-blue-600 hover:text-blue-800"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(p._id)}
                    className="inline-flex items-center text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {!isLoading && parts.length === 0 && (
              <tr><td className="py-4 px-4 text-center text-slate-500" colSpan={6}>No products found</td></tr>
            )}
          </tbody>
        </table>
        {/* Footer controls */}
    <div className="mt-4 flex items-center justify-between">
    <div className="text-sm text-slate-600">
        Page {data?.page ?? 1} / {totalPages}, {data?.total ?? 0} results
    </div>
    <div className="flex items-center gap-2">
        <select
        value={limit}
        onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
        className="border rounded-xl px-2 py-1 text-sm"
        >
        {[10,20,50,100].map(n => <option key={n} value={n}>{n} / page</option>)}
        </select>
        <button
        className="border rounded-xl px-3 py-1 disabled:opacity-50"
        disabled={page <= 1}
        onClick={() => setPage(p => Math.max(1, p - 1))}
        >
        Prev
        </button>
        <button
        className="border rounded-xl px-3 py-1 disabled:opacity-50"
        disabled={page >= totalPages}
        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
        >
        Next
        </button>
    </div>
    </div>
      </div>
    </div>
  );
}
