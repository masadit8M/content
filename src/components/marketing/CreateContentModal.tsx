"use client";

import React, { useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { MultiFileUpload } from "@/components/common/MultiFileUpload";
import { useToast } from "@/components/common/Toast";
import {
  MediaFile,
  PLATFORM_OPTIONS,
  FORMAT_OPTIONS,
  filesToFields,
  getRequiredHashtags,
  isReviewerRole,
} from "@/lib/content-utils";
import {
  getThemeGroups,
  getPlanItem,
  getPlanLabel,
  getMonthTheme,
  getSchoolPosition,
} from "@/lib/marketing-plan";
import { createContent } from "@/lib/content-actions";
import {
  X,
  UploadCloud,
  Film,
  Hash,
  ShieldCheck,
} from "lucide-react";

interface CreateModalProps {
  users: any[];
  defaultMode?: "RAW" | "PROPOSAL";
  defaultThemeId?: string;
  onClose: () => void;
  onSuccess: (targetTab: "raw" | "review" | "ready") => void;
}

export function CreateContentModal({
  users,
  defaultMode = "RAW",
  defaultThemeId,
  onClose,
  onSuccess,
}: CreateModalProps) {
  const { currentUser } = useAuth();
  const toast = useToast();
  const canDirectReady = isReviewerRole(currentUser?.role);

  const themeGroups = useMemo(() => getThemeGroups(new Date()), []);
  const fallbackTheme = useMemo(
    () => getMonthTheme(getSchoolPosition(new Date()).m),
    []
  );

  const [mode, setMode] = useState<"RAW" | "PROPOSAL">(defaultMode);
  const [title, setTitle] = useState("");
  const [themeId, setThemeId] = useState<string>(
    defaultThemeId || fallbackTheme.id
  );
  const [platform, setPlatform] = useState("INSTAGRAM");
  const [contentType, setContentType] = useState("REELS");
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [description, setDescription] = useState("");
  const [caption, setCaption] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [assignedToId, setAssignedToId] = useState("");
  const [directApprove, setDirectApprove] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleInsertHashtags = () => {
    const tags = getRequiredHashtags({ themeId });
    if (!caption.includes("#paudArjunaMalang")) {
      setCaption((prev) => (prev.trim() ? `${prev.trim()}\n\n${tags}` : tags));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Judul konten wajib diisi.");
      return;
    }
    if (files.length === 0) {
      setError(
        mode === "RAW"
          ? "Unggah minimal 1 foto/video mentah atau tautan Google Drive."
          : "Unggah minimal 1 berkas hasil produksi atau tautan Canva/Drive."
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      const planItem = getPlanItem(themeId);
      const themeLabel = planItem ? getPlanLabel(planItem) : null;

      if (mode === "RAW") {
        const res = await createContent({
          title: title.trim(),
          description: description.trim() || null,
          platform,
          contentType,
          status: "RAW_MATERIAL",
          origin: "FIELD",
          themeId: themeId || null,
          themeLabel,
          assignedToId: assignedToId || null,
          targetDate: targetDate || null,
          ...filesToFields("raw", files),
        });

        if (res.ok) {
          toast("Bahan mentah berhasil masuk ke Bank Bahan Mentah!");
          onSuccess("raw");
          onClose();
        } else {
          setError(res.error || "Gagal menyimpan bahan mentah.");
        }
      } else {
        const goReady = canDirectReady && directApprove;
        const nextStatus = goReady ? "READY_TO_PUBLISH" : "IN_REVIEW";

        const res = await createContent({
          title: title.trim(),
          description: description.trim() || null,
          caption: caption.trim() || null,
          platform,
          contentType,
          status: nextStatus,
          origin: "PROPOSAL",
          themeId: themeId || null,
          themeLabel,
          assignedToId: currentUser?.id || null,
          targetDate: targetDate || null,
          ...filesToFields("edited", files),
        });

        if (res.ok) {
          toast(
            goReady
              ? "Konten langsung masuk ke Bank Konten Siap Upload!"
              : "Hasil produksi berhasil diajukan ke Tab 2 (Hasil Edit & Usulan)!"
          );
          onSuccess(goReady ? "ready" : "review");
          onClose();
        } else {
          setError(res.error || "Gagal menyimpan usulan konten.");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1A3460]/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white border-2 border-[#1A3460] rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b-2 border-[#F3BC6F] flex items-center justify-between bg-[#1A3460] text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F35E50] border border-[#F3BC6F] flex items-center justify-center text-white shadow-md">
              {mode === "RAW" ? (
                <UploadCloud className="w-5 h-5" />
              ) : (
                <Film className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">
                Tambah ke Bank Konten PAUD Arjuna
              </h3>
              <p className="text-[11px] text-[#F9C5CB] font-semibold">
                Pilih jenis unggahan: bahan mentah lapangan atau konten jadi hasil edit/kreasi Anda
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#F35E50] text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="p-5 sm:p-6 space-y-4 max-h-[78vh] overflow-y-auto"
        >
          {/* Mode Switcher */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setMode("RAW")}
              className={`p-3 rounded-2xl border-2 text-left transition cursor-pointer ${
                mode === "RAW"
                  ? "bg-[#FFF8F3] border-[#F35E50] shadow-sm"
                  : "bg-white border-[#1A3460]/15 opacity-75 hover:opacity-100"
              }`}
            >
              <div className="text-xs font-black text-[#1A3460] flex items-center gap-1.5">
                <UploadCloud className="w-4 h-4 text-[#F35E50]" />
                1. Bahan Mentah Lapangan
              </div>
              <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                Rekaman foto/video kegiatan kelas yang belum diedit — nantinya diunduh & diolah tim di CapCut/Canva.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setMode("PROPOSAL")}
              className={`p-3 rounded-2xl border-2 text-left transition cursor-pointer ${
                mode === "PROPOSAL"
                  ? "bg-[#FFF8F3] border-[#F35E50] shadow-sm"
                  : "bg-white border-[#1A3460]/15 opacity-75 hover:opacity-100"
              }`}
            >
              <div className="text-xs font-black text-[#1A3460] flex items-center gap-1.5">
                <Film className="w-4 h-4 text-[#F35E50]" />
                2. Hasil Edit / Usulan Mandiri
              </div>
              <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                Video/desain yang sudah selesai Anda edit sendiri beserta caption — siap ditinjau ke Bank Siap Upload.
              </p>
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-bold">
              {error}
            </div>
          )}

          {/* Tema dari JADWAL MARKET KONTEN.xlsx */}
          <div>
            <label className="block text-xs font-black text-[#1A3460] mb-1">
              Tema Sesuai Jadwal Marketing
            </label>
            <select
              value={themeId}
              onChange={(e) => setThemeId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-[#FFF8F3] border-2 border-[#F3BC6F] text-[#1A3460] text-xs font-black focus:outline-none focus:border-[#F35E50]"
            >
              <option value="">-- Umum / Lintas Tema --</option>
              {themeGroups.map((g) => (
                <optgroup key={g.key} label={g.label}>
                  {g.items.map((it) => (
                    <option key={`${g.key}-${it.id}`} value={it.id}>
                      {getPlanLabel(it)}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Judul */}
          <div>
            <label className="block text-xs font-black text-[#1A3460] mb-1">
              Judul Konten / Bahan <span className="text-[#F35E50]">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                mode === "RAW"
                  ? "Contoh: Footage Anak TK Bermain Peran Dokter Cilik"
                  : "Contoh: Reels Edukasi Stimulasi Motorik Halus Usia 2-4 Tahun"
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFF8F3] border-2 border-[#1A3460]/15 text-[#1A3460] placeholder-slate-400 focus:outline-none focus:border-[#F35E50] text-xs sm:text-sm font-bold"
            />
          </div>

          {/* Multi-file Upload */}
          <div className="bg-[#FFF8F3] border-2 border-[#F3BC6F] rounded-2xl p-4 space-y-2">
            <MultiFileUpload
              label={
                mode === "RAW"
                  ? "📸 Berkas Foto / Video Mentah (Bisa Pilih Banyak Klip)"
                  : "🎬 Berkas Konten Jadi (Video MP4 / Slide Carousel PNG-JPG)"
              }
              helperText={
                mode === "RAW"
                  ? "Unggah langsung dari HP/laptop atau tempel tautan folder Google Drive jika ukuran sangat besar."
                  : "Pastikan logo PAUD Arjuna sudah terpasang di pojok kiri atas & tanpa watermark @handle IG."
              }
              files={files}
              onChange={setFiles}
            />
          </div>

          {/* Platform, Format, Tanggal */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-black text-[#1A3460] mb-1">
                Platform Utama
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#FFF8F3] border-2 border-[#1A3460]/15 text-[#1A3460] text-xs font-bold focus:outline-none focus:border-[#F35E50]"
              >
                {PLATFORM_OPTIONS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-[#1A3460] mb-1">
                Format Konten
              </label>
              <select
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#FFF8F3] border-2 border-[#1A3460]/15 text-[#1A3460] text-xs font-bold focus:outline-none focus:border-[#F35E50]"
              >
                {FORMAT_OPTIONS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.code ? `[${f.code}] ` : ""}
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-[#1A3460] mb-1">
                Target Tanggal Upload
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#FFF8F3] border-2 border-[#1A3460]/15 text-[#1A3460] text-xs font-bold focus:outline-none focus:border-[#F35E50]"
              />
            </div>
          </div>

          {mode === "RAW" ? (
            <>
              <div>
                <label className="block text-xs font-black text-[#1A3460] mb-1">
                  Catatan Lapangan / Arahan untuk Editor:
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Contoh: Momen paling bagus di detik ke-12 saat anak berhasil menyusun balok sendiri..."
                  className="w-full p-3 rounded-xl bg-[#FFF8F3] border-2 border-[#1A3460]/15 text-[#1A3460] placeholder-slate-400 focus:outline-none focus:border-[#F35E50] text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-[#1A3460] mb-1">
                  Tugaskan ke Editor Tertentu (Opsional)
                </label>
                <select
                  value={assignedToId}
                  onChange={(e) => setAssignedToId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FFF8F3] border-2 border-[#1A3460]/15 text-[#1A3460] text-xs font-bold focus:outline-none focus:border-[#F35E50]"
                >
                  <option value="">
                    -- Biarkan Terbuka (Bisa Diambil Siapa Saja) --
                  </option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.title || u.role})
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-[#1A3460]">
                    Caption Postingan Medsos
                  </label>
                  <button
                    type="button"
                    onClick={handleInsertHashtags}
                    className="text-[11px] font-black text-[#F35E50] hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Hash className="w-3 h-3" />+ Sisipkan Hashtag Wajib
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Tulis caption hangat untuk Ayah Bunda beserta ajakan konsultasi/trial class..."
                  className="w-full p-3 rounded-xl bg-[#FFF8F3] border-2 border-[#1A3460]/15 text-[#1A3460] placeholder-slate-400 focus:outline-none focus:border-[#F35E50] text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-[#1A3460] mb-1">
                  Catatan Konteks / Usulan (Opsional)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Contoh: Usulan konten mandiri dari kegiatan cooking class Jumat..."
                  className="w-full px-3 py-2 rounded-xl bg-[#FFF8F3] border-2 border-[#1A3460]/15 text-[#1A3460] placeholder-slate-400 focus:outline-none focus:border-[#F35E50] text-xs font-medium"
                />
              </div>

              {canDirectReady && (
                <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={directApprove}
                    onChange={(e) => setDirectApprove(e.target.checked)}
                    className="accent-emerald-600"
                  />
                  <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    Langsung masukkan ke <strong>Bank Konten Siap Upload (Tab 3)</strong>
                  </span>
                </label>
              )}
            </>
          )}

          {/* Footer */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#1A3460]/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#FFF8F3] hover:bg-[#F3BC6F]/30 text-[#1A3460] border border-[#1A3460]/15 text-xs font-black cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-[#F35E50] hover:bg-[#e04b3d] text-white text-xs font-black shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              {loading
                ? "Menyimpan..."
                : mode === "RAW"
                ? "Simpan ke Bank Bahan Mentah"
                : directApprove && canDirectReady
                ? "Simpan ke Bank Siap Upload"
                : "Ajukan Hasil Produksi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
