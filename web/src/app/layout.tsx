import React from "react";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import HeaderClient from "@/components/HeaderClient";
import Footer from "@/components/footer";

export const metadata = { title: "Smart Parts Catalog" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900">
        <AuthProvider>
          <div className="fixed top-0 left-0 right-0 z-50">
            <HeaderClient />
          </div>
          <main>{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
