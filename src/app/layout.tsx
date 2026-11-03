import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "ContentOps — Marketing Team Workspace & Live Showcase",
  description: "Platform pemantauan konten marketing, pelaporan persiapan admin, manajemen task tim ClickUp-style, dan showcase hasil live.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="dark">
      <body className="bg-slate-950 min-h-screen text-slate-100 antialiased selection:bg-indigo-600 selection:text-white">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
