"use client";

import useSWR from "swr";
import { api } from "@/lib/api";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { useState } from "react";

type Point = { label: string; total: number };

export default function RevenueChart() {
  const [granularity, setGranularity] = useState<"day" | "month">("month");

  const span = granularity === "day" ? 30 : 12;
  const { data, isLoading, error, mutate } = useSWR<{ series: Point[]; granularity: "day" | "month" }>(
    `/api/admin/revenue/series?granularity=${granularity}&span=${span}`,
    api
  );

  const rows = data?.series ?? [];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-slate-800">
          Revenue ({granularity === "day" ? "last 30 days" : "last 12 months"})
        </h2>

        {/* Segmented control */}
        <div className="inline-flex rounded-xl border border-slate-200 bg-white overflow-hidden">
          <button
            onClick={() => setGranularity("day")}
            className={`px-3 py-1.5 text-sm ${granularity === "day" ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-50"}`}
          >
            Day
          </button>
          <button
            onClick={() => setGranularity("month")}
            className={`px-3 py-1.5 text-sm ${granularity === "month" ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-50"}`}
          >
            Month
          </button>
        </div>
      </div>

      {error && <div className="text-slate-500 text-sm">Failed to load revenue.</div>}
      {isLoading && <div className="text-slate-500 text-sm">Loading revenue…</div>}

      {!isLoading && rows.length === 0 && (
        <div className="text-slate-500 text-sm">No revenue data.</div>
      )}

      {rows.length > 0 && (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={rows}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="label"
              stroke="#64748b"
              tick={{ fontSize: 12 }}
              // For days, show fewer ticks
              interval={granularity === "day" ? Math.max(0, Math.floor(rows.length / 6)) : 0}
            />
            <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
            <Tooltip
              labelFormatter={(label) =>
                granularity === "day"
                  ? new Date(label).toLocaleDateString()
                  : label
              }
              formatter={(val: number) =>
                new Intl.NumberFormat(undefined, { style: "currency", currency: "LKR" }).format(val)
              }
              labelStyle={{ color: "#0f172a" }}
            />
            <Line
              type="monotone"
              dataKey="total"
              stroke="#2563eb"
              strokeWidth={2}
              dot={{ r: 2 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
