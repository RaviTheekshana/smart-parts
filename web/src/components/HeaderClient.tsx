"use client";
import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function HeaderClient() {
  const { token, logout } = useAuth();
  return (
    <header style={{padding:"1rem", borderBottom:"1px solid #ccc"}}>
      <nav style={{display:"flex", gap:"1rem", alignItems:"center"}}>
        <Link href="/catalog">Catalog</Link>
        <Link href="/cart">Cart</Link>
        <Link href="/orders">Orders</Link>
        <Link href="/community">Community</Link>
        <span style={{marginLeft:"auto"}}/>
        {token ? (
          <button onClick={logout}>Logout</button>
        ) : (
          <>
            <Link href="/login">Login</Link>
            <Link href="/register">Register</Link>
          </>
        )}
      </nav>
    </header>
  );
}
