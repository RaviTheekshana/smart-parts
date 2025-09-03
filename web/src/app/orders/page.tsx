"use client";
import useSWR from "swr";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function OrdersPage() {
  const { token } = useAuth();
  const { data, error } = useSWR(token ? "/api/orders/my" : null, api);
  if (!token) return <div>Please <a href="/login">login</a> to view your orders.</div>;
  if (error) return <div>Error loading</div>;
  if (!data) return <div>Loading...</div>;
  return (
    <div>
      <h1>My Orders</h1>
      <ul>
        {data.orders.map((o:any)=>
          <li key={o._id}>
            Order {o._id} - {o.status} - Total {o.totals.grand}
          </li>
        )}
      </ul>
    </div>
  );
}
