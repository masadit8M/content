/**
 * Aksi alur Bank Konten PAUD Arjuna dari sisi klien:
 * 1. Ambil Bahan Mentah (mencatat siapa user yang mengambil + waktu klaim -> membuat kartu blur di Tab 1)
 * 2. Kembalikan ke Bahan Mentah (membatalkan klaim -> kartu kembali aktif di Tab 1)
 * 3. Upload Hasil Edit dari Bahan Mentah -> pindah ke Tab 2 (Upload Konten & Link Tayang)
 * 4. Tambah / hapus link platform tayang (Instagram, TikTok, Facebook, YouTube, Website)
 */
import {
  PublishedLink,
  getPublishedLinks,
  linksToFields,
  detectPlatformFromUrl,
} from "./content-utils";

export interface ActionResult {
  ok: boolean;
  error?: string;
  content?: any;
}

export interface Actor {
  id: string;
  name: string;
  role?: string;
}

async function request(
  url: string,
  method: string,
  body?: unknown
): Promise<ActionResult> {
  try {
    const res = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        ok: false,
        error: data?.error || `Permintaan gagal (${res.status})`,
      };
    }
    return { ok: true, content: data?.content };
  } catch {
    return {
      ok: false,
      error: "Tidak dapat terhubung ke server. Periksa koneksi internet Anda.",
    };
  }
}

export function patchContent(
  id: string,
  fields: Record<string, unknown>
): Promise<ActionResult> {
  return request(`/api/contents/${id}`, "PATCH", fields);
}

export function createContent(
  fields: Record<string, unknown>
): Promise<ActionResult> {
  return request("/api/contents", "POST", fields);
}

export function deleteContent(id: string): Promise<ActionResult> {
  return request(`/api/contents/${id}`, "DELETE");
}

export function postComment(
  id: string,
  message: string,
  taggedUserId?: string | null,
  kind: "COMMENT" | "LOG" = "COMMENT"
): Promise<ActionResult> {
  return request(`/api/contents/${id}/comments`, "POST", {
    message,
    taggedUserId,
    kind,
  });
}

/** Ubah field lalu catat riwayat otomatis (LOG). */
async function transition(
  content: any,
  fields: Record<string, unknown>,
  logMessage: string,
  taggedUserId?: string | null
): Promise<ActionResult> {
  const res = await patchContent(content.id, fields);
  if (!res.ok) return res;
  await postComment(content.id, logMessage, taggedUserId, "LOG");
  return res;
}

/**
 * Klik "Ambil Bahan" di Tab 1:
 * Mencatat siapa user yang mengambil untuk diedit. Di Tab 1 bahan mentah otomatis blur & terkunci,
 * dan masuk ke daftar "Bahan Mentah yang Sedang Diambil" di Tab 2.
 */
export function claimMaterial(
  content: any,
  actor: Actor,
  targetUser?: Actor
) {
  const assignee = targetUser || actor;
  const now = new Date().toISOString();
  const logMsg =
    assignee.id === actor.id
      ? `🔒 ${actor.name} mengambil bahan mentah ini untuk diedit.`
      : `🔒 ${actor.name} menandai bahan mentah ini diambil oleh @${assignee.name} untuk diedit.`;

  return transition(
    content,
    {
      status: "RAW_MATERIAL",
      assignedToId: assignee.id,
      claimedAt: now,
    },
    logMsg,
    assignee.id !== actor.id ? assignee.id : null
  );
}

/**
 * Klik "Kembalikan ke Bahan Mentah" di Tab 2 (jika tidak jadi diedit):
 * Membuka kunci & menghilangkan blur di Tab 1 sehingga bisa diambil anggota lain.
 */
export function returnToRawMaterial(content: any, actor: Actor) {
  return transition(
    content,
    {
      status: "RAW_MATERIAL",
      assignedToId: null,
      claimedAt: null,
    },
    `↩ ${actor.name} mengembalikan bahan ini ke Tab Bahan Mentah (batal diedit — kembali bebas diambil).`
  );
}

/**
 * Unggah Hasil Edit dari Bahan Mentah yang sedang diambil -> masuk ke daftar Konten di Tab 2.
 */
export function submitEditedFromRaw(
  content: any,
  actor: Actor,
  fields: Record<string, unknown>,
  linkCount: number
) {
  const linkInfo =
    linkCount > 0 ? ` beserta ${linkCount} link platform tayang` : "";
  return transition(
    content,
    fields,
    `🎬 ${actor.name} mengunggah hasil edit dari bahan mentah${linkInfo}.`
  );
}

/** Tambah 1 link platform baru ke konten di Tab 2. */
export function addPlatformLink(
  content: any,
  actor: Actor,
  input: { platform?: string; url: string; label?: string }
) {
  const cleanUrl = input.url.trim();
  const detected = detectPlatformFromUrl(cleanUrl);
  const platform = String(
    input.platform || (detected !== "WEBSITE" ? detected : "INSTAGRAM")
  ).toUpperCase();

  const existing = getPublishedLinks(content);
  const newLink: PublishedLink = {
    id: `lnk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    platform,
    url: cleanUrl,
    label: input.label?.trim() || undefined,
    addedBy: actor.name,
    addedAt: new Date().toISOString(),
  };

  const nextLinks = [...existing, newLink];
  return transition(
    content,
    {
      ...linksToFields(nextLinks),
      publishedAt: content.publishedAt || new Date().toISOString(),
    },
    `🔗 ${actor.name} menambahkan link ${platform}: ${cleanUrl}`
  );
}

/** Hapus 1 link platform dari konten di Tab 2. */
export function removePlatformLink(
  content: any,
  actor: Actor,
  linkId: string
) {
  const existing = getPublishedLinks(content);
  const removed = existing.find((l) => l.id === linkId);
  const nextLinks = existing.filter((l) => l.id !== linkId);

  return transition(
    content,
    linksToFields(nextLinks),
    `🗑️ ${actor.name} menghapus link ${removed?.platform || "platform"} (${
      removed?.url || ""
    }).`
  );
}
