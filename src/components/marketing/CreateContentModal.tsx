"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { FileUploadInput, UploadedFile } from "@/components/common/FileUploadInput";
import {
  X,
  Sparkles,
  FileText,
  Link as LinkIcon,
  Flame,
  Calendar,
  Layers,
  UploadCloud,
  Video,
  Image as ImageIcon,
} from "lucide-react";

interface CreateModalProps {
  users: any[];
  defaultStatus?: string;
  onClose: () => void;
  onSuccess: () => void;
  onOpenStudio?: (initialTopic?: string) => void;
}

export function CreateContentModal({
  users,
  defaultStatus = "RAW_MATERIAL",
  onClose,
  onSuccess,
  onOpenStudio,
}: CreateModalProps) {
  const { currentUser } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [platform, setPlatform] = useState("INSTAGRAM");
  const [contentType, setContentType] = useState("FEED_CAROUSEL");
  const [status, setStatus] = useState(defaultStatus);
  const [prepNotes, setPrepNotes] = useState("");
  const [rawFile, setRawFile] = useState<UploadedFile | null>(null);
  const [assetUrl, setAssetUrl] = useState("");
  const [liveUrl, setLiveUrl] = useState("");
  const [liveNote, setLiveNote] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [assignedToId, setAssignedToId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isRawMode = status === "RAW_MATERIAL";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Judul konten / bahan mentah wajib diisi");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const finalRawUrl = rawFile?.url || assetUrl.trim() || null;
      const finalRawName = rawFile?.fileName || null;
      let rawType = "DOCUMENT";
      if (
        rawFile?.fileType?.startsWith("video/") ||
        contentType?.includes("VIDEO") ||
        contentType === "REELS" ||
        finalRawUrl?.match(/\.(mp4|webm|mov|m4v)/i)
      ) {
        rawType = "VIDEO";
      } else if (
        rawFile?.fileType?.startsWith("image/") ||
        contentType === "FEED_CAROUSEL" ||
        finalRawUrl?.match(/\.(jpg|jpeg|png|webp)/i)
      ) {
        rawType = "IMAGE";
      } else if (finalRawUrl?.includes("drive.google.com") || finalRawUrl?.includes("canva.com")) {
        rawType = "LINK";
      }

      const res = await fetch("/api/contents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          platform,
          contentType,
          status,
          rawAssetUrl: finalRawUrl,
          rawAssetName: finalRawName,
          rawAssetType: rawType,
          assetUrl: finalRawUrl,
          prepNotes: prepNotes.trim() || null,
          liveUrl: liveUrl.trim() || null,
          liveNote: liveNote.trim() || null,
          targetDate: targetDate || null,
          assignedToId: assignedToId || null,
        }),
      });

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const data = await res.json();
        setError(data.error || "Gagal membuat konten baru");
      }
    } catch {
      setError("Terjadi kesalahan koneksi ke server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1A3460]/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white border-2 border-[#1A3460] rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b-2 border-[#F3BC6F] flex items-center justify-between bg-[#1A3460] text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#F35E50] border border-[#F3BC6F] flex items-center justify-center text-white shadow-md">
              {isRawMode ? <UploadCloud className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">
                {isRawMode
                  ? "Upload Bahan Mentah (Foto / Video)"
                  : "Buat Rencana Konten Baru"}
              </h3>
              <p className="text-[11px] text-[#F9C5CB] font-semibold">
                {isRawMode
                  ? "Bahan mentah dapat diambil oleh anggota tim lain untuk diedit"
                  : "Tambahkan naskah persiapan atau langsung submit ke antrean tim"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#F35E50] text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-bold">
              {error}
            </div>
          )}

          {/* Judul */}
          <div>
            <label className="block text-xs font-black text-[#1A3460] mb-1">
              Judul Bahan / Konten <span className="text-[#F35E50]">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Rekaman Video Anak Belajar Brain Gym & Sensory Play"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFF8F3] border-2 border-[#1A3460]/15 text-[#1A3460] placeholder-slate-400 focus:outline-none focus:border-[#F35E50] text-xs sm:text-sm font-bold"
            />
          </div>

          {/* UPLOAD FILE MENTAH (Foto atau Video) */}
          <div className="bg-[#FFF8F3] border-2 border-[#F3BC6F] rounded-2xl p-4 space-y-2">
            <FileUploadInput
              label="📸 Upload File Mentah (Video MP4/MOV atau Foto JPG/PNG)"
              helperText="Upload langsung video footage rekaman HP / kamera, atau masukkan link Google Drive / Canva jika file sangat besar."
              value={rawFile?.url}
              fileName={rawFile?.fileName}
              fileSize={rawFile?.fileSize}
              fileType={rawFile?.fileType}
              onChange={(file) => {
                setRawFile(file);
                if (file) setAssetUrl(file.url);
              }}
            />
          </div>

          {/* Platform & Format */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black text-[#1A3460] mb-1">
                Target Platform
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#FFF8F3] border-2 border-[#1A3460]/15 text-[#1A3460] text-xs font-bold focus:outline-none focus:border-[#F35E50]"
              >
                <option value="INSTAGRAM">Instagram</option>
                <option value="TIKTOK">TikTok</option>
                <option value="YOUTUBE">YouTube</option>
                <option value="LINKEDIN">LinkedIn</option>
                <option value="FACEBOOK">Facebook</option>
                <option value="WEBSITE">Website Blog</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-[#1A3460] mb-1">
                Format yang Ditargetkan
              </label>
              <select
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#FFF8F3] border-2 border-[#1A3460]/15 text-[#1A3460] text-xs font-bold focus:outline-none focus:border-[#F35E50]"
              >
                <option value="REELS">Instagram Reels (Video Pendek)</option>
                <option value="TIKTOK_VIDEO">TikTok Video</option>
                <option value="FEED_CAROUSEL">Feed Carousel (Multi-Slide)</option>
                <option value="YOUTUBE_VIDEO">YouTube Video / Shorts</option>
                <option value="STORY">Story Harian</option>
                <option value="BANNER">Banner Flyer Promosi</option>
              </select>
            </div>
          </div>

          {/* Status Alur & Penugasan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black text-[#1A3460] mb-1">
                Tahap Tab Alur
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#FFF8F3] border-2 border-[#1A3460]/15 text-[#1A3460] text-xs font-bold focus:outline-none focus:border-[#F35E50]"
              >
                <option value="RAW_MATERIAL">📁 Tab 1: Bahan Mentah (Siap Diambil Tim)</option>
                <option value="IN_EDITING">🎨 Tab 2: Proses Editing</option>
                <option value="READY_TO_PUBLISH">🚀 Tab 3: Siap Upload</option>
                <option value="PUBLISHED">🎉 Tab 4: Sudah Live!</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-[#1A3460] mb-1">
                Tugaskan Editor Langsung (Opsional)
              </label>
              <select
                value={assignedToId}
                onChange={(e) => setAssignedToId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#FFF8F3] border-2 border-[#1A3460]/15 text-[#1A3460] text-xs font-bold focus:outline-none focus:border-[#F35E50]"
              >
                <option value="">-- Biarkan Terbuka (Bisa Diambil Siapapun) --</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Catatan Brief / Lapangan */}
          <div>
            <label className="block text-xs font-black text-[#1A3460] mb-1">
              Catatan Lapangan / Brief untuk Editor:
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contoh: Ini video anak waktu jam istirahat. Tolong diambil momen pas senyum dan kasih teks hook parenting..."
              className="w-full p-3 rounded-xl bg-[#FFF8F3] border-2 border-[#1A3460]/15 text-[#1A3460] placeholder-slate-400 focus:outline-none focus:border-[#F35E50] text-xs font-medium leading-relaxed"
            />
          </div>

          {/* Footer Submit */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#1A3460]/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#FFF8F3] hover:bg-[#F3BC6F]/30 text-[#1A3460] border-2 border-[#1A3460]/15 text-xs font-black transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-[#F35E50] hover:bg-[#e04b3d] text-white text-xs font-black shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Menyimpan..." : "Upload & Masukkan ke Antrean Tim"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
