"use client";

import useSWR from "swr";
import { api } from "@/lib/api";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCcw } from "lucide-react";

type Post = {
  _id: string;
  title: string;
  published: boolean;
  authorName?: string;
  createdAt?: string;
  votes?: number;
};

export default function AdminPostsPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");

  const { data, mutate, isLoading } = useSWR<{ posts: Post[] }>(
    `/api/admin/posts?query=${encodeURIComponent(query)}&status=${status}`,
    api
  );
  const posts = data?.posts ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Posts</h1>
        <div className="flex gap-2">
          <input
            className="border rounded-xl px-3 py-2 text-sm"
            placeholder="Search title…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select
            className="border rounded-xl px-3 py-2 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All</option>
            <option value="published">Published</option>
            <option value="hidden">Hidden</option>
          </select>
          <button className="border rounded-xl px-3 py-2 text-sm inline-flex items-center gap-2" onClick={()=>mutate()}>
            <RefreshCcw className="w-4 h-4"/> Refresh
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-600">
              <th className="py-2 px-4">Title</th>
              <th className="py-2 px-4">Author</th>
              <th className="py-2 px-4">Votes</th>
              <th className="py-2 px-4">Published</th>
              <th className="py-2 px-4">Created</th>
              <th className="py-2 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {posts.map(p => (
              <tr key={p._id} className="border-b border-slate-200">
                <td className="py-2 px-4">{p.title}</td>
                <td className="py-2 px-4">{p.authorName ?? "—"}</td>
                <td className="py-2 px-4">{p.votes ?? 0}</td>
                <td className="py-2 px-4">{p.published ? "Yes" : "No"}</td>
                <td className="py-2 px-4">{p.createdAt ? new Date(p.createdAt).toLocaleString() : "—"}</td>
                <td className="py-2 px-4 text-right space-x-2">
                  <button
                    onClick={() => router.push(`/admin/posts/${p._id}`)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </button>
                  <button
                    onClick={async () => {
                      if (!confirm("Delete this post?")) return;
                      await api(`/api/admin/posts/${p._id}`, { method: "DELETE" });
                      mutate();
                    }}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {!isLoading && posts.length === 0 && (
              <tr><td className="py-4 px-4 text-center text-slate-500" colSpan={6}>No posts</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
