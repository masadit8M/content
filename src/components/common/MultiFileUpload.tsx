"use client";

import React, { useRef, useState } from "react";
import {
  UploadCloud,
  Link as LinkIcon,
  X,
  Video,
  Image as ImageIcon,
  FileText,
  ArrowUp,
  ArrowDown,
  Loader2,
  Plus,
} from "lucide-react";
import {
  MediaFile,
  detectMediaKind,
  fileLabel,
  formatBytes,
} from "@/lib/content-utils";
import { uploadMediaFile } from "@/lib/upload-client";

interface MultiFileUploadProps {
  label: string;
  helperText?: string;
  files: MediaFile[];
  onChange: (next: MediaFile[]) => void;
  accept?: string;
  maxFiles?: number;
}

export function MultiFileUpload({
  label,
  helperText,
  files,
  onChange,
  accept = "image/*,video/*",
  maxFiles = 12,
}: MultiFileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"file" | "link">("file");
  const [uploading, setUploading] = useState(false);
  const [progressText, setProgressText] = useState("");
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const [linkUrl, setLinkUrl] = useState("");
  const [linkName, setLinkName] = useState("");

  const handleSelectedFiles = async (selected: FileList | null) => {
    if (!selected || selected.length === 0) return;
    const list = Array.from(selected);

    if (files.length + list.length > maxFiles) {
      setError(`Maksimal ${maxFiles} berkas per konten.`);
      return;
    }

    setError("");
    setUploading(true);
    const uploaded: MediaFile[] = [];

    try {
      for (let i = 0; i < list.length; i++) {
        const f = list[i];
        setProgressText(
          `Mengunggah (${i + 1}/${list.length}) ${f.name}...`
        );
        const result = await uploadMediaFile(f, (_pct, status) => {
          setProgressText(`(${i + 1}/${list.length}) ${f.name} — ${status}`);
        });
        uploaded.push(result);
      }
      onChange([...files, ...uploaded]);
    } catch (err: any) {
      if (uploaded.length > 0) {
        onChange([...files, ...uploaded]);
      }
      setError(err?.message || "Gagal mengunggah berkas.");
    } finally {
      setUploading(false);
      setProgressText("");
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleAddLink = () => {
    const trimmed = linkUrl.trim();
    if (!trimmed) return;
    if (!/^https?:\/\//i.test(trimmed)) {
      setError("Tautan harus diawali https:// atau http://");
      return;
    }
    setError("");
    const inferredName =
      linkName.trim() ||
      (trimmed.includes("canva.com")
        ? "Desain Canva"
        : trimmed.includes("drive.google.com")
        ? "Folder / File Google Drive"
        : "Tautan Aset Cloud");

    onChange([
      ...files,
      {
        url: trimmed,
        name: inferredName,
        type: "link",
      },
    ]);
    setLinkUrl("");
    setLinkName("");
  };

  const removeAt = (idx: number) => {
    onChange(files.filter((_, i) => i !== idx));
  };

  const moveAt = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= files.length) return;
    const copy = [...files];
    const [picked] = copy.splice(idx, 1);
    copy.splice(target, 0, picked);
    onChange(copy);
  };

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-xs font-black text-[#1A3460]">{label}</label>
        <div className="inline-flex rounded-xl bg-white border border-[#1A3460]/15 p-0.5 text-[11px] font-bold">
          <button
            type="button"
            onClick={() => setMode("file")}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition cursor-pointer ${
              mode === "file"
                ? "bg-[#1A3460] text-[#F3BC6F] font-black"
                : "text-[#1A3460]/70 hover:text-[#1A3460]"
            }`}
          >
            <UploadCloud className="w-3 h-3" />
            Unggah File
          </button>
          <button
            type="button"
            onClick={() => setMode("link")}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition cursor-pointer ${
              mode === "link"
                ? "bg-[#1A3460] text-[#F3BC6F] font-black"
                : "text-[#1A3460]/70 hover:text-[#1A3460]"
            }`}
          >
            <LinkIcon className="w-3 h-3" />
            Tautan Drive / Canva
          </button>
        </div>
      </div>

      {helperText && (
        <p className="text-[11px] text-[#1A3460]/70 font-medium leading-relaxed">
          {helperText}
        </p>
      )}

      {mode === "file" ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            handleSelectedFiles(e.dataTransfer.files);
          }}
          onClick={() => !uploading && inputRef.current?.click()}
          className={`rounded-2xl border-2 border-dashed p-4 text-center transition cursor-pointer ${
            dragActive
              ? "border-[#F35E50] bg-[#F35E50]/5"
              : "border-[#1A3460]/25 bg-white hover:border-[#F35E50]"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={accept}
            onChange={(e) => handleSelectedFiles(e.target.files)}
            className="hidden"
          />

          {uploading ? (
            <div className="py-2 flex flex-col items-center gap-1.5 text-[#1A3460]">
              <Loader2 className="w-6 h-6 text-[#F35E50] animate-spin" />
              <span className="text-xs font-black">{progressText}</span>
            </div>
          ) : (
            <div className="space-y-1">
              <UploadCloud className="w-7 h-7 text-[#F35E50] mx-auto" />
              <div className="text-xs font-black text-[#1A3460]">
                Klik atau seret foto/video ke sini (bisa pilih banyak sekaligus)
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                Mendukung MP4, MOV, JPG, PNG, WebP • Maks {maxFiles} berkas (cocok untuk slide Carousel atau beberapa klip mentah)
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-[#1A3460]/15 bg-white p-3 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://drive.google.com/... atau https://www.canva.com/..."
              className="sm:col-span-2 px-3 py-2 text-xs rounded-xl bg-[#FFF8F3] border border-[#1A3460]/20 text-[#1A3460] font-medium focus:outline-none focus:border-[#F35E50]"
            />
            <input
              type="text"
              value={linkName}
              onChange={(e) => setLinkName(e.target.value)}
              placeholder="Label (opsional, mis. Folder Mentah)"
              className="px-3 py-2 text-xs rounded-xl bg-[#FFF8F3] border border-[#1A3460]/20 text-[#1A3460] font-medium focus:outline-none focus:border-[#F35E50]"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleAddLink}
              disabled={!linkUrl.trim()}
              className="px-3 py-1.5 rounded-xl bg-[#1A3460] hover:bg-[#122544] text-[#F3BC6F] text-xs font-black inline-flex items-center gap-1 disabled:opacity-40 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambahkan Tautan
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
          {error}
        </div>
      )}

      {/* Daftar berkas terlampir */}
      {files.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <div className="text-[11px] font-black text-[#1A3460]/70">
            Berkas Terlampir ({files.length}):
          </div>
          <div className="space-y-1.5">
            {files.map((f, idx) => {
              const kind = detectMediaKind(f);
              const Icon =
                kind === "video"
                  ? Video
                  : kind === "image"
                  ? ImageIcon
                  : kind === "link"
                  ? LinkIcon
                  : FileText;
              const sizeStr = formatBytes(f.size);

              return (
                <div
                  key={`${f.url}-${idx}`}
                  className="flex items-center gap-2.5 p-2 rounded-xl bg-white border border-[#1A3460]/15 text-xs"
                >
                  {kind === "image" ? (
                    <img
                      src={f.url}
                      alt={fileLabel(f, idx)}
                      className="w-9 h-9 rounded-lg object-cover border border-[#F3BC6F] shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-[#FFF8F3] border border-[#F3BC6F] flex items-center justify-center shrink-0 text-[#F35E50]">
                      <Icon className="w-4 h-4" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[#1A3460] truncate">
                      {files.length > 1 ? `${idx + 1}. ` : ""}
                      {fileLabel(f, idx)}
                    </div>
                    <div className="text-[10px] text-slate-500 font-semibold">
                      {kind === "video"
                        ? "Video"
                        : kind === "image"
                        ? "Gambar / Slide"
                        : kind === "link"
                        ? "Tautan Cloud"
                        : "Berkas"}
                      {sizeStr ? ` • ${sizeStr}` : ""}
                    </div>
                  </div>

                  {files.length > 1 && (
                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => moveAt(idx, -1)}
                        disabled={idx === 0}
                        title="Geser naik"
                        className="p-1 rounded hover:bg-[#FFF8F3] text-[#1A3460]/60 disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveAt(idx, 1)}
                        disabled={idx === files.length - 1}
                        title="Geser turun"
                        className="p-1 rounded hover:bg-[#FFF8F3] text-[#1A3460]/60 disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => removeAt(idx)}
                    title="Hapus berkas"
                    className="p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
