"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getPlatformBadge, getStatusBadge } from "@/lib/platformUtils";
import { TeamMentionInput, renderMentionedText } from "@/components/common/TeamMentionInput";
import { FileUploadInput, UploadedFile } from "@/components/common/FileUploadInput";
import {
  Wand2,
  Video,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  MessageSquare,
  FileText,
  UploadCloud,
  Check,
  User,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from "lucide-react";

interface EditingProcessViewProps {
  contents: any[];
  users: any[];
  onSelectContent: (content: any) => void;
  onRefresh: () => void;
  onNavigateToReady?: () => void;
}

export function EditingProcessView({
  contents,
  users,
  onSelectContent,
  onRefresh,
  onNavigateToReady,
}: EditingProcessViewProps) {
  const { currentUser } = useAuth();
  const [filterSubStatus, setFilterSubStatus] = useState<"ALL" | "IN_EDITING" | "NEED_REVISION">("ALL");

  // Modal Upload Hasil Edit State
  const [uploadModalItem, setUploadModalItem] = useState<any | null>(null);
  const [editFile, setEditFile] = useState<UploadedFile | null>(null);
  const [draftCaption, setDraftCaption] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // Modal Minta Revisi State
  const [revisionModalItem, setRevisionModalItem] = useState<any | null>(null);
  const [revisionNote, setRevisionNote] = useState("");
  const [savingRevision, setSavingRevision] = useState(false);

  // Quick Inline Comment State
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);

  // Filter editing items (status: IN_EDITING, NEED_REVISION, IN_PREPARATION, IN_REVIEW)
  const editingItems = contents.filter((c) => {
    const isEditing =
      c.status === "IN_EDITING" ||
      c.status === "NEED_REVISION" ||
      c.status === "IN_PREPARATION" ||
      c.status === "IN_REVIEW";
    if (!isEditing) return false;

    if (filterSubStatus === "IN_EDITING") {
      return c.status === "IN_EDITING" || c.status === "IN_PREPARATION";
    }
    if (filterSubStatus === "NEED_REVISION") {
      return c.status === "NEED_REVISION" || c.status === "IN_REVIEW";
    }
    return true;
  });

  // Action: Simpan Hasil Edit (Upload Draft/Revisi Baru)
  const handleSaveEditedResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadModalItem) return;

    try {
      setSavingEdit(true);
      const newVersion = (uploadModalItem.version || 1) + (uploadModalItem.editedAssetUrl ? 1 : 0);

      const res = await fetch(`/api/contents/${uploadModalItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          editedAssetUrl: editFile ? editFile.url : uploadModalItem.editedAssetUrl,
          editedAssetName: editFile ? editFile.fileName : uploadModalItem.editedAssetName,
          prepNotes: draftCaption || uploadModalItem.prepNotes,
          version: newVersion,
          status: "IN_REVIEW", // Pindah ke status review tim setelah upload draft
          revisionNote: null, // Bersihkan catatan revisi sebelumnya
        }),
      });

      if (res.ok) {
        // Otomatis kirim komentar konfirmasi hasil edit
        await fetch(`/api/contents/${uploadModalItem.id}/comments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: `🎨 @${currentUser?.name || "Editor"} telah mengunggah hasil edit terbaru (Versi ${newVersion})! Silakan tim melakukan review.`,
          }),
        });

        setUploadModalItem(null);
        setEditFile(null);
        setDraftCaption("");
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingEdit(false);
    }
  };

  // Action: Minta Revisi (Need Revision)
  const handleRequestRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionModalItem || !revisionNote.trim()) return;

    try {
      setSavingRevision(true);
      const targetEditor = revisionModalItem.assignedTo;

      const res = await fetch(`/api/contents/${revisionModalItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "NEED_REVISION",
          revisionNote: revisionNote.trim(),
        }),
      });

      if (res.ok) {
        // Kirim komentar dengan mention ke editor yang bertugas
        const editorTag = targetEditor ? `@${targetEditor.name} ` : "";
        await fetch(`/api/contents/${revisionModalItem.id}/comments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: `🔁 Permintaan Revisi untuk ${editorTag}: "${revisionNote.trim()}"`,
            taggedUserId: targetEditor?.id,
          }),
        });

        setRevisionModalItem(null);
        setRevisionNote("");
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingRevision(false);
    }
  };

  // Action: Setujui & Pindahkan ke Tab Siap Upload
  const handleApproveContent = async (item: any) => {
    try {
      const res = await fetch(`/api/contents/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "READY_TO_PUBLISH",
        }),
      });

      if (res.ok) {
        await fetch(`/api/contents/${item.id}/comments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: `✅ Hasil edit telah DISETUJUI oleh @${currentUser?.name}! Konten kini resmi berpindah ke Tab Siap Upload.`,
          }),
        });

        onRefresh();
        if (onNavigateToReady) {
          onNavigateToReady();
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Action: Kirim komentar cepat
  const handleSendComment = async (contentId: string, message: string, taggedUserId?: string) => {
    try {
      const res = await fetch(`/api/contents/${contentId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, taggedUserId }),
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner Tab 2 */}
      <div className="bg-gradient-to-r from-[#1A3460] via-[#1A3460] to-[#F35E50] border-2 border-[#F3BC6F] rounded-3xl p-5 sm:p-7 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F3BC6F] text-[#1A3460] text-xs font-black shadow-sm">
              <Wand2 className="w-4 h-4 text-[#F35E50]" />
              Tab 2 • Proses Editing & Review Revisi
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Produksi Visual, Video, & <span className="text-[#F3BC6F]">Ulasan Revisi</span>
            </h2>
            <p className="text-xs sm:text-sm text-white/90 leading-relaxed font-medium">
              Di tab ini editor mengunggah hasil edit draft/video. Tim lain dapat memberikan <strong>feedback spesifik, mention/tag nama editor</strong>, meminta perbaikan (revisi), atau menyetujuinya untuk langsung siap tayang.
            </p>
          </div>
        </div>

        {/* Filter Sub-Status */}
        <div className="mt-6 pt-5 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs font-bold">
          <div className="flex flex-wrap items-center gap-1.5 bg-white/10 p-1 rounded-2xl border border-white/10">
            <button
              onClick={() => setFilterSubStatus("ALL")}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                filterSubStatus === "ALL" ? "bg-[#F3BC6F] text-[#1A3460] font-black" : "text-white/80 hover:text-white"
              }`}
            >
              Semua yang Diedit ({editingItems.length})
            </button>
            <button
              onClick={() => setFilterSubStatus("IN_EDITING")}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                filterSubStatus === "IN_EDITING" ? "bg-amber-400 text-[#1A3460] font-black" : "text-white/80 hover:text-white"
              }`}
            >
              🎨 Sedang Diedit
            </button>
            <button
              onClick={() => setFilterSubStatus("NEED_REVISION")}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                filterSubStatus === "NEED_REVISION" ? "bg-rose-500 text-white font-black" : "text-white/80 hover:text-white"
              }`}
            >
              🔁 Perlu Revisi ({contents.filter((c) => c.status === "NEED_REVISION" || c.status === "IN_REVIEW").length})
            </button>
          </div>

          <span className="text-[11px] text-[#F9C5CB] font-semibold">
            Klik <strong>"✅ Setujui & Siap Upload"</strong> jika naskah & visual sudah sempurna.
          </span>
        </div>
      </div>

      {/* Grid Konten Editing */}
      {editingItems.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-[#1A3460]/20 rounded-3xl p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#FFF8F3] border-2 border-[#F3BC6F] flex items-center justify-center mx-auto text-[#F35E50]">
            <Wand2 className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-black text-[#1A3460]">
              Tidak Ada Konten yang Sedang Berada di Tahap Editing
            </h3>
            <p className="text-xs text-[#1A3460]/70 max-w-md mx-auto font-medium">
              Buka <strong>Tab 1 (Bahan Mentah)</strong> dan klik tombol <strong>"🖐️ Ambil Bahan"</strong> untuk mulai mengerjakan editing konten baru!
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {editingItems.map((item) => {
            const platformInfo = getPlatformBadge(item.platform);
            const statusInfo = getStatusBadge(item.status);
            const isNeedRevision = item.status === "NEED_REVISION" || Boolean(item.revisionNote);
            const rawUrl = item.rawAssetUrl || item.assetUrl;
            const editedUrl = item.editedAssetUrl;

            return (
              <div
                key={item.id}
                className={`bg-white border-2 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col justify-between transition ${
                  isNeedRevision ? "border-rose-400 bg-rose-50/20" : "border-[#1A3460]"
                }`}
              >
                <div className="space-y-4">
                  {/* Top Badges & Status */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-black border ${platformInfo.className}`}
                      >
                        {platformInfo.icon}
                        {platformInfo.label}
                      </span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#FFF8F3] border border-[#1A3460]/15 text-[#1A3460]">
                        {item.contentType?.replace("_", " ")}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className={`text-[11px] px-2.5 py-1 rounded-full border ${statusInfo.className}`}>
                        {statusInfo.label}
                      </span>
                      {item.version && item.version > 1 && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 border border-purple-300">
                          Versi {item.version}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Brief */}
                  <div className="space-y-1">
                    <h3
                      onClick={() => onSelectContent(item)}
                      className="font-black text-[#1A3460] text-base hover:text-[#F35E50] cursor-pointer transition leading-snug"
                    >
                      {item.title}
                    </h3>
                    <p className="text-xs text-[#1A3460]/75 line-clamp-2 font-medium">
                      {item.description || "Brief konten PAUD Arjuna Malang"}
                    </p>
                  </div>

                  {/* PERBANDINGAN: Bahan Mentah vs Hasil Edit */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {/* Kolom Bahan Mentah Asli */}
                    <div className="bg-[#FFF8F3] p-3 rounded-2xl border border-[#1A3460]/15 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-black text-[#1A3460]">
                        <span className="flex items-center gap-1">
                          <UploadCloud className="w-3.5 h-3.5 text-[#1A3460]/70" />
                          Bahan Mentah Asli:
                        </span>
                      </div>
                      {rawUrl ? (
                        rawUrl.match(/\.(mp4|webm|mov|m4v)/i) ? (
                          <video
                            src={rawUrl}
                            controls
                            className="w-full h-32 rounded-xl object-cover bg-black"
                          />
                        ) : (
                          <img
                            src={rawUrl}
                            alt="Bahan Mentah"
                            className="w-full h-32 rounded-xl object-cover"
                          />
                        )
                      ) : (
                        <div className="h-32 rounded-xl border border-dashed border-[#1A3460]/20 flex items-center justify-center text-[10px] text-slate-400">
                          Tidak ada file media langsung
                        </div>
                      )}
                    </div>

                    {/* Kolom Hasil Editing Draft */}
                    <div className="bg-[#FFF8F3] p-3 rounded-2xl border-2 border-[#F3BC6F] space-y-2 relative">
                      <div className="flex items-center justify-between text-[11px] font-black text-[#1A3460]">
                        <span className="flex items-center gap-1 text-[#F35E50]">
                          <Wand2 className="w-3.5 h-3.5" />
                          Hasil Editing (Draft):
                        </span>
                      </div>
                      {editedUrl ? (
                        editedUrl.match(/\.(mp4|webm|mov|m4v)/i) ? (
                          <video
                            src={editedUrl}
                            controls
                            className="w-full h-32 rounded-xl object-cover bg-black"
                          />
                        ) : (
                          <img
                            src={editedUrl}
                            alt="Hasil Edit"
                            className="w-full h-32 rounded-xl object-cover"
                          />
                        )
                      ) : (
                        <div className="h-32 rounded-xl border-2 border-dashed border-[#F3BC6F] flex flex-col items-center justify-center p-2 text-center text-[11px] text-[#1A3460]/60 space-y-1">
                          <span>Belum ada file hasil edit yang diunggah</span>
                          <button
                            type="button"
                            onClick={() => {
                              setUploadModalItem(item);
                              setDraftCaption(item.prepNotes || "");
                            }}
                            className="px-2.5 py-1 rounded-lg bg-[#F35E50] text-white text-[10px] font-black cursor-pointer shadow-sm hover:bg-[#e04b3d]"
                          >
                            + Upload Hasil Edit
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Warning Box jika ada Permintaan Revisi */}
                  {isNeedRevision && item.revisionNote && (
                    <div className="p-3.5 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-800 space-y-1 animate-in fade-in">
                      <div className="flex items-center gap-1.5 text-xs font-black text-rose-700">
                        <AlertCircle className="w-4 h-4 text-rose-600" />
                        Poin Catatan Revisi yang Harus Diperbaiki:
                      </div>
                      <p className="text-xs font-semibold leading-relaxed">
                        {renderMentionedText(item.revisionNote)}
                      </p>
                    </div>
                  )}

                  {/* Info PIC Editor & Pengunggah */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
                    <div className="flex items-center gap-2">
                      <img
                        src={
                          item.assignedTo?.avatar ||
                          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
                        }
                        alt="Editor"
                        className="w-7 h-7 rounded-full object-cover border-2 border-[#F35E50]"
                      />
                      <div className="leading-tight">
                        <div className="font-black text-[#1A3460]">
                          PIC: {item.assignedTo?.name || "Belum Ditugaskan"}
                        </div>
                        <div className="text-[10px] text-[#F35E50] font-bold">
                          {item.assignedTo?.title || item.assignedTo?.role || "Editor"}
                        </div>
                      </div>
                    </div>

                    <div className="text-right text-[11px] text-[#1A3460]/70 font-semibold">
                      Diunggah oleh: <strong>{item.createdBy?.name}</strong>
                    </div>
                  </div>

                  {/* Comments Preview */}
                  {item.comments && item.comments.length > 0 && (
                    <div className="p-3 rounded-2xl bg-[#FFF8F3] border border-[#1A3460]/15 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-[11px] font-black text-[#1A3460]/80">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3 text-[#F35E50]" />
                          Diskusi Tim ({item.comments.length}):
                        </span>
                        <span>{item.comments[item.comments.length - 1].user?.name}</span>
                      </div>
                      <p className="text-xs text-[#1A3460] font-medium leading-relaxed">
                        {renderMentionedText(item.comments[item.comments.length - 1].message)}
                      </p>
                    </div>
                  )}
                </div>

                {/* ACTION BUTTONS (Upload Edit, Minta Revisi, Setujui) */}
                <div className="mt-5 pt-4 border-t-2 border-[#1A3460]/10 space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {/* Tombol 1: Upload Hasil Edit / Revisi */}
                    <button
                      type="button"
                      onClick={() => {
                        setUploadModalItem(item);
                        setDraftCaption(item.prepNotes || "");
                      }}
                      className="py-2.5 px-3 rounded-xl bg-[#1A3460] hover:bg-[#122544] text-[#F3BC6F] font-black text-xs flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
                    >
                      <UploadCloud className="w-4 h-4 text-[#F35E50]" />
                      <span>Upload Edit</span>
                    </button>

                    {/* Tombol 2: Minta Revisi */}
                    <button
                      type="button"
                      onClick={() => {
                        setRevisionModalItem(item);
                        setRevisionNote("");
                      }}
                      className="py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 border-2 border-rose-300 text-rose-700 font-black text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-rose-600" />
                      <span>Minta Revisi</span>
                    </button>

                    {/* Tombol 3: Setujui & Kirim ke Siap Upload */}
                    <button
                      type="button"
                      onClick={() => handleApproveContent(item)}
                      className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md transition cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4 text-[#F3BC6F]" />
                      <span>Setujui</span>
                    </button>
                  </div>

                  {/* Inline Tagging Input */}
                  {activeCommentId === item.id ? (
                    <div className="pt-2">
                      <TeamMentionInput
                        users={users}
                        onSend={(msg, taggedId) => handleSendComment(item.id, msg, taggedId)}
                        placeholder="Beri komentar atau tag tim (@Nama)..."
                      />
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveCommentId(item.id)}
                      className="w-full text-center text-[11px] text-[#1A3460]/60 hover:text-[#F35E50] font-bold py-1 transition cursor-pointer"
                    >
                      + Tambah komentar & tag tim (@Nama)
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: Upload Hasil Editing / Revisi */}
      {uploadModalItem && (
        <div className="fixed inset-0 z-50 bg-[#1A3460]/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border-2 border-[#1A3460] rounded-3xl w-full max-w-xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#1A3460]/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#F35E50] text-white flex items-center justify-center font-bold">
                  <UploadCloud className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-[#1A3460] text-base">
                    Upload Hasil Editing / Draft Baru
                  </h3>
                  <p className="text-xs text-slate-500 font-bold truncate max-w-sm">
                    {uploadModalItem.title}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setUploadModalItem(null)}
                className="text-slate-400 hover:text-[#1A3460] text-lg font-black cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditedResult} className="space-y-4">
              <FileUploadInput
                label="📁 Upload File Hasil Edit (Video Reels / Foto Desain)"
                helperText="Upload video MP4/MOV hasil potongan atau gambar carousel PNG/JPG yang sudah diberi logo Arjuna. Atau masukkan link Canva/Drive."
                value={editFile?.url}
                fileName={editFile?.fileName}
                fileSize={editFile?.fileSize}
                fileType={editFile?.fileType}
                onChange={(file) => setEditFile(file)}
              />

              <div>
                <label className="block text-xs font-black text-[#1A3460] uppercase tracking-wider mb-1">
                  Draft Caption / Copywriting & Catatan untuk Tim:
                </label>
                <textarea
                  rows={4}
                  value={draftCaption}
                  onChange={(e) => setDraftCaption(e.target.value)}
                  placeholder="Tulis naskah hook, isi caption, dan hashtag yang sudah disiapkan..."
                  className="w-full p-3 text-xs rounded-xl bg-[#FFF8F3] border-2 border-[#1A3460]/15 text-[#1A3460] placeholder-slate-400 focus:outline-none focus:border-[#F35E50] font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1A3460]/10">
                <button
                  type="button"
                  onClick={() => setUploadModalItem(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2.5 rounded-xl bg-[#F35E50] hover:bg-[#e04b3d] text-white font-black text-xs shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {savingEdit ? "Menyimpan..." : "Kirim Hasil Edit untuk Review Tim"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Minta Revisi */}
      {revisionModalItem && (
        <div className="fixed inset-0 z-50 bg-[#1A3460]/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border-2 border-rose-400 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-rose-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center font-bold">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-rose-800 text-base">
                    Instruksi Catatan Revisi
                  </h3>
                  <p className="text-xs text-rose-600 font-semibold truncate max-w-xs">
                    Editor: @{revisionModalItem.assignedTo?.name || "Admin"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRevisionModalItem(null)}
                className="text-slate-400 hover:text-[#1A3460] text-lg font-black cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRequestRevision} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-[#1A3460] uppercase tracking-wider mb-1.5">
                  Poin-Poin yang Perlu Direvisi (akan otomatis men-tag editor):
                </label>
                <textarea
                  required
                  rows={4}
                  value={revisionNote}
                  onChange={(e) => setRevisionNote(e.target.value)}
                  placeholder="Contoh: @Bima tolong tambahkan teks hook di 3 detik pertama, dan warna font dibuat lebih kontras dengan background..."
                  className="w-full p-3 text-xs rounded-xl bg-[#FFF8F3] border-2 border-rose-200 text-[#1A3460] placeholder-slate-400 focus:outline-none focus:border-rose-500 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRevisionModalItem(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingRevision || !revisionNote.trim()}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {savingRevision ? "Mengirim..." : "Kirim Catatan Revisi ke Editor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
