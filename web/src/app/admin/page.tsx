"use client";

import useSWR from "swr";
import { api } from "@/lib/api";
import { TrendingUp, Users, Package, Receipt } from "lucide-react";
import RevenueChart from "@/components/admin/RevenueChart"; // ← imported
import TopSellingTable from "@/components/admin/TopSellingTable";
import TopLowStockTable from "@/components/admin/TopLowStockTable";

type Metrics = {
  counts: { users: number; parts: number; orders: number; paidOrders: number };
  revenue30d: { total: number };
  ordersByStatus: Array<{ status: string; count: number }>;
  recentOrders: Array<{ _id: string; status: string; grand?: number; createdAt?: string; userEmail?: string }>;
  recentUsers: Array<{ _id: string; email: string; role: string; createdAt?: string }>;
};

export default function AdminDashboard() {
  const { data, error, isLoading, mutate } = useSWR<{ metrics: Metrics }>(
    "/api/admin/metrics",
    api
  );

  if (error) return <div className="p-6">Failed to load metrics.</div>;

  const m = data?.metrics;

  const fmt = (v?: number) =>
    typeof v === "number"
      ? new Intl.NumberFormat(undefined, { style: "currency", currency: "LKR" }).format(v)
      : "-";

  return (
  <div className="space-y-4 bg-white text-slate-900">
  <div className="flex items-center justify-between">
    <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Dashboard</h1>
    <button
      onClick={() => mutate()}
      className="inline-flex items-center gap-2 rounded-xl bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 transition"
    >
      Refresh
    </button>
  </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    <Card icon={<Users className="w-5 h-5" />} label="Users" value={m?.counts.users} />
    <Card icon={<Package className="w-5 h-5" />} label="Parts" value={m?.counts.parts} />
    <Card icon={<Receipt className="w-5 h-5" />} label="Orders" value={m?.counts.orders} />
    <Card icon={<TrendingUp className="w-5 h-5" />} label="Revenue (30d)" value={fmt(m?.revenue30d.total)} />
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">Recent Orders</h3>
            <a href="/admin/orders" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">View all</a>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200 dark:border-slate-700">
                  <th className="py-2 pr-4">Order</th>
                  <th className="py-2 pr-4">User</th>
                  <th className="py-2 pr-4">Total</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {(m?.recentOrders ?? []).map((o) => (
                  <tr key={o._id} className="border-b border-slate-200/60 dark:border-slate-700/60">
                    <td className="py-2 pr-4">#{o._id.slice(-6).toUpperCase()}</td>
                    <td className="py-2 pr-4">{o.userEmail ?? "—"}</td>
                    <td className="py-2 pr-4">{o.grand != null ? fmt(o.grand) : "—"}</td>
                    <td className="py-2">
                      <span className={`px-2 py-1 rounded-lg text-xs ${o.status === "paid" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-gray-700"}`}>
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {!isLoading && (m?.recentOrders?.length ?? 0) === 0 && (
                  <tr><td className="py-4 text-slate-500" colSpan={4}>No orders.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Recent Users */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">Recent Users</h3>
            <a href="/admin/users" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">View all</a>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200 dark:border-slate-700">
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Role</th>
                  <th className="py-2">Joined</th>
                </tr>
              </thead>
              <tbody>
                {(m?.recentUsers ?? []).map((u) => (
                  <tr key={u._id} className="border-b border-slate-200/60 dark:border-slate-700/60">
                    <td className="py-2 pr-4">{u.email}</td>
                    <td className="py-2 pr-4">{u.role}</td>
                    <td className="py-2">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}</td>
                  </tr>
                ))}
                {!isLoading && (m?.recentUsers?.length ?? 0) === 0 && (
                  <tr><td className="py-4 text-slate-500" colSpan={3}>No users.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
                 {/* Revenue Chart */}
      <RevenueChart />
      <TopSellingTable />
      </div>
      <TopLowStockTable />
    </div>
  );
}

function Card({ icon, label, value }: { icon: React.ReactNode; label: string; value?: number | string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 flex items-center gap-4 shadow-sm">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center">
        {icon}
      </div>
      <div>
        <div className="text-sm text-slate-500">{label}</div>
        <div className="text-xl font-semibold text-slate-900">{value ?? "—"}</div>
      </div>
    </div>
  );
}

