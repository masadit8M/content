"use client";

import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Link as LinkIcon,
  Video,
  Layers,
} from "lucide-react";
import {
  MediaFile,
  detectMediaKind,
  fileLabel,
} from "@/lib/content-utils";
import { downloadAllMedia, downloadMediaFile } from "@/lib/upload-client";
import { useToast } from "./Toast";

interface MediaPreviewProps {
  files: MediaFile[];
  emptyLabel?: string;
  emptySubLabel?: string;
  badgeLabel?: string;
  heightClass?: string;
  downloadBaseName?: string;
  showDownloadBar?: boolean;
}

export function MediaPreview({
  files,
  emptyLabel = "Belum ada berkas media",
  emptySubLabel = "Berupa brief naskah / instruksi rekaman",
  badgeLabel,
  heightClass = "h-48",
  downloadBaseName = "aset-arjuna",
  showDownloadBar = true,
}: MediaPreviewProps) {
  const toast = useToast();
  const [index, setIndex] = useState(0);
  const [downloading, setDownloading] = useState(false);

  const safeIdx = files.length > 0 ? Math.min(index, files.length - 1) : 0;
  const current = files[safeIdx];

  if (!current) {
    return (
      <div
        className={`rounded-2xl border-2 border-dashed border-[#1A3460]/20 bg-[#FFF8F3] ${heightClass} flex flex-col items-center justify-center p-4 text-center space-y-1`}
      >
        <FileText className="w-7 h-7 text-[#1A3460]/30" />
        <div className="text-xs font-black text-[#1A3460]/70">{emptyLabel}</div>
        {emptySubLabel && (
          <div className="text-[11px] font-medium text-slate-400">
            {emptySubLabel}
          </div>
        )}
      </div>
    );
  }

  const kind = detectMediaKind(current);
  const downloadableFiles = files.filter((f) => detectMediaKind(f) !== "link");

  const handleDownloadCurrent = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (kind === "link") {
      window.open(current.url, "_blank", "noopener,noreferrer");
      return;
    }
    setDownloading(true);
    try {
      await downloadMediaFile(current, `${downloadBaseName}-${safeIdx + 1}`);
      toast(`Mengunduh ${fileLabel(current, safeIdx)}...`, { tone: "info" });
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadAll = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (downloadableFiles.length === 0) {
      window.open(current.url, "_blank", "noopener,noreferrer");
      return;
    }
    setDownloading(true);
    try {
      toast(`Mengunduh ${downloadableFiles.length} berkas...`, { tone: "info" });
      await downloadAllMedia(downloadableFiles, downloadBaseName);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <div
        className={`relative rounded-2xl overflow-hidden border-2 border-[#1A3460]/15 bg-[#122544] ${heightClass} flex items-center justify-center group`}
      >
        {kind === "video" ? (
          <video
            key={current.url}
            src={current.url}
            controls
            preload="metadata"
            onClick={(e) => e.stopPropagation()}
            className="w-full h-full object-contain bg-black"
          />
        ) : kind === "image" ? (
          <img
            src={current.url}
            alt={fileLabel(current, safeIdx)}
            className="w-full h-full object-cover bg-[#FFF8F3]"
          />
        ) : (
          <div className="w-full h-full bg-[#FFF8F3] p-4 flex flex-col items-center justify-center text-center space-y-2">
            <div className="w-11 h-11 rounded-2xl bg-[#1A3460] text-[#F3BC6F] flex items-center justify-center shadow-sm">
              <LinkIcon className="w-5 h-5" />
            </div>
            <div className="text-xs font-black text-[#1A3460] max-w-[240px] truncate">
              {fileLabel(current, safeIdx)}
            </div>
            <a
              href={current.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="px-3 py-1.5 rounded-xl bg-[#F35E50] hover:bg-[#e04b3d] text-white text-[11px] font-black inline-flex items-center gap-1 shadow-sm"
            >
              <span>Buka Tautan Aset</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {/* Badge kiri atas */}
        {badgeLabel && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-black/70 text-white text-[10px] font-black flex items-center gap-1 pointer-events-none">
            {kind === "video" ? (
              <Video className="w-3 h-3 text-[#F3BC6F]" />
            ) : kind === "image" ? (
              <ImageIcon className="w-3 h-3 text-[#F3BC6F]" />
            ) : (
              <LinkIcon className="w-3 h-3 text-[#F3BC6F]" />
            )}
            <span>{badgeLabel}</span>
          </div>
        )}

        {/* Indikator jumlah slide / klip */}
        {files.length > 1 && (
          <>
            <div className="absolute top-2 right-2 px-2 py-0.5 rounded-lg bg-black/75 text-[#F3BC6F] text-[10px] font-black flex items-center gap-1">
              <Layers className="w-3 h-3" />
              <span>
                {safeIdx + 1} / {files.length}
              </span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIndex((prev) => (prev - 1 + files.length) % files.length);
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/65 hover:bg-[#F35E50] text-white flex items-center justify-center transition cursor-pointer"
              aria-label="Berkas sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIndex((prev) => (prev + 1) % files.length);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/65 hover:bg-[#F35E50] text-white flex items-center justify-center transition cursor-pointer"
              aria-label="Berkas berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* Baris unduh cepat */}
      {showDownloadBar && (
        <div className="flex items-center justify-between gap-2 text-[11px] px-0.5">
          <span className="text-[#1A3460]/70 font-bold truncate">
            {fileLabel(current, safeIdx)}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            {kind === "link" ? (
              <a
                href={current.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FFF8F3] hover:bg-[#F3BC6F]/30 border border-[#1A3460]/20 text-[#1A3460] font-black cursor-pointer"
              >
                <ExternalLink className="w-3 h-3 text-[#F35E50]" />
                Buka Cloud
              </a>
            ) : (
              <button
                type="button"
                disabled={downloading}
                onClick={handleDownloadCurrent}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FFF8F3] hover:bg-[#F3BC6F]/30 border border-[#1A3460]/20 text-[#1A3460] font-black cursor-pointer disabled:opacity-50"
              >
                <Download className="w-3 h-3 text-[#F35E50]" />
                Unduh
              </button>
            )}

            {downloadableFiles.length > 1 && (
              <button
                type="button"
                disabled={downloading}
                onClick={handleDownloadAll}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1A3460] hover:bg-[#122544] text-[#F3BC6F] font-black cursor-pointer disabled:opacity-50"
              >
                <Download className="w-3 h-3" />
                Unduh Semua ({downloadableFiles.length})
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
