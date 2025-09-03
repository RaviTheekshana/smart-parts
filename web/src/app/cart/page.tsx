"use client";
import useSWR from "swr";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function CartPage() {
  const { token } = useAuth();
  const { data, error, mutate } = useSWR(token ? "/api/cart" : null, api);
  if (!token) return <div>Please <a href="/login">login</a> to view your cart.</div>;
  if (error) return <div>Error loading</div>;
  if (!data) return <div>Loading...</div>;
  const cart = data.cart || { items: [] };
  return (
    <div>
      <h1>Cart</h1>
      {cart.items.length === 0 ? <p>No items.</p> : (
        <ul>{cart.items.map((it:any)=>
          <li key={it.partId._id}>{it.partId.name} x {it.qty}</li>
        )}</ul>
      )}
      <button onClick={async ()=>{
        await api("/api/orders/checkout",{method:"POST"});
        await mutate();
        alert("Checkout complete");
      }}>Checkout</button>
    </div>
  );
}
