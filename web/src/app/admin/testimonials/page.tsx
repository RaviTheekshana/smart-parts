"use client";

import useSWR from "swr";
import { api } from "@/lib/api";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCcw } from "lucide-react";

type T = {
  _id: string;
  userId: string;
  orderId: string;
  rating: number;
  title?: string;
  body?: string;
  published?: boolean;
  createdAt?: string;
};

export default function AdminTestimonialsPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [rating, setRating] = useState("");
  const [published, setPublished] = useState("");
  const [page, setPage] = useState(1);

  const key = `/api/admin/testimonials?query=${encodeURIComponent(query)}&rating=${rating}&published=${published}&page=${page}&limit=20`;
  const { data, mutate, isLoading } = useSWR<{ items: T[]; total: number; page: number; limit: number }>(key, api);
  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / 20));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Testimonials</h1>

      <div className="flex flex-wrap gap-2 items-center">
        <input
          className="border rounded-xl px-3 py-2 text-sm"
          placeholder="Search title/body…"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(1); }}
        />
        <select
          className="border rounded-xl px-3 py-2 text-sm"
          value={rating}
          onChange={(e) => { setRating(e.target.value); setPage(1); }}
        >
          <option value="">Any rating</option>
          {[5,4,3,2,1].map(n => <option key={n} value={n}>{n}★</option>)}
        </select>
        <select
          className="border rounded-xl px-3 py-2 text-sm"
          value={published}
          onChange={(e) => { setPublished(e.target.value); setPage(1); }}
        >
          <option value="">All</option>
          <option value="true">Published</option>
          <option value="false">Hidden</option>
        </select>
        <button className="border rounded-xl px-3 py-2 text-sm inline-flex items-center gap-2" onClick={() => mutate()}>
          <RefreshCcw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-600">
              <th className="py-2 px-4">Rating</th>
              <th className="py-2 px-4">Title</th>
              <th className="py-2 px-4">Published</th>
              <th className="py-2 px-4">Order</th>
              <th className="py-2 px-4">User</th>
              <th className="py-2 px-4">Created</th>
              <th className="py-2 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((t) => (
              <tr key={t._id} className="border-b border-slate-200">
                <td className="py-2 px-4">{t.rating}★</td>
                <td className="py-2 px-4">{t.title ?? "—"}</td>
                <td className="py-2 px-4">{t.published ? "Yes" : "No"}</td>
                <td className="py-2 px-4">
                  <a className="text-blue-600 hover:underline" href={`/orders/${t.orderId}`} target="_blank" rel="noreferrer">View</a>
                </td>
                <td className="py-2 px-4">{t.userId}</td>
                <td className="py-2 px-4">{t.createdAt ? new Date(t.createdAt).toLocaleString() : "—"}</td>
                <td className="py-2 px-4 text-right space-x-2">
                  <button
                    onClick={() => router.push(`/admin/testimonials/${t._id}`)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </button>
                  <button
                    onClick={async () => {
                      if (!confirm("Delete this testimonial?")) return;
                      await api(`/api/admin/testimonials/${t._id}`, { method: "DELETE" });
                      mutate();
                    }}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {!isLoading && items.length === 0 && (
              <tr><td className="py-4 px-4 text-center text-slate-500" colSpan={7}>No testimonials</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* pagination */}
      {pages > 1 && (
        <div className="flex items-center gap-2">
          <button disabled={page<=1} onClick={()=>setPage(p=>p-1)} className="border rounded-xl px-3 py-1 disabled:opacity-50">Prev</button>
          <div className="text-sm text-slate-600">Page {page} of {pages}</div>
          <button disabled={page>=pages} onClick={()=>setPage(p=>p+1)} className="border rounded-xl px-3 py-1 disabled:opacity-50">Next</button>
        </div>
      )}
    </div>
  );
}
