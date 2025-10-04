"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { getToken, setToken } from "@/lib/api";
import { jwtDecode } from "jwt-decode";

type Decoded = { _id?: string; id?: string; userId?: string; email?: string; role?: string };
type UserInfo = { id: string; email?: string; role?: string } | null;

type AuthCtx = {
  token: string | null;
  user: UserInfo;
  isAuthLoading: boolean;
  login: (t: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setT] = useState<string | null>(null);
  const [user, setUser] = useState<UserInfo>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const decodeUser = (t: string | null): UserInfo => {
    if (!t) return null;
    try {
      const d = jwtDecode<Decoded>(t);
      return { id: d._id || d.id || d.userId || "", email: d.email, role: d.role };
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const t = getToken();
    setT(t);
    setUser(decodeUser(t));
    setIsAuthLoading(false);
  }, []);

  const login = (t: string) => {
    setToken(t);
    setT(t);
    setUser(decodeUser(t));
  };

  const logout = () => {
    setToken(null);
    setT(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, isAuthLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
