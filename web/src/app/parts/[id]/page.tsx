"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  Package,
  MapPin,
  ShoppingCart,
  CheckCircle2,
  AlertCircle,
  Tag,
  Building2,
  Minus,
  Plus,
} from "lucide-react";
import ModalPortal from "@/components/ModalPortal";

type PartDetailResponse = {
  part: {
    name: string;
    sku: string;
    brand: string;
    price: number;
    // add other fields as needed
  };
  stock: Array<{
    _id: string;
    locationId: string;
    qtyOnHand: number;
    // add other fields as needed
  }>;
};

export default function PartDetail() {
  const { id } = useParams() as { id: string };
  const { token } = useAuth();
  const router = useRouter();

  const { data, error, isLoading } = useSWR<PartDetailResponse>(`/api/parts/${id}`, api);

  const [qty, setQty] = useState(1);
  const [loc, setLoc] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [showAdded, setShowAdded] = useState(false);

  const part = data?.part;
  const stock = data?.stock ?? [];
  const locationId = useMemo(
    () => (loc ?? (stock?.[0]?.locationId ?? null)),
    [loc, stock]
  );

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

 async function addToCart() {
  if (!token) {
    router.push("/login");
    return;
  }
  if (!locationId) {
    // You can also surface a tiny inline validation if you like
    alert("Please select a location");
    return;
  }
  setIsAdding(true);
  try {
    await api("/api/cart/items", {
      method: "POST",
      body: JSON.stringify({ partId: id, qty, selectedLocationId: locationId }),
    });
    setShowAdded(true); // <-- open modal
  } catch (e: any) {
    // optional: show an error toast/modal
    console.error(e);
  } finally {
    setIsAdding(false);
  }
}


  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center p-20">
        <div className="max-w-lg w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 rounded-2xl shadow-2xl p-8">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-500 mt-0.5" />
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Error loading part</h2>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Something went wrong while fetching this part. Try refreshing the page.
              </p>
            </div>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 inline-flex items-center justify-center px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:opacity-90 transition"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 p-4 md:p-8">
      {/* background glow */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(120,119,198,0.10),transparent_50%)] dark:bg-[radial-gradient(circle_at_50%_20%,rgba(120,119,198,0.05),transparent_50%)]" />

      <div className="relative mx-auto max-w-6xl pt-22">
        {/* Card */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 rounded-2xl shadow-2xl p-6 md:p-10">
          {/* Header */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                  {isLoading ? (
                    <span className="inline-block h-7 w-48 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
                  ) : (
                    <>
                      {part?.name}{" "}
                      <span className="align-middle inline-flex items-center gap-1 text-sm font-medium text-slate-600 dark:text-slate-400">
                        <Tag className="w-4 h-4" /> {part?.sku}
                      </span>
                    </>
                  )}
                </h1>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {isLoading ? (
                    <span className="inline-block h-5 w-24 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      <Building2 className="w-3.5 h-3.5" />
                      {part?.brand}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-2 md:mt-0">
              {isLoading ? (
                <span className="inline-block h-8 w-28 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
              ) : (
                <span className="inline-flex items-center px-3 py-2 rounded-xl text-lg font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-700/60">
                  {fmtMoney(part?.price)}
                </span>
              )}
            </div>
          </div>

          {/* Content grid */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: stock list */}
            <section className="lg:col-span-2">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Stock by Location</h3>

              {isLoading ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-24 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 animate-pulse"
                    />
                  ))}
                </div>
              ) : stock?.length ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stock.map((s) => {
                    const selected = locationId === s.locationId;
                    const out = s.qtyOnHand <= 0;
                    return (
                      <button
                        key={s._id}
                        type="button"
                        onClick={() => setLoc(s.locationId)}
                        className={[
                          "text-left rounded-xl p-4 border transition group",
                          selected
                            ? "border-blue-500 ring-2 ring-blue-200 dark:ring-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20"
                            : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800",
                        ].join(" ")}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
                            <MapPin className="w-4 h-4 opacity-70" />
                            <span className="font-semibold">{s.locationId}</span>
                          </div>
                          {selected ? (
                            <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          ) : null}
                        </div>
                        <p
                          className={[
                            "mt-2 text-sm",
                            out
                              ? "text-red-600 dark:text-red-400"
                              : "text-slate-600 dark:text-slate-400",
                          ].join(" ")}
                        >
                          {out ? "Out of stock" : `On hand: ${s.qtyOnHand}`}
                        </p>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200/60 dark:border-amber-700/60 p-4">
                  <p className="text-amber-800 dark:text-amber-200 text-sm">
                    No stock available at any location.
                  </p>
                </div>
              )}
            </section>

            {/* Right: purchase panel */}
            <aside className="lg:col-span-1">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/70 backdrop-blur p-5 sticky top-6">
                <h4 className="text-base font-semibold text-slate-900 dark:text-white">Purchase</h4>

                {/* Location select fallback (for accessibility / keyboard) */}
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mt-4 mb-1">
                  Location
                </label>
                <div className="relative">
                  <select
                    value={locationId ?? ""}
                    onChange={(e) => setLoc(e.target.value || null)}
                    className="w-full appearance-none rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 pr-10 
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                  {stock?.length ? (
                    stock.map((s) => (
                      <option key={s._id} value={s.locationId}>
                        {s.locationId} {s.qtyOnHand > 0 ? `(on hand ${s.qtyOnHand})` : "(out of stock)"}
                      </option>
                    ))
                  ) : (
                    <option value="">(none)</option>
                  )}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg
                    className="h-4 w-4 text-slate-500 dark:text-slate-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                </div>

                {/* Qty stepper */}
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mt-4 mb-1">
                  Quantity
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="h-10 w-10 inline-flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                    aria-label="Decrease"
                  >
                    <Minus className="w-4 h-4 text-blue-50" />
                </button>

  <input
    type="number"
    inputMode="numeric"
    min={1}
    value={qty}
    onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
    className="w-20 text-center rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
  />

  <button
    type="button"
    onClick={() => setQty((q) => q + 1)}
    className="h-10 w-10 inline-flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
    aria-label="Increase"
  >
    <Plus className="w-4 h-4 text-blue-50" />
  </button>
</div>

{/* CTA */}
<button
  onClick={addToCart}
  disabled={
    isAdding ||
    isLoading ||
    !locationId ||
    (stock.find((s) => s.locationId === locationId)?.qtyOnHand ?? 0) <= 0
  }
  className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-4 shadow-lg hover:shadow-xl transition
             disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed
             hover:scale-[1.01] active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500"
>
  {isAdding ? (
    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
  ) : (
    <>
      <ShoppingCart className="w-4 h-4" />
      Add to cart
    </>
  )}
</button>

{/* Success Modal */}
{showAdded && (
  <ModalPortal>
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setShowAdded(false)}
        aria-hidden="true"
      />

      {/* Modal card */}
      <div className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-6 z-[1000]">
        <button
          onClick={() => setShowAdded(false)}
          className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          aria-label="Close"
        >
          ×
        </button>

        <div className="flex items-start gap-3">
          <div className="mt-0.5 w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="none"><path d="M20 7L9 18l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Added to cart</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              <span className="font-medium">{part?.name}</span> × {qty}
              {locationId ? ` • ${locationId}` : ""}
            </p>
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <button
            onClick={() => setShowAdded(false)}
            className="flex-1 inline-flex items-center justify-center rounded-xl border bg-green-500 border-slate-200 dark:border-slate-700 px-4 py-2 hover:bg-green-600 transition"
          >
            OK
          </button>
          <button
            onClick={() => router.push("/cart")}
            className="flex-1 inline-flex items-center justify-center rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-2 hover:opacity-90 transition"
          >
            Go to cart
          </button>
        </div>
      </div>
    </div>
  </ModalPortal>
)}

                {!token && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 text-center">
                    Tip:{" "}
                    <button
                      type="button"
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                      onClick={() => router.push("/login")}
                    >
                      Log in
                    </button>{" "}
                    to add items to your cart.
                  </p>
                )}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
