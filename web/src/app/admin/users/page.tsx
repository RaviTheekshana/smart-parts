"use client";

import useSWR from "swr";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Plus, Edit, Trash2, RefreshCcw } from "lucide-react";
import { useState } from "react";

type User = {
  _id: string;
  email: string;
  role: string;
  profile?: { name?: string };
  createdAt?: string;
};

export default function UsersPage() {
  const [query, setQuery] = useState("");
  const { data, mutate, isLoading } = useSWR<{ users: User[]; total: number }>(
    `/api/admin/users?query=${encodeURIComponent(query)}`,
    api
  );
  const router = useRouter();

  const users = data?.users || [];

  async function handleDelete(id: string) {
    if (!confirm("Delete this user?")) return;
    await api(`/api/admin/users/${id}`, { method: "DELETE" });
    mutate();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Users</h1>
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search email..."
            className="border rounded-xl px-3 py-2 text-sm"
          />
          <button
            onClick={() => router.push("/admin/users/new")}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-xl text-sm"
          >
            <Plus className="w-4 h-4" /> New
          </button>
          <button
            onClick={() => mutate()}
            className="inline-flex items-center gap-2 border px-3 py-2 rounded-xl text-sm"
          >
            <RefreshCcw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white/70 backdrop-blur">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-600">
              <th className="py-2 px-4">Email</th>
              <th className="py-2 px-4">Name</th>
              <th className="py-2 px-4">Role</th>
              <th className="py-2 px-4">Created</th>
              <th className="py-2 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} className="border-b border-slate-200 hover:bg-slate-100">
                <td className="py-2 px-4">{u.email}</td>
                <td className="py-2 px-4">{u.profile?.name ?? "—"}</td>
                <td className="py-2 px-4 capitalize">{u.role}</td>
                <td className="py-2 px-4">
                  {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                </td>
                <td className="py-2 px-4 text-right space-x-2">
                  <button
                    onClick={() => router.push(`/admin/users/${u._id}`)}
                    className="inline-flex items-center text-blue-600 hover:text-blue-800"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(u._id)}
                    className="inline-flex items-center text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && !isLoading && (
              <tr><td className="py-4 px-4 text-center text-slate-500" colSpan={5}>No users found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
