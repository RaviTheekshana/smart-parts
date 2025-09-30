"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const { login } = useAuth();
  const router = useRouter();

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api("/api/auth/register", { method:"POST", body: JSON.stringify({ email, password, name }) });
      const res = await api<{token:string}>("/api/auth/login", { method:"POST", body: JSON.stringify({ email, password }) });
      login(res.token);
      router.push("/catalog");
    } catch (err: any) {
      alert("Register failed: " + err.message);
    }
  }

  return (
    <div className="min-h-screen mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:items-center lg:gap-12 lg:px-8 lg:py-28 flex flex-col justify-center">
    <form onSubmit={handleRegister} style={{maxWidth:420}}>
      <h1>Register</h1>
      <input placeholder="Name" value={name} onChange={e=>setName(e.target.value)} style={{display:"block",margin:"8px 0",width:"100%"}}/>
      <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} style={{display:"block",margin:"8px 0",width:"100%"}}/>
      <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} style={{display:"block",margin:"8px 0",width:"100%"}}/>
      <button type="submit">Create account</button>
    </form>
    </div>
  );
}
