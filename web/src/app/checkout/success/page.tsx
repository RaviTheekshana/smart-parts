"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle, Clock } from "lucide-react";

export default function SuccessPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const sessionId = sp.get("session_id");
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    async function run() {
      try {
        if (!sessionId) return setErr("Missing session_id");
        // call your Express backend via NEXT_PUBLIC_API
        const res = await fetch(`${process.env.NEXT_PUBLIC_API}/api/orders/finalize`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
          body: JSON.stringify({ session_id: sessionId }),
        });
        if (!res.ok) throw new Error(await res.text());
        setDone(true);
      } catch (e: any) {
        setErr(e.message);
      }
    }
    run();
  }, [sessionId]);

  return (
     <div className="min-h-screen pt-24 flex items-center justify-center bg-gradient-to-br from-emerald-100 via-white to-emerald-50 dark:from-slate-900 dark:via-slate-800 dark:to-emerald-950 p-6">
      <div className="relative backdrop-blur-lg bg-white/60 dark:bg-slate-900/60 border border-emerald-200/50 dark:border-emerald-800/50 shadow-2xl rounded-3xl w-full max-w-md p-8 text-center">
        <div className="flex justify-center">
          <CheckCircle className="w-14 h-14 text-emerald-500 animate-bounce" />
        </div>
        <h1 className="text-3xl font-bold text-emerald-700 dark:text-emerald-300 mt-3">
          Order Confirmed!
        </h1>
        <p className="mt-2 text-gray-700 dark:text-gray-300">
          {done
            ? "Thank you for your order! We’ve received your payment and are preparing your items."
            : err
            ? `Finalize failed: ${err}`
            : "Finalizing your order..."}
        </p>

        {done && (
          <div className="mt-6 bg-white/70 dark:bg-slate-800/60 rounded-2xl p-5 border border-emerald-100 dark:border-emerald-800">
            <h2 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
              Estimated Delivery Time
            </h2>
            <div className="flex items-center justify-center gap-2 text-amber-500 font-medium">
              <Clock className="w-5 h-5" /> 30–45 minutes
            </div>
            <p className="text-sm mt-1 text-gray-500 dark:text-gray-400">
              Our delivery partner will call you upon arrival.
            </p>
          </div>
        )}

        <div className="mt-8 flex gap-4 justify-center">
          <button
            onClick={() => router.push("/orders")}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition"
          >
            View Orders
          </button>
          <button
            onClick={() => router.push("/shop")}
            className="px-5 py-2 rounded-xl bg-white/80 dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-slate-700 transition"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
}
