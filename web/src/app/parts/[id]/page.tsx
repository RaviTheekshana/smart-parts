"use client";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { api } from "@/lib/api";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function PartDetail() {
  const { id } = useParams() as { id: string };
  const { token } = useAuth();
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

  const { data, error } = useSWR<PartDetailResponse>(`/api/parts/${id}`, api);

  const [qty, setQty] = useState(1);
  const [loc, setLoc] = useState<string | null>(null);

  if (error) return <div>Error</div>;
  if (!data) return <div>Loading...</div>;

  const { part, stock } = data;

  // default to first location if any
  const locationId = loc ?? (stock?.[0]?.locationId ?? null);

  async function addToCart() {
    if (!token) {
      alert("Please login first.");
      return;
    }
    try {
      await api("/api/cart/items", {
        method: "POST",
        body: JSON.stringify({ partId: id, qty, selectedLocationId: locationId }),
      });
      alert("Added to cart");
    } catch (e: any) {
      alert("Failed to add to cart: " + e.message);
    }
  }

  return (
    <div>
      <h1>
        {part.name} ({part.sku})
      </h1>
      <p>Brand: {part.brand}</p>
      <p>Price: {part.price}</p>

      <h3>Stock</h3>
      {stock?.length ? (
        <ul>
          {stock.map((s: any) => (
            <li key={s._id}>
              {s.locationId}: {s.qtyOnHand}
            </li>
          ))}
        </ul>
      ) : (
        <p>No stock</p>
      )}

      <div style={{ marginTop: 16, display: "flex", gap: 8, alignItems: "center" }}>
        <label>
          Qty{" "}
          <input
            type="number"
            min={1}
            value={qty}
            onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
            style={{ width: 80 }}
          />
        </label>

        <label>
          Location{" "}
          <select
            value={locationId ?? ""}
            onChange={(e) => setLoc(e.target.value || null)}
            style={{ minWidth: 140 }}
          >
            {stock?.length ? (
              stock.map((s: any) => (
                <option key={s._id} value={s.locationId}>
                  {s.locationId} (on hand {s.qtyOnHand})
                </option>
              ))
            ) : (
              <option value="">(none)</option>
            )}
          </select>
        </label>

        <button onClick={addToCart}>Add to cart</button>
      </div>

      {!token && <p style={{ marginTop: 8 }}>Tip: <a href="/login">Login</a> to add items to your cart.</p>}
    </div>
  );
}
