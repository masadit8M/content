"use client";

import React, { useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getPlatformBadge } from "@/lib/platformUtils";
import { MediaPreview } from "@/components/common/MediaPreview";
import {
  TeamMentionInput,
  renderMentionedText,
} from "@/components/common/TeamMentionInput";
import { useToast } from "@/components/common/Toast";
import {
  getStage,
  getPrimaryFiles,
  detectMediaKind,
  getFormatMeta,
  buildPostText,
  getRequiredHashtags,
  toDateInputValue,
  dayDiffFromToday,
  isReviewerRole,
  REVIEWER_HINT,
} from "@/lib/content-utils";
import { getThemeText } from "@/lib/marketing-plan";
import {
  markLive,
  returnToReview,
  patchContent,
  postComment,
} from "@/lib/content-actions";
import { downloadAllMedia } from "@/lib/upload-client";
import { copyText } from "@/lib/clipboard";
import {
  Rocket,
  Copy,
  Check,
  Download,
  Flame,
  MessageSquare,
  Calendar,
  Undo2,
  Lock,
} from "lucide-react";

interface ReadyToPublishProps {
  contents: any[];
  users: any[];
  onSelectContent: (content: any) => void;
  onRefresh: () => void;
  onNavigateToShowcase: () => void;
  onNavigateToReview: () => void;
}

export function ReadyToPublishView({
  contents,
  users,
  onSelectContent,
  onRefresh,
  onNavigateToShowcase,
  onNavigateToReview,
}: ReadyToPublishProps) {
  const { currentUser } = useAuth();
  const toast = useToast();
  const canPublish = isReviewerRole(currentUser?.role);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [liveUrls, setLiveUrls] = useState<Record<string, string>>({});
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);

  const readyItems = useMemo(() => {
    const list = contents.filter((c) => getStage(c) === "READY");
    return [...list].sort((a, b) => {
      const da = a.targetDate ? new Date(a.targetDate).getTime() : Infinity;
      const db = b.targetDate ? new Date(b.targetDate).getTime() : Infinity;
      return da - db;
    });
  }, [contents]);

  const getFinalCaption = (item: any) => {
    const built = buildPostText(item);
    if (built) return built;
    const legacy = String(item.prepNotes || item.description || "").trim();
    if (!legacy) return getRequiredHashtags(item);
    return /#paudArjunaMalang/i.test(legacy)
      ? legacy
      : `${legacy}\n\n${getRequiredHashtags(item)}`;
  };

  const handleCopyCaption = async (id: string, text: string) => {
    const ok = await copyText(text);
    if (ok) {
      setCopiedId(id);
      toast("Caption + Hashtag wajib disalin ke clipboard!");
      setTimeout(() => setCopiedId(null), 2200);
    }
  };

  const handleUpdateTargetDate = async (item: any, value: string) => {
    const res = await patchContent(item.id, { targetDate: value || null });
    if (res.ok) {
      toast(
        value
          ? "Jadwal rencana upload diperbarui!"
          : "Jadwal rencana upload dikosongkan."
      );
      onRefresh();
    } else {
      toast(res.error || "Gagal menyimpan tanggal.", { tone: "error" });
    }
  };

  const handleMarkAsLive = async (item: any) => {
    if (!currentUser) return;
    const rawUrl = (
      liveUrls[item.id] !== undefined ? liveUrls[item.id] : item.liveUrl || ""
    ).trim();

    if (!rawUrl || !/^https?:\/\//i.test(rawUrl)) {
      toast(
        "Tempelkan tautan postingan medsos (diawali https://) setelah diupload agar tersimpan di Arsip Tayang.",
        { tone: "error" }
      );
      return;
    }

    setPublishingId(item.id);
    try {
      const res = await markLive(
        item,
        currentUser,
        rawUrl,
        `Dipublikasikan oleh ${currentUser.name}`
      );
      if (res.ok) {
        onRefresh();
        toast("Konten resmi tercatat Tayang di Arsip Live!", {
          action: {
            label: "Buka Arsip Tayang →",
            onClick: onNavigateToShowcase,
          },
        });
      } else {
        toast(res.error || "Gagal menandai tayang.", { tone: "error" });
      }
    } finally {
      setPublishingId(null);
    }
  };

  const handleReturnToReview = async (item: any) => {
    if (!currentUser) return;
    const res = await returnToReview(item, currentUser);
    if (res.ok) {
      onRefresh();
      toast("Konten dikembalikan ke Tab 2 (Hasil Edit & Usulan).", {
        action: { label: "Buka Tab 2 →", onClick: onNavigateToReview },
      });
    } else {
      toast(res.error || "Gagal mengembalikan konten.", { tone: "error" });
    }
  };

  const handleSendComment = async (
    contentId: string,
    message: string,
    taggedUserId?: string
  ) => {
    const res = await postComment(contentId, message, taggedUserId, "COMMENT");
    if (res.ok) onRefresh();
  };

  const renderScheduleBadge = (targetDate?: string | null) => {
    const diff = dayDiffFromToday(targetDate);
    if (diff === null) {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
          Tanggal fleksibel
        </span>
      );
    }
    if (diff < 0) {
      return (
        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
          ⏰ Lewat {Math.abs(diff)} hari
        </span>
      );
    }
    if (diff === 0) {
      return (
        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#F35E50] text-white">
          🔥 Jadwal Hari Ini!
        </span>
      );
    }
    if (diff === 1) {
      return (
        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
          Besok
        </span>
      );
    }
    return (
      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
        {diff} hari lagi
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Banner Tab 3 */}
      <div className="bg-gradient-to-r from-[#1A3460] via-[#122544] to-emerald-800 border-2 border-[#F3BC6F] rounded-3xl p-5 sm:p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-black">
              <Rocket className="w-4 h-4 text-[#F3BC6F]" />
              Tab 3 • Bank Konten Siap Upload
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Tabungan Konten Final{" "}
              <span className="text-[#F3BC6F]">Siap Posting ke Medsos</span>
            </h2>
            <p className="text-xs sm:text-sm text-white/90 leading-relaxed font-medium">
              Semua konten di sini sudah disetujui. Admin tinggal{" "}
              <strong>1-klik unduh aset final</strong>,{" "}
              <strong>1-klik salin caption + hashtag wajib</strong>, upload ke akun medsos resmi PAUD Arjuna sesuai tanggal target, lalu tempel link postingannya.
            </p>
          </div>

          <div className="bg-white/10 px-5 py-3 rounded-2xl border border-white/20 text-center shrink-0">
            <div className="text-2xl font-black text-[#F3BC6F]">
              {readyItems.length}
            </div>
            <div className="text-[10px] text-white/80 font-bold uppercase tracking-wider">
              Stok Siap Upload
            </div>
          </div>
        </div>
      </div>

      {/* Daftar Konten Siap Upload */}
      {readyItems.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-[#1A3460]/20 rounded-3xl p-12 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[#FFF8F3] border-2 border-[#F3BC6F] flex items-center justify-center mx-auto text-emerald-600">
            <Rocket className="w-7 h-7" />
          </div>
          <h3 className="text-base font-black text-[#1A3460]">
            Bank Konten Siap Upload Masih Kosong
          </h3>
          <p className="text-xs text-[#1A3460]/70 max-w-md mx-auto font-medium">
            Setujui konten dari <strong>Tab 2 (Hasil Edit & Usulan)</strong> agar masuk ke stok siap upload di sini.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {readyItems.map((item) => {
            const platformInfo = getPlatformBadge(item.platform);
            const formatMeta = getFormatMeta(item.contentType);
            const finalFiles = getPrimaryFiles(item);
            const downloadable = finalFiles.filter(
              (f) => detectMediaKind(f) !== "link"
            );
            const finalCaption = getFinalCaption(item);
            const isCopied = copiedId === item.id;
            const themeText = getThemeText(item.themeId, item.themeLabel);
            const humanComments = (item.comments || []).filter(
              (cm: any) => cm.kind !== "LOG"
            );

            return (
              <div
                key={item.id}
                className="bg-white border-2 border-[#1A3460] rounded-3xl p-5 sm:p-6 shadow-lg flex flex-col justify-between gap-4"
              >
                <div className="space-y-4">
                  {/* Top Badges & Target Date */}
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
                    </div>

                    <div className="flex items-center gap-1.5">
                      {renderScheduleBadge(item.targetDate)}
                      {canPublish && (
                        <button
                          type="button"
                          onClick={() => handleReturnToReview(item)}
                          title="Kembalikan ke Tab 2 jika masih ada yang perlu direvisi"
                          className="p-1.5 rounded-lg bg-[#FFF8F3] hover:bg-amber-100 text-[#1A3460]/70 hover:text-[#1A3460] border border-[#1A3460]/15 cursor-pointer"
                        >
                          <Undo2 className="w-3.5 h-3.5" />
                        </button>
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
                  </div>

                  {/* Baris Tanggal Rencana Upload */}
                  <div className="p-2.5 rounded-2xl bg-[#FFF8F3] border border-[#1A3460]/15 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-black text-[#1A3460] inline-flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#F35E50]" />
                      Target Tanggal Upload:
                    </span>
                    <input
                      type="date"
                      value={toDateInputValue(item.targetDate)}
                      onChange={(e) =>
                        handleUpdateTargetDate(item, e.target.value)
                      }
                      className="px-2.5 py-1 rounded-xl bg-white border border-[#1A3460]/20 text-[#1A3460] font-bold text-xs focus:outline-none focus:border-[#F35E50]"
                    />
                  </div>

                  {/* Preview Aset Final + Tombol Unduh Besar */}
                  <div className="space-y-2">
                    <MediaPreview
                      files={finalFiles}
                      badgeLabel="Aset Final Siap Upload"
                      heightClass="h-52"
                      downloadBaseName={`siap-upload-${item.id.slice(-5)}`}
                      showDownloadBar={false}
                    />
                    {downloadable.length > 0 && (
                      <button
                        type="button"
                        onClick={async () => {
                          toast(
                            `Mengunduh ${downloadable.length} berkas aset final...`,
                            { tone: "info" }
                          );
                          await downloadAllMedia(
                            downloadable,
                            `arjuna-${item.id.slice(-5)}`
                          );
                        }}
                        className="w-full py-2.5 px-4 rounded-xl bg-[#1A3460] hover:bg-[#122544] text-[#F3BC6F] text-xs font-black inline-flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
                      >
                        <Download className="w-4 h-4 text-[#F35E50]" />
                        <span>
                          Unduh Aset Final ({downloadable.length} Berkas)
                        </span>
                      </button>
                    )}
                  </div>

                  {/* Kotak Caption + Hashtag Siap Salin */}
                  <div className="bg-[#FFF8F3] border-2 border-[#F3BC6F] rounded-2xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-black text-[#1A3460]">
                        📝 Caption + Hashtag Siap Tempel:
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyCaption(item.id, finalCaption)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black inline-flex items-center gap-1.5 shadow-sm transition cursor-pointer ${
                          isCopied
                            ? "bg-emerald-600 text-white"
                            : "bg-[#F35E50] hover:bg-[#e04b3d] text-white"
                        }`}
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Tersalin!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Salin Caption + Hashtag</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="max-h-28 overflow-y-auto pr-1">
                      <p className="text-xs text-[#1A3460] font-medium whitespace-pre-line leading-relaxed">
                        {finalCaption}
                      </p>
                    </div>
                  </div>

                  {/* Komentar koordinasi terakhir */}
                  {humanComments.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-[#FFF8F3] border border-[#1A3460]/10 space-y-0.5 text-xs">
                      <div className="flex items-center justify-between text-[10px] font-black text-[#1A3460]/70">
                        <span className="inline-flex items-center gap-1">
                          <MessageSquare className="w-3 h-3 text-[#F35E50]" />
                          Catatan Tim ({humanComments.length})
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

                {/* Konfirmasi Sudah Tayang */}
                <div className="pt-3 border-t-2 border-[#1A3460]/10 space-y-2.5">
                  <label className="block text-[11px] font-black uppercase text-[#1A3460] tracking-wider">
                    Konfirmasi Setelah Terbit di Medsos:
                  </label>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      type="url"
                      disabled={!canPublish}
                      placeholder={
                        canPublish
                          ? "Tempel link postingan (https://instagram.com/reel/...)"
                          : REVIEWER_HINT
                      }
                      value={
                        liveUrls[item.id] !== undefined
                          ? liveUrls[item.id]
                          : item.liveUrl || ""
                      }
                      onChange={(e) =>
                        setLiveUrls({ ...liveUrls, [item.id]: e.target.value })
                      }
                      className="flex-1 px-3 py-2 text-xs rounded-xl bg-[#FFF8F3] border-2 border-[#1A3460]/15 text-[#1A3460] placeholder-slate-400 focus:outline-none focus:border-emerald-600 font-medium disabled:opacity-60"
                    />
                    <button
                      type="button"
                      disabled={!canPublish || publishingId === item.id}
                      title={!canPublish ? REVIEWER_HINT : "Tandai konten sudah tayang di medsos"}
                      onClick={() => handleMarkAsLive(item)}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs inline-flex items-center justify-center gap-1.5 shadow-md transition cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
                    >
                      {canPublish ? (
                        <Flame className="w-4 h-4 text-[#F3BC6F]" />
                      ) : (
                        <Lock className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {publishingId === item.id
                          ? "Menyimpan..."
                          : "Tandai Tayang"}
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
                        placeholder="Tag @Nama untuk koordinasi jam tayang..."
                      />
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveCommentId(item.id)}
                      className="w-full text-center text-[11px] text-[#1A3460]/60 hover:text-[#F35E50] font-bold py-0.5 cursor-pointer"
                    >
                      + Tambah catatan koordinasi upload
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
