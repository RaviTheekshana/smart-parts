"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AdminGuard from "@/components/admin/AdminGuard";
import {
  LayoutDashboard,
  Users,
  Package,
  Receipt,
  Megaphone,
  Quote,
} from "lucide-react";
import { useMemo } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuth();

  const nav = useMemo(
    () => [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/users", label: "Users", icon: Users },
      { href: "/admin/products", label: "Products", icon: Package },
      { href: "/admin/orders", label: "Orders", icon: Receipt },
      { href: "/admin/posts", label: "Posts", icon: Megaphone },
      { href: "/admin/testimonials", label: "Testimonials", icon: Quote },
    ],
    []
  );

  // ✅ Active route logic — fixes Dashboard also turning blue
  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin"; // exact match only
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <AdminGuard allow={["admin"]}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900">
        {/* Top header */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-2 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Welcome To PartPal Admin
            </h1>
          </div>
        </div>

        {/* Soft glow background */}
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(600px_200px_at_20%_0%,rgba(120,119,198,0.1),transparent)]" />

        <div className="relative flex">
          {/* Sidebar */}
          <aside className="min-h-screen hidden md:flex md:w-64 flex-col gap-2 p-4 border-r border-slate-200 bg-white shadow-sm">
            <div className="px-2 text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              PartPal Admin
            </div>

            <nav className="mt-2 space-y-1">
              {nav.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl transition ${
                      active
                        ? "bg-blue-600 text-white"
                        : "text-gray-800 hover:bg-slate-200"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto px-3 py-3 text-xs text-slate-500 border-t border-slate-200">
              Signed in as <span className="font-medium">{user?.email}</span>
              <button
                onClick={() => {
                  logout();
                  router.push("/");
                }}
                className="block mt-2 text-blue-600 hover:underline"
              >
                Logout
              </button>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 p-4 md:p-8 bg-white/90">
            <div className="mx-auto max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
    </AdminGuard>
  );
}
