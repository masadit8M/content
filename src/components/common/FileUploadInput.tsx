"use client";

import React, { useState, useRef } from "react";
import {
  UploadCloud,
  FileText,
  Image as ImageIcon,
  Video,
  FileSpreadsheet,
  File as FileIcon,
  Trash2,
  CheckCircle2,
  ExternalLink,
  Loader2,
} from "lucide-react";

export interface UploadedFile {
  url: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
}

interface FileUploadInputProps {
  label?: string;
  helperText?: string;
  value?: string; // URL
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  onChange: (file: UploadedFile | null) => void;
  accept?: string;
  disabled?: boolean;
}

export function FileUploadInput({
  label = "📸 Lampiran Foto / Video / Dokumen (Opsional)",
  helperText = "Bisa upload foto bukti lapangan, video SOP, dokumen PDF, atau Excel pendukung. Maks 50MB.",
  value,
  fileName,
  fileType,
  fileSize,
  onChange,
  accept = "image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt",
  disabled = false,
}: FileUploadInputProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [manualUrl, setManualUrl] = useState(value || "");
  const [showManualInput, setShowManualInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isImage = (url?: string, type?: string) => {
    if (type?.startsWith("image/")) return true;
    return !!url?.match(/\.(jpeg|jpg|png|gif|webp|svg)(\?.*)?$/i);
  };

  const isVideo = (url?: string, type?: string) => {
    if (type?.startsWith("video/")) return true;
    return !!url?.match(/\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i);
  };

  const isPdf = (url?: string, type?: string) => {
    if (type?.includes("pdf")) return true;
    return !!url?.match(/\.pdf(\?.*)?$/i);
  };

  const isSpreadsheet = (url?: string, type?: string) => {
    return (
      type?.includes("spreadsheet") ||
      type?.includes("excel") ||
      !!url?.match(/\.(xls|xlsx|csv)(\?.*)?$/i)
    );
  };

  const uploadFile = async (file: File) => {
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        onChange({
          url: data.url,
          fileName: data.fileName || file.name,
          fileSize: data.fileSize || file.size,
          fileType: data.fileType || file.type,
        });
        setManualUrl(data.url);
      } else {
        alert(data.error || "Gagal mengunggah file. Silakan coba lagi.");
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Terjadi kesalahan teknis saat mengunggah file.");
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled || uploading) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  const handleRemove = () => {
    onChange(null);
    setManualUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleManualUrlSubmit = () => {
    if (!manualUrl.trim()) {
      handleRemove();
      return;
    }
    const cleanUrl = manualUrl.trim();
    const guessedName = cleanUrl.split("/").pop() || "Lampiran URL";
    onChange({
      url: cleanUrl,
      fileName: guessedName,
    });
  };

  return (
    <div className="space-y-2 p-3.5 sm:p-4 rounded-xl border border-slate-200 bg-slate-50/80">
      <div className="flex items-center justify-between">
        <label className="block text-xs sm:text-sm font-bold text-slate-800">
          {label}
        </label>
        {value && (
          <button
            type="button"
            onClick={handleRemove}
            className="text-xs font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Hapus File
          </button>
        )}
      </div>

      {!value ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-4 sm:p-5 text-center transition cursor-pointer ${
            dragOver
              ? "border-emerald-500 bg-emerald-50/40"
              : "border-slate-300 hover:border-slate-400 bg-white"
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            disabled={disabled || uploading}
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center gap-2">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              {uploading ? (
                <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
              ) : (
                <UploadCloud className="w-5 h-5" />
              )}
            </div>

            <div>
              <p className="text-xs sm:text-sm font-bold text-slate-800">
                {uploading
                  ? "Sedang mengunggah berkas..."
                  : "Klik untuk pilih foto / video / dokumen atau drag ke sini"}
              </p>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                {helperText}
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Preview of the attached file */
        <div className="bg-white rounded-xl border border-slate-200 p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
            {/* Icon / Thumbnail */}
            <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
              {isImage(value, fileType) ? (
                <img
                  src={value}
                  alt={fileName || "Lampiran"}
                  className="w-full h-full object-cover"
                />
              ) : isVideo(value, fileType) ? (
                <Video className="w-6 h-6 text-indigo-600" />
              ) : isPdf(value, fileType) ? (
                <FileText className="w-6 h-6 text-rose-600" />
              ) : isSpreadsheet(value, fileType) ? (
                <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
              ) : (
                <FileIcon className="w-6 h-6 text-slate-600" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="text-xs sm:text-sm font-bold text-slate-900 truncate block">
                  {fileName || value.split("/").pop() || "Berkas Terlampir"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                <span className="font-semibold uppercase tracking-wider text-slate-400">
                  {isVideo(value, fileType)
                    ? "Video"
                    : isImage(value, fileType)
                    ? "Foto / Gambar"
                    : isPdf(value, fileType)
                    ? "Dokumen PDF"
                    : "Dokumen"}
                </span>
                {fileSize ? (
                  <>
                    <span>·</span>
                    <span>{formatFileSize(fileSize)}</span>
                  </>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition inline-flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Lihat File
            </a>
            <button
              type="button"
              onClick={handleRemove}
              className="px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 text-xs font-bold transition"
            >
              Ganti
            </button>
          </div>
        </div>
      )}

      {/* Manual URL toggle if needed */}
      {!value && (
        <div className="pt-1">
          {!showManualInput ? (
            <button
              type="button"
              onClick={() => setShowManualInput(true)}
              className="text-[11px] text-slate-500 hover:text-slate-800 underline transition"
            >
              + Atau masukkan tautan URL file langsung (Google Drive / Link CDN)
            </button>
          ) : (
            <div className="flex items-center gap-2 mt-1">
              <input
                type="text"
                placeholder="https://drive.google.com/... atau /uploads/..."
                value={manualUrl}
                onChange={(e) => setManualUrl(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none"
              />
              <button
                type="button"
                onClick={handleManualUrlSubmit}
                className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold shrink-0"
              >
                Gunakan URL
              </button>
              <button
                type="button"
                onClick={() => setShowManualInput(false)}
                className="text-xs text-slate-400 hover:text-slate-600 px-1"
              >
                Batal
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
