"use client";

import React, { useMemo, useState } from "react";
import { useAuth, DEMO_PERSONAS } from "@/context/AuthContext";
import { BRAND } from "@/lib/brand";
import { isRawMaterialStage } from "@/lib/content-utils";
import {
  getSchoolPosition,
  getMonthTheme,
  formatSlot,
} from "@/lib/marketing-plan";
import { downloadMediaFile } from "@/lib/upload-client";
import {
  Plus,
  Search,
  LogOut,
  ChevronDown,
  Wand2,
  Calendar,
  Download,
  UploadCloud,
  Rocket,
} from "lucide-react";

export type ViewType = "raw" | "published" | "schedule" | "studio";

interface NavbarProps {
  contents: any[];
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenCreateModal: () => void;
}

export function MarketingNavbar({
  contents,
  currentView,
  onViewChange,
  searchQuery,
  onSearchChange,
  onOpenCreateModal,
}: NavbarProps) {
  const { currentUser, switchPersona, logout } = useAuth();
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);

  const counts = useMemo(() => {
    let rawAvailable = 0;
    let rawClaimed = 0;
    let finished = 0;

    for (const c of contents) {
      if (isRawMaterialStage(c)) {
        if (c.assignedToId) rawClaimed++;
        else rawAvailable++;
      } else {
        finished++;
      }
    }
    return {
      rawAvailable,
      rawClaimed,
      rawTotal: rawAvailable + rawClaimed,
      finished,
    };
  }, [contents]);

  const scheduleSummary = useMemo(() => {
    const pos = getSchoolPosition(new Date());
    const theme = getMonthTheme(pos.m);
    return {
      slotLabel: formatSlot(pos),
      themeLabel: theme.label,
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-[#1A3460] border-b-2 border-[#F3BC6F]/40 text-white shadow-md">
      {/* Arjuna Signature Strip */}
      <div className="h-1.5 w-full flex">
        <div className="flex-1 bg-[#1A3460]" />
        <div className="flex-1 bg-[#F35E50]" />
        <div className="flex-1 bg-[#F3BC6F]" />
        <div className="flex-1 bg-[#F9C5CB]" />
      </div>

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo & Brand */}
          <button
            type="button"
            onClick={() => onViewChange("raw")}
            className="flex items-center gap-3 text-left cursor-pointer"
          >
            <div className="w-10 h-10 rounded-2xl bg-[#FFF8F3] border-2 border-[#F3BC6F] p-1 flex items-center justify-center shadow-md shrink-0">
              <img
                src={BRAND.logoUrl}
                alt={BRAND.orgName}
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg sm:text-xl tracking-tight text-white">
                  Bank Konten <span className="text-[#F3BC6F]">Arjuna</span>
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-black bg-[#F3BC6F] text-[#1A3460]">
                  PAUD ARJUNA MALANG
                </span>
              </div>
              <p className="text-[11px] text-[#F9C5CB] font-semibold hidden md:block">
                Bahan Mentah → Ambil & Edit → Upload Konten & Link Platform Tayang
              </p>
            </div>
          </button>

          {/* Search Input */}
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <Search className="w-4 h-4 text-[#F3BC6F] absolute left-3.5 top-2.5" />
              <input
                type="text"
                placeholder="Cari judul bahan, tema jadwal, caption, atau link medsos..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white/10 border border-[#F3BC6F]/30 text-white placeholder-white/50 focus:outline-none focus:border-[#F35E50] focus:ring-1 focus:ring-[#F35E50] transition"
              />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onOpenCreateModal}
              className="px-3.5 py-2 rounded-xl bg-[#F35E50] hover:bg-[#e04b3d] text-white text-xs sm:text-sm font-black flex items-center gap-1.5 shadow-md shadow-[#F35E50]/30 transition active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">
                {currentView === "published"
                  ? "Upload Konten / Link"
                  : "Upload Baru"}
              </span>
              <span className="sm:hidden">Upload</span>
            </button>

            {/* Persona Switcher */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPersonaMenu(!showPersonaMenu)}
                className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-[#F3BC6F]/40 transition cursor-pointer"
              >
                {currentUser?.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-7 h-7 rounded-full object-cover border-2 border-[#F3BC6F]"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-[#F35E50] text-white flex items-center justify-center text-xs font-black">
                    {currentUser?.name?.[0] || "U"}
                  </div>
                )}
                <div className="text-left hidden lg:block">
                  <div className="text-xs font-black text-white leading-tight">
                    {currentUser?.name}
                  </div>
                  <div className="text-[10px] text-[#F3BC6F] font-bold">
                    {currentUser?.title || currentUser?.role}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[#F3BC6F]" />
              </button>

              {showPersonaMenu && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white border-2 border-[#1A3460]/20 shadow-2xl p-2 z-50 text-[#1A3460]">
                  <div className="px-3 py-2 border-b border-[#1A3460]/10">
                    <p className="text-[10px] uppercase font-black tracking-wider text-[#1A3460]/60">
                      Ganti Akun Anggota Tim
                    </p>
                  </div>
                  <div className="space-y-1 my-1 max-h-80 overflow-y-auto pr-1">
                    {DEMO_PERSONAS.map((p) => {
                      const isActive = currentUser?.email === p.email;
                      return (
                        <button
                          key={p.email}
                          type="button"
                          onClick={() => {
                            switchPersona(p.email);
                            setShowPersonaMenu(false);
                          }}
                          className={`w-full text-left p-2 rounded-xl flex items-center gap-2.5 transition text-xs cursor-pointer ${
                            isActive
                              ? "bg-[#FFF8F3] text-[#1A3460] font-black border-2 border-[#F35E50]"
                              : "hover:bg-[#FFF8F3] text-[#1A3460]"
                          }`}
                        >
                          <img
                            src={p.avatar}
                            alt={p.name}
                            className="w-8 h-8 rounded-full object-cover border border-[#F3BC6F]"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-black flex items-center gap-1.5 text-[#1A3460]">
                              <span>{p.name}</span>
                              {isActive && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#F35E50] text-white">
                                  Aktif
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500 font-bold truncate">
                              {p.roleLabel}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <div className="border-t border-[#1A3460]/10 pt-1">
                    <button
                      type="button"
                      onClick={() => logout()}
                      className="w-full text-left p-2 rounded-xl text-rose-600 hover:bg-rose-50 flex items-center gap-2 text-xs font-black cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Keluar (Logout)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sub Bar: 4 Tab Utama (Langsung Berganti di Atas Layar) + Pengingat Tema Minggu Ini */}
      <div className="bg-[#122544] border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between py-2 gap-2.5">
            <div className="flex items-center gap-1.5 bg-white/10 p-1 rounded-2xl border border-white/10 overflow-x-auto max-w-full">
              {/* TAB 1: BAHAN MENTAH */}
              <button
                type="button"
                onClick={() => onViewChange("raw")}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
                  currentView === "raw"
                    ? "bg-[#F35E50] text-white shadow-md"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                }`}
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>1. Bahan Mentah</span>
                <span
                  title={`${counts.rawAvailable} bahan bebas diambil`}
                  className="px-1.5 py-0.2 rounded-full bg-black/25 text-[10px]"
                >
                  {counts.rawAvailable}
                </span>
                {counts.rawClaimed > 0 && (
                  <span
                    title={`${counts.rawClaimed} bahan sedang diambil (blur)`}
                    className="px-1.5 py-0.2 rounded-full bg-amber-400 text-[#1A3460] text-[10px] font-black"
                  >
                    🔒 {counts.rawClaimed}
                  </span>
                )}
              </button>

              {/* TAB 2: UPLOAD KONTEN & LINK TAYANG */}
              <button
                type="button"
                onClick={() => onViewChange("published")}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
                  currentView === "published"
                    ? "bg-emerald-600 text-white shadow-md"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                }`}
              >
                <Rocket className="w-3.5 h-3.5" />
                <span>2. Upload Konten & Link Tayang</span>
                <span className="px-1.5 py-0.2 rounded-full bg-black/25 text-[10px]">
                  {counts.finished}
                </span>
                {counts.rawClaimed > 0 && (
                  <span
                    title={`${counts.rawClaimed} bahan mentah sedang diedit di sini`}
                    className="px-1.5 py-0.2 rounded-full bg-amber-300 text-[#1A3460] text-[10px] font-black"
                  >
                    🛠️ {counts.rawClaimed} diedit
                  </span>
                )}
              </button>

              {/* TAB 3: JADWAL MARKETING & BRAND KIT */}
              <button
                type="button"
                onClick={() => onViewChange("schedule")}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
                  currentView === "schedule"
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Jadwal & Brand</span>
              </button>

              {/* TAB 4: STUDIO IDE (MURNI BRAINSTORMING) */}
              <button
                type="button"
                onClick={() => onViewChange("studio")}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
                  currentView === "studio"
                    ? "bg-[#F3BC6F] text-[#1A3460] shadow-md"
                    : "text-[#F3BC6F] hover:text-white hover:bg-white/10"
                }`}
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Studio Ide</span>
              </button>
            </div>

            {/* Pengingat Singkat Tema Minggu Ini & Unduh Logo Cepat (Tanpa Memakan Tinggi Layar) */}
            <div className="hidden xl:flex items-center gap-2">
              <button
                type="button"
                onClick={() => onViewChange("schedule")}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-[#F3BC6F]/30 text-[11px] font-bold text-white inline-flex items-center gap-1.5 transition cursor-pointer"
                title="Klik untuk membuka matriks lengkap Jadwal Marketing & Brand Kit"
              >
                <span className="text-[#F3BC6F] font-black">
                  📅 {scheduleSummary.slotLabel}:
                </span>
                <span>Tema {scheduleSummary.themeLabel}</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  downloadMediaFile({
                    url: BRAND.logoUrl,
                    name: BRAND.logoFileName,
                  })
                }
                className="px-2.5 py-1.5 rounded-xl bg-[#FFF8F3] hover:bg-[#F3BC6F] text-[#1A3460] text-[11px] font-black inline-flex items-center gap-1 transition cursor-pointer"
                title="Unduh Logo PNG Transparan PAUD Arjuna untuk dipasang di pojok kiri atas konten"
              >
                <Download className="w-3 h-3 text-[#F35E50]" />
                <span>Logo PNG</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
