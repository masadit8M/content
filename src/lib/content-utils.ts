/**
 * Helper murni (tanpa JSX) untuk Bank Konten PAUD Arjuna:
 * - Alur sederhana 2 tahap: Bahan Mentah (Bebas / Diambil untuk Diedit) -> Konten Jadi & Link Platform Tayang
 * - Multi-link platform tayang (Instagram, TikTok, Facebook, YouTube, Website/Lainnya)
 * - Berkas media, opsi format, dan teks caption siap-salin.
 */
import { BRAND } from "./brand";
import { getPlanItem } from "./marketing-plan";

// ---------------------------------------------------------------------------------------
// TAHAP ALUR SEDERHANA (2 TAB KONTEN)
// ---------------------------------------------------------------------------------------

export type Stage = "RAW" | "CLAIMED_RAW" | "READY" | "LIVE";

export interface MediaFile {
  url: string;
  name?: string;
  type?: string;
  size?: number;
}

export interface PublishedLink {
  id: string;
  platform: string; // "INSTAGRAM" | "TIKTOK" | "FACEBOOK" | "YOUTUBE" | "WEBSITE"
  url: string;
  label?: string;
  addedBy?: string;
  addedAt?: string;
}

export const STAGE_META: Record<
  Stage,
  { label: string; short: string; emoji: string; chip: string }
> = {
  RAW: {
    label: "Bahan Mentah (Tersedia)",
    short: "Bahan Mentah",
    emoji: "📁",
    chip: "bg-emerald-50 text-emerald-800 border-emerald-300",
  },
  CLAIMED_RAW: {
    label: "Sedang Diambil untuk Diedit",
    short: "Sedang Diedit",
    emoji: "🔒",
    chip: "bg-amber-50 text-amber-900 border-amber-300",
  },
  READY: {
    label: "Konten Jadi (Belum Ada Link)",
    short: "Konten Jadi",
    emoji: "🎬",
    chip: "bg-blue-50 text-blue-800 border-blue-300",
  },
  LIVE: {
    label: "Sudah Diupload ke Platform",
    short: "Sudah Upload",
    emoji: "🚀",
    chip: "bg-emerald-50 text-emerald-800 border-emerald-300",
  },
};

/**
 * Apakah item masih berada di tahap Bahan Mentah (belum menjadi konten jadi)?
 * Mencakup status RAW_MATERIAL / IDEA, maupun status legacy sebelum ada hasil edit / link tayang.
 */
export function isRawMaterialStage(c: any): boolean {
  const s = String(c?.status || "").toUpperCase();
  if (s === "RAW_MATERIAL" || s === "IDEA" || s === "") return true;
  if (s === "IN_EDITING" || s === "IN_PREPARATION") {
    return getEditedFiles(c).length === 0 && getPublishedLinks(c).length === 0;
  }
  return false;
}

/** Apakah item berasal dari unggahan Bahan Mentah (Guru/Bunda atau Referensi)? */
export function hasRawOrigin(c: any): boolean {
  if (getRawFiles(c).length > 0) return true;
  const origin = String(c?.origin || "").toUpperCase();
  return origin === "FIELD" || origin === "REFERENCE";
}

/** Status yang tersimpan di data → tahap tampilan. */
export function getStage(c: any): Stage {
  if (isRawMaterialStage(c)) {
    return c?.assignedToId ? "CLAIMED_RAW" : "RAW";
  }
  if (
    getPublishedLinks(c).length > 0 ||
    String(c?.status || "").toUpperCase() === "PUBLISHED"
  ) {
    return "LIVE";
  }
  return "READY";
}

// ---------------------------------------------------------------------------------------
// PERAN (hanya dipakai untuk hak hapus item milik orang lain / badge akun)
// ---------------------------------------------------------------------------------------

export function isReviewerRole(role?: string | null): boolean {
  const r = String(role || "").toUpperCase();
  return r === "LEAD" || r === "ADMIN";
}

// ---------------------------------------------------------------------------------------
// MULTI-LINK PLATFORM TAYANG
// ---------------------------------------------------------------------------------------

export function detectPlatformFromUrl(url?: string | null): string {
  const u = String(url || "").toLowerCase();
  if (!u) return "INSTAGRAM";
  if (u.includes("instagram.com") || u.includes("instagr.am")) return "INSTAGRAM";
  if (u.includes("tiktok.com")) return "TIKTOK";
  if (u.includes("facebook.com") || u.includes("fb.watch") || u.includes("fb.com")) {
    return "FACEBOOK";
  }
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "YOUTUBE";
  return "WEBSITE";
}

/** Ambil daftar semua link platform tempat konten ini telah diupload (termasuk fallback liveUrl lama). */
export function getPublishedLinks(c: any): PublishedLink[] {
  const raw = c?.publishedLinks;
  let parsed: any[] = [];

  if (Array.isArray(raw)) {
    parsed = raw;
  } else if (typeof raw === "string" && raw.trim()) {
    try {
      const json = JSON.parse(raw);
      if (Array.isArray(json)) parsed = json;
    } catch {
      parsed = [];
    }
  }

  const valid: PublishedLink[] = parsed
    .filter((item) => item && typeof item.url === "string" && item.url.trim())
    .map((item, idx) => {
      const cleanUrl = item.url.trim();
      const detected = detectPlatformFromUrl(cleanUrl);
      return {
        id: String(item.id || `lnk_${idx}_${cleanUrl.slice(-8)}`),
        platform: String(
          item.platform ||
            (detected !== "WEBSITE" ? detected : c?.platform || "INSTAGRAM")
        ).toUpperCase(),
        url: cleanUrl,
        label: item.label ? String(item.label) : undefined,
        addedBy: item.addedBy ? String(item.addedBy) : undefined,
        addedAt: item.addedAt ? String(item.addedAt) : undefined,
      };
    });

  if (valid.length > 0) return valid;

  // Fallback data lama yang hanya menyimpan satu liveUrl
  const legacyUrl = typeof c?.liveUrl === "string" ? c.liveUrl.trim() : "";
  if (legacyUrl) {
    const detected = detectPlatformFromUrl(legacyUrl);
    return [
      {
        id: "legacy_live",
        platform:
          detected !== "WEBSITE"
            ? detected
            : String(c?.platform || "INSTAGRAM").toUpperCase(),
        url: legacyUrl,
      },
    ];
  }

  return [];
}

/** Konversi array link platform ke field penyimpanan konten + status otomatis. */
export function linksToFields(links: PublishedLink[]) {
  const cleaned = links
    .filter((l) => l && typeof l.url === "string" && l.url.trim())
    .map((l) => ({
      ...l,
      url: l.url.trim(),
      platform: String(l.platform || detectPlatformFromUrl(l.url)).toUpperCase(),
    }));

  const hasLinks = cleaned.length > 0;
  const out: Record<string, unknown> = {
    publishedLinks: hasLinks ? JSON.stringify(cleaned) : null,
    liveUrl: cleaned[0]?.url ?? null,
    status: hasLinks ? "PUBLISHED" : "READY_TO_PUBLISH",
  };
  if (cleaned[0]?.platform) {
    out.platform = cleaned[0].platform;
  }
  return out;
}

/** Apakah item cocok dengan filter platform (memeriksa platform utama MAUPUN semua publishedLinks). */
export function matchesContentPlatform(c: any, selectedPlatform: string): boolean {
  if (!selectedPlatform || selectedPlatform === "ALL") return true;
  const target = selectedPlatform.toUpperCase();
  if (String(c?.platform || "").toUpperCase() === target) return true;
  return getPublishedLinks(c).some((l) => l.platform.toUpperCase() === target);
}

// ---------------------------------------------------------------------------------------
// FILE MEDIA
// ---------------------------------------------------------------------------------------

function parseFiles(v: any): MediaFile[] {
  if (!v) return [];
  let arr: any = v;
  if (typeof v === "string") {
    try {
      arr = JSON.parse(v);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(arr)) return [];
  return arr.filter((f) => f && typeof f.url === "string" && f.url);
}

export function getRawFiles(c: any): MediaFile[] {
  const files = parseFiles(c?.rawFiles);
  if (files.length) return files;
  const url = c?.rawAssetUrl || c?.assetUrl;
  return url
    ? [{ url, name: c?.rawAssetName || c?.assetName, type: c?.rawAssetType }]
    : [];
}

export function getEditedFiles(c: any): MediaFile[] {
  const files = parseFiles(c?.editedFiles);
  if (files.length) return files;
  const url = c?.editedAssetUrl;
  return url
    ? [{ url, name: c?.editedAssetName, type: c?.editedAssetType }]
    : [];
}

/** Hasil jadi jika ada, jika tidak bahan mentah — untuk thumbnail & unduhan. */
export function getPrimaryFiles(c: any): MediaFile[] {
  const edited = getEditedFiles(c);
  return edited.length ? edited : getRawFiles(c);
}

export type MediaKind = "video" | "image" | "link" | "other";

export function detectMediaKind(file?: MediaFile | null): MediaKind {
  if (!file?.url) return "other";
  const url = file.url;
  const type = String(file.type || "").toLowerCase();

  if (type.startsWith("video") || type === "video") return "video";
  if (type.startsWith("image") || type === "image") return "image";
  if (url.startsWith("data:video/")) return "video";
  if (url.startsWith("data:image/")) return "image";

  if (
    /drive\.google\.com|docs\.google\.com|canva\.com|dropbox\.com|youtu\.?be|instagram\.com|tiktok\.com|facebook\.com|icloud\.com|onedrive|1drv\.ms/i.test(
      url
    )
  ) {
    return "link";
  }
  const path = url.split("?")[0];
  if (/\.(mp4|webm|mov|m4v|ogg)$/i.test(path)) return "video";
  if (/\.(jpe?g|png|webp|gif|avif|svg)$/i.test(path)) return "image";
  if (/images\.unsplash\.com/i.test(url)) return "image";
  if (type === "link") return "link";
  return "other";
}

export function fileLabel(file: MediaFile, index = 0): string {
  if (file.name) return file.name;
  const kind = detectMediaKind(file);
  if (kind === "link") return "Tautan Referensi / Cloud";
  const tail = file.url.split("?")[0].split("/").pop();
  return tail && !file.url.startsWith("data:")
    ? decodeURIComponent(tail)
    : `Berkas ${index + 1}`;
}

export function formatBytes(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Ubah daftar file menjadi kolom-kolom yang disimpan di konten (JSON + kolom tunggal kompatibilitas). */
export function filesToFields(kind: "raw" | "edited", files: MediaFile[]) {
  const first = files[0];
  const mediaType = first ? detectMediaKind(first).toUpperCase() : null;
  if (kind === "raw") {
    return {
      rawFiles: files.length ? JSON.stringify(files) : null,
      rawAssetUrl: first?.url ?? null,
      rawAssetName: first ? fileLabel(first) : null,
      rawAssetType: mediaType,
      assetUrl: first?.url ?? null,
      assetName: first ? fileLabel(first) : null,
    };
  }
  return {
    editedFiles: files.length ? JSON.stringify(files) : null,
    editedAssetUrl: first?.url ?? null,
    editedAssetName: first ? fileLabel(first) : null,
    editedAssetType: mediaType,
  };
}

// ---------------------------------------------------------------------------------------
// PLATFORM & FORMAT (kode format mengikuti tabel IX di Excel)
// ---------------------------------------------------------------------------------------

export const PLATFORM_OPTIONS = [
  { id: "INSTAGRAM", label: "Instagram" },
  { id: "TIKTOK", label: "TikTok" },
  { id: "FACEBOOK", label: "Facebook" },
  { id: "YOUTUBE", label: "YouTube" },
  { id: "WEBSITE", label: "Website / Lainnya" },
];

export const FORMAT_OPTIONS = [
  { id: "REELS", code: "R", label: "Reel / Video Pendek", hint: "Lagu + gerakan + teks manfaat" },
  { id: "FEED_CAROUSEL", code: "C", label: "Carousel / Slide", hint: "Beberapa slide gambar" },
  { id: "VIDEO_TUTORIAL", code: "V", label: "Video Panjang / Tutorial", hint: "Cara/langkah kegiatan" },
  { id: "STORY", code: "S", label: "Story", hint: "Tayang 24 jam" },
  { id: "REEL_TREND", code: "RD", label: "Reel Duet / Trend", hint: "Mengikuti tren" },
  { id: "BANNER", code: "", label: "Poster / Flyer", hint: "Satu gambar statis" },
];

const LEGACY_FORMATS: Record<string, { code: string; label: string }> = {
  TIKTOK_VIDEO: { code: "R", label: "Video TikTok" },
  YOUTUBE_VIDEO: { code: "V", label: "Video YouTube" },
  ARTICLE: { code: "", label: "Artikel" },
};

export function getFormatMeta(id?: string | null): { code: string; label: string } {
  const found = FORMAT_OPTIONS.find((f) => f.id === id);
  if (found) return { code: found.code, label: found.label };
  if (id && LEGACY_FORMATS[id]) return LEGACY_FORMATS[id];
  return { code: "", label: (id || "").replace(/_/g, " ") };
}

// ---------------------------------------------------------------------------------------
// CAPTION & HASHTAG
// ---------------------------------------------------------------------------------------

/** Hashtag khusus tema (mis. #spmb) + hashtag wajib brand. */
export function getRequiredHashtags(c: any): string {
  const extra = getPlanItem(c?.themeId)?.hashtags || [];
  return [...extra, BRAND.defaultHashtags].join(" ");
}

/** Teks final siap tempel ke medsos: caption + hashtag (ditambahkan otomatis jika belum ada). */
export function buildPostText(c: any): string {
  const caption = String(c?.caption || "").trim();
  if (!caption) return "";
  const hasTags = /#paudArjunaMalang/i.test(caption);
  return hasTags ? caption : `${caption}\n\n${getRequiredHashtags(c)}`;
}

// ---------------------------------------------------------------------------------------
// WAKTU
// ---------------------------------------------------------------------------------------

export function timeAgo(value?: string | Date | null): string {
  if (!value) return "";
  const t = new Date(value).getTime();
  if (Number.isNaN(t)) return "";
  const diff = Math.max(0, Date.now() - t);
  const min = Math.floor(diff / 60000);
  if (min < 1) return "baru saja";
  if (min < 60) return `${min} menit lalu`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} jam lalu`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day} hari lalu`;
  return new Date(value).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function parseDateOnly(value?: string | Date | null): Date | null {
  if (!value) return null;
  if (typeof value === "string") {
    const m = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? null
    : new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Nilai untuk <input type="date"> (YYYY-MM-DD) dari tanggal tersimpan. */
export function toDateInputValue(value?: string | Date | null): string {
  const d = parseDateOnly(value);
  if (!d) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function formatDateOnly(
  value?: string | Date | null,
  withWeekday = false
): string {
  const d = parseDateOnly(value);
  if (!d) return "";
  return d.toLocaleDateString("id-ID", {
    weekday: withWeekday ? "short" : undefined,
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
