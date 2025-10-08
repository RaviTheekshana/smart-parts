"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function AdminGuard({
  children,
  allow = ["admin"],
}: {
  children: React.ReactNode;
  allow?: string[];
}) {
  const { token, user, isAuthLoading } = useAuth();           // 1) hooks
  const router = useRouter();                                  // 2)
  const pathname = usePathname();                              // 3)
  const redirected = useRef(false);                            // 4)

  const isLoggedIn = !!token && !!user;
  const isAllowed = isLoggedIn && allow.includes(user?.role ?? "");

  // 5) ALWAYS call effects — don't return before this
  useEffect(() => {
    if (!isAuthLoading && !isLoggedIn && !redirected.current) {
      redirected.current = true;
      const next = encodeURIComponent(pathname || "/");
      router.replace(`/login?next=${next}`);
    }
  }, [isAuthLoading, isLoggedIn, pathname, router]);

  // ----- Render branches AFTER hooks -----
  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Checking credentials...
      </div>
    );
  }

  if (!isLoggedIn) {
    // redirect in effect; render nothing while it happens
    return null;
  }

  if (!isAllowed) {
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
