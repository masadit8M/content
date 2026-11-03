"use client";

import React, { useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getPlatformBadge } from "@/lib/platformUtils";
import { MediaPreview } from "@/components/common/MediaPreview";
import { MultiFileUpload } from "@/components/common/MultiFileUpload";
import { useToast } from "@/components/common/Toast";
import { copyText } from "@/lib/clipboard";
import { downloadAllMedia } from "@/lib/upload-client";
import {
  isRawMaterialStage,
  hasRawOrigin,
  getRawFiles,
  getEditedFiles,
  getPrimaryFiles,
  getPublishedLinks,
  detectPlatformFromUrl,
  linksToFields,
  filesToFields,
  matchesContentPlatform,
  PLATFORM_OPTIONS,
  getFormatMeta,
  getRequiredHashtags,
  buildPostText,
  MediaFile,
  PublishedLink,
  timeAgo,
} from "@/lib/content-utils";
import { getThemeText } from "@/lib/marketing-plan";
import {
  returnToRawMaterial,
  submitEditedFromRaw,
  addPlatformLink,
  removePlatformLink,
} from "@/lib/content-actions";
import {
  Rocket,
  Plus,
  Undo2,
  Film,
  Download,
  ExternalLink,
  Copy,
  Trash2,
  Link2,
  Hash,
  X,
  Wrench,
  Sparkles,
  FolderOpen,
  Check,
} from "lucide-react";

interface UploadKontenViewProps {
  /** Seluruh konten (agar antrean Bahan yang Sedang Diambil selalu utuh) */
  allContents: any[];
  /** Konten yang sudah terfilter kata kunci pencarian & tema jadwal */
  filteredContents: any[];
  onSelectContent: (content: any) => void;
  onOpenCreateFinishedModal: () => void;
  onNavigateToRaw: () => void;
  onRefresh: () => void;
}

interface DraftLinkRow {
  platform: string;
  url: string;
}

export function UploadKontenView({
  allContents,
  filteredContents,
  onSelectContent,
  onOpenCreateFinishedModal,
  onNavigateToRaw,
  onRefresh,
}: UploadKontenViewProps) {
  const { currentUser } = useAuth();
  const toast = useToast();

  const [subFilter, setSubFilter] = useState<"ALL" | "WITH_LINKS" | "NO_LINKS">(
    "ALL"
  );
  const [platformFilter, setPlatformFilter] = useState<string>("ALL");
  const [busyId, setBusyId] = useState<string | null>(null);

  // Form tambah link cepat per kartu konten
  const [openAddLinkCardId, setOpenAddLinkCardId] = useState<string | null>(
    null
  );
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [newLinkPlatform, setNewLinkPlatform] = useState("INSTAGRAM");
  const [savingLinkCardId, setSavingLinkCardId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal Upload Hasil Edit dari Bahan Mentah yang Sedang Diambil
  const [editingClaimedItem, setEditingClaimedItem] = useState<any | null>(
    null
  );
  const [resultFiles, setResultFiles] = useState<MediaFile[]>([]);
  const [resultCaption, setResultCaption] = useState("");
  const [resultLinks, setResultLinks] = useState<DraftLinkRow[]>([
    { platform: "INSTAGRAM", url: "" },
  ]);
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // 1. Daftar Bahan Mentah yang sedang diambil dari Tab 1 (menunggu diedit / dikembalikan)
  const claimedRawItems = useMemo(() => {
    const list = allContents.filter(
      (c) => isRawMaterialStage(c) && Boolean(c.assignedToId)
    );
    return [...list].sort((a, b) => {
      const aMine = a.assignedToId === currentUser?.id ? 0 : 1;
      const bMine = b.assignedToId === currentUser?.id ? 0 : 1;
      if (aMine !== bMine) return aMine - bMine;
      return (
        new Date(b.claimedAt || b.updatedAt || 0).getTime() -
        new Date(a.claimedAt || a.updatedAt || 0).getTime()
      );
    });
  }, [allContents, currentUser?.id]);

  // 2. Daftar Konten Jadi & Link Platform Tayang
  const allFinished = useMemo(
    () => filteredContents.filter((c) => !isRawMaterialStage(c)),
    [filteredContents]
  );

  const counts = useMemo(() => {
    let withLinks = 0;
    let noLinks = 0;
    for (const c of allFinished) {
      if (getPublishedLinks(c).length > 0) withLinks++;
      else noLinks++;
    }
    return { total: allFinished.length, withLinks, noLinks };
  }, [allFinished]);

  const visibleFinished = useMemo(() => {
    return allFinished.filter((c) => {
      const links = getPublishedLinks(c);
      if (subFilter === "WITH_LINKS" && links.length === 0) return false;
      if (subFilter === "NO_LINKS" && links.length > 0) return false;
      if (!matchesContentPlatform(c, platformFilter)) return false;
      return true;
    });
  }, [allFinished, subFilter, platformFilter]);

  // Kembalikan bahan mentah ke Tab 1 (membuka blur & kunci di Tab 1)
  const handleReturnToRaw = async (item: any) => {
    if (!currentUser) return;
    setBusyId(item.id);
    try {
      const res = await returnToRawMaterial(item, currentUser);
      if (res.ok) {
        onRefresh();
        toast(
          `↩ "${item.title}" dikembalikan ke Tab 1 (Bahan Mentah) & kembali aktif (tidak blur).`,
          {
            action: {
              label: "Lihat di Tab 1 →",
              onClick: onNavigateToRaw,
            },
          }
        );
      } else {
        toast(res.error || "Gagal mengembalikan bahan mentah.", {
          tone: "error",
        });
      }
    } finally {
      setBusyId(null);
    }
  };

  // Buka modal Upload Hasil Edit untuk bahan mentah yang diambil
  const openSubmitEditModal = (item: any) => {
    setEditingClaimedItem(item);
    setResultFiles(getEditedFiles(item));
    setResultCaption(item.caption || "");
    const existing = getPublishedLinks(item);
    setResultLinks(
      existing.length > 0
        ? existing.map((l) => ({ platform: l.platform, url: l.url }))
        : [{ platform: item.platform || "INSTAGRAM", url: "" }]
    );
  };

  // Simpan Hasil Edit dari Bahan Mentah -> masuk daftar utama Tab 2
  const handleSubmitEditedResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClaimedItem || !currentUser) return;

    const validLinks: PublishedLink[] = resultLinks
      .filter((r) => r.url.trim())
      .map((r, idx) => {
        const cleanUrl = r.url.trim();
        const detected = detectPlatformFromUrl(cleanUrl);
        return {
          id: `lnk_${Date.now()}_${idx}`,
          platform:
            r.platform || (detected !== "WEBSITE" ? detected : "INSTAGRAM"),
          url: cleanUrl,
          addedBy: currentUser.name,
          addedAt: new Date().toISOString(),
        };
      });

    if (resultFiles.length === 0 && validLinks.length === 0) {
      toast(
        "Unggah berkas hasil edit ATAU isi minimal 1 link platform tempat konten diupload.",
        { tone: "error" }
      );
      return;
    }

    setSubmittingEdit(true);
    try {
      const payload: Record<string, unknown> = {
        ...(resultFiles.length > 0 ? filesToFields("edited", resultFiles) : {}),
        caption: resultCaption.trim() || null,
        assignedToId: editingClaimedItem.assignedToId || currentUser.id,
        ...linksToFields(validLinks),
        ...(validLinks.length > 0
          ? { publishedAt: new Date().toISOString() }
          : {}),
      };

      const res = await submitEditedFromRaw(
        editingClaimedItem,
        currentUser,
        payload,
        validLinks.length
      );

      if (res.ok) {
        setEditingClaimedItem(null);
        onRefresh();
        toast(
          validLinks.length > 0
            ? "🎉 Hasil edit beserta link platform tayang berhasil disimpan!"
            : "🎬 Hasil edit berhasil disimpan! Anda bisa menambahkan link platform kapan saja setelah tayang."
        );
      } else {
        toast(res.error || "Gagal menyimpan hasil edit.", { tone: "error" });
      }
    } finally {
      setSubmittingEdit(false);
    }
  };

  // Tambah 1 link platform langsung pada kartu konten
  const handleQuickAddLink = async (e: React.FormEvent, item: any) => {
    e.preventDefault();
    if (!currentUser) return;
    const trimmed = newLinkUrl.trim();
    if (!trimmed || !/^https?:\/\//i.test(trimmed)) {
      toast("Masukkan link lengkap diawali https://...", { tone: "error" });
      return;
    }

    setSavingLinkCardId(item.id);
    try {
      const res = await addPlatformLink(item, currentUser, {
        platform: newLinkPlatform,
        url: trimmed,
      });
      if (res.ok) {
        setNewLinkUrl("");
        setOpenAddLinkCardId(null);
        onRefresh();
        toast(`🔗 Link ${newLinkPlatform} berhasil ditambahkan!`);
      } else {
        toast(res.error || "Gagal menambahkan link.", { tone: "error" });
      }
    } finally {
      setSavingLinkCardId(null);
    }
  };

  const handleRemoveLink = async (item: any, linkId: string) => {
    if (!currentUser) return;
    setBusyId(`${item.id}_${linkId}`);
    try {
      const res = await removePlatformLink(item, currentUser, linkId);
      if (res.ok) {
        onRefresh();
        toast("Link platform dihapus.", { tone: "info" });
      } else {
        toast(res.error || "Gagal menghapus link.", { tone: "error" });
      }
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* =====================================================================
          BAGIAN ATAS: BAHAN MENTAH YANG SEDANG DIAMBIL (DARI TAB 1)
         ===================================================================== */}
      {claimedRawItems.length > 0 && (
        <section className="bg-amber-50 border-2 border-amber-400 rounded-3xl p-5 sm:p-6 space-y-4 shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="space-y-0.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-400 text-[#1A3460] text-xs font-black">
                <Wrench className="w-3.5 h-3.5" />
                Antrean Edit Bahan Mentah ({claimedRawItems.length})
              </div>
              <h3 className="text-base sm:text-lg font-black text-[#1A3460]">
                Bahan Mentah yang Sedang Diambil dari Tab 1
              </h3>
              <p className="text-xs text-[#1A3460]/75 font-medium">
                Unduh bahannya untuk diedit, lalu klik{" "}
                <strong>Upload Hasil Edit & Link</strong>. Jika tidak jadi diedit, klik{" "}
                <strong>Kembalikan ke Bahan Mentah</strong> agar blurnya hilang di Tab 1.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {claimedRawItems.map((item) => {
              const rawFiles = getRawFiles(item);
              const isMine = item.assignedToId === currentUser?.id;
              const themeText = getThemeText(item.themeId, item.themeLabel);

              return (
                <div
                  key={item.id}
                  className={`rounded-2xl bg-white p-4 border-2 flex flex-col justify-between gap-3.5 shadow-sm ${
                    isMine ? "border-[#F35E50]" : "border-[#1A3460]/20"
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-xl bg-amber-100 border border-amber-300 text-xs font-black text-amber-950">
                        {item.assignedTo?.avatar && (
                          <img
                            src={item.assignedTo.avatar}
                            alt={item.assignedTo.name}
                            className="w-5 h-5 rounded-full object-cover"
                          />
                        )}
                        <span>
                          Diambil oleh:{" "}
                          <strong>{item.assignedTo?.name || "Tim"}</strong>
                          {isMine ? " (Anda)" : ""}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-slate-400">
                        {timeAgo(item.claimedAt || item.updatedAt)}
                      </span>
                    </div>

                    {themeText && (
                      <div className="inline-block text-[11px] font-black px-2 py-0.5 rounded-lg bg-[#F3BC6F]/30 text-[#1A3460] border border-[#F3BC6F]">
                        📅 {themeText}
                      </div>
                    )}

                    <div className="font-black text-sm text-[#1A3460]">
                      {item.title}
                    </div>
                    {(item.description || item.prepNotes) && (
                      <p className="text-xs text-[#1A3460]/70 line-clamp-2 font-medium">
                        {item.description || item.prepNotes}
                      </p>
                    )}

                    {rawFiles.length > 0 && (
                      <MediaPreview
                        files={rawFiles}
                        badgeLabel="Bahan Mentah"
                        heightClass="h-36"
                        downloadBaseName={`mentah-${item.id.slice(-5)}`}
                      />
                    )}
                  </div>

                  {/* 3 Tombol Jelas: Unduh Bahan, Kembalikan ke Bahan Mentah, Upload Hasil Edit */}
                  <div className="pt-3 border-t border-[#1A3460]/10 flex flex-wrap items-center gap-2">
                    {rawFiles.length > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          downloadAllMedia(
                            rawFiles,
                            `mentah-${item.id.slice(-5)}`
                          )
                        }
                        className="py-2 px-3 rounded-xl bg-[#FFF8F3] hover:bg-[#F3BC6F]/30 border border-[#1A3460]/20 text-[#1A3460] text-xs font-black inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 text-[#1A3460]" />
                        <span>Unduh Bahan</span>
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={busyId === item.id}
                      onClick={() => handleReturnToRaw(item)}
                      className="py-2 px-3 rounded-xl bg-white hover:bg-rose-50 border border-rose-300 text-rose-700 text-xs font-black inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      title="Batalkan pengambilan — bahan kembali ke Tab Bahan Mentah dan tidak blur lagi"
                    >
                      <Undo2 className="w-3.5 h-3.5" />
                      <span>
                        {busyId === item.id
                          ? "Mengembalikan..."
                          : "Kembalikan ke Bahan Mentah"}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openSubmitEditModal(item)}
                      className="flex-1 py-2 px-3.5 rounded-xl bg-[#F35E50] hover:bg-[#e04b3d] text-white text-xs font-black inline-flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Film className="w-3.5 h-3.5 text-[#F3BC6F]" />
                      <span>Upload Hasil Edit & Link</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* =====================================================================
          BAGIAN UTAMA: BANK KONTEN TERUPLOAD & DAFTAR LINK PLATFORM
         ===================================================================== */}
      <div className="bg-gradient-to-r from-[#1A3460] to-[#122544] border-2 border-[#F3BC6F] rounded-3xl p-5 sm:p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-black">
              <Rocket className="w-4 h-4 text-[#F3BC6F]" />
              Tab 2 • Upload Konten & Link Platform Tayang
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Konten Hasil Edit, Konten Mandiri, &{" "}
              <span className="text-[#F3BC6F]">Link Multi-Platform</span>
            </h2>
            <p className="text-xs sm:text-sm text-white/85 leading-relaxed font-medium">
              Unggah konten jadi (baik hasil olahan bahan mentah maupun{" "}
              <strong>konten mandiri di luar bahan mentah</strong>) dan simpan{" "}
              <strong>semua link platform</strong> tempat konten tersebut telah diupload (Instagram, TikTok, Facebook, YouTube, dll).
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenCreateFinishedModal}
            className="px-5 py-3 rounded-2xl bg-[#F35E50] hover:bg-[#e04b3d] text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#F3BC6F]" />
            <span>+ Upload Konten Mandiri / Link</span>
          </button>
        </div>

        {/* Filter Bar: Status Link & Filter Platform */}
        <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs font-bold">
          <div className="flex flex-wrap items-center gap-1.5 bg-white/10 p-1 rounded-2xl border border-white/10">
            <button
              type="button"
              onClick={() => setSubFilter("ALL")}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                subFilter === "ALL"
                  ? "bg-[#F3BC6F] text-[#1A3460] font-black"
                  : "text-white/80 hover:text-white"
              }`}
            >
              Semua Konten ({counts.total})
            </button>
            <button
              type="button"
              onClick={() => setSubFilter("WITH_LINKS")}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                subFilter === "WITH_LINKS"
                  ? "bg-emerald-500 text-white font-black"
                  : "text-white/80 hover:text-white"
              }`}
            >
              🔗 Sudah Ada Link Platform ({counts.withLinks})
            </button>
            <button
              type="button"
              onClick={() => setSubFilter("NO_LINKS")}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                subFilter === "NO_LINKS"
                  ? "bg-sky-500 text-white font-black"
                  : "text-white/80 hover:text-white"
              }`}
            >
              🎬 Konten Jadi — Belum Ada Link ({counts.noLinks})
            </button>
          </div>

          {/* Filter Platform */}
          <div className="flex flex-wrap items-center gap-1">
            {[
              { id: "ALL", label: "Semua Platform" },
              ...PLATFORM_OPTIONS,
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPlatformFilter(p.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  platformFilter === p.id
                    ? "bg-white text-[#1A3460] font-black shadow-sm"
                    : "text-white/75 hover:text-white hover:bg-white/10"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Daftar Kartu Konten & Link Platform */}
      {visibleFinished.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-[#1A3460]/20 rounded-3xl p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#FFF8F3] border-2 border-[#F3BC6F] flex items-center justify-center mx-auto text-[#F35E50]">
            <Rocket className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-black text-[#1A3460]">
              Belum Ada Konten pada Kategori Ini
            </h3>
            <p className="text-xs text-[#1A3460]/70 max-w-md mx-auto font-medium">
              Anda dapat mengunggah hasil edit dari bahan mentah di atas, atau langsung mengunggah konten mandiri beserta link platform tayangnya.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenCreateFinishedModal}
            className="px-4 py-2.5 rounded-xl bg-[#F35E50] hover:bg-[#e04b3d] text-white text-xs font-black inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Upload Konten Mandiri / Link Baru
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {visibleFinished.map((item) => {
            const files = getPrimaryFiles(item);
            const links = getPublishedLinks(item);
            const formatMeta = getFormatMeta(item.contentType);
            const themeText = getThemeText(item.themeId, item.themeLabel);
            const fromRaw = hasRawOrigin(item);
            const postText = buildPostText(item);
            const isAddingLink = openAddLinkCardId === item.id;

            return (
              <div
                key={item.id}
                className="bg-white border-2 border-[#1A3460] rounded-3xl p-5 shadow-md hover:shadow-xl transition flex flex-col justify-between gap-4"
              >
                <div className="space-y-3.5">
                  {/* Asal Konten & Format */}
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {fromRaw ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-black bg-indigo-50 text-indigo-900 border border-indigo-300">
                          <FolderOpen className="w-3 h-3" />
                          Hasil Edit Bahan Mentah
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-black bg-amber-100 text-[#1A3460] border border-amber-300">
                          <Sparkles className="w-3 h-3 text-[#F35E50]" />
                          Konten Mandiri
                        </span>
                      )}

                      {formatMeta.label && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-[#FFF8F3] border border-[#1A3460]/15 text-[#1A3460]">
                          {formatMeta.code ? `[${formatMeta.code}] ` : ""}
                          {formatMeta.label}
                        </span>
                      )}
                    </div>

                    <span className="text-[10px] font-bold text-slate-400">
                      {timeAgo(item.publishedAt || item.updatedAt)}
                    </span>
                  </div>

                  {/* Tema Jadwal */}
                  {themeText && (
                    <div className="inline-block text-[11px] font-black px-2.5 py-0.5 rounded-lg bg-[#F3BC6F]/30 text-[#1A3460] border border-[#F3BC6F]">
                      📅 {themeText}
                    </div>
                  )}

                  {/* Pratinjau Media Konten (jika berkas diunggah) */}
                  {files.length > 0 && (
                    <MediaPreview
                      files={files}
                      badgeLabel="Konten Jadi"
                      heightClass="h-44"
                      downloadBaseName={`konten-${item.id.slice(-5)}`}
                    />
                  )}

                  {/* Judul & Caption Singkat */}
                  <div className="space-y-1.5">
                    <h3
                      onClick={() => onSelectContent(item)}
                      className="font-black text-[#1A3460] text-sm leading-snug hover:text-[#F35E50] cursor-pointer transition line-clamp-2"
                    >
                      {item.title}
                    </h3>

                    {postText && (
                      <div className="p-2.5 rounded-xl bg-[#FFF8F3] border border-[#1A3460]/10 space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-black text-[#1A3460]/70">
                          <span>CAPTION & HASHTAG</span>
                          <button
                            type="button"
                            onClick={async () => {
                              await copyText(postText);
                              setCopiedId(`cap_${item.id}`);
                              toast("Caption + hashtag disalin!");
                              setTimeout(() => setCopiedId(null), 1500);
                            }}
                            className="text-[#F35E50] hover:underline inline-flex items-center gap-1 cursor-pointer"
                          >
                            {copiedId === `cap_${item.id}` ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            <span>Salin Caption</span>
                          </button>
                        </div>
                        <p className="text-[11px] text-[#1A3460] line-clamp-2 whitespace-pre-line font-medium">
                          {item.caption}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* ==========================================================
                      DAFTAR LINK PLATFORM TEMPAT KONTEN TELAH DIUPLOAD
                     ========================================================== */}
                  <div className="rounded-2xl bg-emerald-50/70 border-2 border-emerald-300 p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-black text-emerald-950 flex items-center gap-1.5">
                        <Link2 className="w-3.5 h-3.5 text-emerald-700" />
                        Link Platform Terupload ({links.length})
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          if (isAddingLink) {
                            setOpenAddLinkCardId(null);
                          } else {
                            setOpenAddLinkCardId(item.id);
                            setNewLinkUrl("");
                            setNewLinkPlatform("INSTAGRAM");
                          }
                        }}
                        className="px-2 py-0.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>{isAddingLink ? "Tutup" : "Tambah Link"}</span>
                      </button>
                    </div>

                    {links.length === 0 ? (
                      <p className="text-[11px] text-emerald-900/70 italic py-1">
                        Belum ada link platform. Klik <strong>+ Tambah Link</strong> setelah konten diupload ke IG / TikTok / FB / YouTube.
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {links.map((lnk) => {
                          const pBadge = getPlatformBadge(lnk.platform);
                          return (
                            <div
                              key={lnk.id}
                              className="flex items-center justify-between gap-1.5 p-2 rounded-xl bg-white border border-emerald-200 text-xs"
                            >
                              <a
                                href={lnk.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 min-w-0 flex-1 group"
                                title={lnk.url}
                              >
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] border shrink-0 ${pBadge.className}`}
                                >
                                  {pBadge.icon}
                                  {pBadge.label}
                                </span>
                                <span className="text-[11px] font-semibold text-[#1A3460] group-hover:text-[#F35E50] group-hover:underline truncate">
                                  {lnk.url.replace(/^https?:\/\/(www\.)?/i, "")}
                                </span>
                                <ExternalLink className="w-3 h-3 text-emerald-700 shrink-0" />
                              </a>

                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await copyText(lnk.url);
                                    toast(`Link ${pBadge.label} disalin!`);
                                  }}
                                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-[#1A3460] cursor-pointer"
                                  title="Salin link"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  disabled={busyId === `${item.id}_${lnk.id}`}
                                  onClick={() =>
                                    handleRemoveLink(item, lnk.id)
                                  }
                                  className="p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 cursor-pointer disabled:opacity-40"
                                  title="Hapus link ini"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Form Inline Tambah Link Platform Baru */}
                    {isAddingLink && (
                      <form
                        onSubmit={(e) => handleQuickAddLink(e, item)}
                        className="pt-2 border-t border-emerald-200 space-y-2"
                      >
                        <div className="flex gap-1.5">
                          <select
                            value={newLinkPlatform}
                            onChange={(e) => setNewLinkPlatform(e.target.value)}
                            className="px-2 py-1.5 rounded-xl bg-white border border-emerald-300 text-[11px] font-black text-[#1A3460] shrink-0"
                          >
                            {PLATFORM_OPTIONS.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.label}
                              </option>
                            ))}
                          </select>
                          <input
                            type="url"
                            required
                            value={newLinkUrl}
                            onChange={(e) => {
                              const val = e.target.value;
                              setNewLinkUrl(val);
                              const auto = detectPlatformFromUrl(val);
                              if (auto !== "WEBSITE" || val.trim()) {
                                setNewLinkPlatform(auto);
                              }
                            }}
                            placeholder="https://www.instagram.com/reel/..."
                            className="flex-1 min-w-0 px-2.5 py-1.5 rounded-xl bg-white border border-emerald-300 text-xs text-[#1A3460] font-medium focus:outline-none focus:border-emerald-600"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={savingLinkCardId === item.id}
                          className="w-full py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black cursor-pointer disabled:opacity-50"
                        >
                          {savingLinkCardId === item.id
                            ? "Menyimpan..."
                            : "Simpan Link Platform"}
                        </button>
                      </form>
                    )}
                  </div>
                </div>

                {/* Footer Kartu: PIC/Pembuat & Tombol Detail */}
                <div className="pt-2.5 border-t border-[#1A3460]/10 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={
                        (item.assignedTo || item.createdBy)?.avatar ||
                        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
                      }
                      alt=""
                      className="w-6 h-6 rounded-full object-cover border border-[#F3BC6F] shrink-0"
                    />
                    <span className="text-[11px] font-bold text-[#1A3460] truncate">
                      {(item.assignedTo || item.createdBy)?.name || "Tim"}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectContent(item)}
                    className="text-xs font-black text-[#1A3460]/75 hover:text-[#F35E50] cursor-pointer"
                  >
                    Edit Detail / Kelola →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* =====================================================================
          MODAL UPLOAD HASIL EDIT DARI BAHAN MENTAH YANG SEDANG DIAMBIL
         ===================================================================== */}
      {editingClaimedItem && (
        <div className="fixed inset-0 z-50 bg-[#1A3460]/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border-2 border-[#1A3460] rounded-3xl w-full max-w-2xl p-5 sm:p-6 shadow-2xl space-y-4 my-auto">
            <div className="flex items-start justify-between gap-3 border-b border-[#1A3460]/10 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#F35E50] text-white">
                  Upload Hasil Edit dari Bahan Mentah
                </span>
                <h3 className="font-black text-[#1A3460] text-base sm:text-lg mt-1">
                  {editingClaimedItem.title}
                </h3>
                <p className="text-[11px] text-slate-500 font-semibold">
                  Unggah berkas hasil edit dan/atau tempelkan link platform tempat konten ini sudah diupload.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingClaimedItem(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handleSubmitEditedResult}
              className="space-y-4 max-h-[75vh] overflow-y-auto pr-1"
            >
              {/* Upload File Hasil Edit */}
              <div className="bg-[#FFF8F3] border-2 border-[#F3BC6F] rounded-2xl p-4">
                <MultiFileUpload
                  label="🎬 Berkas Hasil Edit (Video MP4 / Slide Carousel PNG-JPG / Link Canva)"
                  helperText="Opsional jika Anda hanya ingin langsung menempelkan link platform tayang di bawah."
                  files={resultFiles}
                  onChange={setResultFiles}
                />
              </div>

              {/* Caption */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-[#1A3460]">
                    Caption Postingan Medsos (Opsional)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const tags = getRequiredHashtags(editingClaimedItem);
                      if (!resultCaption.includes("#paudArjunaMalang")) {
                        setResultCaption((prev) =>
                          prev.trim() ? `${prev.trim()}\n\n${tags}` : tags
                        );
                      }
                    }}
                    className="text-[11px] font-black text-[#F35E50] hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Hash className="w-3 h-3" />+ Sisipkan Hashtag Wajib
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={resultCaption}
                  onChange={(e) => setResultCaption(e.target.value)}
                  placeholder="Tulis caption hangat sesuai gaya bahasa PAUD Arjuna Malang..."
                  className="w-full p-3 text-xs rounded-xl bg-[#FFF8F3] border-2 border-[#1A3460]/15 text-[#1A3460] font-medium focus:outline-none focus:border-[#F35E50]"
                />
              </div>

              {/* Multi-Link Platform Tayang */}
              <div className="rounded-2xl bg-emerald-50/70 border-2 border-emerald-300 p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                    <Link2 className="w-4 h-4 text-emerald-700" />
                    Link Platform Tempat Konten Diupload (Bisa Banyak Link)
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setResultLinks((prev) => [
                        ...prev,
                        { platform: "TIKTOK", url: "" },
                      ])
                    }
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    Tambah Baris Link
                  </button>
                </div>

                <div className="space-y-2">
                  {resultLinks.map((row, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <select
                        value={row.platform}
                        onChange={(e) =>
                          setResultLinks((prev) =>
                            prev.map((r, i) =>
                              i === idx ? { ...r, platform: e.target.value } : r
                            )
                          )
                        }
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
                        value={row.url}
                        onChange={(e) => {
                          const val = e.target.value;
                          const auto = detectPlatformFromUrl(val);
                          setResultLinks((prev) =>
                            prev.map((r, i) =>
                              i === idx
                                ? {
                                    platform:
                                      val.trim() && auto !== "WEBSITE"
                                        ? auto
                                        : r.platform,
                                    url: val,
                                  }
                                : r
                            )
                          );
                        }}
                        placeholder="https://www.instagram.com/reel/... atau link TikTok/FB/YT"
                        className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-white border border-emerald-300 text-xs text-[#1A3460] font-medium focus:outline-none focus:border-emerald-600"
                      />
                      {resultLinks.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setResultLinks((prev) =>
                              prev.filter((_, i) => i !== idx)
                            )
                          }
                          className="p-2 rounded-xl hover:bg-rose-100 text-rose-600 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-emerald-900/75 font-medium">
                  Kosongkan dulu jika konten belum diupload ke medsos — Anda bisa menambahkan link kapan saja nanti.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1A3460]/10">
                <button
                  type="button"
                  onClick={() => setEditingClaimedItem(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit}
                  className="px-5 py-2.5 rounded-xl bg-[#F35E50] hover:bg-[#e04b3d] text-white font-black text-xs shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {submittingEdit ? "Menyimpan..." : "Simpan Hasil Edit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
