"use client";

import React, { useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getPlatformBadge, getStatusBadge } from "@/lib/platformUtils";
import { MediaPreview } from "@/components/common/MediaPreview";
import { MultiFileUpload } from "@/components/common/MultiFileUpload";
import {
  TeamMentionInput,
  renderMentionedText,
} from "@/components/common/TeamMentionInput";
import { useToast } from "@/components/common/Toast";
import {
  isRawMaterialStage,
  getRawFiles,
  getEditedFiles,
  getPublishedLinks,
  linksToFields,
  detectPlatformFromUrl,
  filesToFields,
  PLATFORM_OPTIONS,
  FORMAT_OPTIONS,
  getRequiredHashtags,
  buildPostText,
  isReviewerRole,
  MediaFile,
  PublishedLink,
  timeAgo,
} from "@/lib/content-utils";
import {
  getThemeGroups,
  getPlanItem,
  getPlanLabel,
} from "@/lib/marketing-plan";
import {
  patchContent,
  deleteContent,
  postComment,
  returnToRawMaterial,
} from "@/lib/content-actions";
import { copyText } from "@/lib/clipboard";
import {
  X,
  Trash2,
  Sparkles,
  CheckCircle2,
  UploadCloud,
  Film,
  Hash,
  Copy,
  History,
  MessageSquare,
  Undo2,
  Link2,
  Plus,
  ExternalLink,
} from "lucide-react";

interface DetailModalProps {
  content: any;
  users: any[];
  onClose: () => void;
  onRefresh: () => void;
}

export function ContentDetailModal({
  content,
  users,
  onClose,
  onRefresh,
}: DetailModalProps) {
  const { currentUser } = useAuth();
  const toast = useToast();

  const canDelete =
    isReviewerRole(currentUser?.role) ||
    (currentUser?.id &&
      (content.createdById === currentUser.id ||
        content.assignedToId === currentUser.id));

  const themeGroups = useMemo(() => getThemeGroups(new Date()), []);

  const [title, setTitle] = useState<string>(content.title || "");
  const [description, setDescription] = useState<string>(
    content.description || ""
  );
  const [themeId, setThemeId] = useState<string>(content.themeId || "");
  const [contentType, setContentType] = useState<string>(
    content.contentType || "REELS"
  );
  const [caption, setCaption] = useState<string>(content.caption || "");

  const [rawFiles, setRawFiles] = useState<MediaFile[]>(() =>
    getRawFiles(content)
  );
  const [editedFiles, setEditedFiles] = useState<MediaFile[]>(() =>
    getEditedFiles(content)
  );
  const [links, setLinks] = useState<PublishedLink[]>(() =>
    getPublishedLinks(content)
  );
  const [newPlatform, setNewPlatform] = useState("INSTAGRAM");
  const [newUrl, setNewUrl] = useState("");

  const [editFilesOpen, setEditFilesOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [feedFilter, setFeedFilter] = useState<"ALL" | "COMMENT" | "LOG">(
    "ALL"
  );

  const isStillRaw = isRawMaterialStage(content);
  const statusInfo = getStatusBadge(content);

  const handleAddLocalLink = () => {
    const clean = newUrl.trim();
    if (!clean || !/^https?:\/\//i.test(clean)) {
      toast("Masukkan tautan lengkap diawali https://...", { tone: "error" });
      return;
    }
    const auto = detectPlatformFromUrl(clean);
    const plat = newPlatform || (auto !== "WEBSITE" ? auto : "INSTAGRAM");
    setLinks((prev) => [
      ...prev,
      {
        id: `lnk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        platform: plat,
        url: clean,
        addedBy: currentUser?.name || "Tim",
        addedAt: new Date().toISOString(),
      },
    ]);
    setNewUrl("");
  };

  const handleSaveChanges = async () => {
    if (!title.trim()) {
      toast("Judul konten tidak boleh kosong.", { tone: "error" });
      return;
    }

    setSaving(true);
    try {
      const plan = getPlanItem(themeId);
      const hasFinishedAssets = editedFiles.length > 0 || links.length > 0;

      const payload: Record<string, unknown> = {
        title: title.trim(),
        description: description.trim() || null,
        themeId: themeId || null,
        themeLabel: plan ? getPlanLabel(plan) : content.themeLabel || null,
        contentType,
        caption: caption.trim() || null,
        ...filesToFields("raw", rawFiles),
        ...filesToFields("edited", editedFiles),
      };

      if (!isStillRaw || hasFinishedAssets) {
        Object.assign(payload, linksToFields(links));
        if (links.length > 0 && !content.publishedAt) {
          payload.publishedAt = new Date().toISOString();
        }
      }

      const res = await patchContent(content.id, payload);
      if (res.ok) {
        toast("Perubahan berhasil disimpan!");
        setEditFilesOpen(false);
        onRefresh();
      } else {
        toast(res.error || "Gagal menyimpan perubahan.", { tone: "error" });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleReturnRawNow = async () => {
    if (!currentUser) return;
    const res = await returnToRawMaterial(content, currentUser);
    if (res.ok) {
      toast("Bahan dikembalikan ke Tab 1 (Bahan Mentah) & tidak blur lagi.");
      onRefresh();
      onClose();
    } else {
      toast(res.error || "Gagal mengembalikan bahan.", { tone: "error" });
    }
  };

  const handleDeleteNow = async () => {
    setDeleting(true);
    try {
      const res = await deleteContent(content.id);
      if (res.ok) {
        toast("Item dihapus dari Bank Konten.");
        onRefresh();
        onClose();
      } else {
        toast(res.error || "Gagal menghapus item.", { tone: "error" });
      }
    } finally {
      setDeleting(false);
    }
  };

  const handlePostComment = async (message: string, taggedUserId?: string) => {
    const res = await postComment(content.id, message, taggedUserId, "COMMENT");
    if (res.ok) onRefresh();
  };

  const allComments: any[] = content.comments || [];
  const filteredComments = allComments.filter((c) => {
    if (feedFilter === "COMMENT") return c.kind !== "LOG";
    if (feedFilter === "LOG") return c.kind === "LOG";
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-[#1A3460]/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white border-2 border-[#1A3460] rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b-2 border-[#F3BC6F] flex items-start justify-between gap-4 bg-[#1A3460] text-white">
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full border ${statusInfo.className}`}
              >
                {statusInfo.label}
              </span>
              {content.assignedTo && (
                <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-amber-300 text-[#1A3460]">
                  PIC: {content.assignedTo.name}
                </span>
              )}
            </div>

            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-white/20 rounded-xl px-3 py-1.5 text-base sm:text-xl font-black text-white focus:outline-none focus:border-[#F3BC6F]"
            />
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#F35E50] text-white flex items-center justify-center transition shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body 2 Kolom */}
        <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-h-[76vh] overflow-y-auto">
          {/* Kolom Kiri (7): Media, Tema, Caption, & Daftar Link Platform */}
          <div className="lg:col-span-7 space-y-5">
            {/* Pratinjau Bahan Mentah & Hasil Edit */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-[#1A3460]">
                  Berkas Media
                </span>
                <button
                  type="button"
                  onClick={() => setEditFilesOpen((v) => !v)}
                  className="px-3 py-1 rounded-xl bg-[#FFF8F3] hover:bg-[#F3BC6F]/30 border border-[#1A3460]/20 text-xs font-black text-[#1A3460] cursor-pointer"
                >
                  {editFilesOpen
                    ? "Tutup Pengelola Berkas"
                    : "📤 Tambah / Ganti Berkas"}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-[#FFF8F3] border border-[#1A3460]/15 rounded-2xl p-3 space-y-1.5">
                  <div className="text-xs font-black text-[#1A3460] flex items-center gap-1">
                    <UploadCloud className="w-3.5 h-3.5 text-[#1A3460]" />
                    Bahan Mentah ({rawFiles.length})
                  </div>
                  <MediaPreview
                    files={rawFiles}
                    emptyLabel="Tanpa bahan mentah"
                    emptySubLabel="Konten mandiri"
                    heightClass="h-40"
                    downloadBaseName={`mentah-${content.id.slice(-5)}`}
                  />
                </div>

                <div className="bg-[#FFF8F3] border-2 border-[#F3BC6F] rounded-2xl p-3 space-y-1.5">
                  <div className="text-xs font-black text-[#F35E50] flex items-center gap-1">
                    <Film className="w-3.5 h-3.5" />
                    Konten Jadi / Hasil Edit ({editedFiles.length})
                  </div>
                  <MediaPreview
                    files={editedFiles}
                    emptyLabel="Belum ada berkas jadi"
                    emptySubLabel="Unggah hasil edit atau isi link tayang di bawah"
                    heightClass="h-40"
                    downloadBaseName={`final-${content.id.slice(-5)}`}
                  />
                </div>
              </div>

              {editFilesOpen && (
                <div className="p-4 rounded-2xl bg-[#FFF8F3] border-2 border-[#1A3460]/20 space-y-4">
                  <MultiFileUpload
                    label="📁 Kelola Berkas Bahan Mentah"
                    files={rawFiles}
                    onChange={setRawFiles}
                  />
                  <div className="border-t border-[#1A3460]/10 pt-3">
                    <MultiFileUpload
                      label="🎬 Kelola Berkas Konten Jadi / Hasil Edit"
                      files={editedFiles}
                      onChange={setEditedFiles}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Tema, Format, & Catatan */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#FFF8F3] p-4 rounded-2xl border border-[#1A3460]/15">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-black text-[#1A3460] mb-1">
                  Tema Jadwal Marketing
                </label>
                <select
                  value={themeId}
                  onChange={(e) => setThemeId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#1A3460]/20 text-[#1A3460] font-black"
                >
                  <option value="">-- Umum / Lintas Tema --</option>
                  {themeGroups.map((g) => (
                    <optgroup key={g.key} label={g.label}>
                      {g.items.map((it) => (
                        <option key={`${g.key}-${it.id}`} value={it.id}>
                          {getPlanLabel(it)}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-black text-[#1A3460] mb-1">
                  Format Konten
                </label>
                <select
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#1A3460]/20 text-[#1A3460] font-bold"
                >
                  {FORMAT_OPTIONS.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.code ? `[${f.code}] ` : ""}
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[11px] font-black text-[#1A3460] mb-1">
                  Catatan / Arahan
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Catatan tambahan atau konteks konten..."
                  className="w-full p-2.5 text-xs rounded-xl bg-white border border-[#1A3460]/20 text-[#1A3460] font-medium"
                />
              </div>
            </div>

            {/* Caption Postingan Medsos */}
            <div className="bg-[#FFF8F3] border-2 border-[#F3BC6F] rounded-2xl p-4 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs font-black text-[#1A3460]">
                  📝 Caption Postingan Medsos & Hashtag
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const tags = getRequiredHashtags({ themeId });
                      if (!caption.includes("#paudArjunaMalang")) {
                        setCaption((prev) =>
                          prev.trim() ? `${prev.trim()}\n\n${tags}` : tags
                        );
                      }
                    }}
                    className="text-[11px] font-black text-[#F35E50] hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Hash className="w-3 h-3" />+ Hashtag Wajib
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      const txt = buildPostText({ caption, themeId });
                      if (!txt) return;
                      await copyText(txt);
                      toast("Caption + hashtag disalin!");
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[#1A3460] text-[#F3BC6F] text-[11px] font-black inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    Salin
                  </button>
                </div>
              </div>
              <textarea
                rows={3}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Tulis caption final untuk Instagram / TikTok / Facebook..."
                className="w-full p-3 text-xs rounded-xl bg-white border border-[#1A3460]/15 text-[#1A3460] font-medium leading-relaxed focus:outline-none focus:border-[#F35E50]"
              />
            </div>

            {/* Daftar Link Platform Tayang (Multi-Link) */}
            <div className="bg-emerald-50/70 border-2 border-emerald-300 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                  <Link2 className="w-4 h-4 text-emerald-700" />
                  Daftar Link Platform Tempat Konten Diupload ({links.length})
                </span>
              </div>

              {links.length > 0 && (
                <div className="space-y-1.5">
                  {links.map((lnk) => {
                    const pBadge = getPlatformBadge(lnk.platform);
                    return (
                      <div
                        key={lnk.id}
                        className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white border border-emerald-200 text-xs"
                      >
                        <a
                          href={lnk.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 min-w-0 flex-1 hover:underline text-[#1A3460] font-semibold"
                        >
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] border shrink-0 ${pBadge.className}`}
                          >
                            {pBadge.icon}
                            {pBadge.label}
                          </span>
                          <span className="truncate">{lnk.url}</span>
                          <ExternalLink className="w-3 h-3 text-emerald-700 shrink-0" />
                        </a>

                        <button
                          type="button"
                          onClick={() =>
                            setLinks((prev) =>
                              prev.filter((x) => x.id !== lnk.id)
                            )
                          }
                          className="p-1 rounded-lg hover:bg-rose-50 text-rose-600 cursor-pointer"
                          title="Hapus baris link ini (jangan lupa klik Simpan Perubahan)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={newPlatform}
                  onChange={(e) => setNewPlatform(e.target.value)}
                  className="px-2.5 py-2 rounded-xl bg-white border border-emerald-300 text-xs font-black text-[#1A3460] shrink-0"
                >
                  {PLATFORM_OPTIONS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
                <input
                  type="url"
                  value={newUrl}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewUrl(val);
                    const auto = detectPlatformFromUrl(val);
                    if (val.trim() && auto !== "WEBSITE") {
                      setNewPlatform(auto);
                    }
                  }}
                  placeholder="https://www.instagram.com/reel/... atau link TikTok/FB/YT"
                  className="flex-1 px-3 py-2 text-xs rounded-xl bg-white border border-emerald-300 text-[#1A3460] font-medium focus:outline-none focus:border-emerald-600"
                />
                <button
                  type="button"
                  onClick={handleAddLocalLink}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black inline-flex items-center justify-center gap-1 cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tambah Link
                </button>
              </div>
            </div>

            {/* Tombol Kembalikan ke Bahan Mentah jika masih di antrean edit */}
            {isStillRaw && content.assignedToId && (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-amber-950">
                  Bahan mentah ini sedang diambil oleh{" "}
                  <strong>{content.assignedTo?.name || "Tim"}</strong>. Batal mengedit?
                </span>
                <button
                  type="button"
                  onClick={handleReturnRawNow}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-rose-50 border border-rose-300 text-rose-700 text-xs font-black inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  Kembalikan ke Bahan Mentah
                </button>
              </div>
            )}

            {/* Save & Delete Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#1A3460]/10">
              <button
                type="button"
                onClick={handleSaveChanges}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-[#F35E50] hover:bg-[#e04b3d] text-white text-xs font-black inline-flex items-center gap-2 shadow-md transition disabled:opacity-50 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-[#F3BC6F]" />
                <span>
                  {saving ? "Menyimpan..." : "Simpan Semua Perubahan"}
                </span>
              </button>

              {canDelete && (
                <div>
                  {confirmDelete ? (
                    <div className="inline-flex items-center gap-1.5">
                      <span className="text-xs font-bold text-rose-700">
                        Yakin hapus?
                      </span>
                      <button
                        type="button"
                        disabled={deleting}
                        onClick={handleDeleteNow}
                        className="px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-black cursor-pointer"
                      >
                        {deleting ? "..." : "Ya, Hapus"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(false)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold cursor-pointer"
                      >
                        Batal
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(true)}
                      className="px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-black inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Hapus Item
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Kolom Kanan (5): Diskusi Tim & Riwayat Otomatis */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-[#FFF8F3] border-2 border-[#1A3460]/15 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xs font-black text-[#1A3460] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#F35E50]" />
                  Catatan & Riwayat ({allComments.length})
                </h3>

                <div className="inline-flex rounded-xl bg-white border border-[#1A3460]/15 p-0.5 text-[10px] font-black">
                  <button
                    type="button"
                    onClick={() => setFeedFilter("ALL")}
                    className={`px-2 py-0.5 rounded-lg cursor-pointer ${
                      feedFilter === "ALL"
                        ? "bg-[#1A3460] text-[#F3BC6F]"
                        : "text-[#1A3460]/70"
                    }`}
                  >
                    Semua
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeedFilter("COMMENT")}
                    className={`px-2 py-0.5 rounded-lg inline-flex items-center gap-1 cursor-pointer ${
                      feedFilter === "COMMENT"
                        ? "bg-[#1A3460] text-[#F3BC6F]"
                        : "text-[#1A3460]/70"
                    }`}
                  >
                    <MessageSquare className="w-2.5 h-2.5" />
                    Komentar
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeedFilter("LOG")}
                    className={`px-2 py-0.5 rounded-lg inline-flex items-center gap-1 cursor-pointer ${
                      feedFilter === "LOG"
                        ? "bg-[#1A3460] text-[#F3BC6F]"
                        : "text-[#1A3460]/70"
                    }`}
                  >
                    <History className="w-2.5 h-2.5" />
                    Riwayat
                  </button>
                </div>
              </div>

              <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                {filteredComments.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-8">
                    Belum ada catatan atau riwayat pada item ini.
                  </p>
                ) : (
                  filteredComments.map((cm: any) => {
                    const isLog = cm.kind === "LOG";
                    if (isLog) {
                      return (
                        <div
                          key={cm.id}
                          className="px-3 py-2 rounded-xl bg-white/70 border border-[#1A3460]/10 text-[11px] text-[#1A3460]/75 flex items-start justify-between gap-2"
                        >
                          <span className="font-semibold leading-snug">
                            {renderMentionedText(cm.message)}
                          </span>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {timeAgo(cm.createdAt)}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={cm.id}
                        className="p-3 rounded-xl bg-white border border-[#1A3460]/15 space-y-1 shadow-sm"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-1.5 font-black text-[#1A3460]">
                            <img
                              src={
                                cm.user?.avatar ||
                                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
                              }
                              alt=""
                              className="w-5 h-5 rounded-full object-cover border border-[#F3BC6F]"
                            />
                            <span>{cm.user?.name || "Tim"}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-bold">
                            {timeAgo(cm.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-[#1A3460] font-medium leading-relaxed">
                          {renderMentionedText(cm.message)}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-[#1A3460]/15">
              <TeamMentionInput
                users={users}
                onSend={handlePostComment}
                placeholder="Ketik diskusi atau tag @Nama anggota tim..."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
