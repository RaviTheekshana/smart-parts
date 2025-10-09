"use client";

import useSWR from "swr";
import { api } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Inv = { _id: string; locationId: string; qtyOnHand: number; qtyReserved?: number; eta?: string | null };
type Fit = { _id: string; make: string; model: string; yearFrom?: number; yearTo?: number; notes?: string };

export default function EditProductPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  // product
  const { data: partRes, mutate: mutatePart } = useSWR<{ part: any }>(`/api/admin/parts/${id}`, api);

  // inventories
  const { data: invRes, mutate: mutateInv } = useSWR<{ inventories: Inv[] }>(`/api/admin/parts/${id}/inventories`, api);

  // fitments
  const { data: fitRes, mutate: mutateFit } = useSWR<{ fitments: Fit[] }>(`/api/admin/parts/${id}/fitments`, api);

  const [tab, setTab] = useState<"details" | "inventories" | "fitments">("details");

  // details form
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [price, setPrice] = useState<number | string>("");

  useEffect(() => {
    const p = partRes?.part;
    if (p) {
      setSku(p.sku || "");
      setName(p.name || "");
      setBrand(p.brand || "");
      setPrice(p.price ?? "");
    }
  }, [partRes]);

  async function saveDetails(e: React.FormEvent) {
    e.preventDefault();
    await api(`/api/admin/parts/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ sku, name, brand, price: Number(price || 0) }),
    });
    mutatePart();
    router.push("/admin/products");
  }

  /* ----- inventories actions ----- */
  const inventories = invRes?.inventories ?? [];
  const [loc, setLoc] = useState("");
  const [qty, setQty] = useState<number | string>("");
  const [eta, setEta] = useState<string>("");

  async function upsertInventory() {
    await api(`/api/admin/parts/${id}/inventories`, {
      method: "PUT",
      body: JSON.stringify({ locationId: loc, qtyOnHand: Number(qty || 0), eta: eta || null }),
    });
    setLoc(""); setQty(""); setEta("");
    mutateInv();
  }
  async function deleteInventory(locationId: string) {
    if (!confirm(`Delete inventory for ${locationId}?`)) return;
    await api(`/api/admin/parts/${id}/inventories/${locationId}`, { method: "DELETE" });
    mutateInv();
  }

  /* ----- fitments actions ----- */
  const fitments = fitRes?.fitments ?? [];
  const [make, setMake] = useState(""); const [model, setModel] = useState("");
  const [yf, setYf] = useState<number | string>(""); const [yt, setYt] = useState<number | string>("");
  const [notes, setNotes] = useState("");

  async function addFitment() {
    await api(`/api/admin/parts/${id}/fitments`, {
      method: "POST",
      body: JSON.stringify({
        make, model, yearFrom: Number(yf || 0), yearTo: Number(yt || yf || 0), notes
      }),
    });
    setMake(""); setModel(""); setYf(""); setYt(""); setNotes("");
    mutateFit();
  }
  async function deleteFitment(fid: string) {
    if (!confirm("Delete fitment?")) return;
    await api(`/api/admin/parts/${id}/fitments/${fid}`, { method: "DELETE" });
    mutateFit();
  }

  if (!partRes) return <div>Loading…</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Edit Product</h1>

      {/* tabs */}
      <div className="flex gap-2">
        <button className={btn(tab==="details")} onClick={() => setTab("details")}>Details</button>
        <button className={btn(tab==="inventories")} onClick={() => setTab("inventories")}>Inventories</button>
        <button className={btn(tab==="fitments")} onClick={() => setTab("fitments")}>Fitments</button>
      </div>

      {tab === "details" && (
        <form onSubmit={saveDetails} className="space-y-4 bg-white border border-slate-200 rounded-2xl p-6">
          <input className="w-full border rounded-xl px-3 py-2" placeholder="SKU" value={sku} onChange={(e) => setSku(e.target.value)} />
          <input className="w-full border rounded-xl px-3 py-2" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="w-full border rounded-xl px-3 py-2" placeholder="Brand" value={brand} onChange={(e) => setBrand(e.target.value)} />
          <input className="w-full border rounded-xl px-3 py-2" placeholder="Price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl">Save</button>
        </form>
      )}

      {tab === "inventories" && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <input className="border rounded-xl px-3 py-2" placeholder="Location ID" value={loc} onChange={(e)=>setLoc(e.target.value)} />
              <input className="border rounded-xl px-3 py-2" placeholder="Qty On Hand" type="number" value={qty} onChange={(e)=>setQty(e.target.value)} />
              <input className="border rounded-xl px-3 py-2" placeholder="ETA (optional)" value={eta} onChange={(e)=>setEta(e.target.value)} />
              <button onClick={upsertInventory} className="bg-blue-600 text-white rounded-xl px-3 py-2">Upsert</button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-600">
                  <th className="py-2 px-4">Location</th>
                  <th className="py-2 px-4">On Hand</th>
                  <th className="py-2 px-4">Reserved</th>
                  <th className="py-2 px-4">ETA</th>
                  <th className="py-2 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {inventories.map((row) => (
                  <tr key={row._id} className="border-b border-slate-200">
                    <td className="py-2 px-4">{row.locationId}</td>
                    <td className="py-2 px-4">{row.qtyOnHand}</td>
                    <td className="py-2 px-4">{row.qtyReserved ?? 0}</td>
                    <td className="py-2 px-4">{row.eta ?? "—"}</td>
                    <td className="py-2 px-4 text-right">
                      <button
                        onClick={() => deleteInventory(row.locationId)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {inventories.length === 0 && (
                  <tr><td className="py-4 px-4 text-center text-slate-500" colSpan={5}>No inventory rows.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "fitments" && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <input className="border rounded-xl px-3 py-2" placeholder="Make"  value={make}  onChange={(e)=>setMake(e.target.value)} />
              <input className="border rounded-xl px-3 py-2" placeholder="Model" value={model} onChange={(e)=>setModel(e.target.value)} />
              <input className="border rounded-xl px-3 py-2" placeholder="Year From" type="number" value={yf} onChange={(e)=>setYf(e.target.value)} />
              <input className="border rounded-xl px-3 py-2" placeholder="Year To"   type="number" value={yt} onChange={(e)=>setYt(e.target.value)} />
              <button onClick={addFitment} className="bg-blue-600 text-white rounded-xl px-3 py-2">Add</button>
            </div>
            <input className="mt-3 w-full border rounded-xl px-3 py-2" placeholder="Notes (optional)" value={notes} onChange={(e)=>setNotes(e.target.value)} />
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-600">
                  <th className="py-2 px-4">Make</th>
                  <th className="py-2 px-4">Model</th>
                  <th className="py-2 px-4">Years</th>
                  <th className="py-2 px-4">Notes</th>
                  <th className="py-2 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {fitments.map((f) => (
                  <tr key={f._id} className="border-b border-slate-200">
                    <td className="py-2 px-4">{f.make}</td>
                    <td className="py-2 px-4">{f.model}</td>
                    <td className="py-2 px-4">{[f.yearFrom, f.yearTo].filter(Boolean).join("–") || "—"}</td>
                    <td className="py-2 px-4">{f.notes ?? "—"}</td>
                    <td className="py-2 px-4 text-right">
                      <button
                        onClick={() => deleteFitment(f._id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {fitments.length === 0 && (
                  <tr><td className="py-4 px-4 text-center text-slate-500" colSpan={5}>No fitments yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function btn(active: boolean) {
  return `px-3 py-1.5 rounded-xl border ${active ? "bg-slate-900 text-white" : "bg-white hover:bg-slate-50"}`
}
