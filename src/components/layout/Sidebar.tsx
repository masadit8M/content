"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  FileCheck2,
  CheckSquare,
  FileBarChart2,
  Users,
  Camera,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  projectId: string;
}

export function Sidebar({ projectId }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      label: "Ringkasan Proyek",
      subLabel: "Dashboard & Kondisi Hari Ini",
      href: `/projects/${projectId}`,
      icon: LayoutDashboard,
      exact: true,
    },
    {
      label: "Jurnal & Jadwal",
      subLabel: "Jadwal Kerja & Diary Pribadi",
      href: `/projects/${projectId}/activities`,
      icon: Calendar,
      exact: false,
    },
    {
      label: "Rekomendasi & Solusi",
      subLabel: "Persetujuan Masukan Konsultan",
      href: `/projects/${projectId}/recommendations`,
      icon: FileCheck2,
      exact: false,
    },
    {
      label: "Daftar Tugas",
      subLabel: "Checklist Operasional Daycare",
      href: `/projects/${projectId}/tasks`,
      icon: CheckSquare,
      exact: false,
    },
    {
      label: "Foto & Video",
      subLabel: "Dokumentasi Lapangan & SOP",
      href: `/projects/${projectId}/media`,
      icon: Camera,
      exact: false,
    },
    {
      label: "Laporan & Dokumen",
      subLabel: "Rekap Hasil & Berkas SOP",
      href: `/projects/${projectId}/reports`,
      icon: FileBarChart2,
      exact: false,
    },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="w-72 shrink-0 border-r border-slate-200 bg-white min-h-[calc(100vh-4rem)] flex flex-col justify-between py-6 px-4 no-print hidden md:flex">
        <div className="space-y-6">
          {/* Workspace Info Box */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-wider uppercase text-slate-400">
                Workspace Daycare
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Aktif
              </span>
            </div>
            <p className="font-bold text-slate-900 text-sm mt-1.5 leading-snug">
              Rumah Nara Islamic Child Center
            </p>
            <p className="text-xs text-slate-500 mt-0.5">Klien: CV Santara Artha</p>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-2">
            <span className="px-3 text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Menu Utama
            </span>
            {navItems.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);

              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-start gap-3 px-3.5 py-3 rounded-2xl transition group",
                    isActive
                      ? "bg-slate-900 text-white font-bold shadow-sm"
                      : "text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 font-semibold"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-5 h-5 mt-0.5 shrink-0 transition",
                      isActive
                        ? "text-emerald-400"
                        : "text-slate-400 group-hover:text-slate-700"
                    )}
                  />
                  <div className="min-w-0">
                    <span className="block text-sm leading-tight truncate">{item.label}</span>
                    <span
                      className={cn(
                        "block text-xs mt-0.5 leading-tight truncate",
                        isActive ? "text-slate-300 font-normal" : "text-slate-400 font-normal"
                      )}
                    >
                      {item.subLabel}
                    </span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Info */}
        <div className="pt-4 border-t border-slate-100">
          <p className="text-xs text-slate-400 px-3">
            Yayasan Arjuna Cendekia · 2026
          </p>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar (PRD #55: Super Smooth Mobile Experience) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 py-2 px-3 flex items-center justify-around md:hidden no-print shadow-lg">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center p-2 rounded-xl text-center transition min-w-[56px]",
                isActive
                  ? "text-emerald-700 font-bold"
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive ? "text-emerald-600 stroke-[2.5]" : "text-slate-400")} />
              <span className="text-[11px] mt-1 font-semibold leading-none truncate max-w-[64px]">
                {item.label.split(" ")[0]}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
