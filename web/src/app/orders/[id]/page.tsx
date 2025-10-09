"use client";

import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { api } from "@/lib/api";
import { ArrowLeft, PackageCheck } from "lucide-react";

type OrderItem = {
  // canonical fields your schema can provide
  name?: string;
  price?: number;            // newer normalized field (optional)
  priceAtOrder?: number;     // your schema field
  qty: number;
  locationId?: string;
  // when backend populates
  partId?: { _id: string; name?: string; price?: number };
};

type OrderDetail = {
  _id: string;
  status: string;
  totals?: { subtotal?: number; tax?: number; grand?: number };
  payment?: { provider?: string; status?: string; sessionId?: string };
  createdAt?: string;
  items: OrderItem[];
};

export default function OrderDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const { data, error, isLoading } = useSWR<{ order: OrderDetail }>(
    `/api/orders/${id}`,
    api
  );

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        Failed to load order.
      </div>
    );
  if (isLoading || !data)
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Loading order details...
      </div>
    );

  const order = data.order;

  // ---------- helpers ----------
  const fmt = (v?: number) => {
    if (typeof v !== "number" || Number.isNaN(v)) return "$0.00";
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: "LKR",
      }).format(v);
    } catch {
      return `$${v.toFixed(2)}`;
    }
  };

  const unitPrice = (it: OrderItem) =>
    Number(
      (it.price ?? it.priceAtOrder ?? it.partId?.price ?? 0)
    );

  const displayName = (it: OrderItem) =>
    it.name ?? it.partId?.name ?? "Part";

  const computedSubtotal = (order.items ?? []).reduce(
    (sum, it) => sum + unitPrice(it) * (Number(it.qty ?? 0)),
    0
  );
  const showSubtotal = order.totals?.subtotal ?? computedSubtotal;
  const showTax = order.totals?.tax ?? 0;
  const showGrand = order.totals?.grand ?? (showSubtotal + showTax);

  // ---------- UI ----------
  return (
    <div className="min-h-screen pt-28 bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 p-6">
      <div className="relative mx-auto max-w-4xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 rounded-2xl shadow-2xl p-8">
        <button
          onClick={() => router.push("/orders")}
          className="inline-flex items-center text-sm text-blue-600 dark:text-blue-400 mb-6 hover:underline"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to My Orders
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow">
            <PackageCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Order #{order._id.slice(-6).toUpperCase()}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Status:{" "}
              <span className="font-semibold text-green-500">
                {order.status || "unknown"}
              </span>
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {order.items.map((it, i) => {
            const unit = unitPrice(it);
            const qty = Number(it.qty ?? 0);
            const lineTotal = unit * qty;

            return (
              <div
                key={i}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 p-4"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {displayName(it)}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      Qty: {qty}
                      {it.locationId && <> • Location: {it.locationId}</>}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-slate-500 dark:text-slate-400">Price</div>
                    <div className="text-base font-semibold text-slate-900 dark:text-white">
                      {fmt(lineTotal)}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      ({fmt(unit)} each)
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 border-t border-slate-200 dark:border-slate-700 pt-4">
          <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
            <span>Subtotal</span>
            <span>{fmt(showSubtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
            <span>Tax</span>
            <span>{fmt(showTax)}</span>
          </div>
          <div className="flex justify-between text-base font-bold text-slate-900 dark:text-white mt-2">
            <span>Total</span>
            <span>{fmt(showGrand)}</span>
          </div>
        </div>

        <div className="mt-6 text-sm text-slate-500 dark:text-slate-400">
          Payment: {order.payment?.provider ?? "—"} •{" "}
          <span className="capitalize">{order.payment?.status ?? "—"}</span>
          <br />
          Placed on:{" "}
          {order.createdAt
            ? new Date(order.createdAt).toLocaleString()
            : "Unknown date"}
        </div>
      </div>
    </div>
  );
}
