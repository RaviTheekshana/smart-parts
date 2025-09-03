"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { getToken, setToken } from "@/lib/api";

type AuthCtx = {
  token: string | null;
  login: (t: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setT] = useState<string | null>(null);
  useEffect(() => { setT(getToken()); }, []);
  const login = (t: string) => { setToken(t); setT(t); };
  const logout = () => { setToken(null); setT(null); };
  return <AuthContext.Provider value={{ token, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
