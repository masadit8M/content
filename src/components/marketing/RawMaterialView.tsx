"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getPlatformBadge } from "@/lib/platformUtils";
import { MediaPreview } from "@/components/common/MediaPreview";
import { MultiFileUpload } from "@/components/common/MultiFileUpload";
import {
  TeamMentionInput,
  renderMentionedText,
} from "@/components/common/TeamMentionInput";
import { useToast } from "@/components/common/Toast";
import {
  getStage,
  getRawFiles,
  getEditedFiles,
  detectMediaKind,
  getFormatMeta,
  getRequiredHashtags,
  filesToFields,
  isReviewerRole,
  MediaFile,
  timeAgo,
} from "@/lib/content-utils";
import { getThemeText } from "@/lib/marketing-plan";
import {
  claimMaterial,
  releaseClaim,
  attachResult,
  patchContent,
  postComment,
} from "@/lib/content-actions";
import {
  UploadCloud,
  Video,
  Image as ImageIcon,
  CheckCircle2,
  UserCheck,
  MessageSquare,
  FileText,
  Plus,
  Hand,
  Undo2,
  Film,
  Hash,
  X,
  Sparkles,
} from "lucide-react";

interface RawMaterialViewProps {
  contents: any[];
  users: any[];
  onSelectContent: (content: any) => void;
  onOpenCreateModal: (mode?: "RAW" | "PROPOSAL") => void;
  onRefresh: () => void;
  onNavigateToReview: () => void;
  onNavigateToReady: () => void;
}

export function RawMaterialView({
  contents,
  users,
  onSelectContent,
  onOpenCreateModal,
  onRefresh,
  onNavigateToReview,
  onNavigateToReady,
}: RawMaterialViewProps) {
  const { currentUser } = useAuth();
  const toast = useToast();

  const [filterType, setFilterType] = useState<
    "ALL" | "VIDEO" | "IMAGE" | "BRIEF" | "UNCLAIMED"
  >("ALL");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);

  // Modal unggah hasil jadi dari bahan mentah (CapCut / Canva -> Bank Konten)
  const [submitModalItem, setSubmitModalItem] = useState<any | null>(null);
  const [resultFiles, setResultFiles] = useState<MediaFile[]>([]);
  const [captionDraft, setCaptionDraft] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [skipReview, setSkipReview] = useState(false);
  const [submittingResult, setSubmittingResult] = useState(false);

  // Modal lampirkan rekaman mentah ke Brief Ide
  const [attachRawItem, setAttachRawItem] = useState<any | null>(null);
  const [newRawFiles, setNewRawFiles] = useState<MediaFile[]>([]);
  const [savingRaw, setSavingRaw] = useState(false);

  const allRawStage = contents.filter((c) => {
    const st = getStage(c);
    return st === "RAW" || st === "IDEA";
  });

  const rawItems = allRawStage.filter((c) => {
    const files = getRawFiles(c);
    const st = getStage(c);

    if (filterType === "BRIEF") {
      return st === "IDEA" || files.length === 0;
    }
    if (filterType === "VIDEO") {
      return files.some((f) => detectMediaKind(f) === "video");
    }
    if (filterType === "IMAGE") {
      return files.some((f) => detectMediaKind(f) === "image");
    }
    if (filterType === "UNCLAIMED") {
      return !c.assignedToId;
    }
    return true;
  });

  const handleClaimToggle = async (item: any) => {
    if (!currentUser) return;
    setBusyId(item.id);
    try {
      const isMine = item.assignedToId === currentUser.id;
      const canRelease = isMine || isReviewerRole(currentUser.role);

      if (item.assignedToId && canRelease) {
        const res = await releaseClaim(item, currentUser);
        if (res.ok) {
          toast("Bahan dilepas — anggota lain kini bisa mengambilnya.", {
            tone: "info",
          });
          onRefresh();
        } else {
          toast(res.error || "Gagal melepas bahan.", { tone: "error" });
        }
      } else {
        const res = await claimMaterial(item, currentUser);
        if (res.ok) {
          toast(
            "Ditandai sedang Anda olah! Silakan unduh bahan, edit di CapCut/Canva, lalu klik 'Unggah Hasil Edit'."
          );
          onRefresh();
        } else {
          toast(res.error || "Gagal menandai bahan.", { tone: "error" });
        }
      }
    } finally {
      setBusyId(null);
    }
  };

  const openSubmitResultModal = (item: any) => {
    setSubmitModalItem(item);
    setResultFiles(getEditedFiles(item));
    setCaptionDraft(item.caption || "");
    setTargetDate(item.targetDate ? String(item.targetDate).slice(0, 10) : "");
    setSkipReview(false);
  };

  const handleSaveResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submitModalItem || !currentUser) return;
    if (resultFiles.length === 0) {
      toast("Unggah minimal 1 berkas/tautan hasil edit terlebih dahulu.", {
        tone: "error",
      });
      return;
    }

    setSubmittingResult(true);
    try {
      const canSkip = isReviewerRole(currentUser.role) && skipReview;
      const nextVersion =
        (submitModalItem.version || 1) +
        (getEditedFiles(submitModalItem).length > 0 ? 1 : 0);

      const payload: Record<string, unknown> = {
        ...filesToFields("edited", resultFiles),
        caption: captionDraft.trim() || null,
        targetDate: targetDate || submitModalItem.targetDate || null,
        assignedToId: submitModalItem.assignedToId || currentUser.id,
        version: nextVersion,
        status: canSkip ? "READY_TO_PUBLISH" : "IN_REVIEW",
        revisionNote: null,
      };

      const res = await attachResult(submitModalItem, currentUser, payload, {
        version: nextVersion,
        files: resultFiles.length,
        skipReview: canSkip,
      });

      if (res.ok) {
        setSubmitModalItem(null);
        onRefresh();
        if (canSkip) {
          toast("Hasil edit langsung masuk ke Bank Konten Siap Upload!", {
            action: { label: "Buka Siap Upload →", onClick: onNavigateToReady },
          });
        } else {
          toast("Hasil edit berhasil dikirim ke Tab 2 (Hasil Edit & Usulan)!", {
            action: { label: "Buka Review →", onClick: onNavigateToReview },
          });
        }
      } else {
        toast(res.error || "Gagal menyimpan hasil edit.", { tone: "error" });
      }
    } finally {
      setSubmittingResult(false);
    }
  };

  const handleSaveAttachedRaw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attachRawItem || !currentUser || newRawFiles.length === 0) return;

    setSavingRaw(true);
    try {
      const res = await patchContent(attachRawItem.id, {
        ...filesToFields("raw", newRawFiles),
        status: "RAW_MATERIAL",
      });
      if (res.ok) {
        await postComment(
          attachRawItem.id,
          `📁 ${currentUser.name} melampirkan ${newRawFiles.length} berkas bahan mentah ke brief ini.`,
          null,
          "LOG"
        );
        setAttachRawItem(null);
        setNewRawFiles([]);
        onRefresh();
        toast("Bahan mentah berhasil dilampirkan ke brief!");
      } else {
        toast(res.error || "Gagal melampirkan bahan mentah.", {
          tone: "error",
        });
      }
    } finally {
      setSavingRaw(false);
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

  return (
    <div className="space-y-6">
      {/* Banner Tab 1 */}
      <div className="bg-gradient-to-r from-[#1A3460] to-[#122544] border-2 border-[#F3BC6F] rounded-3xl p-5 sm:p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F35E50] text-white text-xs font-black">
              <UploadCloud className="w-4 h-4 text-[#F3BC6F]" />
              Tab 1 • Bank Bahan Mentah & Brief Rekaman
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Gudang Footage Kelas & Brief{" "}
              <span className="text-[#F3BC6F]">Siap Diolah</span>
            </h2>
            <p className="text-xs sm:text-sm text-white/85 leading-relaxed font-medium">
              Guru & tim mengunggah foto/video mentah di sini. Editor tinggal{" "}
              <strong>tandai &ldquo;Ambil untuk Diolah&rdquo;</strong> (agar tidak dikerjakan dobel),{" "}
              <strong>unduh bahannya</strong> untuk diedit di CapCut/Canva sesuai Brand Kit di atas, lalu{" "}
              <strong>unggah hasil jadinya</strong>.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onOpenCreateModal("RAW")}
            className="px-5 py-3 rounded-2xl bg-[#F35E50] hover:bg-[#e04b3d] text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#F3BC6F]" />
            <span>+ Upload Bahan Mentah</span>
          </button>
        </div>

        {/* Sub-Filter */}
        <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs font-bold">
          <div className="flex flex-wrap items-center gap-1.5 bg-white/10 p-1 rounded-2xl border border-white/10">
            <button
              type="button"
              onClick={() => setFilterType("ALL")}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                filterType === "ALL"
                  ? "bg-[#F3BC6F] text-[#1A3460] font-black"
                  : "text-white/80 hover:text-white"
              }`}
            >
              Semua ({allRawStage.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType("VIDEO")}
              className={`px-3 py-1.5 rounded-xl transition inline-flex items-center gap-1.5 cursor-pointer ${
                filterType === "VIDEO"
                  ? "bg-[#F3BC6F] text-[#1A3460] font-black"
                  : "text-white/80 hover:text-white"
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              Video Mentah
            </button>
            <button
              type="button"
              onClick={() => setFilterType("IMAGE")}
              className={`px-3 py-1.5 rounded-xl transition inline-flex items-center gap-1.5 cursor-pointer ${
                filterType === "IMAGE"
                  ? "bg-[#F3BC6F] text-[#1A3460] font-black"
                  : "text-white/80 hover:text-white"
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              Foto Mentah
            </button>
            <button
              type="button"
              onClick={() => setFilterType("BRIEF")}
              className={`px-3 py-1.5 rounded-xl transition inline-flex items-center gap-1.5 cursor-pointer ${
                filterType === "BRIEF"
                  ? "bg-[#F3BC6F] text-[#1A3460] font-black"
                  : "text-white/80 hover:text-white"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Brief Ide (Butuh Rekaman)
            </button>
            <button
              type="button"
              onClick={() => setFilterType("UNCLAIMED")}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                filterType === "UNCLAIMED"
                  ? "bg-emerald-500 text-white font-black"
                  : "text-white/80 hover:text-white"
              }`}
            >
              🟢 Belum Diambil
            </button>
          </div>
        </div>
      </div>

      {/* Daftar Kartu Bahan Mentah */}
      {rawItems.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-[#1A3460]/20 rounded-3xl p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#FFF8F3] border-2 border-[#F3BC6F] flex items-center justify-center mx-auto text-[#F35E50]">
            <UploadCloud className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-black text-[#1A3460]">
              Belum Ada Bahan Mentah pada Kategori Ini
            </h3>
            <p className="text-xs text-[#1A3460]/70 max-w-md mx-auto font-medium">
              Unggah rekaman kegiatan anak di kelas atau simpan brief dari Studio Brainstorm di atas.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenCreateModal("RAW")}
            className="px-4 py-2.5 rounded-xl bg-[#F35E50] hover:bg-[#e04b3d] text-white text-xs font-black inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Upload Bahan Mentah Baru
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {rawItems.map((item) => {
            const platformInfo = getPlatformBadge(item.platform);
            const formatMeta = getFormatMeta(item.contentType);
            const rawFiles = getRawFiles(item);
            const stage = getStage(item);
            const themeText = getThemeText(item.themeId, item.themeLabel);

            const isClaimed = Boolean(item.assignedToId);
            const isMine = item.assignedToId === currentUser?.id;
            const canRelease =
              isMine || isReviewerRole(currentUser?.role);

            const humanComments = (item.comments || []).filter(
              (cm: any) => cm.kind !== "LOG"
            );

            return (
              <div
                key={item.id}
                className="bg-white border-2 border-[#1A3460] rounded-3xl p-5 shadow-md hover:shadow-xl transition flex flex-col justify-between gap-4"
              >
                <div className="space-y-3.5">
                  {/* Top Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-black border ${platformInfo.className}`}
                      >
                        {platformInfo.icon}
                        {platformInfo.label}
                      </span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-[#FFF8F3] border border-[#1A3460]/15 text-[#1A3460]">
                        {formatMeta.code ? `[${formatMeta.code}] ` : ""}
                        {formatMeta.label}
                      </span>
                    </div>

                    {stage === "IDEA" ? (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-violet-100 text-violet-800 border border-violet-300">
                        💡 Brief Ide
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400">
                        {timeAgo(item.createdAt)}
                      </span>
                    )}
                  </div>

                  {/* Tema Jadwal */}
                  {themeText && (
                    <div className="inline-block text-[11px] font-black px-2.5 py-0.5 rounded-lg bg-[#F3BC6F]/30 text-[#1A3460] border border-[#F3BC6F]">
                      📅 {themeText}
                    </div>
                  )}

                  {/* Preview Bahan Mentah / Brief */}
                  {rawFiles.length > 0 ? (
                    <MediaPreview
                      files={rawFiles}
                      badgeLabel="Bahan Mentah"
                      heightClass="h-44"
                      downloadBaseName={`mentah-${item.id.slice(-5)}`}
                    />
                  ) : (
                    <div className="rounded-2xl border-2 border-dashed border-violet-300 bg-violet-50/50 p-4 space-y-2">
                      <div className="flex items-center justify-between text-xs font-black text-violet-900">
                        <span className="inline-flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5 text-violet-600" />
                          Brief Ide (Belum Ada Rekaman)
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setAttachRawItem(item);
                            setNewRawFiles([]);
                          }}
                          className="px-2 py-1 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-[10px] font-black cursor-pointer"
                        >
                          + Lampirkan Bahan
                        </button>
                      </div>
                      <p className="text-[11px] text-violet-950/80 line-clamp-4 whitespace-pre-line font-medium">
                        {item.prepNotes ||
                          item.description ||
                          "Silakan rekam footage kegiatan anak sesuai judul brief ini."}
                      </p>
                    </div>
                  )}

                  {/* Judul & Catatan Lapangan */}
                  <div className="space-y-1">
                    <h3
                      onClick={() => onSelectContent(item)}
                      className="font-black text-[#1A3460] text-sm leading-snug hover:text-[#F35E50] cursor-pointer transition line-clamp-2"
                    >
                      {item.title}
                    </h3>
                    {(item.description || (rawFiles.length > 0 && item.prepNotes)) && (
                      <p className="text-xs text-[#1A3460]/75 line-clamp-2 font-medium">
                        {item.description || item.prepNotes}
                      </p>
                    )}
                  </div>

                  {/* Info Pengunggah & Status Koordinasi Olah */}
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
                      <div className="truncate">
                        <span className="text-[11px] font-black text-[#1A3460]">
                          {item.createdBy?.name || "Tim"}
                        </span>
                      </div>
                    </div>

                    {isClaimed ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 shrink-0">
                        <UserCheck className="w-3 h-3" />
                        Diolah: {item.assignedTo?.name || "Editor"}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                        🟢 Bebas Diambil
                      </span>
                    )}
                  </div>

                  {/* Komentar manusia terakhir */}
                  {humanComments.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-[#FFF8F3] border border-[#1A3460]/10 space-y-0.5 text-xs">
                      <div className="flex items-center justify-between text-[10px] font-black text-[#1A3460]/70">
                        <span className="inline-flex items-center gap-1">
                          <MessageSquare className="w-3 h-3 text-[#F35E50]" />
                          Diskusi ({humanComments.length})
                        </span>
                        <span>
                          {humanComments[humanComments.length - 1].user?.name}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#1A3460] font-medium line-clamp-2">
                        {renderMentionedText(
                          humanComments[humanComments.length - 1].message
                        )}
                      </p>
                    </div>
                  )}
                </div>

                {/* Action Footer */}
                <div className="pt-3 border-t-2 border-[#1A3460]/10 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    {/* Koordinasi Ambil / Lepas */}
                    <button
                      type="button"
                      disabled={
                        busyId === item.id || (isClaimed && !canRelease)
                      }
                      onClick={() => handleClaimToggle(item)}
                      title={
                        isClaimed && !canRelease
                          ? `Sedang diolah oleh ${item.assignedTo?.name}`
                          : "Tandai agar anggota tim lain tahu bahan ini sedang Anda edit di CapCut/Canva"
                      }
                      className={`py-2 px-2.5 rounded-xl font-black text-xs inline-flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50 ${
                        isClaimed
                          ? "bg-[#FFF8F3] hover:bg-rose-50 border border-[#1A3460]/20 text-[#1A3460]"
                          : "bg-[#1A3460] hover:bg-[#122544] text-[#F3BC6F]"
                      }`}
                    >
                      {isClaimed ? (
                        canRelease ? (
                          <>
                            <Undo2 className="w-3.5 h-3.5 text-[#F35E50]" />
                            <span>Lepas Klaim</span>
                          </>
                        ) : (
                          <span>Sedang Diolah</span>
                        )
                      ) : (
                        <>
                          <Hand className="w-3.5 h-3.5 text-[#F3BC6F]" />
                          <span>Ambil Bahan</span>
                        </>
                      )}
                    </button>

                    {/* Unggah Hasil Edit dari CapCut / Canva */}
                    <button
                      type="button"
                      onClick={() => openSubmitResultModal(item)}
                      className="py-2 px-2.5 rounded-xl bg-[#F35E50] hover:bg-[#e04b3d] text-white font-black text-xs inline-flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
                    >
                      <Film className="w-3.5 h-3.5 text-[#F3BC6F]" />
                      <span>Unggah Hasil Edit</span>
                    </button>
                  </div>

                  {/* Quick Detail & Tagging */}
                  <div className="flex items-center justify-between text-[11px] pt-0.5">
                    <button
                      type="button"
                      onClick={() => onSelectContent(item)}
                      className="font-black text-[#1A3460]/70 hover:text-[#F35E50] cursor-pointer"
                    >
                      Detail & Brief Lengkap →
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveCommentId(
                          activeCommentId === item.id ? null : item.id
                        )
                      }
                      className="font-bold text-[#1A3460]/60 hover:text-[#F35E50] cursor-pointer"
                    >
                      {activeCommentId === item.id
                        ? "Tutup Komentar"
                        : "+ Tag Tim"}
                    </button>
                  </div>

                  {activeCommentId === item.id && (
                    <div className="pt-1">
                      <TeamMentionInput
                        users={users}
                        onSend={(msg, taggedId) =>
                          handleSendComment(item.id, msg, taggedId)
                        }
                        placeholder="Tulis catatan atau tag @Nama..."
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: Unggah Hasil Edit (dari Bahan Mentah -> Hasil & Usulan / Siap Upload) */}
      {submitModalItem && (
        <div className="fixed inset-0 z-50 bg-[#1A3460]/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border-2 border-[#1A3460] rounded-3xl w-full max-w-xl p-5 sm:p-6 shadow-2xl space-y-4 my-auto">
            <div className="flex items-start justify-between gap-3 border-b border-[#1A3460]/10 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-[#F35E50] text-white">
                  Setor Hasil Produksi (CapCut / Canva)
                </span>
                <h3 className="font-black text-[#1A3460] text-base mt-1">
                  {submitModalItem.title}
                </h3>
                <p className="text-[11px] text-slate-500 font-semibold">
                  Pastikan logo resmi PAUD Arjuna ada di pojok kiri atas & tanpa watermark @handle IG.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSubmitModalItem(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveResult} className="space-y-4">
              <div className="bg-[#FFF8F3] border-2 border-[#F3BC6F] rounded-2xl p-4">
                <MultiFileUpload
                  label="🎬 Berkas Hasil Jadi (Video MP4 / Slide Carousel PNG-JPG / Link Canva)"
                  helperText="Untuk konten Carousel, Anda bisa memilih semua gambar slide sekaligus dan mengatur urutannya."
                  files={resultFiles}
                  onChange={setResultFiles}
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
                      const tags = getRequiredHashtags(submitModalItem);
                      if (!captionDraft.includes("#paudArjunaMalang")) {
                        setCaptionDraft((prev) =>
                          prev.trim() ? `${prev.trim()}\n\n${tags}` : tags
                        );
                      }
                    }}
                    className="text-[11px] font-black text-[#F35E50] hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Hash className="w-3 h-3" />+ Sisipkan Hashtag Wajib
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={captionDraft}
                  onChange={(e) => setCaptionDraft(e.target.value)}
                  placeholder="Tulis caption hangat sesuai gaya bahasa PAUD Arjuna Malang..."
                  className="w-full p-3 text-xs rounded-xl bg-[#FFF8F3] border-2 border-[#1A3460]/15 text-[#1A3460] font-medium focus:outline-none focus:border-[#F35E50]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block text-xs font-black text-[#1A3460] mb-1">
                    Rencana Tanggal Upload (Opsional)
                  </label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[#FFF8F3] border-2 border-[#1A3460]/15 text-[#1A3460] font-bold focus:outline-none focus:border-[#F35E50]"
                  />
                </div>

                {isReviewerRole(currentUser?.role) && (
                  <label className="flex items-start gap-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 cursor-pointer mt-2 sm:mt-5">
                    <input
                      type="checkbox"
                      checked={skipReview}
                      onChange={(e) => setSkipReview(e.target.checked)}
                      className="mt-0.5 accent-emerald-600"
                    />
                    <span className="text-[11px] font-bold text-emerald-900 leading-snug">
                      Langsung setujui ke <strong>Bank Siap Upload</strong> (akses Lead/Admin)
                    </span>
                  </label>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1A3460]/10">
                <button
                  type="button"
                  onClick={() => setSubmitModalItem(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingResult || resultFiles.length === 0}
                  className="px-5 py-2.5 rounded-xl bg-[#F35E50] hover:bg-[#e04b3d] text-white font-black text-xs shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {submittingResult
                    ? "Menyimpan..."
                    : skipReview
                    ? "Simpan ke Bank Siap Upload"
                    : "Kirim ke Review Tim (Tab 2)"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Lampirkan Bahan Mentah ke Brief Ide */}
      {attachRawItem && (
        <div className="fixed inset-0 z-50 bg-[#1A3460]/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border-2 border-[#1A3460] rounded-3xl w-full max-w-lg p-5 sm:p-6 shadow-2xl space-y-4 my-auto">
            <div className="flex items-start justify-between gap-3 border-b border-[#1A3460]/10 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-violet-600 text-white">
                  Lampirkan Rekaman Kelas ke Brief
                </span>
                <h3 className="font-black text-[#1A3460] text-base mt-1">
                  {attachRawItem.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAttachRawItem(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAttachedRaw} className="space-y-4">
              <MultiFileUpload
                label="📸 Pilih Foto / Video Mentah Rekaman Guru"
                files={newRawFiles}
                onChange={setNewRawFiles}
              />
              <div className="flex justify-end gap-2 pt-2 border-t border-[#1A3460]/10">
                <button
                  type="button"
                  onClick={() => setAttachRawItem(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingRaw || newRawFiles.length === 0}
                  className="px-5 py-2 rounded-xl bg-[#1A3460] hover:bg-[#122544] text-[#F3BC6F] font-black text-xs disabled:opacity-50 cursor-pointer"
                >
                  {savingRaw ? "Menyimpan..." : "Simpan Bahan Mentah"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
