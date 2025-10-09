"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, Send, Plus, X } from "lucide-react";

export default function NewPostPage() {
  const { token } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [image, setImage] = useState<File | null>(null);

  // vehicle tags
  const [vehicle, setVehicle] = useState({
    make: "",
    model: "",
    yearFrom: "",
    yearTo: "",
  });

  // part tags (chips)
  const [partInput, setPartInput] = useState("");
  const [partTags, setPartTags] = useState<string[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-600">
          Please{" "}
          <a href="/login" className="text-blue-600 underline">
            login
          </a>{" "}
          to create a post.
        </p>
      </div>
    );
  }

  function addPartTag() {
    const t = partInput.trim();
    if (!t) return;
    if (!partTags.includes(t)) setPartTags((arr) => [...arr, t]);
    setPartInput("");
  }
  function removePartTag(tag: string) {
    setPartTags((arr) => arr.filter((x) => x !== tag));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return alert("Title is required");
    setIsSubmitting(true);
    try {
      const form = new FormData();
      form.append("title", title);
      form.append("body", body);
      if (image) form.append("image", image);
      form.append("partTags", JSON.stringify(partTags));
      form.append(
        "vehicleTags",
        JSON.stringify({
          make: vehicle.make || undefined,
          model: vehicle.model || undefined,
          yearFrom: vehicle.yearFrom ? Number(vehicle.yearFrom) : undefined,
          yearTo: vehicle.yearTo ? Number(vehicle.yearTo) : undefined,
        })
      );

      const res = await fetch(`${process.env.NEXT_PUBLIC_API}/api/posts`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg);
      }
      router.push("/community");
    } catch (err: any) {
      alert("Failed to create post: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="bg-gradient-to-r from-blue-900 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-18 pb-2">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-2">Community</h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Share builds, ask questions, and tag parts/vehicles for better discovery.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto mt-4 bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <h1 className="text-2xl font-bold text-slate-900 mb-6">Create a New Post</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="What do you want to ask or share?"
              required
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Body</label>
            <textarea
              rows={6}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Provide more details here (optional)…"
            />
          </div>

          {/* Image */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Image (optional)</label>
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={(e) => setImage(e.target.files?.[0] ?? null)}
              className="block w-full text-sm"
            />
            {image && (
              <img
                src={URL.createObjectURL(image)}
                alt="preview"
                className="mt-3 max-h-64 w-full object-cover rounded-xl border"
              />
            )}
          </div>

          {/* Vehicle tags */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Vehicle tags</label>
            <div className="grid grid-cols-2 gap-3">
              <input
                className="rounded-xl border border-slate-300 px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Make"
                value={vehicle.make}
                onChange={(e) => setVehicle((v) => ({ ...v, make: e.target.value }))}
              />
              <input
                className="rounded-xl border border-slate-300 px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Model"
                value={vehicle.model}
                onChange={(e) => setVehicle((v) => ({ ...v, model: e.target.value }))}
              />
              <input
                className="rounded-xl border border-slate-300 px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Year From"
                type="number"
                value={vehicle.yearFrom}
                onChange={(e) => setVehicle((v) => ({ ...v, yearFrom: e.target.value }))}
              />
              <input
                className="rounded-xl border border-slate-300 px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Year To"
                type="number"
                value={vehicle.yearTo}
                onChange={(e) => setVehicle((v) => ({ ...v, yearTo: e.target.value }))}
              />
            </div>
          </div>

          {/* Part tags */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Part tags</label>
            <div className="flex gap-2">
              <input
                className="flex-1 border border-slate-300 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Type a tag and press Add"
                value={partInput}
                onChange={(e) => setPartInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addPartTag())}
              />
              <button
                type="button"
                onClick={addPartTag}
                className="inline-flex border-slate-300 text-amber-50 font-medium bg-blue-600 items-center gap-1 border rounded-xl px-3 py-2 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
            {partTags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {partTags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border bg-slate-50 text-sm"
                  >
                    {t}
                    <button
                      type="button"
                      onClick={() => removePartTag(t)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-4 shadow-lg hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                Publish Post
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
