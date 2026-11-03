/**
 * Aksi alur Bank Konten dari sisi klien. Setiap perpindahan tahap = satu PATCH + satu baris riwayat
 * (komentar kind "LOG") agar siapa pun bisa menelusuri siapa melakukan apa.
 */

export interface ActionResult {
  ok: boolean;
  error?: string;
  content?: any;
}

interface Actor {
  id: string;
  name: string;
  role?: string;
}

async function request(url: string, method: string, body?: unknown): Promise<ActionResult> {
  try {
    const res = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data?.error || `Permintaan gagal (${res.status})` };
    return { ok: true, content: data?.content };
  } catch {
    return { ok: false, error: "Tidak dapat terhubung ke server. Periksa koneksi internet Anda." };
  }
}

export function patchContent(id: string, fields: Record<string, unknown>): Promise<ActionResult> {
  return request(`/api/contents/${id}`, "PATCH", fields);
}

export function createContent(fields: Record<string, unknown>): Promise<ActionResult> {
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
  return request(`/api/contents/${id}/comments`, "POST", { message, taggedUserId, kind });
}

/** Ubah field lalu catat riwayat. Riwayat gagal tidak menggagalkan aksi utama. */
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

/** "Ambil untuk diolah": menandai siapa yang sedang mengerjakan bahan agar tidak diedit dobel. */
export function claimMaterial(content: any, user: Actor) {
  return transition(content, { assignedToId: user.id }, `✋ ${user.name} mengambil bahan ini untuk diolah.`);
}

export function releaseClaim(content: any, user: Actor) {
  return transition(content, { assignedToId: null }, `↩ ${user.name} melepas bahan ini — bisa diambil anggota lain.`);
}

export function approveContent(content: any, user: Actor) {
  return transition(
    content,
    { status: "READY_TO_PUBLISH", revisionNote: null },
    `✅ ${user.name} menyetujui konten ini — masuk Siap Upload.`
  );
}

export function requestRevision(content: any, user: Actor, note: string) {
  const owner = content.assignedTo || content.createdBy;
  const tag = owner?.name && owner.id !== user.id ? `@${owner.name} ` : "";
  return transition(
    content,
    { status: "NEED_REVISION", revisionNote: note.trim() },
    `🔁 ${user.name} meminta perbaikan ${tag}— ${note.trim()}`,
    owner && owner.id !== user.id ? owner.id : null
  );
}

export function markLive(content: any, user: Actor, liveUrl: string, liveNote?: string) {
  return transition(
    content,
    { status: "PUBLISHED", liveUrl: liveUrl.trim(), liveNote: liveNote?.trim() || null },
    `🎉 ${user.name} menandai konten ini sudah tayang: ${liveUrl.trim()}`
  );
}

export function returnToReview(content: any, user: Actor) {
  return transition(
    content,
    { status: "IN_REVIEW" },
    `↩ ${user.name} mengembalikan konten ke tahap Hasil & Usulan untuk ditinjau ulang.`
  );
}

export function revertLive(content: any, user: Actor) {
  return transition(
    content,
    { status: "READY_TO_PUBLISH", liveUrl: null, liveNote: null, publishedAt: null },
    `↩ ${user.name} membatalkan status tayang — konten kembali ke Siap Upload.`
  );
}

/** Simpan hasil edit / usulan ke konten yang sudah ada (menggantikan hasil sebelumnya jika ada). */
export function attachResult(
  content: any,
  user: Actor,
  fields: Record<string, unknown>,
  info: { version: number; files: number; skipReview: boolean }
) {
  const verText = info.version > 1 ? `versi ${info.version}` : "hasil edit";
  const next = info.skipReview ? "langsung masuk Siap Upload" : "menunggu review";
  return transition(
    content,
    fields,
    `🎬 ${user.name} mengunggah ${verText} (${info.files} berkas) — ${next}.`
  );
}
