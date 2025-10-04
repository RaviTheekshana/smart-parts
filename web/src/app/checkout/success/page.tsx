"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl border border-emerald-300/60 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-900/20 p-8 text-center">
        <h1 className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
          Payment successful 🎉
        </h1>
        <p className="mt-2 text-slate-700 dark:text-slate-300">
          {done ? "Your order is finalized." : err ? `Finalize failed: ${err}` : "Finalizing your order..."}
        </p>
        <button
          onClick={() => router.push("/orders")}
          className="mt-6 inline-flex rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-2 hover:opacity-90 transition"
        >
          View orders
        </button>
      </div>
    </div>
  );
}
