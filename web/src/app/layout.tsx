import React from "react";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import HeaderClient from "@/components/HeaderClient";

export const metadata = { title: "Smart Parts Catalog" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <HeaderClient />
          <main style={{padding:"1rem"}}>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
