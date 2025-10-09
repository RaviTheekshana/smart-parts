"use client";

import useSWR from "swr";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, AlertCircle, RefreshCw, ShoppingBag, ReceiptText } from "lucide-react";

type Order = {
  _id: string;
  status: string;
  totals: { grand: number };
  // add: createdAt, number, etc. when available
};
type OrdersResponse = { orders: Order[] };

export default function OrdersPage() {
  const { token } = useAuth();
  const router = useRouter();
  const search = useSearchParams();
  const showSuccessInit = search?.get("success") === "1";
  const [showSuccess, setShowSuccess] = useState(showSuccessInit);

  const { data, error, isLoading, mutate } = useSWR<OrdersResponse>(
    token ? "/api/orders/my" : null,
    api
  );

  const orders = data?.orders ?? [];

  function fmtMoney(v?: number) {
    if (typeof v !== "number") return "-";
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: "LKR",
        maximumFractionDigits: 2,
      }).format(v);
    } catch {
      return `$${v.toFixed(2)}`;
    }
  }

  function pill(status: string) {
    const s = status.toLowerCase();
    if (s.includes("paid") || s.includes("complete"))
      return "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-700/60";
    if (s.includes("pending") || s.includes("processing"))
      return "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200/60 dark:border-amber-700/60";
    if (s.includes("failed") || s.includes("cancel"))
      return "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 border-rose-200/60 dark:border-rose-700/60";
    return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700";
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <p className="text-slate-700 dark:text-slate-300">
          Please{" "}
          <a className="text-blue-600 dark:text-blue-400 underline" href="/login">
            login
          </a>{" "}
          to view your orders.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-rose-600" />
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Error loading orders</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Please try again in a moment.
              </p>
            </div>
          </div>
          <button
            onClick={() => location.reload()}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-2 hover:opacity-90 transition"
          >
            <RefreshCw className="w-4 h-4" />
            Reload
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 p-4 md:p-8">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(120,119,198,0.10),transparent_50%)] dark:bg-[radial-gradient(circle_at_50%_20%,rgba(120,119,198,0.05),transparent_50%)]" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(120,119,198,0.10),transparent_50%)] dark:bg-[radial-gradient(circle_at_50%_20%,rgba(120,119,198,0.05),transparent_50%)]" />
      <div className="relative mx-auto max-w-6xl pt-24">
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 rounded-2xl shadow-2xl p-6 md:p-10">
          {/* Header */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow">
                <ReceiptText className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">My Orders</h1>
            </div>
            <button
              onClick={() => mutate()}
              className="inline-flex items-center gap-2 rounded-xl border-0 bg-purple-600 text-white px-4 py-2 hover:opacity-80 transition"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>

          {/* Success banner after redirect */}
          {showSuccess && (
            <div className="mt-6 rounded-2xl border border-emerald-200/60 dark:border-emerald-700/60 bg-emerald-50 dark:bg-emerald-900/20 p-4 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5" />
              <div className="flex-1 text-sm text-emerald-800 dark:text-emerald-200">
                Payment successful. Your order has been placed.
              </div>
              <button
                onClick={() => setShowSuccess(false)}
                className="text-emerald-700/70 dark:text-emerald-300/70 hover:opacity-80"
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>
          )}

          {/* List / skeleton / empty */}
          <div className="mt-6">
            {isLoading ? (
              <ul className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <li
                    key={i}
                    className="h-24 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 animate-pulse"
                  />
                ))}
              </ul>
            ) : orders.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 p-8 text-center">
                <p className="text-slate-700 dark:text-slate-300">You don’t have any orders yet.</p>
                <button
                  onClick={() => router.push("/catalog")}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-2 hover:opacity-90 transition"
                >
                  <ShoppingBag className="w-4 h-4" />
                  Continue shopping
                </button>
              </div>
            ) : (
              <ul className="space-y-4">
                {orders.map((o) => (
                  <li
                    key={o._id}
                    className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/70 p-5 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <div className="text-sm text-slate-500 dark:text-slate-400">Order</div>
                      <div className="text-base md:text-lg font-semibold text-slate-900 dark:text-white truncate">
                        {o._id}
                      </div>
                      <div className="mt-2 inline-flex items-center gap-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${pill(
                            o.status
                          )}`}
                        >
                          {o.status}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm text-slate-500 dark:text-slate-400">Total</div>
                      <div className="text-lg font-bold text-slate-900 dark:text-white">
                        {fmtMoney(o.totals?.grand)}
                      </div>
                      <div className="mt-3">
                        <a
                          href={`/orders/${o._id}`}
                          className="inline-flex items-center justify-center rounded-xl border bg-blue-600 dark:border-slate-700 px-3 py-2 text-sm text-white font-medium hover:bg-blue-700 transition"
                        >
                          View details
                        </a>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
