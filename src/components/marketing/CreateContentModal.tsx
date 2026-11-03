"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  X,
  Sparkles,
  FileText,
  Link as LinkIcon,
  Flame,
  Calendar,
  Layers,
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
  defaultStatus = "IN_PREPARATION",
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
  const [assetUrl, setAssetUrl] = useState("");
  const [liveUrl, setLiveUrl] = useState("");
  const [liveNote, setLiveNote] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [assignedToId, setAssignedToId] = useState(currentUser?.id || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Judul konten wajib diisi");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/contents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          platform,
          contentType,
          status,
          prepNotes: prepNotes.trim() || null,
          assetUrl: assetUrl.trim() || null,
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
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">
                Lapor Persiapan Konten Marketing
              </h3>
              <p className="text-[11px] text-[#F9C5CB] font-semibold">
                Laporkan ide, draf naskah, atau langsung submit link hasil live
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

          {/* AI Brainstorm Recommendation Banner */}
          {status === "IDEA" && onOpenStudio && (
            <div className="p-3.5 rounded-2xl bg-[#1A3460] text-white flex items-center justify-between gap-3 border-2 border-[#F3BC6F] shadow-sm">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-[#F3BC6F] shrink-0" />
                <div>
                  <div className="text-xs font-black text-[#F3BC6F]">Ingin Brainstorming dengan AI?</div>
                  <p className="text-[11px] text-white/80 font-medium">
                    Gunakan Studio Ide Arjuna untuk riset hook, naskah, dan format otomatis.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenStudio(title);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-[#F35E50] hover:bg-[#e04b3d] text-white text-xs font-black shrink-0 shadow-sm cursor-pointer whitespace-nowrap"
              >
                Buka Studio AI →
              </button>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-black text-[#1A3460] mb-1">
              Judul Konten <span className="text-[#F35E50]">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Carousel Edukasi - 5 Alasan Sensorik Play Penting di PAUD"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFF8F3] border-2 border-[#1A3460]/15 text-[#1A3460] placeholder-slate-400 focus:outline-none focus:border-[#F35E50] text-xs sm:text-sm font-bold"
            />
          </div>

          {/* Platform & Format */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black text-[#1A3460] mb-1">
                Platform Media Sosial
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
                Format Konten
              </label>
              <select
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#FFF8F3] border-2 border-[#1A3460]/15 text-[#1A3460] text-xs font-bold focus:outline-none focus:border-[#F35E50]"
              >
                <option value="FEED_CAROUSEL">Feed Carousel (Multi-Slide)</option>
                <option value="REELS">Instagram Reels</option>
                <option value="TIKTOK_VIDEO">TikTok Video</option>
                <option value="YOUTUBE_VIDEO">YouTube Video / Shorts</option>
                <option value="STORY">Story Harian</option>
                <option value="BANNER">Banner Flyer Promosi</option>
              </select>
            </div>
          </div>

          {/* Status & PIC */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black text-[#1A3460] mb-1">
                Status Awal
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#FFF8F3] border-2 border-[#1A3460]/15 text-[#1A3460] text-xs font-bold focus:outline-none focus:border-[#F35E50]"
              >
                <option value="IDEA">💡 Ide & Konsep</option>
                <option value="IN_PREPARATION">🛠️ Persiapan Admin</option>
                <option value="IN_REVIEW">🔍 Review & Revisi Tim</option>
                <option value="READY_TO_PUBLISH">🚀 Siap Tayang</option>
                <option value="PUBLISHED">🎉 Sudah Live (Hasil Karya)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-[#1A3460] mb-1">
                Tugaskan / PIC Konten
              </label>
              <select
                value={assignedToId}
                onChange={(e) => setAssignedToId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#FFF8F3] border-2 border-[#1A3460]/15 text-[#1A3460] text-xs font-bold focus:outline-none focus:border-[#F35E50]"
              >
                <option value="">-- Pilih PIC --</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Brief Concept */}
          <div>
            <label className="block text-xs font-black text-[#1A3460] mb-1">
              Konsep / Brief Singkat
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Jelaskan tujuan konten ini dan siapa audiens utamanya..."
              className="w-full px-3.5 py-2 rounded-xl bg-[#FFF8F3] border-2 border-[#1A3460]/15 text-[#1A3460] placeholder-slate-400 focus:outline-none focus:border-[#F35E50] text-xs font-medium"
            />
          </div>

          {/* Laporan Persiapan Admin */}
          <div className="bg-[#FFF8F3] border-2 border-[#F3BC6F] rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-[#F35E50] flex items-center gap-1.5 uppercase">
                <FileText className="w-4 h-4" />
                Laporan Persiapan yang Sudah Dibuat
              </label>
              <span className="text-[10px] text-[#1A3460]/60 font-bold">Draf Naskah & Visual</span>
            </div>

            <textarea
              rows={4}
              value={prepNotes}
              onChange={(e) => setPrepNotes(e.target.value)}
              placeholder="Tuliskan persiapan admin: draft naskah, angle hook, slide canva, atau catatan konsep..."
              className="w-full p-3 rounded-xl bg-white border-2 border-[#1A3460]/15 text-[#1A3460] placeholder-slate-400 focus:outline-none focus:border-[#F35E50] text-xs leading-relaxed font-medium"
            />

            <div>
              <label className="block text-[11px] font-black text-[#1A3460] mb-1">
                Link Asset Preview (Canva / Figma / Drive)
              </label>
              <input
                type="url"
                value={assetUrl}
                onChange={(e) => setAssetUrl(e.target.value)}
                placeholder="https://www.canva.com/design/... atau Google Drive"
                className="w-full px-3 py-2 rounded-xl bg-white border-2 border-[#1A3460]/15 text-[#1A3460] text-xs placeholder-slate-400 focus:outline-none focus:border-[#F35E50]"
              />
            </div>
          </div>

          {/* Tautan Live Hasil Pekerjaan */}
          <div className="bg-gradient-to-br from-emerald-50 to-white border-2 border-emerald-400 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-emerald-800 flex items-center gap-1.5 uppercase">
                <Flame className="w-4 h-4 text-emerald-600" />
                Link Hasil Live (Jika Desain Sudah Tayang)
              </label>
              <span className="text-[10px] text-emerald-700 font-bold">Otomatis Muncul di Showcase</span>
            </div>

            <input
              type="url"
              value={liveUrl}
              onChange={(e) => setLiveUrl(e.target.value)}
              placeholder="https://www.instagram.com/p/... atau TikTok link"
              className="w-full px-3 py-2 rounded-xl bg-white border-2 border-emerald-400 text-[#1A3460] placeholder-slate-400 focus:outline-none focus:border-emerald-600 text-xs font-bold"
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
              {loading ? "Menyimpan..." : "Simpan & Publikasikan ke Tim"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
