"use client";
import useSWR from "swr";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function OrdersPage() {
  const { token } = useAuth();
  type Order = {
    _id: string;
    status: string;
    totals: { grand: number };
  };

  type OrdersResponse = {
    orders: Order[];
  };

  const { data, error } = useSWR<OrdersResponse>(token ? "/api/orders/my" : null, api);
  if (!token) return <div>Please <a href="/login">login</a> to view your orders.</div>;
  if (error) return <div>Error loading</div>;
  if (!data) return <div>Loading...</div>;
  return (
    <div className="min-h-screen mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:items-center lg:gap-12 lg:px-8 lg:py-28">
      <h1>My Orders</h1>
      <ul>
        {(data.orders ?? []).map((o: Order) =>
          <li key={o._id}>
            Order {o._id} - {o.status} - Total {o.totals.grand}
          </li>
        )}
      </ul>
    </div>
  );
}
