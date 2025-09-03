"use client";
import useSWR from "swr";
import { api } from "@/lib/api";
import Link from "next/link";

export default function CatalogPage() {
  const { data, error } = useSWR("/api/parts?make=Toyota&model=Corolla&year=2019&engine=1.8L&transmission=AT", (url)=>api(url));
  if (error) return <div>Error loading</div>;
  if (!data) return <div>Loading...</div>;
  return (
    <div>
      <h1>Catalog</h1>
      <ul>
        {data.parts.map((p:any)=>
          <li key={p._id}>
            <Link href={`/parts/${p._id}`}>{p.name} ({p.sku}) - Stock {p.stockTotal}</Link>
          </li>
        )}
      </ul>
    </div>
  );
}
