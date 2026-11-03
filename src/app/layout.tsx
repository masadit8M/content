import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/components/common/Toast";

export const metadata: Metadata = {
  title: "Bank Konten & Jadwal Marketing — PAUD Arjuna Malang",
  description:
    "Pusat Bank Konten Terpadu, Jadwal Marketing Tahun Ajaran, Panduan Brand Identity, dan Studio Ide PAUD Arjuna Malang.",
  icons: {
    icon: "/brand/logo-arjuna.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="bg-[#FFF8F3] min-h-screen text-[#1A3460] antialiased selection:bg-[#F35E50]/20 selection:text-[#1A3460]">
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
