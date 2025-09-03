"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await api<{token:string}>("/api/auth/login", {
        method:"POST",
        body: JSON.stringify({ email, password })
      });
      login(res.token);
      router.push("/catalog");
    } catch (err: any) {
      alert("Login failed: " + err.message);
    }
  }

  return (
    <form onSubmit={handleLogin} style={{maxWidth:420}}>
      <h1>Login</h1>
      <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} style={{display:"block",margin:"8px 0",width:"100%"}}/>
      <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} style={{display:"block",margin:"8px 0",width:"100%"}}/>
      <button type="submit">Login</button>
      <p style={{marginTop:8}}>Seeded users: admin@example.com / admin123, alice@example.com / alice123</p>
    </form>
  );
}
