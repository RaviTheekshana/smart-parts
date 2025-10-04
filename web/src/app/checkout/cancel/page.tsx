export default function CancelPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl border border-amber-300/60 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-900/20 p-8 text-center">
        <h1 className="text-2xl font-bold text-amber-700 dark:text-amber-300">Payment canceled</h1>
        <p className="mt-2 text-slate-700 dark:text-slate-300">You can try checking out again.</p>
        <a href="/cart" className="mt-6 inline-flex rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-2 hover:opacity-90 transition">Back to cart</a>
      </div>
    </div>
  );
}
