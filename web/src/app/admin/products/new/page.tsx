"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";

export default function NewProductPage() {
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [price, setPrice] = useState<number | string>("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await api("/api/admin/parts", {
      method: "POST",
      body: JSON.stringify({ sku, name, brand, price: Number(price || 0) }),
    });
    router.push("/admin/products");
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-6 text-slate-900">Create Product</h1>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white border border-slate-200 rounded-2xl p-6">
        <input className="w-full border rounded-xl px-3 py-2" placeholder="SKU" value={sku} onChange={(e) => setSku(e.target.value)} />
        <input className="w-full border rounded-xl px-3 py-2" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="w-full border rounded-xl px-3 py-2" placeholder="Brand" value={brand} onChange={(e) => setBrand(e.target.value)} />
        <input className="w-full border rounded-xl px-3 py-2" placeholder="Price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl">Create</button>
      </form>
    </div>
  );
}
