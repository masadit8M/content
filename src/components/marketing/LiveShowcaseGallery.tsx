"use client";

import React, { useState } from "react";
import { getPlatformBadge } from "@/lib/platformUtils";
import { MediaPreview } from "@/components/common/MediaPreview";
import {
  getStage,
  getPrimaryFiles,
  getFormatMeta,
  formatDateID,
} from "@/lib/content-utils";
import { getThemeText } from "@/lib/marketing-plan";
import { copyText } from "@/lib/clipboard";
import { useToast } from "@/components/common/Toast";
import {
  Flame,
  Copy,
  Check,
  Clock,
  ArrowUpRight,
} from "lucide-react";

interface ShowcaseProps {
  contents: any[];
  onSelectContent: (content: any) => void;
}

export function LiveShowcaseGallery({
  contents,
  onSelectContent,
}: ShowcaseProps) {
  const toast = useToast();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const liveContents = contents.filter((c) => getStage(c) === "LIVE");

  const handleCopyLink = async (
    id: string,
    url: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    const ok = await copyText(url);
    if (ok) {
      setCopiedId(id);
      toast("Tautan postingan live disalin!");
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#1A3460] border-2 border-[#F3BC6F] rounded-3xl p-5 sm:p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 text-white">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F35E50] text-white text-xs font-black">
            <Flame className="w-4 h-4 text-[#F3BC6F]" />
            Tab 4 • Arsip Konten Tayang (Live)
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Galeri Konten Resmi yang Sudah Terbit
          </h2>
          <p className="text-xs sm:text-sm text-white/80 max-w-2xl leading-relaxed font-medium">
            Dokumentasi seluruh konten PAUD Arjuna Malang yang sudah tayang di Instagram, TikTok, Facebook, & YouTube beserta arsip file dan tautan aslinya.
          </p>
        </div>

        <div className="px-5 py-3 rounded-2xl bg-white/10 border border-[#F3BC6F]/40 text-center shrink-0">
          <div className="text-2xl sm:text-3xl font-black text-[#F3BC6F]">
            {liveContents.length}
          </div>
          <div className="text-[10px] font-black text-white/80 uppercase tracking-wider">
            Konten Tayang
          </div>
        </div>
      </div>

      {/* Grid of Live Cards */}
      {liveContents.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-[#1A3460]/20 rounded-3xl p-12 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[#FFF8F3] border border-[#F3BC6F] flex items-center justify-center text-[#F35E50] mx-auto">
            <Flame className="w-7 h-7" />
          </div>
          <h3 className="text-base font-black text-[#1A3460]">
            Belum Ada Konten di Arsip Tayang
          </h3>
          <p className="text-xs text-[#1A3460]/70 font-medium max-w-md mx-auto">
            Konten yang ditandai tayang dari <strong>Tab 3 (Bank Siap Upload)</strong> otomatis tercatat rapi di galeri ini.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {liveContents.map((item) => {
            const platformInfo = getPlatformBadge(item.platform);
            const formatMeta = getFormatMeta(item.contentType);
            const files = getPrimaryFiles(item);
            const themeText = getThemeText(item.themeId, item.themeLabel);
            const isCopied = copiedId === item.id;
            const publishedDate =
              formatDateID(item.publishedAt || item.updatedAt) || "Tayang";

            return (
              <div
                key={item.id}
                onClick={() => onSelectContent(item)}
                className="bg-white hover:bg-[#FFF8F3]/60 border-2 border-[#1A3460] rounded-3xl p-5 shadow-md hover:shadow-xl cursor-pointer transition flex flex-col justify-between gap-4 relative overflow-hidden"
              >
                <div className="space-y-3">
                  {/* Top Bar */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-black border ${platformInfo.className}`}
                      >
                        {platformInfo.icon}
                        {platformInfo.label}
                      </span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-[#FFF8F3] border border-[#1A3460]/15 text-[#1A3460]">
                        {formatMeta.code ? `[${formatMeta.code}] ` : ""}
                        {formatMeta.label}
                      </span>
                    </div>

                    <span className="text-[11px] text-[#1A3460]/60 flex items-center gap-1 font-bold">
                      <Clock className="w-3 h-3" />
                      {publishedDate}
                    </span>
                  </div>

                  {themeText && (
                    <span className="inline-block text-[11px] font-black px-2.5 py-0.5 rounded-lg bg-[#F3BC6F]/30 text-[#1A3460] border border-[#F3BC6F]">
                      📅 {themeText}
                    </span>
                  )}

                  {files.length > 0 && (
                    <MediaPreview
                      files={files}
                      badgeLabel="Tayang"
                      heightClass="h-44"
                      downloadBaseName={`arsip-${item.id.slice(-5)}`}
                      showDownloadBar={false}
                    />
                  )}

                  <h3 className="text-sm sm:text-base font-black text-[#1A3460] hover:text-[#F35E50] transition line-clamp-2 leading-snug">
                    {item.title}
                  </h3>

                  {(item.caption || item.description) && (
                    <p className="text-xs text-[#1A3460]/75 line-clamp-2 leading-relaxed font-medium">
                      {item.caption || item.description}
                    </p>
                  )}
                </div>

                {/* Footer Live Link */}
                <div className="pt-3 border-t border-[#1A3460]/10 space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-[#1A3460]/70 font-bold">
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={
                          (item.assignedTo || item.createdBy)?.avatar ||
                          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150"
                        }
                        alt=""
                        className="w-6 h-6 rounded-full object-cover border border-[#F3BC6F] shrink-0"
                      />
                      <span className="truncate">
                        Tim:{" "}
                        <strong className="text-[#1A3460] font-black">
                          {(item.assignedTo || item.createdBy)?.name || "Arjuna"}
                        </strong>
                      </span>
                    </div>

                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-black shrink-0">
                      ● LIVE
                    </span>
                  </div>

                  {item.liveUrl ? (
                    <div className="flex items-center gap-2">
                      <a
                        href={item.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className={`flex-1 py-2 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition shadow-sm ${platformInfo.btnColor}`}
                      >
                        <span>Buka Postingan Live</span>
                        <ArrowUpRight className="w-4 h-4 shrink-0" />
                      </a>

                      <button
                        type="button"
                        onClick={(e) =>
                          handleCopyLink(item.id, item.liveUrl, e)
                        }
                        title="Salin tautan postingan"
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
                      Klik kartu untuk menempelkan tautan live
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
