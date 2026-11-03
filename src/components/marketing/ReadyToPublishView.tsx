"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getPlatformBadge, getStatusBadge } from "@/lib/platformUtils";
import { TeamMentionInput, renderMentionedText } from "@/components/common/TeamMentionInput";
import {
  Rocket,
  CheckCircle2,
  Copy,
  Check,
  Download,
  ExternalLink,
  Flame,
  MessageSquare,
  Calendar,
  Share2,
  Clock,
  Sparkles,
  ArrowRight,
  Video,
  Image as ImageIcon,
} from "lucide-react";

interface ReadyToPublishProps {
  contents: any[];
  users: any[];
  onSelectContent: (content: any) => void;
  onRefresh: () => void;
  onNavigateToShowcase?: () => void;
}

export function ReadyToPublishView({
  contents,
  users,
  onSelectContent,
  onRefresh,
  onNavigateToShowcase,
}: ReadyToPublishProps) {
  const { currentUser } = useAuth();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [liveUrls, setLiveUrls] = useState<{ [id: string]: string }>({});
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);

  // Filter items in READY_TO_PUBLISH status
  const readyItems = contents.filter(
    (c) => c.status === "READY_TO_PUBLISH" && !c.liveUrl
  );

  // Copy caption helper
  const handleCopyCaption = (id: string, text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Action: Tandai Sudah Tayang / Live
  const handleMarkAsLive = async (item: any) => {
    const url = liveUrls[item.id] || "";
    try {
      setPublishingId(item.id);
      const res = await fetch(`/api/contents/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "PUBLISHED",
          liveUrl: url.trim() || item.liveUrl || "https://instagram.com/paudarjuna",
          liveNote: `Dipublikasikan oleh @${currentUser?.name || "Admin"}`,
        }),
      });

      if (res.ok) {
        await fetch(`/api/contents/${item.id}/comments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: `🎉 Konten telah resmi TAYANG LIVE oleh @${currentUser?.name}! Link: ${url || "Sudah tayang di medsos"}`,
          }),
        });

        onRefresh();
        if (onNavigateToShowcase) {
          onNavigateToShowcase();
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPublishingId(null);
    }
  };

  // Send comment with tagging
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
      {/* Banner Tab 3 */}
      <div className="bg-gradient-to-r from-[#1A3460] via-[#122544] to-emerald-800 border-2 border-[#F3BC6F] rounded-3xl p-5 sm:p-7 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-black shadow-sm">
              <Rocket className="w-4 h-4 text-[#F3BC6F]" />
              Tab 3 • Antrean Siap Upload & Penjadwalan
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Aset & Naskah Final <span className="text-[#F3BC6F]">Siap Tayang</span>
            </h2>
            <p className="text-xs sm:text-sm text-white/90 leading-relaxed font-medium">
              Semua konten di tab ini sudah melalui tahap review dan revisi. Admin (Rani) tinggal <strong>menyalin caption, mengunduh file visual</strong>, memposting ke media sosial resmi PAUD Arjuna, dan mencantumkan link live postingannya.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/10 px-4 py-3 rounded-2xl border border-white/20 text-center">
              <div className="text-2xl font-black text-[#F3BC6F]">{readyItems.length}</div>
              <div className="text-[10px] text-white/80 font-bold uppercase tracking-wider">
                Siap Upload
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Konten Siap Upload */}
      {readyItems.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-[#1A3460]/20 rounded-3xl p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#FFF8F3] border-2 border-[#F3BC6F] flex items-center justify-center mx-auto text-emerald-600">
            <Rocket className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-black text-[#1A3460]">
              Belum Ada Konten di Antrean Siap Upload
            </h3>
            <p className="text-xs text-[#1A3460]/70 max-w-md mx-auto font-medium">
              Konten akan masuk ke sini secara otomatis setelah tim menyelesaikan revisi dan menekan tombol <strong>"✅ Setujui & Siap Upload"</strong> di Tab 2.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {readyItems.map((item) => {
            const platformInfo = getPlatformBadge(item.platform);
            const finalMediaUrl = item.editedAssetUrl || item.rawAssetUrl || item.assetUrl;
            const captionText = item.prepNotes || item.description || "";
            const isCopied = copiedId === item.id;
            const isVideo =
              item.contentType?.includes("VIDEO") ||
              item.contentType === "REELS" ||
              finalMediaUrl?.match(/\.(mp4|webm|mov|m4v)/i);

            return (
              <div
                key={item.id}
                className="bg-white border-2 border-[#1A3460] rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col justify-between space-y-5"
              >
                <div className="space-y-4">
                  {/* Top Bar Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-black border ${platformInfo.className}`}
                    >
                      {platformInfo.icon}
                      {platformInfo.label}
                    </span>

                    <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-300">
                      🚀 Siap Upload ke Medsos
                    </span>
                  </div>

                  {/* Title & Type */}
                  <div className="space-y-1">
                    <h3
                      onClick={() => onSelectContent(item)}
                      className="font-black text-[#1A3460] text-base hover:text-[#F35E50] cursor-pointer transition leading-snug"
                    >
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-[#1A3460]/70 font-semibold">
                      <span>Format: <strong>{item.contentType?.replace("_", " ")}</strong></span>
                      {item.targetDate && (
                        <span>• Jadwal: <strong>{new Date(item.targetDate).toLocaleDateString("id-ID")}</strong></span>
                      )}
                    </div>
                  </div>

                  {/* Final Media Preview Box */}
                  <div className="bg-[#FFF8F3] border-2 border-[#1A3460]/15 rounded-2xl p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs font-black text-[#1A3460]">
                      <span className="flex items-center gap-1 text-emerald-700">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Aset Final Terverifikasi:
                      </span>
                      {finalMediaUrl && (
                        <a
                          href={finalMediaUrl}
                          download
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-[#F35E50] hover:underline font-bold"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download Aset
                        </a>
                      )}
                    </div>

                    {finalMediaUrl ? (
                      isVideo ? (
                        <video
                          src={finalMediaUrl}
                          controls
                          className="w-full h-44 rounded-xl object-cover bg-black"
                        />
                      ) : (
                        <img
                          src={finalMediaUrl}
                          alt="Aset Final"
                          className="w-full h-44 rounded-xl object-cover"
                        />
                      )
                    ) : (
                      <div className="h-28 rounded-xl border border-dashed border-[#1A3460]/20 flex items-center justify-center text-xs text-slate-400">
                        Link aset terlampir di naskah
                      </div>
                    )}
                  </div>

                  {/* Caption & Copywriting Ready to Copy */}
                  <div className="bg-[#FFF8F3] border-2 border-[#F3BC6F] rounded-2xl p-4 space-y-2 relative">
                    <div className="flex items-center justify-between text-xs font-black text-[#1A3460]">
                      <span>📝 Final Caption & Hashtag:</span>
                      <button
                        type="button"
                        onClick={() => handleCopyCaption(item.id, captionText)}
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-black transition cursor-pointer shadow-sm ${
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
                            <span>Salin Caption</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="max-h-28 overflow-y-auto pr-1">
                      <p className="text-xs text-[#1A3460] font-medium whitespace-pre-line leading-relaxed">
                        {captionText || "Belum ada caption tertulis."}
                      </p>
                    </div>
                  </div>

                  {/* Comments Preview */}
                  {item.comments && item.comments.length > 0 && (
                    <div className="p-3 rounded-2xl bg-[#FFF8F3] border border-[#1A3460]/15 space-y-1 text-xs">
                      <div className="flex items-center justify-between text-[11px] font-black text-[#1A3460]/80">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3 text-[#F35E50]" />
                          Komentar & Koordinasi Upload:
                        </span>
                        <span>{item.comments[item.comments.length - 1].user?.name}</span>
                      </div>
                      <p className="text-xs text-[#1A3460] font-medium leading-relaxed">
                        {renderMentionedText(item.comments[item.comments.length - 1].message)}
                      </p>
                    </div>
                  )}
                </div>

                {/* PUBLISH ACTION SECTION */}
                <div className="pt-4 border-t-2 border-[#1A3460]/10 space-y-3">
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-black uppercase text-[#1A3460] tracking-wider">
                      Masukkan Link Postingan Medsos Setelah Publish:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        placeholder="https://www.instagram.com/p/... atau link TikTok..."
                        value={liveUrls[item.id] !== undefined ? liveUrls[item.id] : (item.liveUrl || "")}
                        onChange={(e) =>
                          setLiveUrls({ ...liveUrls, [item.id]: e.target.value })
                        }
                        className="flex-1 px-3 py-2 text-xs rounded-xl bg-[#FFF8F3] border-2 border-[#1A3460]/15 text-[#1A3460] placeholder-slate-400 focus:outline-none focus:border-[#F35E50] font-medium"
                      />

                      <button
                        type="button"
                        onClick={() => handleMarkAsLive(item)}
                        disabled={publishingId === item.id}
                        className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer"
                      >
                        {publishingId === item.id ? (
                          <span>Menyimpan...</span>
                        ) : (
                          <>
                            <Flame className="w-4 h-4 text-[#F3BC6F]" />
                            <span>Tandai Live!</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Inline Tagging Input */}
                  {activeCommentId === item.id ? (
                    <div className="pt-2">
                      <TeamMentionInput
                        users={users}
                        onSend={(msg, taggedId) => handleSendComment(item.id, msg, taggedId)}
                        placeholder="Tag tim (@Nama) untuk koordinasi tayang..."
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
    </div>
  );
}
