"use client";

import React, { useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { MediaPreview } from "@/components/common/MediaPreview";
import { useToast } from "@/components/common/Toast";
import {
  isRawMaterialStage,
  hasRawOrigin,
  getRawFiles,
  getFormatMeta,
  timeAgo,
} from "@/lib/content-utils";
import { getThemeText } from "@/lib/marketing-plan";
import { claimMaterial } from "@/lib/content-actions";
import {
  UploadCloud,
  Plus,
  Hand,
  Lock,
  Bell,
  CheckCircle2,
  Link2,
  Camera,
  ArrowRight,
  UserCheck,
} from "lucide-react";

interface RawMaterialViewProps {
  contents: any[];
  users: any[];
  onSelectContent: (content: any) => void;
  onOpenCreateModal: () => void;
  onRefresh: () => void;
  onNavigateToPublished: () => void;
}

export function RawMaterialView({
  contents,
  users,
  onSelectContent,
  onOpenCreateModal,
  onRefresh,
  onNavigateToPublished,
}: RawMaterialViewProps) {
  const { currentUser } = useAuth();
  const toast = useToast();

  const [filterMode, setFilterMode] = useState<
    "ALL" | "AVAILABLE" | "TAKEN" | "GURU" | "REFERENCE"
  >("ALL");
  const [busyId, setBusyId] = useState<string | null>(null);
  // Pilihan "Diambil oleh user siapa" per kartu (default ke user yang sedang login)
  const [selectedAssigneeByCard, setSelectedAssigneeByCard] = useState<
    Record<string, string>
  >({});

  // Seluruh item yang masuk Tab 1: masih tahap Bahan Mentah ATAU bahan mentah yang sudah selesai diedit
  const allRawItems = useMemo(() => {
    const list = contents.filter(
      (c) => isRawMaterialStage(c) || hasRawOrigin(c)
    );
    // Urutkan: Bahan Mentah yang BELUM diambil tampil paling atas, diikuti yang sedang diedit (blur), lalu selesai (blur)
    return [...list].sort((a, b) => {
      const rank = (item: any) => {
        if (isRawMaterialStage(item) && !item.assignedToId) return 0; // Bebas diambil
        if (isRawMaterialStage(item) && item.assignedToId) return 1; // Sedang diambil (blur)
        return 2; // Sudah selesai diedit (blur)
      };
      const diff = rank(a) - rank(b);
      if (diff !== 0) return diff;
      return (
        new Date(b.updatedAt || b.createdAt || 0).getTime() -
        new Date(a.updatedAt || a.createdAt || 0).getTime()
      );
    });
  }, [contents]);

  const availableItems = useMemo(
    () =>
      allRawItems.filter((c) => isRawMaterialStage(c) && !c.assignedToId),
    [allRawItems]
  );

  // Bahan mentah yang sedang aktif diambil untuk diedit (muncul di notifikasi atas)
  const activelyClaimedItems = useMemo(
    () =>
      allRawItems.filter(
        (c) => isRawMaterialStage(c) && Boolean(c.assignedToId)
      ),
    [allRawItems]
  );

  const takenOrFinishedItems = useMemo(
    () =>
      allRawItems.filter(
        (c) => !isRawMaterialStage(c) || Boolean(c.assignedToId)
      ),
    [allRawItems]
  );

  const visibleItems = useMemo(() => {
    return allRawItems.filter((item) => {
      const isAvailable = isRawMaterialStage(item) && !item.assignedToId;
      const isReference =
        String(item.origin || "").toUpperCase() === "REFERENCE";

      if (filterMode === "AVAILABLE") return isAvailable;
      if (filterMode === "TAKEN") return !isAvailable;
      if (filterMode === "REFERENCE") return isReference;
      if (filterMode === "GURU") return !isReference;
      return true;
    });
  }, [allRawItems, filterMode]);

  const handleTakeMaterial = async (item: any) => {
    if (!currentUser) return;
    const chosenId = selectedAssigneeByCard[item.id] || currentUser.id;
    const chosenUser =
      users.find((u) => u.id === chosenId) || currentUser;

    setBusyId(item.id);
    try {
      const res = await claimMaterial(item, currentUser, {
        id: chosenUser.id,
        name: chosenUser.name,
        role: chosenUser.role,
      });

      if (res.ok) {
        onRefresh();
        toast(
          `🔔 Bahan "${item.title}" resmi diambil oleh ${chosenUser.name} untuk diedit! Kartu ini sekarang dikunci (blur).`,
          {
            action: {
              label: "Kelola / Upload Hasil di Tab 2 →",
              onClick: onNavigateToPublished,
            },
          }
        );
      } else {
        toast(res.error || "Gagal mengambil bahan mentah.", {
          tone: "error",
        });
      }
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header Banner Tab 1 */}
      <div className="bg-gradient-to-r from-[#1A3460] to-[#122544] border-2 border-[#F3BC6F] rounded-3xl p-5 sm:p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F35E50] text-white text-xs font-black">
              <UploadCloud className="w-4 h-4 text-[#F3BC6F]" />
              Tab 1 • Bank Bahan Mentah
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Upload Bahan Mentah{" "}
              <span className="text-[#F3BC6F]">
                (Guru/Bunda & Sumber Referensi)
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-white/85 leading-relaxed font-medium">
              Unggah foto/video mentah dari guru/bunda maupun tautan referensi luar. Pilih{" "}
              <strong>diambil oleh siapa</strong> lalu klik <strong>Ambil untuk Diedit</strong> — bahan yang sudah diambil otomatis{" "}
              <strong>menjadi blur (terkunci)</strong> agar tidak diedit dobel, dan bisa dikembalikan dari Tab 2 jika batal diedit.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenCreateModal}
            className="px-5 py-3 rounded-2xl bg-[#F35E50] hover:bg-[#e04b3d] text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#F3BC6F]" />
            <span>+ Upload Bahan Mentah</span>
          </button>
        </div>

        {/* Sub-Filter Tab 1 */}
        <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs font-bold">
          <div className="flex flex-wrap items-center gap-1.5 bg-white/10 p-1 rounded-2xl border border-white/10">
            <button
              type="button"
              onClick={() => setFilterMode("ALL")}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                filterMode === "ALL"
                  ? "bg-[#F3BC6F] text-[#1A3460] font-black"
                  : "text-white/80 hover:text-white"
              }`}
            >
              Semua ({allRawItems.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("AVAILABLE")}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                filterMode === "AVAILABLE"
                  ? "bg-emerald-500 text-white font-black"
                  : "text-white/80 hover:text-white"
              }`}
            >
              🟢 Bebas Diambil ({availableItems.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("TAKEN")}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                filterMode === "TAKEN"
                  ? "bg-amber-400 text-[#1A3460] font-black"
                  : "text-white/80 hover:text-white"
              }`}
            >
              🔒 Sudah Diambil / Blur ({takenOrFinishedItems.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("GURU")}
              className={`px-3 py-1.5 rounded-xl transition inline-flex items-center gap-1 cursor-pointer ${
                filterMode === "GURU"
                  ? "bg-[#F3BC6F] text-[#1A3460] font-black"
                  : "text-white/80 hover:text-white"
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              Dari Guru / Bunda
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("REFERENCE")}
              className={`px-3 py-1.5 rounded-xl transition inline-flex items-center gap-1 cursor-pointer ${
                filterMode === "REFERENCE"
                  ? "bg-[#F3BC6F] text-[#1A3460] font-black"
                  : "text-white/80 hover:text-white"
              }`}
            >
              <Link2 className="w-3.5 h-3.5" />
              Sumber Referensi Lain
            </button>
          </div>
        </div>
      </div>

      {/* BANNER NOTIFIKASI TIM: Memberi tahu seluruh user bahan mentah mana yang sedang diambil untuk diedit */}
      {activelyClaimedItems.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-black text-amber-950">
              <span className="w-6 h-6 rounded-full bg-amber-400 text-[#1A3460] flex items-center justify-center shrink-0">
                <Bell className="w-3.5 h-3.5" />
              </span>
              <span>
                Pemberitahuan Tim: {activelyClaimedItems.length} bahan mentah sedang diambil untuk diedit
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 pl-8">
              {activelyClaimedItems.map((c) => (
                <span
                  key={c.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white border border-amber-300 text-[11px] font-bold text-[#1A3460]"
                >
                  <UserCheck className="w-3 h-3 text-amber-600 shrink-0" />
                  <span>
                    <strong>{c.assignedTo?.name || "Anggota Tim"}</strong> mengambil{" "}
                    <em>&ldquo;{c.title}&rdquo;</em>
                  </span>
                  <span className="text-[10px] text-slate-400">
                    ({timeAgo(c.claimedAt || c.updatedAt)})
                  </span>
                </span>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={onNavigateToPublished}
            className="px-3.5 py-2 rounded-xl bg-[#1A3460] hover:bg-[#122544] text-[#F3BC6F] text-xs font-black inline-flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
          >
            <span>Upload Hasil / Kembalikan di Tab 2</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Grid Kartu Bahan Mentah */}
      {visibleItems.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-[#1A3460]/20 rounded-3xl p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#FFF8F3] border-2 border-[#F3BC6F] flex items-center justify-center mx-auto text-[#F35E50]">
            <UploadCloud className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-black text-[#1A3460]">
              Belum Ada Bahan Mentah pada Filter Ini
            </h3>
            <p className="text-xs text-[#1A3460]/70 max-w-md mx-auto font-medium">
              Unggah rekaman dokumentasi dari guru/bunda di kelas atau simpan tautan/file dari sumber referensi lain.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenCreateModal}
            className="px-4 py-2.5 rounded-xl bg-[#F35E50] hover:bg-[#e04b3d] text-white text-xs font-black inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Upload Bahan Mentah Baru
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {visibleItems.map((item) => {
            const rawFiles = getRawFiles(item);
            const formatMeta = getFormatMeta(item.contentType);
            const themeText = getThemeText(item.themeId, item.themeLabel);
            const isReference =
              String(item.origin || "").toUpperCase() === "REFERENCE";

            // Bahan terkunci (blur & tidak bisa diklik) begitu sudah ada user yang mengambil atau sudah selesai diedit
            const isStillRaw = isRawMaterialStage(item);
            const isLockedBlur = !isStillRaw || Boolean(item.assignedToId);
            const holder = item.assignedTo || item.createdBy;

            const chosenAssigneeId =
              selectedAssigneeByCard[item.id] || currentUser?.id || "";

            return (
              <div
                key={item.id}
                className={`relative rounded-3xl border-2 overflow-hidden transition ${
                  isLockedBlur
                    ? "bg-slate-100 border-slate-300 cursor-not-allowed select-none"
                    : "bg-white border-[#1A3460] shadow-md hover:shadow-xl"
                }`}
              >
                {/* Isi Kartu — Jika sudah diambil user, otomatis BLUR & TIDAK BISA DIKLIK */}
                <div
                  aria-hidden={isLockedBlur}
                  className={`p-5 h-full flex flex-col justify-between gap-4 transition ${
                    isLockedBlur
                      ? "blur-[4px] opacity-40 pointer-events-none select-none"
                      : ""
                  }`}
                >
                  <div className="space-y-3">
                    {/* Baris Badge Sumber & Waktu */}
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {isReference ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-black bg-violet-100 text-violet-900 border border-violet-300">
                            <Link2 className="w-3 h-3" />
                            Sumber Referensi
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-black bg-sky-100 text-sky-900 border border-sky-300">
                            <Camera className="w-3 h-3" />
                            Guru / Bunda
                          </span>
                        )}

                        {formatMeta.label && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-[#FFF8F3] border border-[#1A3460]/15 text-[#1A3460]">
                            {formatMeta.code ? `[${formatMeta.code}] ` : ""}
                            {formatMeta.label}
                          </span>
                        )}
                      </div>

                      <span className="text-[10px] font-bold text-slate-400">
                        {timeAgo(item.createdAt)}
                      </span>
                    </div>

                    {/* Tema Jadwal Marketing */}
                    {themeText && (
                      <div className="inline-block text-[11px] font-black px-2.5 py-0.5 rounded-lg bg-[#F3BC6F]/30 text-[#1A3460] border border-[#F3BC6F]">
                        📅 {themeText}
                      </div>
                    )}

                    {/* Pratinjau Media Mentah */}
                    <MediaPreview
                      files={rawFiles}
                      badgeLabel={isReference ? "Referensi" : "Bahan Mentah"}
                      emptyLabel="Catatan Bahan / Referensi"
                      emptySubLabel="Klik judul untuk melihat detail"
                      heightClass="h-44"
                      downloadBaseName={`mentah-${item.id.slice(-5)}`}
                    />

                    {/* Judul & Catatan */}
                    <div className="space-y-1">
                      <h3
                        onClick={() => !isLockedBlur && onSelectContent(item)}
                        className="font-black text-[#1A3460] text-sm leading-snug hover:text-[#F35E50] cursor-pointer transition line-clamp-2"
                      >
                        {item.title}
                      </h3>
                      {(item.description || item.prepNotes) && (
                        <p className="text-xs text-[#1A3460]/75 line-clamp-2 font-medium">
                          {item.description || item.prepNotes}
                        </p>
                      )}
                    </div>

                    {/* Pengunggah */}
                    <div className="pt-2.5 border-t border-[#1A3460]/10 flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <img
                          src={
                            item.createdBy?.avatar ||
                            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
                          }
                          alt={item.createdBy?.name || "Tim"}
                          className="w-6 h-6 rounded-full object-cover border border-[#F3BC6F] shrink-0"
                        />
                        <span className="text-[11px] font-bold text-[#1A3460] truncate">
                          Diunggah: <strong>{item.createdBy?.name || "Tim"}</strong>
                        </span>
                      </div>

                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                        🟢 Tersedia
                      </span>
                    </div>
                  </div>

                  {/* Footer Aksi: Pilih Diambil Oleh Siapa + Klik Ambil untuk Diedit */}
                  {!isLockedBlur && (
                    <div className="pt-3 border-t-2 border-[#1A3460]/10 space-y-2">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-[#1A3460]/70 mb-1">
                          Diambil untuk diedit oleh:
                        </label>
                        <select
                          value={chosenAssigneeId}
                          onChange={(e) =>
                            setSelectedAssigneeByCard((prev) => ({
                              ...prev,
                              [item.id]: e.target.value,
                            }))
                          }
                          className="w-full px-2.5 py-1.5 rounded-xl bg-[#FFF8F3] border border-[#1A3460]/20 text-xs font-bold text-[#1A3460] focus:outline-none focus:border-[#F35E50]"
                        >
                          {users.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name}
                              {u.id === currentUser?.id ? " (Saya)" : ""} —{" "}
                              {u.title || u.role}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={busyId === item.id}
                          onClick={() => handleTakeMaterial(item)}
                          className="flex-1 py-2.5 px-3 rounded-xl bg-[#F35E50] hover:bg-[#e04b3d] text-white font-black text-xs inline-flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer disabled:opacity-50"
                        >
                          <Hand className="w-3.5 h-3.5 text-[#F3BC6F]" />
                          <span>
                            {busyId === item.id
                              ? "Memproses..."
                              : "Ambil untuk Diedit"}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onSelectContent(item)}
                          className="py-2.5 px-3 rounded-xl bg-[#FFF8F3] hover:bg-[#F3BC6F]/30 border border-[#1A3460]/20 text-[#1A3460] font-black text-xs cursor-pointer"
                        >
                          Detail
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* OVERLAY TERKUNCI SAAT SUDAH DIAMBIL USER (Kartu tetap tidak bisa diklik di Tab 1) */}
                {isLockedBlur && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center p-5 pointer-events-none">
                    <div className="bg-[#1A3460]/95 text-white border-2 border-[#F3BC6F] rounded-2xl p-4 shadow-2xl max-w-[270px] w-full text-center space-y-2">
                      <div className="w-10 h-10 rounded-full bg-[#F3BC6F] text-[#1A3460] flex items-center justify-center mx-auto shadow-md">
                        {isStillRaw ? (
                          <Lock className="w-5 h-5 text-[#1A3460]" />
                        ) : (
                          <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                        )}
                      </div>

                      <div className="text-[10px] font-black uppercase tracking-wider text-[#F3BC6F]">
                        {isStillRaw
                          ? "🔒 Bahan Sedang Diambil"
                          : "✅ Selesai Diedit"}
                      </div>

                      <div className="flex items-center justify-center gap-2">
                        {holder?.avatar && (
                          <img
                            src={holder.avatar}
                            alt={holder.name}
                            className="w-6 h-6 rounded-full object-cover border border-[#F3BC6F]"
                          />
                        )}
                        <span className="text-sm font-black text-white">
                          {holder?.name || "Anggota Tim"}
                        </span>
                      </div>

                      <p className="text-[11px] text-white/80 font-medium leading-snug">
                        {isStillRaw
                          ? `Diambil ${timeAgo(
                              item.claimedAt || item.updatedAt
                            )} untuk diedit. Jika batal diedit, klik "Kembalikan ke Bahan Mentah" di Tab 2.`
                          : "Hasil edit dari bahan ini sudah diunggah ke Tab 2 (Upload Konten & Link Tayang)."}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
