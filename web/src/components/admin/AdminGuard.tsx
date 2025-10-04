"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function AdminGuard({ children, allow = ["admin"] }: { children: React.ReactNode; allow?: string[] }) {
  const { token, user, isAuthLoading } = useAuth();
  const router = useRouter();

  // Wait until AuthContext finished initializing
  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Checking credentials...
      </div>
    );
  }

  if (!token) {
    router.replace("/login");
    return null;
  }

  if (!user || !allow.includes(user.role ?? "")) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 p-8 text-center">
          <div className="text-2xl font-bold mb-2">403</div>
          <p className="text-slate-600 dark:text-slate-300">
            You don’t have permission to access the admin area.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
