"use client";

import React, { useState } from "react";
import {
  FileText,
  Image as ImageIcon,
  Video,
  FileSpreadsheet,
  File as FileIcon,
  ExternalLink,
  Download,
  Eye,
  X,
  Paperclip,
} from "lucide-react";

export interface AttachmentItem {
  id?: string;
  url: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
}

interface AttachmentDisplayProps {
  attachments?: AttachmentItem[];
  // Or simple single url prop
  url?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  title?: string;
  compact?: boolean;
}

export function AttachmentDisplay({
  attachments,
  url,
  fileName,
  fileSize,
  fileType,
  title = "Lampiran Foto / Video / Dokumen:",
  compact = false,
}: AttachmentDisplayProps) {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [lightboxType, setLightboxType] = useState<"image" | "video" | null>(null);

  // Unify items
  const items: AttachmentItem[] = attachments && attachments.length > 0
    ? attachments
    : url
    ? [{ url, fileName, fileSize, fileType }]
    : [];

  if (items.length === 0) return null;

  const isImage = (itemUrl: string, type?: string) => {
    if (type?.startsWith("image/")) return true;
    return !!itemUrl.match(/\.(jpeg|jpg|png|gif|webp|svg)(\?.*)?$/i);
  };

  const isVideo = (itemUrl: string, type?: string) => {
    if (type?.startsWith("video/")) return true;
    return !!itemUrl.match(/\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i);
  };

  const isPdf = (itemUrl: string, type?: string) => {
    if (type?.includes("pdf")) return true;
    return !!itemUrl.match(/\.pdf(\?.*)?$/i);
  };

  const isSpreadsheet = (itemUrl: string, type?: string) => {
    return (
      type?.includes("spreadsheet") ||
      type?.includes("excel") ||
      !!itemUrl.match(/\.(xls|xlsx|csv)(\?.*)?$/i)
    );
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <>
      <div className="space-y-2">
        {!compact && (
          <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5 uppercase tracking-wider">
            <Paperclip className="w-3.5 h-3.5 text-emerald-600" />
            {title}
          </span>
        )}

        <div className="flex flex-wrap gap-3">
          {items.map((item, idx) => {
            const itemIsImage = isImage(item.url, item.fileType);
            const itemIsVideo = isVideo(item.url, item.fileType);
            const itemIsPdf = isPdf(item.url, item.fileType);
            const itemIsSheet = isSpreadsheet(item.url, item.fileType);

            if (itemIsImage) {
              return (
                <div
                  key={item.id || idx}
                  className="group relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 hover:border-emerald-400 transition cursor-pointer shadow-xs max-w-xs"
                  onClick={() => {
                    setLightboxUrl(item.url);
                    setLightboxType("image");
                  }}
                >
                  <img
                    src={item.url}
                    alt={item.fileName || "Lampiran"}
                    className="w-full h-36 sm:h-44 object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition p-2.5 flex flex-col justify-between">
                    <span className="self-end px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-bold flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      Perbesar
                    </span>
                    <div className="text-white">
                      <p className="text-xs font-bold truncate">
                        {item.fileName || item.url.split("/").pop()}
                      </p>
                      {item.fileSize ? (
                        <p className="text-[10px] text-slate-300">
                          {formatFileSize(item.fileSize)}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            }

            if (itemIsVideo) {
              return (
                <div
                  key={item.id || idx}
                  className="rounded-xl overflow-hidden border border-slate-200 bg-slate-900 shadow-xs max-w-sm w-full"
                >
                  <div className="p-2 bg-slate-800 text-white flex items-center justify-between text-xs font-bold">
                    <span className="flex items-center gap-1.5 truncate">
                      <Video className="w-4 h-4 text-emerald-400 shrink-0" />
                      {item.fileName || "Lampiran Video"}
                    </span>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-emerald-300 hover:underline flex items-center gap-1"
                    >
                      Buka <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <video
                    src={item.url}
                    controls
                    className="w-full max-h-56 bg-black object-contain"
                  />
                </div>
              );
            }

            // Documents (PDF, Excel, Word, etc.)
            return (
              <div
                key={item.id || idx}
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 shadow-xs transition max-w-md w-full"
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    itemIsPdf
                      ? "bg-rose-50 text-rose-600 border border-rose-100"
                      : itemIsSheet
                      ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                      : "bg-blue-50 text-blue-600 border border-blue-100"
                  }`}
                >
                  {itemIsPdf ? (
                    <FileText className="w-5 h-5" />
                  ) : itemIsSheet ? (
                    <FileSpreadsheet className="w-5 h-5" />
                  ) : (
                    <FileIcon className="w-5 h-5" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                    {item.fileName || item.url.split("/").pop()}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                    <span className="font-semibold uppercase text-slate-400">
                      {itemIsPdf ? "PDF" : itemIsSheet ? "Excel" : "Dokumen"}
                    </span>
                    {item.fileSize ? (
                      <>
                        <span>·</span>
                        <span>{formatFileSize(item.fileSize)}</span>
                      </>
                    ) : null}
                  </p>
                </div>

                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition shrink-0"
                  title="Unduh / Buka Dokumen"
                >
                  <Download className="w-4 h-4" />
                </a>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in"
          onClick={() => setLightboxUrl(null)}
        >
          <div
            className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setLightboxUrl(null)}
              className="absolute -top-12 right-0 p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition"
            >
              <X className="w-6 h-6" />
            </button>

            {lightboxType === "image" ? (
              <img
                src={lightboxUrl}
                alt="Pratinjau Gambar"
                className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl border border-white/10"
              />
            ) : (
              <video
                src={lightboxUrl}
                controls
                autoPlay
                className="max-h-[85vh] max-w-full rounded-2xl shadow-2xl bg-black"
              />
            )}

            <div className="mt-3 flex items-center gap-3">
              <a
                href={lightboxUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold backdrop-blur-md transition flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Buka di Tab Baru
              </a>
              <a
                href={lightboxUrl}
                download
                className="px-4 py-2 rounded-xl bg-white text-slate-900 text-xs font-bold transition flex items-center gap-1.5 shadow-md hover:bg-slate-100"
              >
                <Download className="w-3.5 h-3.5" />
                Unduh Berkas
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
