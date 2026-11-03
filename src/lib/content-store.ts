import { createClient } from "@supabase/supabase-js";
import { findTeamMember } from "./team-data";

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

const BUCKET_NAME = process.env.SUPABASE_STORAGE_BUCKET || "Media";
const CONTENTS_FILE_PATH = "_data/contents.json";

// In-memory cache for ultra-fast response within lambda life cycle
let memoryCache: any[] | null = null;
let lastCacheTime = 0;
const CACHE_TTL = 3000; // 3 seconds

/**
 * Kolom konten yang boleh diubah lewat API. Bidang lain (id, createdBy, comments, dst.)
 * tidak bisa ditimpa dari request.
 */
const CONTENT_FIELDS = [
  "title",
  "description",
  "platform",
  "contentType",
  "status",
  "themeId",
  "themeLabel",
  "origin",
  "caption",
  "prepNotes",
  "rawFiles",
  "rawAssetUrl",
  "rawAssetName",
  "rawAssetType",
  "assetUrl",
  "assetName",
  "editedFiles",
  "editedAssetUrl",
  "editedAssetName",
  "editedAssetType",
  "revisionNote",
  "version",
  "liveUrl",
  "publishedLinks",
  "liveNote",
  "publishedAt",
  "claimedAt",
  "targetDate",
  "assignedToId",
] as const;

const DATE_FIELDS = new Set(["publishedAt", "targetDate", "claimedAt"]);
const JSON_FIELDS = new Set(["rawFiles", "editedFiles", "publishedLinks"]);

/** Ambil hanya bidang yang diizinkan dan rapikan nilainya (array → JSON, "" → null). */
function pickContentFields(input: any): Record<string, any> {
  const out: Record<string, any> = {};
  if (!input || typeof input !== "object") return out;

  for (const key of CONTENT_FIELDS) {
    if (!(key in input)) continue;
    let value = input[key];

    if (JSON_FIELDS.has(key) && Array.isArray(value)) {
      value = value.length ? JSON.stringify(value) : null;
    }
    if (key === "version") {
      value = Number(value) || 1;
    } else if (typeof value === "string" && value.trim() === "") {
      value = null;
    }
    out[key] = value === undefined ? null : value;
  }
  return out;
}

/** Bentuk data untuk tabel Prisma (tanggal berupa Date). */
function toPrismaData(fields: Record<string, any>): Record<string, any> {
  const data: Record<string, any> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (DATE_FIELDS.has(key)) {
      data[key] = value ? new Date(value) : null;
    } else {
      data[key] = value;
    }
  }
  return data;
}

export async function getAllContents(): Promise<any[]> {
  const now = Date.now();
  if (memoryCache && now - lastCacheTime < CACHE_TTL) {
    return memoryCache;
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      let { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .download(CONTENTS_FILE_PATH);

      // Fallback if bucket name has different case
      if (error && (BUCKET_NAME === "Media" || BUCKET_NAME === "media")) {
        const alt = BUCKET_NAME === "Media" ? "media" : "Media";
        const altRes = await supabase.storage.from(alt).download(CONTENTS_FILE_PATH);
        if (!altRes.error && altRes.data) {
          data = altRes.data;
          error = null;
        }
      }

      if (!error && data) {
        const text = await data.text();
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          memoryCache = parsed;
          lastCacheTime = now;
          return parsed;
        }
      }
    } catch (err) {
      console.warn("Could not load contents from Supabase Storage:", err);
    }
  }

  // Fallback to Prisma if available
  try {
    const { prisma } = await import("@/lib/prisma");
    const contents = await prisma.marketingContent.findMany({
      include: {
        createdBy: true,
        assignedTo: true,
        comments: {
          include: { user: true, taggedUser: true },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: [{ updatedAt: "desc" }],
    });
    if (contents && contents.length > 0) {
      memoryCache = contents;
      lastCacheTime = now;
      return contents;
    }
  } catch {
    // Ignore read-only or empty db error
  }

  return [];
}

export async function saveAllContents(contents: any[]): Promise<boolean> {
  memoryCache = contents;
  lastCacheTime = Date.now();

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const json = JSON.stringify(contents, null, 2);
      let { error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(CONTENTS_FILE_PATH, json, {
          upsert: true,
          contentType: "application/json",
        });

      if (error && (BUCKET_NAME === "Media" || BUCKET_NAME === "media")) {
        const alt = BUCKET_NAME === "Media" ? "media" : "Media";
        const altRes = await supabase.storage
          .from(alt)
          .upload(CONTENTS_FILE_PATH, json, {
            upsert: true,
            contentType: "application/json",
          });
        error = altRes.error;
      }

      if (!error) return true;
      console.error("Supabase storage save error:", error);
    } catch (err) {
      console.error("Failed to save contents to Supabase Storage:", err);
    }
  }
  return false;
}

export async function getContentById(id: string): Promise<any | null> {
  const contents = await getAllContents();
  return contents.find((c) => c.id === id) || null;
}

export async function createContentItem(data: any, currentUser: any): Promise<any> {
  const now = new Date().toISOString();
  const fields = pickContentFields(data);
  const assignedUser = fields.assignedToId ? findTeamMember(fields.assignedToId) : null;
  const status = fields.status || "RAW_MATERIAL";
  const isPublished = status === "PUBLISHED";

  const newContent = {
    id: data.id || `cnt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    title: String(fields.title || "").trim(),
    description: fields.description ?? null,
    platform: fields.platform || "INSTAGRAM",
    contentType: fields.contentType || "FEED_CAROUSEL",
    status,
    themeId: fields.themeId ?? null,
    themeLabel: fields.themeLabel ?? null,
    origin: fields.origin ?? null,
    caption: fields.caption ?? null,
    prepNotes: fields.prepNotes ?? null,
    rawFiles: fields.rawFiles ?? null,
    rawAssetUrl: fields.rawAssetUrl ?? null,
    rawAssetName: fields.rawAssetName ?? null,
    rawAssetType: fields.rawAssetType ?? null,
    assetUrl: fields.assetUrl ?? fields.rawAssetUrl ?? null,
    assetName: fields.assetName ?? fields.rawAssetName ?? null,
    editedFiles: fields.editedFiles ?? null,
    editedAssetUrl: fields.editedAssetUrl ?? null,
    editedAssetName: fields.editedAssetName ?? null,
    editedAssetType: fields.editedAssetType ?? null,
    revisionNote: fields.revisionNote ?? null,
    version: fields.version || 1,
    liveUrl: fields.liveUrl ?? null,
    publishedLinks: fields.publishedLinks ?? null,
    liveNote: fields.liveNote ?? null,
    publishedAt: isPublished ? fields.publishedAt || now : null,
    claimedAt:
      fields.claimedAt ??
      (fields.assignedToId && status === "RAW_MATERIAL" ? now : null),
    targetDate: fields.targetDate ?? null,
    createdById: currentUser.id,
    createdBy: {
      id: currentUser.id,
      name: currentUser.name,
      email: currentUser.email,
      avatar: currentUser.avatar,
      title: currentUser.title,
      role: currentUser.role,
    },
    assignedToId: fields.assignedToId ?? null,
    assignedTo: assignedUser || null,
    comments: [],
    createdAt: now,
    updatedAt: now,
  };

  const all = await getAllContents();
  all.unshift(newContent);
  await saveAllContents(all);

  // Sync to Prisma silently if possible
  try {
    const { prisma } = await import("@/lib/prisma");
    const { title, ...rest } = toPrismaData(pickContentFields(newContent));
    await prisma.marketingContent.create({
      data: {
        id: newContent.id,
        title: newContent.title,
        ...rest,
        createdById: currentUser.id,
      } as any,
    });
  } catch {
    // Ignore
  }

  return newContent;
}

export async function updateContentItem(id: string, updateData: any): Promise<any | null> {
  const all = await getAllContents();
  const index = all.findIndex((c) => c.id === id);
  if (index === -1) return null;

  const current = all[index];
  const now = new Date().toISOString();
  const fields = pickContentFields(updateData);

  if ("title" in fields && !fields.title) delete fields.title; // judul tidak boleh kosong

  let assignedTo = current.assignedTo;
  if ("assignedToId" in fields) {
    assignedTo = fields.assignedToId ? findTeamMember(fields.assignedToId) || null : null;
  }

  let publishedAt = "publishedAt" in fields ? fields.publishedAt : current.publishedAt;
  if (fields.status === "PUBLISHED" && !publishedAt) {
    publishedAt = now;
    fields.publishedAt = now;
  }

  const updated = {
    ...current,
    ...fields,
    assignedTo,
    publishedAt: publishedAt ?? null,
    updatedAt: now,
  };

  all[index] = updated;
  await saveAllContents(all);

  // Sync to Prisma silently if possible
  try {
    const { prisma } = await import("@/lib/prisma");
    await prisma.marketingContent.update({
      where: { id },
      data: toPrismaData(fields) as any,
    });
  } catch {
    // Ignore
  }

  return updated;
}

export async function deleteContentItem(id: string): Promise<boolean> {
  const all = await getAllContents();
  const filtered = all.filter((c) => c.id !== id);
  if (filtered.length !== all.length) {
    await saveAllContents(filtered);
    try {
      const { prisma } = await import("@/lib/prisma");
      await prisma.marketingContent.delete({ where: { id } });
    } catch {
      // Ignore
    }
    return true;
  }
  return false;
}

export async function addContentComment(
  contentId: string,
  message: string,
  taggedUserId: string | null,
  currentUser: any,
  kind: "COMMENT" | "LOG" = "COMMENT"
): Promise<any | null> {
  const all = await getAllContents();
  const content = all.find((c) => c.id === contentId);
  if (!content) return null;

  const taggedMember = taggedUserId ? findTeamMember(taggedUserId) : null;
  const newComment = {
    id: `cm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    contentId,
    userId: currentUser.id,
    user: {
      id: currentUser.id,
      name: currentUser.name,
      avatar: currentUser.avatar,
      title: currentUser.title,
      role: currentUser.role,
    },
    message: message.trim(),
    kind,
    taggedUserId: taggedUserId || null,
    taggedUser: taggedMember || null,
    createdAt: new Date().toISOString(),
  };

  if (!Array.isArray(content.comments)) {
    content.comments = [];
  }
  content.comments.push(newComment);
  // Riwayat otomatis tidak menggeser urutan "terakhir diperbarui" konten.
  if (kind === "COMMENT") content.updatedAt = new Date().toISOString();

  await saveAllContents(all);

  // Sync to Prisma silently
  try {
    const { prisma } = await import("@/lib/prisma");
    await prisma.contentComment.create({
      data: {
        id: newComment.id,
        contentId,
        userId: currentUser.id,
        message: newComment.message,
        kind,
        taggedUserId: taggedUserId || null,
      },
    });
  } catch {
    // Ignore
  }

  return newComment;
}
