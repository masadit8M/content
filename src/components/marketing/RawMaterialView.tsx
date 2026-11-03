"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getPlatformBadge, getStatusBadge } from "@/lib/platformUtils";
import { AttachmentDisplay } from "@/components/common/AttachmentDisplay";
import { TeamMentionInput, renderMentionedText } from "@/components/common/TeamMentionInput";
import {
  UploadCloud,
  Video,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  UserCheck,
  MessageSquare,
  FileText,
  Play,
  Share2,
  Plus,
} from "lucide-react";

interface RawMaterialViewProps {
  contents: any[];
  users: any[];
  onSelectContent: (content: any) => void;
  onOpenCreateModal: (defaultStatus?: string) => void;
  onRefresh: () => void;
  onNavigateToEditing?: () => void;
}

export function RawMaterialView({
  contents,
  users,
  onSelectContent,
  onOpenCreateModal,
  onRefresh,
  onNavigateToEditing,
}: RawMaterialViewProps) {
  const { currentUser } = useAuth();
  const [filterType, setFilterType] = useState<"ALL" | "VIDEO" | "IMAGE" | "UNCLAIMED">("ALL");
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [activeCommentContentId, setActiveCommentContentId] = useState<string | null>(null);

  // Filter raw material items
  // Konten yang berstatus RAW_MATERIAL atau IDEA atau belum masuk fase editing lanjutan
  const rawItems = contents.filter((c) => {
    const isRawStatus = c.status === "RAW_MATERIAL" || c.status === "IDEA";
    if (!isRawStatus && c.status !== "IN_PREPARATION") return false;

    if (filterType === "VIDEO") {
      return (
        c.rawAssetType === "VIDEO" ||
        c.contentType?.includes("VIDEO") ||
        c.contentType === "REELS" ||
        c.rawAssetUrl?.match(/\.(mp4|webm|mov|m4v)/i)
      );
    }
    if (filterType === "IMAGE") {
      return (
        c.rawAssetType === "IMAGE" ||
        c.contentType === "FEED_CAROUSEL" ||
        c.contentType === "STORY" ||
        c.rawAssetUrl?.match(/\.(jpg|jpeg|png|webp)/i)
      );
    }
    if (filterType === "UNCLAIMED") {
      return !c.assignedToId || c.assignedToId === c.createdById;
    }
    return true;
  });

  // Action: Ambil Bahan untuk Diedit (Claim)
  const handleClaimMaterial = async (content: any) => {
    if (!currentUser) return;
    try {
      setClaimingId(content.id);
      const res = await fetch(`/api/contents/${content.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "IN_EDITING",
          assignedToId: currentUser.id,
        }),
      });

      if (res.ok) {
        // Otomatis tambahkan komentar penugasan
        await fetch(`/api/contents/${content.id}/comments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: `🖐️ @${currentUser.name} telah mengambil bahan ini untuk mulai proses editing!`,
            taggedUserId: currentUser.id,
          }),
        });

        onRefresh();
        if (onNavigateToEditing) {
          onNavigateToEditing();
        }
      }
    } catch (err) {
      console.error("Gagal claim bahan:", err);
    } finally {
      setClaimingId(null);
    }
  };

  // Quick inline comment with @mention
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
      {/* Banner Tab 1 */}
      <div className="bg-gradient-to-r from-[#1A3460] to-[#122544] border-2 border-[#F3BC6F] rounded-3xl p-5 sm:p-7 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full bg-[#F35E50]/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F35E50] text-white text-xs font-black shadow-sm">
              <UploadCloud className="w-4 h-4 text-[#F3BC6F]" />
              Tab 1 • Bank Bahan Mentah Foto & Video
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Koleksi Bahan Mentah <span className="text-[#F3BC6F]">Siap Edit</span>
            </h2>
            <p className="text-xs sm:text-sm text-white/80 leading-relaxed font-medium">
              Setiap anggota tim (Creator, Admin, Guru, Lead) bebas mengunggah foto kegiatan atau video lapangan di sini. 
              Desainer & editor dapat langsung <strong>memilih dan mengambil bahan</strong> yang sesuai keahliannya untuk mulai diedit.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={() => onOpenCreateModal("RAW_MATERIAL")}
              className="px-5 py-3 rounded-2xl bg-[#F35E50] hover:bg-[#e04b3d] text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#F35E50]/40 transition transform active:scale-95 cursor-pointer"
            >
              <Plus className="w-5 h-5 text-[#F3BC6F]" />
              <span>+ Upload Bahan Mentah Baru</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="mt-6 pt-5 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs font-bold">
          <div className="flex flex-wrap items-center gap-1.5 bg-white/10 p-1 rounded-2xl border border-white/10">
            <button
              onClick={() => setFilterType("ALL")}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                filterType === "ALL" ? "bg-[#F3BC6F] text-[#1A3460] font-black" : "text-white/80 hover:text-white"
              }`}
            >
              Semua Bahan ({contents.filter((c) => c.status === "RAW_MATERIAL" || c.status === "IDEA" || c.status === "IN_PREPARATION").length})
            </button>
            <button
              onClick={() => setFilterType("VIDEO")}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
                filterType === "VIDEO" ? "bg-[#F3BC6F] text-[#1A3460] font-black" : "text-white/80 hover:text-white"
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              Video Mentah
            </button>
            <button
              onClick={() => setFilterType("IMAGE")}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
                filterType === "IMAGE" ? "bg-[#F3BC6F] text-[#1A3460] font-black" : "text-white/80 hover:text-white"
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              Foto / Desain
            </button>
            <button
              onClick={() => setFilterType("UNCLAIMED")}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                filterType === "UNCLAIMED" ? "bg-emerald-500 text-white font-black" : "text-white/80 hover:text-white"
              }`}
            >
              🟢 Belum Diambil Editor
            </button>
          </div>

          <span className="text-[11px] text-[#F3BC6F] font-semibold">
            Tip: Klik <strong>"🖐️ Ambil Bahan Ini"</strong> untuk memindahkan tugas ke Tab Editing Anda.
          </span>
        </div>
      </div>

      {/* Grid Bahan Mentah */}
      {rawItems.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-[#1A3460]/20 rounded-3xl p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#FFF8F3] border-2 border-[#F3BC6F] flex items-center justify-center mx-auto text-[#F35E50]">
            <UploadCloud className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-black text-[#1A3460]">
              Belum Ada Bahan Mentah yang Diunggah
            </h3>
            <p className="text-xs text-[#1A3460]/70 max-w-md mx-auto font-medium">
              Yuk upload video reels mentah, rekaman kelas PAUD, atau foto kegiatan anak agar tim desainer dan copywriter bisa mulai mengedit!
            </p>
          </div>
          <button
            onClick={() => onOpenCreateModal("RAW_MATERIAL")}
            className="px-4 py-2.5 rounded-xl bg-[#F35E50] text-white text-xs font-black inline-flex items-center gap-2 hover:bg-[#e04b3d] shadow-md transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Upload File Mentah Pertama
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {rawItems.map((item) => {
            const platformInfo = getPlatformBadge(item.platform);
            const rawUrl = item.rawAssetUrl || item.assetUrl;
            const isVideo =
              item.rawAssetType === "VIDEO" ||
              item.contentType?.includes("VIDEO") ||
              item.contentType === "REELS" ||
              rawUrl?.match(/\.(mp4|webm|mov|m4v)/i);

            const isAssigned = item.assignedTo && item.assignedToId !== item.createdById;
            const isAssignedToMe = item.assignedToId === currentUser?.id;

            return (
              <div
                key={item.id}
                className="bg-white border-2 border-[#1A3460] rounded-3xl p-5 shadow-lg hover:shadow-xl transition flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  {/* Card Header & Platform */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-black border ${platformInfo.className}`}
                    >
                      {platformInfo.icon}
                      {platformInfo.label}
                    </span>

                    <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-[#FFF8F3] border border-[#1A3460]/15 text-[#1A3460]">
                      {item.contentType?.replace("_", " ")}
                    </span>
                  </div>

                  {/* Media Preview Box */}
                  <div className="relative rounded-2xl overflow-hidden border-2 border-[#1A3460]/15 bg-[#FFF8F3] aspect-video flex items-center justify-center group-hover:border-[#F35E50] transition">
                    {rawUrl ? (
                      isVideo ? (
                        <div className="relative w-full h-full bg-black flex items-center justify-center">
                          <video
                            src={rawUrl}
                            className="w-full h-full object-cover"
                            controls
                            preload="metadata"
                          />
                          <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 text-white text-[10px] font-black flex items-center gap-1 pointer-events-none">
                            <Video className="w-3 h-3 text-[#F3BC6F]" />
                            Video Mentah
                          </div>
                        </div>
                      ) : (
                        <div className="relative w-full h-full">
                          <img
                            src={rawUrl}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 text-white text-[10px] font-black flex items-center gap-1 pointer-events-none">
                            <ImageIcon className="w-3 h-3 text-[#F3BC6F]" />
                            Foto Mentah
                          </div>
                        </div>
                      )
                    ) : (
                      <div className="text-center p-4 space-y-1">
                        <FileText className="w-8 h-8 text-[#1A3460]/30 mx-auto" />
                        <span className="text-[11px] font-bold text-slate-400">
                          Lampiran link drive / teks brief
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-1.5">
                    <h3
                      onClick={() => onSelectContent(item)}
                      className="font-black text-[#1A3460] text-sm leading-snug hover:text-[#F35E50] cursor-pointer transition line-clamp-2"
                      title={item.title}
                    >
                      {item.title}
                    </h3>
                    <p className="text-xs text-[#1A3460]/75 line-clamp-2 font-medium">
                      {item.description || item.prepNotes || "Belum ada catatan detail dari pengunggah."}
                    </p>
                  </div>

                  {/* Uploader & Assignment Info */}
                  <div className="pt-3 border-t border-[#1A3460]/10 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <img
                        src={
                          item.createdBy?.avatar ||
                          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
                        }
                        alt={item.createdBy?.name || "Uploader"}
                        className="w-6 h-6 rounded-full object-cover border border-[#F3BC6F]"
                      />
                      <div className="leading-tight">
                        <div className="font-bold text-[11px] text-[#1A3460]">
                          {item.createdBy?.name || "Admin"}
                        </div>
                        <div className="text-[9px] text-[#1A3460]/60 font-semibold">
                          Pengunggah
                        </div>
                      </div>
                    </div>

                    {isAssigned ? (
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                          <UserCheck className="w-3 h-3" />
                          Editor: {item.assignedTo?.name}
                        </span>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                        🟢 Siap Diambil
                      </span>
                    )}
                  </div>

                  {/* Komentar Terbaru & Mention Display */}
                  {item.comments && item.comments.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-[#FFF8F3] border border-[#1A3460]/10 space-y-1 text-xs">
                      <div className="flex items-center justify-between text-[10px] font-black text-[#1A3460]/70">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3 text-[#F35E50]" />
                          Komentar Terbaru ({item.comments.length}):
                        </span>
                        <span>{item.comments[item.comments.length - 1].user?.name}</span>
                      </div>
                      <p className="text-[11px] text-[#1A3460] font-medium line-clamp-2">
                        {renderMentionedText(item.comments[item.comments.length - 1].message)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="mt-4 pt-3 border-t-2 border-[#1A3460]/10 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    {/* Tombol Ambil untuk Diedit */}
                    <button
                      onClick={() => handleClaimMaterial(item)}
                      disabled={claimingId === item.id}
                      className={`py-2 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer ${
                        isAssignedToMe
                          ? "bg-amber-500 hover:bg-amber-600 text-white"
                          : "bg-[#1A3460] hover:bg-[#122544] text-[#F3BC6F]"
                      }`}
                    >
                      {claimingId === item.id ? (
                        <span>Memproses...</span>
                      ) : isAssignedToMe ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Lanjut Edit</span>
                        </>
                      ) : (
                        <>
                          <span>🖐️ Ambil Bahan</span>
                        </>
                      )}
                    </button>

                    {/* Tombol Diskusi & Tag Tim */}
                    <button
                      onClick={() => onSelectContent(item)}
                      className="py-2 px-3 rounded-xl bg-[#FFF8F3] hover:bg-[#F3BC6F]/30 border-2 border-[#1A3460]/20 text-[#1A3460] font-black text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-[#F35E50]" />
                      <span>Diskusi / Tag</span>
                    </button>
                  </div>

                  {/* Quick Mention input toggle */}
                  {activeCommentContentId === item.id ? (
                    <div className="pt-2">
                      <TeamMentionInput
                        users={users}
                        onSend={(msg, taggedId) => handleSendComment(item.id, msg, taggedId)}
                        placeholder="Tag tim (@Nama) untuk instruksi..."
                      />
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveCommentContentId(item.id)}
                      className="w-full text-center text-[11px] text-[#1A3460]/60 hover:text-[#F35E50] font-bold py-1 transition cursor-pointer"
                    >
                      + Tambah komentar cepat & tag tim
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
