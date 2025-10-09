"use client";

import useSWR from "swr";
import { api } from "@/lib/api";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCcw } from "lucide-react";

type Row = {
  _id: string;
  userEmail?: string;
  status: string;
  grand: number;
  createdAt?: string;
};

export default function AdminOrdersPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const { data, isLoading, mutate } = useSWR<{
    orders: Row[]; total: number; page: number; pageSize: number; totalPages: number;
  }>(
    `/api/admin/orders?query=${encodeURIComponent(query)}&status=${status}&page=${page}&limit=${limit}`,
    api
  );

  const orders = data?.orders ?? [];
  const totalPages = data?.totalPages ?? 1;

  const fmtMoney = (n: number) =>
    new Intl.NumberFormat(undefined, { style: "currency", currency: "LKR" }).format(n ?? 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
        <div className="flex gap-2">
          <input
            className="border rounded-xl px-3 py-2 text-sm"
            placeholder="Search email or id…"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
          />
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="border rounded-xl px-3 py-2 text-sm"
          >
            <option value="">All statuses</option>
            <option value="pending">pending</option>
            <option value="paid">paid</option>
            <option value="fulfilled">fulfilled</option>
            <option value="cancelled">cancelled</option>
          </select>
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
              <th className="py-2 px-4">Order</th>
              <th className="py-2 px-4">Customer</th>
              <th className="py-2 px-4">Status</th>
              <th className="py-2 px-4">Total</th>
              <th className="py-2 px-4">Created</th>
              <th className="py-2 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o._id} className="border-b border-slate-200">
                <td className="py-2 px-4 font-mono">{o._id.slice(-6).toUpperCase()}</td>
                <td className="py-2 px-4">{o.userEmail ?? "—"}</td>
                <td className="py-2 px-4 capitalize">{o.status}</td>
                <td className="py-2 px-4">{fmtMoney(o.grand)}</td>
                <td className="py-2 px-4">{o.createdAt ? new Date(o.createdAt).toLocaleString() : "—"}</td>
                <td className="py-2 px-4 text-right">
                  <button
                    onClick={() => router.push(`/admin/orders/${o._id}`)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
            {!isLoading && orders.length === 0 && (
              <tr><td className="py-4 px-4 text-center text-slate-500" colSpan={6}>No orders</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* pagination */}
      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-slate-600">
          Page {data?.page ?? 1} / {totalPages} • {data?.total ?? 0} results
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
  );
}
