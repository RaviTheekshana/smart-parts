"use client";

import useSWR from "swr";
import { api } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function EditProductPage() {
  const { id } = useParams() as { id: string };
  const { data, mutate } = useSWR<{ part: any }>(`/api/admin/parts/${id}`, api);
  const router = useRouter();

  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [price, setPrice] = useState<number | string>("");

  useEffect(() => {
    if (data?.part) {
      setSku(data.part.sku || "");
      setName(data.part.name || "");
      setBrand(data.part.brand || "");
      setPrice(data.part.price ?? "");
    }
  }, [data]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await api(`/api/admin/parts/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ sku, name, brand, price: Number(price || 0) }),
    });
    mutate();
    router.push("/admin/products");
  }

  if (!data) return <div>Loading...</div>;

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-6 text-slate-900">Edit Product</h1>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white border border-slate-200 rounded-2xl p-6">
        <input className="w-full border rounded-xl px-3 py-2" placeholder="SKU" value={sku} onChange={(e) => setSku(e.target.value)} />
        <input className="w-full border rounded-xl px-3 py-2" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="w-full border rounded-xl px-3 py-2" placeholder="Brand" value={brand} onChange={(e) => setBrand(e.target.value)} />
        <input className="w-full border rounded-xl px-3 py-2" placeholder="Price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl">Save</button>
      </form>
    </div>
  );
}
