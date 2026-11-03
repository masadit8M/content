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
  Link as LinkIcon,
  HardDrive,
  FolderOpen,
  AlertCircle,
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
  label = "📸 Lampiran Foto / Video / Dokumen (Bahan Mentah)",
  helperText = "Upload foto & video langsung dari HP/Laptop (Cloud Storage) atau masukkan Link Google Drive / Canva.",
  value,
  fileName,
  fileType,
  fileSize,
  onChange,
  accept = "image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt",
  disabled = false,
}: FileUploadInputProps) {
  const [activeTab, setActiveTab] = useState<"file" | "link">("file");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadStatusText, setUploadStatusText] = useState<string>("");
  const [dragOver, setDragOver] = useState(false);
  const [manualUrl, setManualUrl] = useState(value || "");
  const [sizeWarning, setSizeWarning] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isImage = (url?: string, type?: string) => {
    if (type?.startsWith("image/")) return true;
    if (url?.startsWith("data:image/")) return true;
    return !!url?.match(/\.(jpeg|jpg|png|gif|webp|svg)(\?.*)?$/i);
  };

  const isVideo = (url?: string, type?: string) => {
    if (type?.startsWith("video/")) return true;
    if (url?.startsWith("data:video/")) return true;
    return !!url?.match(/\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i);
  };

  const isGoogleDrive = (url?: string) => {
    return !!url?.includes("drive.google.com");
  };

  const isCanva = (url?: string) => {
    return !!url?.includes("canva.com");
  };

  const uploadFile = async (file: File) => {
    setSizeWarning(null);
    setUploadProgress(0);
    const sizeInMB = file.size / (1024 * 1024);

    if (sizeInMB > 100) {
      setSizeWarning(
        `File ini berukuran ${sizeInMB.toFixed(1)} MB. Batas upload cloud langsung adalah 100 MB. Untuk footage video sangat besar, disarankan gunakan Tab 'Link Google Drive / Canva'.`
      );
    }

    try {
      setUploading(true);
      setUploadStatusText("Menyiapkan koneksi cloud storage...");

      let uploadSuccess = false;

      // 1. Prioritas Utama: Direct Signed Upload ke Supabase Storage (Bypass limit 4.5MB serverless)
      try {
        const signRes = await fetch("/api/upload/sign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            folder: "raw-materials",
          }),
        });

        if (signRes.ok) {
          const signData = await signRes.json();
          if (signData.signedUrl) {
            setUploadStatusText("Mengunggah berkas ke Cloud Storage...");
            await new Promise<void>((resolve, reject) => {
              const xhr = new XMLHttpRequest();
              xhr.open("PUT", signData.signedUrl);
              xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");

              xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) {
                  const percent = Math.round((e.loaded / e.total) * 100);
                  setUploadProgress(percent);
                  setUploadStatusText(`Mengunggah ke Cloud: ${percent}%`);
                }
              };

              xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                  uploadSuccess = true;
                  onChange({
                    url: signData.publicUrl,
                    fileName: file.name,
                    fileSize: file.size,
                    fileType: file.type,
                  });
                  setManualUrl(signData.publicUrl);
                  resolve();
                } else {
                  reject(new Error(`Direct upload status ${xhr.status}`));
                }
              };

              xhr.onerror = () => reject(new Error("Network error during cloud direct upload"));
              xhr.send(file);
            });
          }
        }
      } catch (cloudErr) {
        console.warn("Direct signed upload failed, attempting fallback:", cloudErr);
      }

      // 2. Fallback: Upload ke endpoint /api/upload
      if (!uploadSuccess) {
        setUploadStatusText("Mencoba upload via server fallback...");
        try {
          const formData = new FormData();
          formData.append("file", file);
          const res = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          if (res.ok) {
            const data = await res.json();
            if (data.url) {
              uploadSuccess = true;
              onChange({
                url: data.url,
                fileName: data.fileName || file.name,
                fileSize: data.fileSize || file.size,
                fileType: data.fileType || file.type,
              });
              setManualUrl(data.url);
            }
          }
        } catch (serverErr) {
          console.warn("Server upload failed:", serverErr);
        }
      }

      // 3. Fallback terakhir: jika file kecil (< 4MB), simpan sebagai Data URL browser
      if (!uploadSuccess) {
        if (sizeInMB <= 4) {
          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = reader.result as string;
            onChange({
              url: dataUrl,
              fileName: file.name,
              fileSize: file.size,
              fileType: file.type,
            });
            setManualUrl(dataUrl);
            setUploading(false);
          };
          reader.onerror = () => {
            alert("Gagal membaca file dari perangkat Anda. Silakan coba lagi atau gunakan Link Google Drive.");
            setUploading(false);
          };
          reader.readAsDataURL(file);
          return;
        } else {
          alert(`Gagal mengunggah file (${sizeInMB.toFixed(1)} MB) ke cloud. Silakan coba lagi atau gunakan Link Google Drive.`);
        }
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      alert("Terjadi kesalahan saat memproses file. Silakan gunakan opsi Link Google Drive.");
    } finally {
      setUploading(false);
      setUploadProgress(null);
      setUploadStatusText("");
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
    setSizeWarning(null);
    setUploadProgress(null);
    setUploadStatusText("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleManualUrlSubmit = (urlToUse?: string) => {
    const targetUrl = (urlToUse || manualUrl).trim();
    if (!targetUrl) {
      handleRemove();
      return;
    }

    let detectedName = "Lampiran Cloud";
    if (isGoogleDrive(targetUrl)) {
      detectedName = "Google Drive (Folder/File Footage Mentah)";
    } else if (isCanva(targetUrl)) {
      detectedName = "Canva Project Link (Desain Mentah)";
    } else {
      detectedName = targetUrl.split("/").pop() || "Lampiran URL";
    }

    onChange({
      url: targetUrl,
      fileName: detectedName,
    });
    setManualUrl(targetUrl);
  };

  return (
    <div className="space-y-3 p-3.5 sm:p-4 rounded-2xl border-2 border-[#1A3460]/15 bg-[#FFF8F3]">
      <div className="flex items-center justify-between">
        <label className="block text-xs sm:text-sm font-black text-[#1A3460]">
          {label}
        </label>
        {value && (
          <button
            type="button"
            onClick={handleRemove}
            className="text-xs font-black text-rose-600 hover:text-rose-800 flex items-center gap-1 transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Hapus Lampiran
          </button>
        )}
      </div>

      {/* Mode Selector Tabs (Upload File vs Link Cloud) */}
      {!value && (
        <div className="flex items-center gap-1.5 p-1 bg-white border border-[#1A3460]/15 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab("file")}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === "file"
                ? "bg-[#1A3460] text-white shadow-sm"
                : "text-[#1A3460]/70 hover:text-[#1A3460] hover:bg-[#FFF8F3]"
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Upload File Langsung</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("link")}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === "link"
                ? "bg-[#F35E50] text-white shadow-sm"
                : "text-[#1A3460]/70 hover:text-[#1A3460] hover:bg-[#FFF8F3]"
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Link Google Drive / Cloud</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#F3BC6F] text-[#1A3460] font-black uppercase">
              Besar
            </span>
          </button>
        </div>
      )}

      {/* TAB 1: UPLOAD FILE LANGSUNG */}
      {!value && activeTab === "file" && (
        <div className="space-y-2">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-5 text-center transition cursor-pointer ${
              dragOver
                ? "border-[#F35E50] bg-rose-50"
                : "border-[#1A3460]/30 hover:border-[#F35E50] bg-white shadow-xs"
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

            <div className="flex flex-col items-center justify-center gap-2.5 py-1">
              {uploading ? (
                <div className="flex flex-col items-center gap-2 w-full max-w-xs">
                  <div className="w-11 h-11 rounded-2xl bg-[#FFF8F3] border-2 border-emerald-500 text-emerald-600 flex items-center justify-center shadow-xs">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                  <p className="text-xs sm:text-sm font-black text-[#1A3460]">
                    {uploadStatusText || "Mengunggah berkas ke Cloud..."}
                  </p>
                  {uploadProgress !== null && (
                    <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden shadow-inner mt-1">
                      <div
                        className="bg-emerald-500 h-2.5 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  )}
                  <span className="text-[10px] text-slate-500 font-bold">
                    Mohon tunggu hingga upload selesai (langsung ke Cloud Storage)
                  </span>
                </div>
              ) : (
                <>
                  <div className="w-11 h-11 rounded-2xl bg-[#FFF8F3] border-2 border-[#F3BC6F] text-[#F35E50] flex items-center justify-center shadow-xs">
                    <UploadCloud className="w-6 h-6" />
                  </div>

                  <div>
                    <p className="text-xs sm:text-sm font-black text-[#1A3460]">
                      Klik untuk pilih foto / video dari HP / PC atau seret ke sini
                    </p>
                    <p className="text-[11px] text-[#1A3460]/60 mt-1 font-semibold">
                      Mendukung Foto (JPG, PNG, WebP) & Video (MP4, MOV, WebM) hingga 100MB
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Size Warning / Recommendation Alert */}
          {sizeWarning && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-medium space-y-1.5 animate-in fade-in">
              <div className="flex items-start gap-1.5 font-bold">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>Peringatan Ukuran File:</span>
              </div>
              <p className="text-[11px] leading-relaxed">{sizeWarning}</p>
              <button
                type="button"
                onClick={() => setActiveTab("link")}
                className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-black text-[11px] flex items-center gap-1 transition cursor-pointer"
              >
                <HardDrive className="w-3.5 h-3.5" />
                Gunakan Link Google Drive Sekarang
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: LINK GOOGLE DRIVE / CANVA / CLOUD */}
      {!value && activeTab === "link" && (
        <div className="space-y-3 bg-white border border-[#1A3460]/20 rounded-2xl p-4">
          <div>
            <label className="block text-xs font-black text-[#1A3460] mb-1">
              Tautan File / Folder Cloud (Google Drive / Canva / Dropbox / iCloud)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={manualUrl}
                onChange={(e) => setManualUrl(e.target.value)}
                placeholder="https://drive.google.com/... atau https://canva.com/..."
                className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-[#FFF8F3] border-2 border-[#1A3460]/20 text-[#1A3460] placeholder-slate-400 focus:outline-none focus:border-[#F35E50] font-bold"
              />
              <button
                type="button"
                onClick={() => handleManualUrlSubmit()}
                disabled={!manualUrl.trim()}
                className="px-4 py-2 bg-[#F35E50] hover:bg-[#e04b3d] text-white rounded-xl text-xs font-black transition disabled:opacity-50 cursor-pointer shadow-sm shrink-0"
              >
                Simpan Link
              </button>
            </div>
          </div>

          {/* Quick preset tips */}
          <div className="pt-2 border-t border-slate-100">
            <p className="text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1.5">
              💡 Rekomendasi Format Tim Marketing:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600">
              <div className="p-2 rounded-lg bg-[#FFF8F3] border border-[#F3BC6F]/40 flex items-start gap-2">
                <FolderOpen className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[#1A3460]">Google Drive:</span> Buat 1 folder bahan mentah di Drive PAUD Arjuna, pastikan akses "Siapa saja yang memiliki link dapat melihat".
                </div>
              </div>
              <div className="p-2 rounded-lg bg-[#FFF8F3] border border-[#F3BC6F]/40 flex items-start gap-2">
                <ExternalLink className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[#1A3460]">Canva / YouTube:</span> Masukkan link template Canva atau unlisted YouTube untuk review video panjang.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAMPILAN PREVIEW JIKA FILE / LINK SUDAH TERLAMPIR */}
      {value && (
        <div className="bg-white rounded-2xl border-2 border-[#1A3460] p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md animate-in fade-in">
          <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
            {/* Thumbnail / Icon */}
            <div className="w-14 h-14 rounded-xl bg-[#FFF8F3] border-2 border-[#F3BC6F] flex items-center justify-center overflow-hidden shrink-0">
              {isImage(value, fileType) ? (
                <img
                  src={value}
                  alt={fileName || "Lampiran"}
                  className="w-full h-full object-cover"
                />
              ) : isVideo(value, fileType) ? (
                <Video className="w-7 h-7 text-[#F35E50]" />
              ) : isGoogleDrive(value) ? (
                <HardDrive className="w-7 h-7 text-emerald-600" />
              ) : isCanva(value) ? (
                <ExternalLink className="w-7 h-7 text-indigo-600" />
              ) : (
                <FileIcon className="w-7 h-7 text-[#1A3460]" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-xs sm:text-sm font-black text-[#1A3460] truncate block">
                  {fileName || (isGoogleDrive(value) ? "Folder Google Drive Terlampir" : "Berkas Terlampir")}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5 font-bold">
                <span className="text-[#F35E50] uppercase tracking-wider">
                  {isGoogleDrive(value)
                    ? "Link Google Drive"
                    : isCanva(value)
                    ? "Link Canva"
                    : isVideo(value, fileType)
                    ? "Video Footage"
                    : isImage(value, fileType)
                    ? "Foto / Gambar"
                    : "Dokumen / Tautan"}
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

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-[#1A3460] hover:bg-[#122544] text-white text-xs font-black transition inline-flex items-center gap-1.5 shadow-sm"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#F3BC6F]" />
              Buka / Lihat
            </a>
            <button
              type="button"
              onClick={handleRemove}
              className="px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 text-xs font-black transition cursor-pointer"
            >
              Ganti File
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
