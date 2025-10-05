"use client";
import Link from "next/link";
import { XCircle, RotateCcw } from "lucide-react";

export default function CancelPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-white to-amber-100 dark:from-slate-900 dark:via-slate-800 dark:to-amber-950 p-6">
      <div className="relative w-full max-w-md rounded-3xl border border-amber-300/50 dark:border-amber-800/50 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl shadow-2xl p-8 text-center">
        <div className="flex justify-center">
          <XCircle className="w-14 h-14 text-amber-500 animate-pulse" />
        </div>

        <h1 className="mt-3 text-3xl font-bold text-amber-700 dark:text-amber-300">
          Payment Canceled
        </h1>
        <p className="mt-2 text-gray-700 dark:text-gray-300">
          No charges were made. You can review your cart and try again.
        </p>

        <div className="mt-8 flex items-center justify-center gap-4">
          <Link
            href="/cart"
            className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium transition"
          >
            Back to Cart
          </Link>

          <Link
            href="/shop"
            className="px-5 py-2 rounded-xl bg-white/80 dark:bg-slate-800 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-slate-700 transition inline-flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Try Checkout Again
          </Link>
        </div>

        <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          Need help? <Link href="/support" className="underline hover:opacity-80">Contact support</Link>.
        </p>
      </div>
    </div>
  );
}
