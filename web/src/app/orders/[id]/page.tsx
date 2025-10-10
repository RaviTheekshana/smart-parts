"use client";

import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { api } from "@/lib/api";
import { ArrowLeft, PackageCheck, Star } from "lucide-react";
import { useState } from "react";

type OrderItem = {
  name?: string;
  price?: number;
  priceAtOrder?: number;
  qty: number;
  locationId?: string;
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

type MyTestimonial = {
  _id: string;
  orderId: string;
  rating: number;
  title?: string;
  body?: string;
  published?: boolean;
};

export default function OrderDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const { data, error, isLoading } = useSWR<{ order: OrderDetail }>(`/api/orders/${id}`, api);
  const { data: myTData, mutate: mutateMyT } = useSWR<{ testimonial: MyTestimonial | null }>(
    `/api/testimonials/my?orderId=${id}`,
    api
  );

  const [saving, setSaving] = useState(false);
  const [localRating, setLocalRating] = useState<number>(0);
  const [localTitle, setLocalTitle] = useState("");
  const [localBody, setLocalBody] = useState("");

  const myT = myTData?.testimonial || null;

  const fmt = (v?: number) => {
    if (typeof v !== "number" || Number.isNaN(v)) return "රු0.00";
    try {
      return new Intl.NumberFormat(undefined, { style: "currency", currency: "LKR" }).format(v);
    } catch {
      return `රු${Number(v || 0).toFixed(2)}`;
    }
  };

  const unitPrice = (it: OrderItem) => Number((it.price ?? it.priceAtOrder ?? it.partId?.price ?? 0));
  const displayName = (it: OrderItem) => it.name ?? it.partId?.name ?? "Part";
  const computedSubtotal = (data?.order.items ?? []).reduce(
    (sum, it) => sum + unitPrice(it) * Number(it.qty ?? 0), 0
  );
  const showSubtotal = data?.order.totals?.subtotal ?? computedSubtotal;
  const showTax = data?.order.totals?.tax ?? 0;
  const showGrand = data?.order.totals?.grand ?? (showSubtotal + showTax);

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center text-rose-500 dark:text-rose-400">
        Failed to load order.
      </div>
    );
  if (isLoading || !data)
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500 dark:text-slate-400">
        Loading order details...
      </div>
    );

  const order = data.order;

  // hydrate local fields once
  if (myT && localRating === 0 && !saving) {
    setTimeout(() => {
      setLocalRating(myT.rating);
      setLocalTitle(myT.title || "");
      setLocalBody(myT.body || "");
    }, 0);
  }

  async function submitRating(e: React.FormEvent) {
    e.preventDefault();
    if (localRating < 1 || localRating > 5) return alert("Please choose a rating 1–5");
    setSaving(true);
    try {
      await api("/api/testimonials", {
        method: "POST",
        body: JSON.stringify({
          orderId: id,
          rating: localRating,
          title: localTitle,
          body: localBody,
        }),
      });
      await mutateMyT();
      alert("Thank you for your feedback!");
    } catch (err: any) {
      alert("Failed to save rating: " + (err?.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  }

  function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className="p-1"
            aria-label={`rate ${n}`}
            title={`${n} star${n > 1 ? "s" : ""}`}
          >
            <Star
              className={`w-6 h-6 transition-colors
                ${n <= value
                  ? "fill-yellow-400 stroke-yellow-400"
                  : "stroke-slate-300 dark:stroke-slate-600"}`}
            />
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 p-6 bg-gradient-to-br from-slate-50 via-white to-slate-100
                    dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      {/* soft radial glow */}
      <div className="pointer-events-none fixed inset-0
                      bg-[radial-gradient(circle_at_50%_20%,rgba(120,119,198,0.10),transparent_50%)]
                      dark:bg-[radial-gradient(circle_at_50%_20%,rgba(120,119,198,0.05),transparent_50%)]" />
      <div className="relative mx-auto max-w-4xl
                      bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl
                      border border-slate-200/60 dark:border-slate-700/60
                      rounded-2xl shadow-2xl p-8">
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
              <span className="font-semibold text-green-600 dark:text-green-400">
                {order.status || "unknown"}
              </span>
            </p>
          </div>
        </div>

        {/* Items */}
        <div className="space-y-4">
          {order.items.map((it, i) => {
            const unit = unitPrice(it);
            const qty = Number(it.qty ?? 0);
            const lineTotal = unit * qty;
            return (
              <div
                key={i}
                className="rounded-xl border border-slate-200 dark:border-slate-700
                           bg-slate-50/70 dark:bg-slate-800/60 p-4"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {displayName(it)}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
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

        {/* Totals */}
        <div className="mt-8 border-t border-slate-200 dark:border-slate-700 pt-4">
          <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
            <span>Subtotal</span><span className="text-slate-900 dark:text-white">{fmt(showSubtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
            <span>Tax</span><span className="text-slate-900 dark:text-white">{fmt(showTax)}</span>
          </div>
          <div className="flex justify-between text-base font-bold text-slate-900 dark:text-white mt-2">
            <span>Total</span><span>{fmt(showGrand)}</span>
          </div>
        </div>

        <div className="mt-6 text-sm text-slate-600 dark:text-slate-400">
          Payment: <span className="text-slate-900 dark:text-white">{order.payment?.provider ?? "—"}</span>
          {" • "}
          <span className="capitalize">{order.payment?.status ?? "—"}</span>
          <br />
          Placed on:{" "}
          <span className="text-slate-900 dark:text-white">
            {order.createdAt ? new Date(order.createdAt).toLocaleString() : "Unknown date"}
          </span>
        </div>

        {/* Rating box */}
        <div className="mt-8 border-t border-slate-200 dark:border-slate-700 pt-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Rate this order</h2>

          {myT && (
            <div className="mb-4 rounded-xl border border-slate-200 dark:border-slate-700
                            bg-slate-50/80 dark:bg-slate-800/60 p-3">
              <div className="text-sm text-slate-700 dark:text-slate-300">
                <span className="font-semibold">Your current rating:</span> {myT.rating} / 5
              </div>
              {myT.title && (
                <div className="text-sm text-slate-600 dark:text-slate-400">Title: {myT.title}</div>
              )}
              {myT.body && (
                <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">{myT.body}</div>
              )}
            </div>
          )}

          <form onSubmit={submitRating} className="space-y-3">
            <StarPicker value={localRating} onChange={setLocalRating} />
            <input
              className="w-full border border-slate-200 dark:border-slate-700
                         bg-white dark:bg-slate-900 text-slate-900 dark:text-white
                         rounded-xl px-3 py-2 placeholder-slate-400 dark:placeholder-slate-500
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Short title (optional)"
              value={localTitle}
              onChange={(e) => setLocalTitle(e.target.value)}
              maxLength={120}
            />
            <textarea
              className="w-full border border-slate-200 dark:border-slate-700
                         bg-white dark:bg-slate-900 text-slate-900 dark:text-white
                         rounded-xl px-3 py-2 min-h-[80px] placeholder-slate-400 dark:placeholder-slate-500
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Share a few details (optional)…"
              value={localBody}
              onChange={(e) => setLocalBody(e.target.value)}
              maxLength={2000}
            />
            <button
              disabled={saving || localRating < 1}
              className="inline-flex items-center justify-center rounded-xl
                         bg-gradient-to-r from-blue-600 to-purple-600
                         hover:from-blue-700 hover:to-purple-700
                         text-white px-4 py-2 shadow-lg hover:shadow-xl
                         disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed
                         transition"
            >
              {saving ? "Saving…" : "Submit rating"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
