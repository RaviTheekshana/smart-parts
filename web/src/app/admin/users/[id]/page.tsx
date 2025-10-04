"use client";

import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { api } from "@/lib/api";
import { useState, useEffect } from "react";

export default function EditUserPage() {
  const { id } = useParams() as { id: string };
  const { data, mutate } = useSWR<{ user: any }>(`/api/admin/users/${id}`, api);
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (data?.user) {
      setEmail(data.user.email || "");
      setName(data.user.profile?.name || "");
      setRole(data.user.role || "");
    }
  }, [data]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await api(`/api/admin/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ email, name, role, password: password || undefined }),
    });
    mutate();
    router.push("/admin/users");
  }

  if (!data) return <div>Loading...</div>;

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">Edit User</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border rounded-xl px-3 py-2"
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded-xl px-3 py-2"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full border rounded-xl px-3 py-2"
        >
          <option value="admin">Admin</option>
          <option value="dealer">Dealer</option>
          <option value="mechanic">Mechanic</option>
          <option value="customer">Customer</option>
        </select>
        <input
          type="password"
          placeholder="New Password (optional)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border rounded-xl px-3 py-2"
        />

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700"
        >
          Save Changes
        </button>
      </form>
    </div>
  );
}
