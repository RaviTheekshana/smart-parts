"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { UploadCloud, CheckCircle2, AlertTriangle } from "lucide-react";

type Preview = {
  totalRows: number;
  willUpsertParts: number;
  willUpsertInventories: number;
  errors: Array<{ row: number; msg: string }>;
  sample: any[];
};

export default function ImportProductsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function doPreview() {
    if (!file) return;
    setBusy(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API}/api/admin/parts/import?dryRun=true`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
        body: form,
      });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setPreview(json.preview);
    } catch (e: any) {
      alert("Preview failed: " + e.message);
    } finally {
      setBusy(false);
    }
  }

  async function doImport() {
    if (!file) return;
    setBusy(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API}/api/admin/parts/import`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
        body: form,
      });
      if (!res.ok) throw new Error(await res.text());
      await res.json();
      setDone(true);
    } catch (e: any) {
      alert("Import failed: " + e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-4">Import Products (CSV)</h1>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
        <p className="text-slate-600">
          CSV must include a header row with: <code className="font-mono">sku,name,brand,price,locationId,qtyOnHand</code>.
        </p>

        <label className="block">
          <div className="flex items-center gap-3 border-2 border-dashed border-slate-300 rounded-2xl p-6 text-slate-600 hover:bg-slate-50 cursor-pointer">
            <UploadCloud className="w-5 h-5" />
            <div>
              <div className="font-medium">Choose CSV file</div>
              <div className="text-xs text-slate-500">Click to browse</div>
            </div>
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
        </label>

        {file && (
          <div className="text-sm text-slate-700">Selected: <span className="font-medium">{file.name}</span></div>
        )}

        <div className="flex gap-2">
          <button
            onClick={doPreview}
            disabled={!file || busy}
            className="px-4 py-2 rounded-xl border hover:bg-slate-50 disabled:opacity-50"
          >
            Preview (Dry Run)
          </button>
          <button
            onClick={doImport}
            disabled={!file || !preview || busy}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Import
          </button>
        </div>

        {busy && <div className="text-slate-500 text-sm">Processing…</div>}

        {done && (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="w-5 h-5" />
            Import complete!
          </div>
        )}

        {preview && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Preview</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <Stat label="Rows" value={preview.totalRows} />
              <Stat label="Will upsert parts" value={preview.willUpsertParts} />
              <Stat label="Will upsert inventories" value={preview.willUpsertInventories} />
            </div>

            {preview.errors.length > 0 && (
              <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-800">
                <div className="flex items-center gap-2 font-semibold mb-2">
                  <AlertTriangle className="w-5 h-5" /> Errors
                </div>
                <ul className="list-disc pl-6 text-sm">
                  {preview.errors.slice(0, 10).map((e, i) => (
                    <li key={i}>Row {e.row}: {e.msg}</li>
                  ))}
                  {preview.errors.length > 10 && <li>+ {preview.errors.length - 10} more…</li>}
                </ul>
              </div>
            )}

            <div className="mt-4">
              <div className="text-sm font-medium mb-1">Sample (first 5 rows)</div>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="min-w-full text-sm bg-white">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-slate-600">
                      <th className="py-2 px-3">sku</th>
                      <th className="py-2 px-3">name</th>
                      <th className="py-2 px-3">brand</th>
                      <th className="py-2 px-3">price</th>
                      <th className="py-2 px-3">locationId</th>
                      <th className="py-2 px-3">qtyOnHand</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.sample.map((row, i) => (
                      <tr key={i} className="border-b border-slate-200">
                        <td className="py-2 px-3 font-mono">{row.sku}</td>
                        <td className="py-2 px-3">{row.name}</td>
                        <td className="py-2 px-3">{row.brand}</td>
                        <td className="py-2 px-3">{row.price}</td>
                        <td className="py-2 px-3">{row.locationId}</td>
                        <td className="py-2 px-3">{row.qtyOnHand}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}
