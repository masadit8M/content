"use client";

import React, { useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { MultiFileUpload } from "@/components/common/MultiFileUpload";
import { useToast } from "@/components/common/Toast";
import {
  MediaFile,
  PublishedLink,
  PLATFORM_OPTIONS,
  FORMAT_OPTIONS,
  filesToFields,
  linksToFields,
  detectPlatformFromUrl,
  getRequiredHashtags,
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
  Rocket,
  Hash,
  Camera,
  Link2,
  Plus,
} from "lucide-react";

interface CreateModalProps {
  defaultMode?: "RAW" | "FINISHED";
  defaultThemeId?: string;
  onClose: () => void;
  onSuccess: (targetTab: "raw" | "published") => void;
}

export function CreateContentModal({
  defaultMode = "RAW",
  defaultThemeId,
  onClose,
  onSuccess,
}: CreateModalProps) {
  const { currentUser } = useAuth();
  const toast = useToast();

  const themeGroups = useMemo(() => getThemeGroups(new Date()), []);
  const fallbackTheme = useMemo(
    () => getMonthTheme(getSchoolPosition(new Date()).m),
    []
  );

  const [mode, setMode] = useState<"RAW" | "FINISHED">(defaultMode);
  const [rawSource, setRawSource] = useState<"FIELD" | "REFERENCE">("FIELD");
  const [title, setTitle] = useState("");
  const [themeId, setThemeId] = useState<string>(
    defaultThemeId || fallbackTheme.id
  );
  const [contentType, setContentType] = useState("REELS");
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [description, setDescription] = useState("");
  const [caption, setCaption] = useState("");
  const [linkRows, setLinkRows] = useState<{ platform: string; url: string }[]>(
    [{ platform: "INSTAGRAM", url: "" }]
  );

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
      setError("Judul bahan / konten wajib diisi.");
      return;
    }

    const validLinks: PublishedLink[] = linkRows
      .filter((r) => r.url.trim())
      .map((r, idx) => {
        const cleanUrl = r.url.trim();
        const auto = detectPlatformFromUrl(cleanUrl);
        return {
          id: `lnk_${Date.now()}_${idx}`,
          platform: r.platform || (auto !== "WEBSITE" ? auto : "INSTAGRAM"),
          url: cleanUrl,
          addedBy: currentUser?.name || "Tim",
          addedAt: new Date().toISOString(),
        };
      });

    if (mode === "RAW" && files.length === 0) {
      setError(
        "Unggah minimal 1 foto/video mentah atau tempel tautan referensi."
      );
      return;
    }

    if (mode === "FINISHED" && files.length === 0 && validLinks.length === 0) {
      setError(
        "Unggah minimal 1 berkas konten jadi ATAU isi minimal 1 link platform tempat konten telah diupload."
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
          platform: "INSTAGRAM",
          contentType,
          status: "RAW_MATERIAL",
          origin: rawSource,
          themeId: themeId || null,
          themeLabel,
          assignedToId: null,
          ...filesToFields("raw", files),
        });

        if (res.ok) {
          toast("Bahan mentah berhasil ditambahkan ke Tab 1 (Bahan Mentah)!");
          onSuccess("raw");
          onClose();
        } else {
          setError(res.error || "Gagal menyimpan bahan mentah.");
        }
      } else {
        const res = await createContent({
          title: title.trim(),
          description: description.trim() || null,
          caption: caption.trim() || null,
          platform: validLinks[0]?.platform || "INSTAGRAM",
          contentType,
          origin: "PROPOSAL",
          themeId: themeId || null,
          themeLabel,
          assignedToId: currentUser?.id || null,
          ...(files.length > 0 ? filesToFields("edited", files) : {}),
          ...linksToFields(validLinks),
          ...(validLinks.length > 0
            ? { publishedAt: new Date().toISOString() }
            : {}),
        });

        if (res.ok) {
          toast(
            validLinks.length > 0
              ? `Konten beserta ${validLinks.length} link platform berhasil disimpan!`
              : "Konten jadi berhasil disimpan di Tab 2! Anda dapat menambah link platform kapan saja."
          );
          onSuccess("published");
          onClose();
        } else {
          setError(res.error || "Gagal menyimpan konten.");
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
                <Rocket className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">
                Upload ke Bank Konten PAUD Arjuna
              </h3>
              <p className="text-[11px] text-[#F9C5CB] font-semibold">
                Pilih Bahan Mentah (Tab 1) atau Konten Mandiri & Link Tayang (Tab 2)
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
          {/* Pilihan Mode: Bahan Mentah vs Konten Jadi & Link */}
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
                1. Upload Bahan Mentah
              </div>
              <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                Foto/video mentah dari guru/bunda atau tautan referensi luar — nantinya diambil & diedit tim.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setMode("FINISHED")}
              className={`p-3 rounded-2xl border-2 text-left transition cursor-pointer ${
                mode === "FINISHED"
                  ? "bg-[#FFF8F3] border-[#F35E50] shadow-sm"
                  : "bg-white border-[#1A3460]/15 opacity-75 hover:opacity-100"
              }`}
            >
              <div className="text-xs font-black text-[#1A3460] flex items-center gap-1.5">
                <Rocket className="w-4 h-4 text-emerald-600" />
                2. Upload Konten Mandiri & Link
              </div>
              <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                Konten yang dibuat mandiri (bukan dari bahan mentah) beserta link platform tempat konten diupload.
              </p>
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-bold">
              {error}
            </div>
          )}

          {/* Khusus Bahan Mentah: Pilih Asal Bahan (Guru/Bunda vs Sumber Referensi) */}
          {mode === "RAW" && (
            <div>
              <label className="block text-xs font-black text-[#1A3460] mb-1.5">
                Sumber Bahan Mentah
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRawSource("FIELD")}
                  className={`py-2 px-3 rounded-xl border text-xs font-black inline-flex items-center justify-center gap-1.5 cursor-pointer ${
                    rawSource === "FIELD"
                      ? "bg-[#1A3460] text-[#F3BC6F] border-[#1A3460]"
                      : "bg-[#FFF8F3] text-[#1A3460] border-[#1A3460]/20"
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  Dari Guru / Bunda
                </button>
                <button
                  type="button"
                  onClick={() => setRawSource("REFERENCE")}
                  className={`py-2 px-3 rounded-xl border text-xs font-black inline-flex items-center justify-center gap-1.5 cursor-pointer ${
                    rawSource === "REFERENCE"
                      ? "bg-[#1A3460] text-[#F3BC6F] border-[#1A3460]"
                      : "bg-[#FFF8F3] text-[#1A3460] border-[#1A3460]/20"
                  }`}
                >
                  <Link2 className="w-3.5 h-3.5" />
                  Sumber Referensi Lain
                </button>
              </div>
            </div>
          )}

          {/* Tema & Format */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
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

            <div>
              <label className="block text-xs font-black text-[#1A3460] mb-1">
                Format Konten
              </label>
              <select
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#FFF8F3] border-2 border-[#1A3460]/15 text-[#1A3460] text-xs font-bold focus:outline-none focus:border-[#F35E50]"
              >
                {FORMAT_OPTIONS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.code ? `[${f.code}] ` : ""}
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Judul */}
          <div>
            <label className="block text-xs font-black text-[#1A3460] mb-1">
              Judul {mode === "RAW" ? "Bahan Mentah" : "Konten"}{" "}
              <span className="text-[#F35E50]">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                mode === "RAW"
                  ? rawSource === "REFERENCE"
                    ? "Contoh: Referensi Tren Transisi Anak Masuk Kelas"
                    : "Contoh: Rekaman Anak TK Bermain Peran Dokter Cilik"
                  : "Contoh: Reels Tips Menyiapkan Bekal Anak Tanpa Drama"
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFF8F3] border-2 border-[#1A3460]/15 text-[#1A3460] placeholder-slate-400 focus:outline-none focus:border-[#F35E50] text-xs sm:text-sm font-bold"
            />
          </div>

          {/* Multi-file Upload */}
          <div className="bg-[#FFF8F3] border-2 border-[#F3BC6F] rounded-2xl p-4">
            <MultiFileUpload
              label={
                mode === "RAW"
                  ? rawSource === "REFERENCE"
                    ? "🔗 Tautan / File Sumber Referensi (Klik 'Tempel Tautan' atau Pilih File)"
                    : "📸 Berkas Foto / Video Mentah dari Guru / Bunda"
                  : "🎬 Berkas Konten Jadi (Opsional jika langsung menempelkan link platform di bawah)"
              }
              helperText={
                mode === "RAW"
                  ? "Bisa pilih beberapa foto/video sekaligus atau tempel link Google Drive / IG / TikTok referensi."
                  : "Unggah video MP4 / slide Carousel untuk arsip bank konten, atau langsung tempel link medsos."
              }
              files={files}
              onChange={setFiles}
            />
          </div>

          {mode === "RAW" ? (
            <div>
              <label className="block text-xs font-black text-[#1A3460] mb-1">
                Catatan / Arahan untuk Editor (Opsional)
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Contoh: Ambil momen senyum anak di detik ke-10, tambahkan musik ceria..."
                className="w-full p-3 rounded-xl bg-[#FFF8F3] border-2 border-[#1A3460]/15 text-[#1A3460] placeholder-slate-400 focus:outline-none focus:border-[#F35E50] text-xs font-medium"
              />
            </div>
          ) : (
            <>
              {/* Caption */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-[#1A3460]">
                    Caption Postingan Medsos (Opsional)
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
                  rows={3}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Tulis caption hangat untuk Ayah Bunda..."
                  className="w-full p-3 rounded-xl bg-[#FFF8F3] border-2 border-[#1A3460]/15 text-[#1A3460] placeholder-slate-400 focus:outline-none focus:border-[#F35E50] text-xs font-medium"
                />
              </div>

              {/* Multi-Link Platform Tayang */}
              <div className="rounded-2xl bg-emerald-50/70 border-2 border-emerald-300 p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                    <Link2 className="w-4 h-4 text-emerald-700" />
                    Link Platform Tempat Konten Telah Diupload
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setLinkRows((prev) => [
                        ...prev,
                        { platform: "TIKTOK", url: "" },
                      ])
                    }
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    Tambah Link Lain
                  </button>
                </div>

                <div className="space-y-2">
                  {linkRows.map((row, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <select
                        value={row.platform}
                        onChange={(e) =>
                          setLinkRows((prev) =>
                            prev.map((r, i) =>
                              i === idx ? { ...r, platform: e.target.value } : r
                            )
                          )
                        }
                        className="px-2.5 py-2 rounded-xl bg-white border border-emerald-300 text-xs font-black text-[#1A3460] shrink-0"
                      >
                        {PLATFORM_OPTIONS.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                      <input
                        type="url"
                        value={row.url}
                        onChange={(e) => {
                          const val = e.target.value;
                          const auto = detectPlatformFromUrl(val);
                          setLinkRows((prev) =>
                            prev.map((r, i) =>
                              i === idx
                                ? {
                                    platform:
                                      val.trim() && auto !== "WEBSITE"
                                        ? auto
                                        : r.platform,
                                    url: val,
                                  }
                                : r
                            )
                          );
                        }}
                        placeholder="https://www.instagram.com/reel/... atau TikTok/FB/YT"
                        className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-white border border-emerald-300 text-xs text-[#1A3460] font-medium focus:outline-none focus:border-emerald-600"
                      />
                      {linkRows.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setLinkRows((prev) =>
                              prev.filter((_, i) => i !== idx)
                            )
                          }
                          className="p-2 rounded-xl hover:bg-rose-100 text-rose-600 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-emerald-900/75 font-medium">
                  Anda bisa menempelkan beberapa link sekaligus (misal IG + TikTok + FB + YouTube), atau menambahkannya nanti di kartu konten.
                </p>
              </div>
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
                ? "Simpan Bahan Mentah"
                : "Simpan Konten & Link"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
