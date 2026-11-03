"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getPlatformBadge, getStatusBadge } from "@/lib/platformUtils";
import { MediaPreview } from "@/components/common/MediaPreview";
import { MultiFileUpload } from "@/components/common/MultiFileUpload";
import {
  TeamMentionInput,
  renderMentionedText,
} from "@/components/common/TeamMentionInput";
import { useToast } from "@/components/common/Toast";
import {
  getStage,
  needsRevision,
  getRawFiles,
  getEditedFiles,
  getFormatMeta,
  getRequiredHashtags,
  filesToFields,
  isReviewerRole,
  REVIEWER_HINT,
  MediaFile,
} from "@/lib/content-utils";
import { getThemeText } from "@/lib/marketing-plan";
import {
  approveContent,
  requestRevision,
  attachResult,
  postComment,
} from "@/lib/content-actions";
import {
  Film,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  MessageSquare,
  UploadCloud,
  Plus,
  Sparkles,
  Hash,
  X,
  ShieldCheck,
  Lock,
} from "lucide-react";

interface ProductionReviewViewProps {
  contents: any[];
  users: any[];
  onSelectContent: (content: any) => void;
  onOpenCreateModal: (mode?: "RAW" | "PROPOSAL") => void;
  onRefresh: () => void;
  onNavigateToReady: () => void;
}

export function ProductionReviewView({
  contents,
  users,
  onSelectContent,
  onOpenCreateModal,
  onRefresh,
  onNavigateToReady,
}: ProductionReviewViewProps) {
  const { currentUser } = useAuth();
  const toast = useToast();
  const canReview = isReviewerRole(currentUser?.role);

  const [subFilter, setSubFilter] = useState<
    "ALL" | "WAITING" | "REVISION" | "PROPOSAL"
  >("ALL");
  const [previewTab, setPreviewTab] = useState<Record<string, "edited" | "raw">>({});
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  // Modal unggah versi perbaikan / perbarui hasil produksi
  const [uploadModalItem, setUploadModalItem] = useState<any | null>(null);
  const [editFiles, setEditFiles] = useState<MediaFile[]>([]);
  const [captionDraft, setCaptionDraft] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // Modal minta revisi (khusus Reviewer)
  const [revisionModalItem, setRevisionModalItem] = useState<any | null>(null);
  const [revisionNote, setRevisionNote] = useState("");
  const [savingRevision, setSavingRevision] = useState(false);

  const allReviewStage = contents.filter((c) => getStage(c) === "REVIEW");

  const filteredItems = allReviewStage.filter((c) => {
    if (subFilter === "WAITING") return !needsRevision(c);
    if (subFilter === "REVISION") return needsRevision(c);
    if (subFilter === "PROPOSAL") return c.origin === "PROPOSAL";
    return true;
  });

  const openReuploadModal = (item: any) => {
    setUploadModalItem(item);
    setEditFiles(getEditedFiles(item));
    setCaptionDraft(item.caption || item.prepNotes || "");
  };

  const handleSaveUpdatedResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadModalItem || !currentUser) return;
    if (editFiles.length === 0) {
      toast("Lampirkan minimal 1 berkas/tautan hasil produksi.", {
        tone: "error",
      });
      return;
    }

    setSavingEdit(true);
    try {
      const nextVersion = (uploadModalItem.version || 1) + 1;
      const payload: Record<string, unknown> = {
        ...filesToFields("edited", editFiles),
        caption: captionDraft.trim() || null,
        version: nextVersion,
        status: "IN_REVIEW",
        revisionNote: null,
      };

      const res = await attachResult(uploadModalItem, currentUser, payload, {
        version: nextVersion,
        files: editFiles.length,
        skipReview: false,
      });

      if (res.ok) {
        setUploadModalItem(null);
        onRefresh();
        toast(`Versi ${nextVersion} berhasil diunggah untuk ditinjau!`);
      } else {
        toast(res.error || "Gagal menyimpan versi terbaru.", { tone: "error" });
      }
    } finally {
      setSavingEdit(false);
    }
  };

  const handleRequestRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionModalItem || !currentUser || !revisionNote.trim()) return;

    setSavingRevision(true);
    try {
      const res = await requestRevision(
        revisionModalItem,
        currentUser,
        revisionNote
      );
      if (res.ok) {
        setRevisionModalItem(null);
        setRevisionNote("");
        onRefresh();
        toast("Catatan perbaikan dikirim dan men-tag pembuat konten.", {
          tone: "info",
        });
      } else {
        toast(res.error || "Gagal mengirim catatan perbaikan.", {
          tone: "error",
        });
      }
    } finally {
      setSavingRevision(false);
    }
  };

  const handleApprove = async (item: any) => {
    if (!currentUser) return;
    setApprovingId(item.id);
    try {
      const res = await approveContent(item, currentUser);
      if (res.ok) {
        onRefresh();
        toast("Konten disetujui & masuk ke Bank Konten Siap Upload!", {
          action: {
            label: "Buka Tab 3 →",
            onClick: onNavigateToReady,
          },
        });
      } else {
        toast(res.error || "Gagal menyetujui konten.", { tone: "error" });
      }
    } finally {
      setApprovingId(null);
    }
  };

  const handleSendComment = async (
    contentId: string,
    message: string,
    taggedUserId?: string
  ) => {
    const res = await postComment(contentId, message, taggedUserId, "COMMENT");
    if (res.ok) {
      onRefresh();
    } else {
      toast(res.error || "Gagal mengirim komentar.", { tone: "error" });
    }
  };

  const revisionCount = allReviewStage.filter((c) => needsRevision(c)).length;

  return (
    <div className="space-y-6">
      {/* Banner Tab 2 */}
      <div className="bg-gradient-to-r from-[#1A3460] via-[#1A3460] to-[#9a382f] border-2 border-[#F3BC6F] rounded-3xl p-5 sm:p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F3BC6F] text-[#1A3460] text-xs font-black">
              <Film className="w-4 h-4 text-[#F35E50]" />
              Tab 2 • Hasil Edit & Usulan Produksi Mandiri
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Review Hasil Produksi &{" "}
              <span className="text-[#F3BC6F]">Usulan Konten Tim</span>
            </h2>
            <p className="text-xs sm:text-sm text-white/90 leading-relaxed font-medium">
              Tampung hasil edit dari bahan mentah maupun{" "}
              <strong>usulan konten hasil produksi mandiri</strong> anggota tim. Cek kesesuaian Brand Identity (logo kiri atas, warna, tanpa @handle), beri masukan, atau setujui ke <strong>Bank Siap Upload</strong>.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onOpenCreateModal("PROPOSAL")}
            className="px-5 py-3 rounded-2xl bg-[#F3BC6F] hover:bg-[#eab05e] text-[#1A3460] font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#F35E50]" />
            <span>+ Upload Hasil Edit / Usulan Mandiri</span>
          </button>
        </div>

        {/* Sub-Filter */}
        <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs font-bold">
          <div className="flex flex-wrap items-center gap-1.5 bg-white/10 p-1 rounded-2xl border border-white/10">
            <button
              type="button"
              onClick={() => setSubFilter("ALL")}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                subFilter === "ALL"
                  ? "bg-[#F3BC6F] text-[#1A3460] font-black"
                  : "text-white/80 hover:text-white"
              }`}
            >
              Semua ({allReviewStage.length})
            </button>
            <button
              type="button"
              onClick={() => setSubFilter("WAITING")}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                subFilter === "WAITING"
                  ? "bg-[#F3BC6F] text-[#1A3460] font-black"
                  : "text-white/80 hover:text-white"
              }`}
            >
              🎬 Menunggu Review ({allReviewStage.length - revisionCount})
            </button>
            <button
              type="button"
              onClick={() => setSubFilter("REVISION")}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                subFilter === "REVISION"
                  ? "bg-rose-500 text-white font-black"
                  : "text-white/80 hover:text-white"
              }`}
            >
              🔁 Perlu Perbaikan ({revisionCount})
            </button>
            <button
              type="button"
              onClick={() => setSubFilter("PROPOSAL")}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                subFilter === "PROPOSAL"
                  ? "bg-[#F3BC6F] text-[#1A3460] font-black"
                  : "text-white/80 hover:text-white"
              }`}
            >
              🌟 Usulan Mandiri
            </button>
          </div>

          <span className="text-[11px] text-[#F9C5CB] font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#F3BC6F]" />
            {canReview
              ? "Anda masuk sebagai Lead/Admin — dapat menyetujui & meminta perbaikan."
              : "Persetujuan ke Bank Siap Upload dilakukan oleh Lead / Admin."}
          </span>
        </div>
      </div>

      {/* Daftar Kartu Review */}
      {filteredItems.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-[#1A3460]/20 rounded-3xl p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#FFF8F3] border-2 border-[#F3BC6F] flex items-center justify-center mx-auto text-[#F35E50]">
            <Film className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-black text-[#1A3460]">
              Belum Ada Hasil Edit atau Usulan di Antrean Ini
            </h3>
            <p className="text-xs text-[#1A3460]/70 max-w-md mx-auto font-medium">
              Unggah hasil edit dari Tab 1 (Bahan Mentah), atau langsung ajukan konten kreasi mandiri Anda menggunakan tombol di bawah.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenCreateModal("PROPOSAL")}
            className="px-4 py-2.5 rounded-xl bg-[#F35E50] hover:bg-[#e04b3d] text-white text-xs font-black inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Upload Hasil Edit / Usulan Mandiri
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredItems.map((item) => {
            const platformInfo = getPlatformBadge(item.platform);
            const statusInfo = getStatusBadge(item);
            const formatMeta = getFormatMeta(item.contentType);
            const isRev = needsRevision(item);
            const rawFiles = getRawFiles(item);
            const editedFiles = getEditedFiles(item);
            const hasDistinctRaw =
              rawFiles.length > 0 &&
              editedFiles.length > 0 &&
              rawFiles[0]?.url !== editedFiles[0]?.url;

            const activeMediaMode = previewTab[item.id] || "edited";
            const shownFiles =
              activeMediaMode === "raw" && hasDistinctRaw
                ? rawFiles
                : editedFiles.length > 0
                ? editedFiles
                : rawFiles;

            const themeText = getThemeText(item.themeId, item.themeLabel);
            const captionPreview = item.caption || item.prepNotes || "";
            const humanComments = (item.comments || []).filter(
              (cm: any) => cm.kind !== "LOG"
            );

            return (
              <div
                key={item.id}
                className={`bg-white border-2 rounded-3xl p-5 sm:p-6 shadow-lg flex flex-col justify-between gap-4 ${
                  isRev ? "border-rose-400 bg-rose-50/15" : "border-[#1A3460]"
                }`}
              >
                <div className="space-y-3.5">
                  {/* Top Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-black border ${platformInfo.className}`}
                      >
                        {platformInfo.icon}
                        {platformInfo.label}
                      </span>
                      <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-[#FFF8F3] border border-[#1A3460]/15 text-[#1A3460]">
                        {formatMeta.code ? `[${formatMeta.code}] ` : ""}
                        {formatMeta.label}
                      </span>
                      {item.origin === "PROPOSAL" && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                          🌟 Usulan Mandiri
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[11px] px-2.5 py-0.5 rounded-full border ${statusInfo.className}`}
                      >
                        {statusInfo.label}
                      </span>
                      {item.version > 1 && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 border border-purple-300">
                          v{item.version}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Tema & Judul */}
                  <div className="space-y-1">
                    {themeText && (
                      <span className="inline-block text-[11px] font-black px-2.5 py-0.5 rounded-lg bg-[#F3BC6F]/30 text-[#1A3460] border border-[#F3BC6F]">
                        📅 {themeText}
                      </span>
                    )}
                    <h3
                      onClick={() => onSelectContent(item)}
                      className="font-black text-[#1A3460] text-base hover:text-[#F35E50] cursor-pointer transition leading-snug"
                    >
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-xs text-[#1A3460]/70 line-clamp-2 font-medium">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Toggle Hasil Produksi vs Bahan Mentah Asli (jika berasal dari bahan mentah) */}
                  <div className="space-y-2">
                    {hasDistinctRaw && (
                      <div className="inline-flex rounded-xl bg-[#FFF8F3] border border-[#1A3460]/15 p-0.5 text-[11px] font-black">
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewTab((p) => ({
                              ...p,
                              [item.id]: "edited",
                            }))
                          }
                          className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                            activeMediaMode === "edited"
                              ? "bg-[#1A3460] text-[#F3BC6F]"
                              : "text-[#1A3460]/70"
                          }`}
                        >
                          🎬 Hasil Edit ({editedFiles.length})
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewTab((p) => ({ ...p, [item.id]: "raw" }))
                          }
                          className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                            activeMediaMode === "raw"
                              ? "bg-[#1A3460] text-[#F3BC6F]"
                              : "text-[#1A3460]/70"
                          }`}
                        >
                          📁 Bahan Asli ({rawFiles.length})
                        </button>
                      </div>
                    )}

                    <MediaPreview
                      files={shownFiles}
                      badgeLabel={
                        activeMediaMode === "raw" && hasDistinctRaw
                          ? "Bahan Asli"
                          : "Hasil Produksi"
                      }
                      heightClass="h-52"
                      downloadBaseName={`produksi-${item.id.slice(-5)}`}
                    />
                  </div>

                  {/* Catatan Revisi jika ada */}
                  {isRev && item.revisionNote && (
                    <div className="p-3.5 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-900 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-black text-rose-700">
                        <AlertCircle className="w-4 h-4 text-rose-600" />
                        Catatan Perbaikan:
                      </div>
                      <p className="text-xs font-semibold leading-relaxed">
                        {renderMentionedText(item.revisionNote)}
                      </p>
                    </div>
                  )}

                  {/*Pratinjau Caption */}
                  <div className="p-3 rounded-2xl bg-[#FFF8F3] border border-[#F3BC6F] space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-black text-[#1A3460]">
                      <span>📝 Draft Caption:</span>
                      <span className="text-[10px] text-slate-500 font-semibold">
                        Cek: Logo kiri atas • Tanpa @handle
                      </span>
                    </div>
                    <p className="text-xs text-[#1A3460]/90 line-clamp-3 whitespace-pre-line font-medium">
                      {captionPreview ||
                        "Belum ada caption tertulis — klik Unggah Versi / Detail untuk melengkapi."}
                    </p>
                  </div>

                  {/* Info Pembuat / Editor */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
                    <div className="flex items-center gap-2">
                      <img
                        src={
                          (item.assignedTo || item.createdBy)?.avatar ||
                          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
                        }
                        alt="Kontributor"
                        className="w-6 h-6 rounded-full object-cover border border-[#F35E50]"
                      />
                      <span className="font-bold text-[#1A3460]">
                        Diproduksi oleh:{" "}
                        <strong>
                          {(item.assignedTo || item.createdBy)?.name || "Tim"}
                        </strong>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelectContent(item)}
                      className="text-[11px] font-black text-[#F35E50] hover:underline cursor-pointer"
                    >
                      Buka Detail Lengkap →
                    </button>
                  </div>

                  {/* Komentar Terakhir */}
                  {humanComments.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-[#FFF8F3] border border-[#1A3460]/10 space-y-0.5 text-xs">
                      <div className="flex items-center justify-between text-[10px] font-black text-[#1A3460]/70">
                        <span className="inline-flex items-center gap-1">
                          <MessageSquare className="w-3 h-3 text-[#F35E50]" />
                          Feedback Tim ({humanComments.length})
                        </span>
                        <span>
                          {humanComments[humanComments.length - 1].user?.name}
                        </span>
                      </div>
                      <p className="text-xs text-[#1A3460] font-medium line-clamp-2">
                        {renderMentionedText(
                          humanComments[humanComments.length - 1].message
                        )}
                      </p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t-2 border-[#1A3460]/10 space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => openReuploadModal(item)}
                      className="py-2.5 px-3 rounded-xl bg-[#1A3460] hover:bg-[#122544] text-[#F3BC6F] font-black text-xs inline-flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <UploadCloud className="w-3.5 h-3.5 text-[#F35E50]" />
                      <span>Perbarui File</span>
                    </button>

                    <button
                      type="button"
                      disabled={!canReview}
                      title={!canReview ? REVIEWER_HINT : "Minta perbaikan ke pembuat konten"}
                      onClick={() => {
                        setRevisionModalItem(item);
                        setRevisionNote(item.revisionNote || "");
                      }}
                      className="py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 border-2 border-rose-300 text-rose-700 font-black text-xs inline-flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
                    >
                      {canReview ? (
                        <RefreshCw className="w-3.5 h-3.5 text-rose-600" />
                      ) : (
                        <Lock className="w-3.5 h-3.5" />
                      )}
                      <span>Minta Perbaikan</span>
                    </button>

                    <button
                      type="button"
                      disabled={!canReview || approvingId === item.id}
                      title={!canReview ? REVIEWER_HINT : "Setujui & masukkan ke Bank Siap Upload"}
                      onClick={() => handleApprove(item)}
                      className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs inline-flex items-center justify-center gap-1.5 shadow-md transition cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
                    >
                      {canReview ? (
                        <CheckCircle2 className="w-4 h-4 text-[#F3BC6F]" />
                      ) : (
                        <Lock className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {approvingId === item.id ? "Memproses..." : "Setujui"}
                      </span>
                    </button>
                  </div>

                  {activeCommentId === item.id ? (
                    <div className="pt-1">
                      <TeamMentionInput
                        users={users}
                        onSend={(msg, taggedId) =>
                          handleSendComment(item.id, msg, taggedId)
                        }
                        placeholder="Beri masukan atau tag @Nama..."
                      />
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveCommentId(item.id)}
                      className="w-full text-center text-[11px] text-[#1A3460]/60 hover:text-[#F35E50] font-bold py-0.5 cursor-pointer"
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

      {/* MODAL 1: Perbarui Hasil Produksi / Versi Revisi */}
      {uploadModalItem && (
        <div className="fixed inset-0 z-50 bg-[#1A3460]/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border-2 border-[#1A3460] rounded-3xl w-full max-w-xl p-5 sm:p-6 shadow-2xl space-y-4 my-auto">
            <div className="flex items-start justify-between gap-3 border-b border-[#1A3460]/10 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-[#1A3460] text-[#F3BC6F]">
                  Unggah Versi Terbaru (v{(uploadModalItem.version || 1) + 1})
                </span>
                <h3 className="font-black text-[#1A3460] text-base mt-1">
                  {uploadModalItem.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setUploadModalItem(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUpdatedResult} className="space-y-4">
              <div className="bg-[#FFF8F3] border-2 border-[#F3BC6F] rounded-2xl p-4">
                <MultiFileUpload
                  label="🎬 Berkas Hasil Produksi (Ganti atau Tambah Slide)"
                  files={editFiles}
                  onChange={setEditFiles}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-[#1A3460]">
                    Caption Postingan Medsos
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const tags = getRequiredHashtags(uploadModalItem);
                      if (!captionDraft.includes("#paudArjunaMalang")) {
                        setCaptionDraft((prev) =>
                          prev.trim() ? `${prev.trim()}\n\n${tags}` : tags
                        );
                      }
                    }}
                    className="text-[11px] font-black text-[#F35E50] hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Hash className="w-3 h-3" />+ Hashtag Wajib
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={captionDraft}
                  onChange={(e) => setCaptionDraft(e.target.value)}
                  className="w-full p-3 text-xs rounded-xl bg-[#FFF8F3] border-2 border-[#1A3460]/15 text-[#1A3460] font-medium focus:outline-none focus:border-[#F35E50]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#1A3460]/10">
                <button
                  type="button"
                  onClick={() => setUploadModalItem(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingEdit || editFiles.length === 0}
                  className="px-5 py-2.5 rounded-xl bg-[#F35E50] hover:bg-[#e04b3d] text-white font-black text-xs shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {savingEdit ? "Menyimpan..." : "Simpan Versi Terbaru"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Catatan Permintaan Perbaikan */}
      {revisionModalItem && (
        <div className="fixed inset-0 z-50 bg-[#1A3460]/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border-2 border-rose-400 rounded-3xl w-full max-w-lg p-5 sm:p-6 shadow-2xl space-y-4 my-auto">
            <div className="flex items-start justify-between gap-3 border-b border-rose-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-rose-600 text-white">
                  Permintaan Perbaikan Konten
                </span>
                <h3 className="font-black text-[#1A3460] text-base mt-1">
                  {revisionModalItem.title}
                </h3>
                <p className="text-xs text-rose-700 font-semibold">
                  Otomatis men-tag @
                  {(revisionModalItem.assignedTo || revisionModalItem.createdBy)
                    ?.name || "Pembuat"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRevisionModalItem(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRequestRevision} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-[#1A3460] mb-1.5">
                  Poin yang Perlu Diperbaiki:
                </label>
                <textarea
                  required
                  rows={4}
                  value={revisionNote}
                  onChange={(e) => setRevisionNote(e.target.value)}
                  placeholder="Contoh: Tolong pindahkan logo PAUD Arjuna ke pojok kiri atas dan hapus tulisan @handle di slide terakhir..."
                  className="w-full p-3 text-xs rounded-xl bg-[#FFF8F3] border-2 border-rose-200 text-[#1A3460] font-medium focus:outline-none focus:border-rose-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRevisionModalItem(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingRevision || !revisionNote.trim()}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {savingRevision ? "Mengirim..." : "Kirim Catatan Perbaikan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
