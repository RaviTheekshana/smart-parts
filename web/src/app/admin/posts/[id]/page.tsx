"use client";

import useSWR from "swr";
import { API, api } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AdminPostEdit() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { data, mutate } = useSWR<{ post: any }>(`/api/admin/posts/${id}`, api);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [published, setPublished] = useState(true);
  const [make, setMake] = useState(""); const [model, setModel] = useState("");
  const [yf, setYf] = useState(""); const [yt, setYt] = useState("");
  const [partTags, setPartTags] = useState<string>("");
  const [newImage, setNewImage] = useState<File | null>(null);

  useEffect(() => {
    const p = data?.post;
    if (!p) return;
    setTitle(p.title || "");
    setBody(p.body || "");
    setPublished(!!p.published);
    setMake(p.vehicleTags?.make || ""); setModel(p.vehicleTags?.model || "");
    setYf(p.vehicleTags?.yearFrom ?? ""); setYt(p.vehicleTags?.yearTo ?? "");
    setPartTags(Array.isArray(p.partTags) ? p.partTags.join(", ") : "");
  }, [data]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      title,
      body,
      published,
      vehicleTags: {
        make: make || undefined,
        model: model || undefined,
        yearFrom: yf ? Number(yf) : undefined,
        yearTo: yt ? Number(yt) : undefined,
      },
      partTags: partTags
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };
    await api(`/api/admin/posts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    mutate();
    router.push("/admin/posts");
  }

  if (!data) return <div>Loading…</div>;

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-4 text-slate-900">Edit Post</h1>
      <form onSubmit={save} className="space-y-4 bg-white border border-slate-200 rounded-2xl p-6">
        <input className="w-full border rounded-xl px-3 py-2" value={title} onChange={(e)=>setTitle(e.target.value)} />
        <textarea className="w-full border rounded-xl px-3 py-2 min-h-[120px]" value={body} onChange={(e)=>setBody(e.target.value)} />
        <div className="flex items-center gap-2">
          <input id="pub" type="checkbox" checked={published} onChange={(e)=>setPublished(e.target.checked)} />
          <label htmlFor="pub" className="text-sm">Published (visible to users)</label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <input className="border rounded-xl px-3 py-2" placeholder="Make" value={make} onChange={(e)=>setMake(e.target.value)} />
          <input className="border rounded-xl px-3 py-2" placeholder="Model" value={model} onChange={(e)=>setModel(e.target.value)} />
          <input className="border rounded-xl px-3 py-2" placeholder="Year From" type="number" value={yf} onChange={(e)=>setYf(e.target.value)} />
          <input className="border rounded-xl px-3 py-2" placeholder="Year To" type="number" value={yt} onChange={(e)=>setYt(e.target.value)} />
        </div>

        <input className="w-full border rounded-xl px-3 py-2" placeholder="Part tags (comma separated)" value={partTags} onChange={(e)=>setPartTags(e.target.value)} />
        <div className="space-y-2">
  <label className="block text-sm font-medium text-slate-700">Image</label>

  {data?.post?.imageUrl ? (
    <div className="rounded-xl border p-3">
      <img
        src={`${API}${data.post.imageUrl}`}
        alt=""
        className="max-h-64 rounded-lg border"
      />
      <div className="mt-3 flex items-center gap-2">
        <input
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          onChange={(e) => setNewImage(e.target.files?.[0] ?? null)}
          className="text-sm"
        />
        <button
          type="button"
          onClick={async () => {
            if (!newImage) return alert("Choose a file first");
            const form = new FormData();
            form.append("image", newImage);
            await fetch(`${process.env.NEXT_PUBLIC_API}/api/admin/posts/${id}/image`, {
              method: "POST",
              headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
              body: form,
            });
            setNewImage(null);
            await mutate();
          }}
          className="border rounded-xl px-3 py-2 text-sm hover:bg-slate-50"
        >
          Replace
        </button>
        <button
          type="button"
          onClick={async () => {
            if (!confirm("Remove image?")) return;
            await fetch(`${process.env.NEXT_PUBLIC_API}/api/admin/posts/${id}/image`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
            });
            await mutate();
          }}
          className="text-red-600 hover:text-red-800 text-sm"
        >
          Remove
        </button>
      </div>
    </div>
  ) : (
    <div className="rounded-xl border p-3">
      <div className="text-sm text-slate-600 mb-2">No image attached.</div>
      <div className="flex items-center gap-2">
        <input
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          onChange={(e) => setNewImage(e.target.files?.[0] ?? null)}
          className="text-sm"
        />
        <button
          type="button"
          onClick={async () => {
            if (!newImage) return alert("Choose a file first");
            const form = new FormData();
            form.append("image", newImage);
            await fetch(`${process.env.NEXT_PUBLIC_API}/api/admin/posts/${id}/image`, {
              method: "POST",
              headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
              body: form,
            });
            setNewImage(null);
            await mutate();
          }}
          className="border rounded-xl px-3 py-2 text-sm hover:bg-slate-50"
        >
          Upload
        </button>
      </div>
    </div>
  )}
</div>

        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl">Save</button>
      </form>
    </div>
  );
}
