"use client";

import React, { useEffect, useState } from "react";
import {
  Camera,
  Video,
  Plus,
  Search,
  Calendar,
  User,
  Download,
  Trash2,
  X,
  Eye,
  Tag,
  Sparkles,
  Globe,
  Users,
  Lock,
  CheckCircle2,
} from "lucide-react";
import { formatDateIndo } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const CATEGORY_OPTIONS = [
  { value: "", label: "Semua Kategori" },
  { value: "SOP", label: "Penerapan SOP & Standarisasi" },
  { value: "FACILITY", label: "Fasilitas & Sanitasi" },
  { value: "CHILD_ACTIVITY", label: "Kegiatan & Pengasuhan Anak" },
  { value: "TRAINING", label: "Pelatihan & Briefing Guru" },
  { value: "OPERATIONAL", label: "Operasional Umum" },
];

const RECIPIENT_FILTER_OPTIONS = [
  { value: "ALL", label: "Semua Media (Semua Penerima)" },
  { value: "FOR_ME", label: "Khusus Ditujukan ke Saya" },
  { value: "BY_ME", label: "Diunggah oleh Saya" },
];

const MONTH_OPTIONS = [
  { value: "", label: "Semua Periode (12 Bulan)" },
  { value: "2026-09", label: "September 2026" },
  { value: "2026-10", label: "Oktober 2026" },
  { value: "2026-11", label: "November 2026" },
  { value: "2026-12", label: "Desember 2026" },
  { value: "2027-01", label: "Januari 2027" },
  { value: "2027-02", label: "Februari 2027" },
  { value: "2027-03", label: "Maret 2027" },
  { value: "2027-04", label: "April 2027" },
  { value: "2027-05", label: "Mei 2027" },
  { value: "2027-06", label: "Juni 2027" },
  { value: "2027-07", label: "Juli 2027" },
  { value: "2027-08", label: "Agustus 2027" },
  { value: "2027-09", label: "September 2027" },
];

export default function MediaPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const [mediaItems, setMediaItems] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [recipientFilter, setRecipientFilter] = useState("ALL");

  // Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("SOP");
  const [targetType, setTargetType] = useState<"ALL" | "SPECIFIC">("ALL");
  const [targetUserIds, setTargetUserIds] = useState<string[]>([]);

  // Lightbox View State
  const [viewingMedia, setViewingMedia] = useState<any>(null);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (search) query.set("search", search);
      if (selectedCategory) query.set("category", selectedCategory);
      if (selectedMonth) query.set("month", selectedMonth);
      if (recipientFilter && recipientFilter !== "ALL") {
        query.set("recipientFilter", recipientFilter);
      }

      const res = await fetch(`/api/projects/${params.id}/media?${query.toString()}`);
      const data = await res.json();
      setMediaItems(data.mediaItems || []);
      setMembers(data.members || []);
    } catch (err) {
      console.error("Failed to load media:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, [params.id, selectedCategory, selectedMonth, recipientFilter]);

  const getTargetSummary = (item: any) => {
    if (!item.targetType || item.targetType === "ALL") {
      return { isAll: true, label: "Semua Tim" };
    }
    if (!item.targetUserIds) {
      return { isAll: false, label: "User Tertentu" };
    }
    try {
      const ids: string[] = JSON.parse(item.targetUserIds);
      if (!ids.length) return { isAll: false, label: "User Tertentu" };
      const matched = members
        .filter((m) => ids.includes(m.userId))
        .map((m) => m.user?.name || "User");
      if (matched.length > 0) {
        return { isAll: false, label: matched.join(", ") };
      }
      return { isAll: false, label: `${ids.length} User` };
    } catch {
      return { isAll: false, label: "User Tertentu" };
    }
  };

  const resetUploadModal = () => {
    setShowUploadModal(false);
    setSelectedFile(null);
    setPreviewUrl(null);
    setTitle("");
    setDescription("");
    setCategory("SOP");
    setTargetType("ALL");
    setTargetUserIds([]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      if (!title) {
        // Auto fill title from filename without extension
        const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
        setTitle(cleanName);
      }
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !title) return;

    if (targetType === "SPECIFIC" && targetUserIds.length === 0) {
      alert("Silakan pilih minimal satu user penerima foto/video.");
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("title", title);
      formData.append("description", description);
      formData.append("category", category);
      formData.append("targetType", targetType);
      if (targetType === "SPECIFIC") {
        formData.append("targetUserIds", JSON.stringify(targetUserIds));
      }

      const res = await fetch(`/api/projects/${params.id}/media`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        resetUploadModal();
        fetchMedia();
      } else {
        const data = await res.json();
        alert(data.error || "Gagal mengunggah media");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan koneksi");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (mediaId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus dokumentasi ini?")) return;

    try {
      const res = await fetch(`/api/projects/${params.id}/media/${mediaId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setMediaItems((prev) => prev.filter((m) => m.id !== mediaId));
        if (viewingMedia && viewingMedia.id === mediaId) {
          setViewingMedia(null);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Dokumentasi Foto & Video
            </h1>
            <span className="px-3 py-1 rounded-full text-xs sm:text-sm font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              {mediaItems.length} Berkas Media
            </span>
          </div>
          <p className="text-sm sm:text-base text-slate-600 mt-1">
            Galeri visual temuan lapangan, kondisi fasilitas, kegiatan anak, dan penerapan SOP di Rumah Nara.
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm sm:text-base shadow-md transition flex items-center justify-center gap-2 shrink-0 self-start sm:self-auto"
        >
          <Camera className="w-5 h-5 text-emerald-400" />
          Upload Foto / Video
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Cari dokumentasi atau deskripsi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchMedia()}
            className="w-full pl-11 pr-4 py-2.5 text-sm sm:text-base border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>

        {/* 12-Month Filter */}
        <div className="w-full md:w-auto">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full md:w-52 px-3.5 py-2.5 text-sm sm:text-base border border-slate-200 rounded-xl focus:outline-none bg-slate-50 font-medium"
          >
            {MONTH_OPTIONS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        {/* Category Filter */}
        <div className="w-full md:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full md:w-52 px-3.5 py-2.5 text-sm sm:text-base border border-slate-200 rounded-xl focus:outline-none"
          >
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Recipient Filter */}
        <div className="w-full md:w-auto">
          <select
            value={recipientFilter}
            onChange={(e) => setRecipientFilter(e.target.value)}
            className="w-full md:w-56 px-3.5 py-2.5 text-sm sm:text-base border border-slate-200 rounded-xl focus:outline-none bg-emerald-50/50 text-slate-800 font-semibold"
          >
            {RECIPIENT_FILTER_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Media Grid */}
      {loading ? (
        <div className="py-16 text-center text-base text-slate-400 font-medium">
          Memuat galeri dokumentasi...
        </div>
      ) : mediaItems.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
            <Camera className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-800">
              Belum Ada Dokumentasi Foto atau Video
            </h3>
            <p className="text-sm sm:text-base text-slate-500 max-w-md mx-auto mt-1">
              Mbak Tika atau tim Rumah Nara dapat mengunggah dokumentasi visual simulasi SOP, briefing guru, atau kondisi anak di daycare.
            </p>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-sm transition inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            Upload Dokumentasi Pertama
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {mediaItems.map((item) => {
            const isVideo = item.fileType === "VIDEO";
            const categoryLabel =
              CATEGORY_OPTIONS.find((c) => c.value === item.category)?.label || item.category;

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                {/* Media Preview Thumbnail / Player */}
                <div className="relative bg-slate-900 aspect-video flex items-center justify-center overflow-hidden group">
                  {isVideo ? (
                    <video
                      src={item.fileUrl}
                      controls
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={item.fileUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300 cursor-pointer"
                      onClick={() => setViewingMedia(item)}
                    />
                  )}

                  {/* Badge Type (Photo vs Video) */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 pointer-events-none">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-900/80 text-white backdrop-blur-sm flex items-center gap-1">
                      {isVideo ? <Video className="w-3.5 h-3.5 text-blue-400" /> : <Camera className="w-3.5 h-3.5 text-emerald-400" />}
                      {isVideo ? "VIDEO" : "FOTO"}
                    </span>
                  </div>

                  {!isVideo && (
                    <button
                      onClick={() => setViewingMedia(item)}
                      className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white"
                      title="Perbesar Foto"
                    >
                      <Eye className="w-8 h-8 drop-shadow-md" />
                    </button>
                  )}
                </div>

                {/* Content Details */}
                <div className="p-4 sm:p-5 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-500 gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                          {categoryLabel}
                        </span>
                        {(() => {
                          const targetInfo = getTargetSummary(item);
                          return targetInfo.isAll ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                              <Globe className="w-3 h-3 text-slate-500" />
                              Semua Tim
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200"
                              title={`Ditujukan ke: ${targetInfo.label}`}
                            >
                              <Lock className="w-3 h-3 text-blue-600" />
                              Khusus: {targetInfo.label}
                            </span>
                          );
                        })()}
                      </div>
                      <span className="shrink-0">{formatDateIndo(item.createdAt)}</span>
                    </div>

                    <h3 className="font-black text-base sm:text-lg text-slate-900 leading-snug">
                      {item.title}
                    </h3>

                    {item.description && (
                      <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Footer & Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate max-w-[120px]">
                        {item.uploadedBy?.name || "Anggota"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <a
                        href={item.fileUrl}
                        download={item.fileName}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
                        title="Unduh Berkas"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Hapus Media"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: Upload Foto / Video Baru */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden my-8">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900">
                  Upload Foto atau Video Baru
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Dokumentasikan kondisi lapangan, kegiatan, atau bukti penerapan SOP.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedFile(null);
                  setPreviewUrl(null);
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* File Input Box */}
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1.5">
                  Pilih Berkas Foto / Video *
                </label>
                <div className="border-2 border-dashed border-slate-300 hover:border-slate-400 rounded-2xl p-4 text-center bg-slate-50/60 transition cursor-pointer relative">
                  <input
                    type="file"
                    required
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {previewUrl ? (
                    <div className="space-y-2">
                      {selectedFile?.type.startsWith("video/") ? (
                        <video src={previewUrl} controls className="max-h-48 mx-auto rounded-xl" />
                      ) : (
                        <img src={previewUrl} alt="Preview" className="max-h-48 mx-auto rounded-xl object-contain" />
                      )}
                      <p className="text-xs font-bold text-emerald-700">{selectedFile?.name}</p>
                      <p className="text-[11px] text-slate-400">Klik untuk mengganti berkas</p>
                    </div>
                  ) : (
                    <div className="py-6 space-y-2">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto shadow-xs text-slate-500">
                        <Camera className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold text-slate-800">
                        Klik untuk memilih foto / video dari perangkat Anda
                      </p>
                      <p className="text-xs text-slate-500">
                        Mendukung format JPG, PNG, WEBP, MP4, MOV (Langsung dari kamera HP/laptop)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1.5">
                  Judul Dokumentasi *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Observasi Ruang Makan & Sanitasi Botol Susu"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm sm:text-base border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1.5">
                  Kategori
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm sm:text-base border border-slate-200 rounded-xl focus:outline-none"
                >
                  <option value="SOP">Penerapan SOP & Standarisasi</option>
                  <option value="FACILITY">Fasilitas & Sanitasi</option>
                  <option value="CHILD_ACTIVITY">Kegiatan & Pengasuhan Anak</option>
                  <option value="TRAINING">Pelatihan & Briefing Guru</option>
                  <option value="OPERATIONAL">Operasional Umum</option>
                </select>
              </div>

              {/* Kirim / Bagikan Dokumentasi Ke */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-bold text-slate-800">
                    Kirim / Bagikan Dokumentasi Ke:
                  </label>
                  <span className="text-xs text-slate-500">Bisa ke semua atau user tertentu</span>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setTargetType("ALL");
                      setTargetUserIds([]);
                    }}
                    className={`py-2 px-3 text-xs sm:text-sm font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                      targetType === "ALL"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    Semua Tim (Semua User)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetType("SPECIFIC")}
                    className={`py-2 px-3 text-xs sm:text-sm font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                      targetType === "SPECIFIC"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    User Tertentu
                  </button>
                </div>

                {targetType === "SPECIFIC" && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span className="font-semibold">Pilih user penerima foto/video ini:</span>
                      <span className="text-[11px] text-slate-500">Bisa pilih lebih dari satu</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                      {members.map((m) => {
                        const isSelected = targetUserIds.includes(m.userId);
                        return (
                          <button
                            key={m.userId}
                            type="button"
                            onClick={() => {
                              setTargetUserIds((prev) =>
                                isSelected
                                  ? prev.filter((id) => id !== m.userId)
                                  : [...prev, m.userId]
                              );
                            }}
                            className={`px-3 py-2 rounded-xl text-left text-xs sm:text-sm font-bold border transition flex items-center justify-between gap-2 ${
                              isSelected
                                ? "bg-blue-600 text-white border-blue-700 shadow-xs"
                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100/80"
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className={`w-4 h-4 rounded-md border flex items-center justify-center text-[10px] shrink-0 font-black ${
                                  isSelected
                                    ? "border-white bg-white text-blue-600"
                                    : "border-slate-300 bg-white"
                                }`}
                              >
                                {isSelected ? "✓" : ""}
                              </span>
                              <span className="truncate">{m.user?.name}</span>
                            </div>
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 font-medium ${
                                isSelected
                                  ? "bg-blue-700 text-blue-100"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {m.role === "CLIENT_LEAD"
                                ? "Rumah Nara"
                                : m.role === "CONSULTANT_LEAD"
                                ? "Konsultan"
                                : "Tim"}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {targetUserIds.length === 0 ? (
                      <p className="text-xs text-amber-600 font-medium">
                        * Klik minimal satu nama user di atas untuk mengirimkan dokumentasi ini.
                      </p>
                    ) : (
                      <p className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        {targetUserIds.length} user dipilih sebagai penerima dokumentasi.
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1.5">
                  Catatan / Keterangan Dokumentasi
                </label>
                <textarea
                  rows={3}
                  placeholder="Jelaskan temuan atau konteks dari foto/video ini..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm sm:text-base border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={resetUploadModal}
                  className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={uploading || !selectedFile}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm sm:text-base font-bold rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {uploading ? "Mengunggah..." : "Simpan Dokumentasi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LIGHTBOX: Preview Zoom Foto */}
      {viewingMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="relative max-w-4xl w-full flex flex-col items-center space-y-4">
            <button
              onClick={() => setViewingMedia(null)}
              className="absolute -top-12 right-0 p-2 text-white/80 hover:text-white rounded-full bg-slate-800/60"
            >
              <X className="w-6 h-6" />
            </button>

            <img
              src={viewingMedia.fileUrl}
              alt={viewingMedia.title}
              className="max-h-[75vh] w-auto max-w-full rounded-2xl shadow-2xl object-contain"
            />

            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl text-white w-full max-w-2xl text-center space-y-2">
              <h3 className="text-lg font-bold">{viewingMedia.title}</h3>
              {viewingMedia.description && (
                <p className="text-sm text-white/80">{viewingMedia.description}</p>
              )}
              <div className="flex items-center justify-center gap-2 pt-1 text-xs text-white/70 flex-wrap">
                <span>
                  Diunggah oleh <strong className="text-white">{viewingMedia.uploadedBy?.name}</strong> pada {formatDateIndo(viewingMedia.createdAt)}
                </span>
                <span>•</span>
                {(() => {
                  const targetInfo = getTargetSummary(viewingMedia);
                  return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 text-white font-medium">
                      {targetInfo.isAll ? (
                        <Globe className="w-3 h-3 text-emerald-300" />
                      ) : (
                        <Lock className="w-3 h-3 text-blue-300" />
                      )}
                      {targetInfo.isAll ? "Ditujukan ke: Semua Tim" : `Ditujukan ke: ${targetInfo.label}`}
                    </span>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
