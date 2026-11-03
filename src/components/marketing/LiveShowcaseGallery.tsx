"use client";

import React, { useState } from "react";
import { getPlatformBadge } from "@/lib/platformUtils";
import {
  ExternalLink,
  Flame,
  Copy,
  Check,
  Clock,
  ArrowUpRight,
} from "lucide-react";

interface ShowcaseProps {
  contents: any[];
  onSelectContent: (content: any) => void;
  onOpenCreateModal: () => void;
}

export function LiveShowcaseGallery({
  contents,
  onSelectContent,
  onOpenCreateModal,
}: ShowcaseProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter only contents that have liveUrl or status is PUBLISHED
  const liveContents = contents.filter((c) => c.liveUrl || c.status === "PUBLISHED");

  const handleCopyLink = (id: string, url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#1A3460] border-2 border-[#F3BC6F] rounded-3xl p-6 sm:p-8 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6 text-white">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#F35E50] text-white text-xs font-black shadow-sm">
            <Flame className="w-4 h-4 text-[#F3BC6F]" />
            SHOWCASE KARYA LIVE TIM MARKETING
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Dashboard Konten yang Sudah Tayang
          </h2>
          <p className="text-xs sm:text-sm text-white/80 max-w-2xl leading-relaxed font-semibold">
            Semua admin & tim dapat melihat tautan langsung hasil pekerjaan yang telah dirilis
            ke publik (Instagram, TikTok, YouTube, dll). Klik untuk membuka postingan atau salin link untuk dibagikan.
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-3">
          <div className="px-6 py-4 rounded-2xl bg-white/10 border-2 border-[#F3BC6F]/40 text-center">
            <div className="text-3xl sm:text-4xl font-black text-[#F3BC6F]">
              {liveContents.length}
            </div>
            <div className="text-[11px] font-black text-white/80 uppercase tracking-wider mt-0.5">
              Konten Live
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Live Cards */}
      {liveContents.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-[#1A3460]/20 rounded-3xl p-12 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[#FFF8F3] border border-[#F3BC6F] flex items-center justify-center text-[#F35E50] mx-auto">
            <Flame className="w-7 h-7" />
          </div>
          <h3 className="text-base font-black text-[#1A3460]">Belum ada konten yang berstatus Live</h3>
          <p className="text-xs text-[#1A3460]/70 font-semibold max-w-md mx-auto">
            Saat admin mempublikasikan hasil desainnya, masukkan link URL ke dalam konten tersebut agar otomatis muncul di galeri showcase ini.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {liveContents.map((item) => {
            const platformInfo = getPlatformBadge(item.platform);
            const isCopied = copiedId === item.id;
            const publishedDate = item.publishedAt
              ? new Date(item.publishedAt).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Baru saja";

            return (
              <div
                key={item.id}
                onClick={() => onSelectContent(item)}
                className="bg-white hover:bg-[#FFF8F3] border-2 border-[#1A3460]/15 hover:border-[#F35E50] rounded-3xl p-5 shadow-sm hover:shadow-md cursor-pointer transition flex flex-col justify-between group space-y-4 relative overflow-hidden"
              >
                {/* Top colored strip */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#F35E50]" />

                <div className="space-y-3">
                  {/* Top Bar: Platform & Published Date */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-black border ${platformInfo.className}`}
                    >
                      {platformInfo.icon}
                      {platformInfo.label}
                    </span>

                    <span className="text-[11px] text-[#1A3460]/60 flex items-center gap-1 font-bold">
                      <Clock className="w-3 h-3 text-[#1A3460]/50" />
                      {publishedDate}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-sm sm:text-base font-black text-[#1A3460] group-hover:text-[#F35E50] transition line-clamp-2 leading-snug">
                    {item.title}
                  </h3>

                  {/* Description / Concept */}
                  {item.description && (
                    <p className="text-xs text-[#1A3460]/70 line-clamp-2 leading-relaxed font-semibold">
                      {item.description}
                    </p>
                  )}

                  {/* Live Note / Highlight */}
                  {item.liveNote && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-900">
                      <div className="text-[10px] font-black text-emerald-700 uppercase tracking-wider mb-0.5">
                        Catatan Hasil Live:
                      </div>
                      <p className="line-clamp-2 font-medium">{item.liveNote}</p>
                    </div>
                  )}

                  {/* Preparation summary snippet */}
                  {item.prepNotes && (
                    <div className="p-2.5 rounded-xl bg-[#FFF8F3] border border-[#F3BC6F]/50 text-[11px] text-[#1A3460]/80 line-clamp-2 font-medium">
                      <span className="text-[#F35E50] font-black">Persiapan: </span>
                      {item.prepNotes}
                    </div>
                  )}
                </div>

                {/* Bottom Action Section: Live Link Buttons & Publisher */}
                <div className="pt-3 border-t border-[#1A3460]/10 space-y-3">
                  {/* Publisher / Admin Info */}
                  <div className="flex items-center justify-between text-xs text-[#1A3460]/70 font-bold">
                    <div className="flex items-center gap-2">
                      <img
                        src={item.createdBy?.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150"}
                        alt={item.createdBy?.name || "Admin"}
                        className="w-6 h-6 rounded-full object-cover border border-[#F3BC6F]"
                      />
                      <span>
                        Oleh: <strong className="text-[#1A3460] font-black">{item.createdBy?.name}</strong>
                      </span>
                    </div>

                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-300 font-black">
                      ● LIVE
                    </span>
                  </div>

                  {/* Action Buttons: Open Link & Copy */}
                  {item.liveUrl ? (
                    <div className="flex items-center gap-2">
                      <a
                        href={item.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className={`flex-1 py-2 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition shadow-sm ${platformInfo.btnColor} cursor-pointer`}
                      >
                        <span>Buka Postingan Live</span>
                        <ArrowUpRight className="w-4 h-4 shrink-0" />
                      </a>

                      <button
                        type="button"
                        onClick={(e) => handleCopyLink(item.id, item.liveUrl, e)}
                        title="Salin Tautan"
                        className="p-2 rounded-xl bg-[#FFF8F3] hover:bg-[#F3BC6F]/40 text-[#1A3460] border-2 border-[#1A3460]/15 transition cursor-pointer"
                      >
                        {isCopied ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="text-center p-2 rounded-xl bg-[#FFF8F3] text-[#1A3460]/60 text-xs font-bold">
                      Status Live (Tautan belum disematkan)
                    </div>
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
