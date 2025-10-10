"use client";

import useSWR from "swr";
import { api } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AdminTestimonialEdit() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { data, mutate } = useSWR<{ testimonial: any }>(`/api/admin/testimonials/${id}`, api);

  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [published, setPublished] = useState(true);

  useEffect(() => {
    const t = data?.testimonial;
    if (!t) return;
    setRating(t.rating ?? 5);
    setTitle(t.title ?? "");
    setBody(t.body ?? "");
    setPublished(!!t.published);
  }, [data]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    await api(`/api/admin/testimonials/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ rating, title, body, published }),
    });
    await mutate();
    router.push("/admin/testimonials");
  }

  if (!data) return <div>Loading…</div>;

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-4 text-slate-900">Edit Testimonial</h1>
      <form onSubmit={save} className="space-y-4 bg-white border border-slate-200 rounded-2xl p-6">
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm text-slate-600">Rating</label>
          <select className="border rounded-xl px-3 py-2" value={rating} onChange={(e)=>setRating(Number(e.target.value))}>
            {[5,4,3,2,1].map(n => <option key={n} value={n}>{n}★</option>)}
          </select>
        </div>
        <input className="w-full border rounded-xl px-3 py-2" placeholder="Title" value={title} onChange={(e)=>setTitle(e.target.value)} maxLength={120} />
        <textarea className="w-full border rounded-xl px-3 py-2 min-h-[120px]" placeholder="Body" value={body} onChange={(e)=>setBody(e.target.value)} maxLength={2000} />
        <div className="flex items-center gap-2">
          <input id="pub" type="checkbox" checked={published} onChange={(e)=>setPublished(e.target.checked)} />
          <label htmlFor="pub" className="text-sm">Published (visible on public sections)</label>
        </div>
        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl">Save</button>
      </form>
    </div>
  );
}
