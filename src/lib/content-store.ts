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
        tasks: {
          include: { createdBy: true, assignedTo: true },
          orderBy: { createdAt: "asc" },
        },
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
  const assignedUser = data.assignedToId ? findTeamMember(data.assignedToId) : null;
  const isPublished = data.status === "PUBLISHED" || Boolean(data.liveUrl);

  const newContent = {
    id: data.id || `cnt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    title: data.title,
    description: data.description || null,
    platform: data.platform || "INSTAGRAM",
    contentType: data.contentType || "FEED_CAROUSEL",
    status: isPublished ? "PUBLISHED" : data.status || "RAW_MATERIAL",
    prepNotes: data.prepNotes || null,
    assetUrl: data.assetUrl || data.rawAssetUrl || null,
    assetName: data.assetName || data.rawAssetName || null,
    rawAssetUrl: data.rawAssetUrl || data.assetUrl || null,
    rawAssetName: data.rawAssetName || data.assetName || null,
    rawAssetType: data.rawAssetType || null,
    editedAssetUrl: data.editedAssetUrl || null,
    editedAssetName: data.editedAssetName || null,
    editedAssetType: data.editedAssetType || null,
    revisionNote: data.revisionNote || null,
    version: Number(data.version) || 1,
    liveUrl: data.liveUrl || null,
    liveNote: data.liveNote || null,
    publishedAt: isPublished ? now : null,
    targetDate: data.targetDate || null,
    createdById: currentUser.id,
    createdBy: {
      id: currentUser.id,
      name: currentUser.name,
      email: currentUser.email,
      avatar: currentUser.avatar,
      title: currentUser.title,
      role: currentUser.role,
    },
    assignedToId: data.assignedToId || null,
    assignedTo: assignedUser || null,
    tasks: [],
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
    await prisma.marketingContent.create({
      data: {
        id: newContent.id,
        title: newContent.title,
        description: newContent.description,
        platform: newContent.platform,
        contentType: newContent.contentType,
        status: newContent.status,
        prepNotes: newContent.prepNotes,
        assetUrl: newContent.assetUrl,
        assetName: newContent.assetName,
        rawAssetUrl: newContent.rawAssetUrl,
        rawAssetName: newContent.rawAssetName,
        rawAssetType: newContent.rawAssetType,
        editedAssetUrl: newContent.editedAssetUrl,
        editedAssetName: newContent.editedAssetName,
        editedAssetType: newContent.editedAssetType,
        revisionNote: newContent.revisionNote,
        version: newContent.version,
        liveUrl: newContent.liveUrl,
        liveNote: newContent.liveNote,
        publishedAt: isPublished ? new Date() : null,
        targetDate: data.targetDate ? new Date(data.targetDate) : null,
        createdById: currentUser.id,
        assignedToId: data.assignedToId || null,
      },
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

  let assignedTo = current.assignedTo;
  if (updateData.assignedToId !== undefined) {
    assignedTo = updateData.assignedToId ? findTeamMember(updateData.assignedToId) : null;
  }

  let publishedAt = current.publishedAt;
  if (updateData.status === "PUBLISHED" && !publishedAt) {
    publishedAt = now;
  }

  const updated = {
    ...current,
    ...updateData,
    assignedTo,
    publishedAt,
    updatedAt: now,
  };

  all[index] = updated;
  await saveAllContents(all);

  // Sync to Prisma silently if possible
  try {
    const { prisma } = await import("@/lib/prisma");
    const pData: any = { ...updateData };
    delete pData.assignedTo;
    delete pData.createdBy;
    delete pData.tasks;
    delete pData.comments;
    if (pData.targetDate) pData.targetDate = new Date(pData.targetDate);
    await prisma.marketingContent.update({
      where: { id },
      data: pData,
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
  currentUser: any
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
    taggedUserId: taggedUserId || null,
    taggedUser: taggedMember || null,
    createdAt: new Date().toISOString(),
  };

  if (!Array.isArray(content.comments)) {
    content.comments = [];
  }
  content.comments.push(newComment);
  content.updatedAt = new Date().toISOString();

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
        taggedUserId: taggedUserId || null,
      },
    });
  } catch {
    // Ignore
  }

  return newComment;
}

export async function addContentTask(
  contentId: string,
  title: string,
  assignedToId: string | null,
  dueDate: string | null,
  currentUser: any
): Promise<any | null> {
  const all = await getAllContents();
  const content = all.find((c) => c.id === contentId);
  if (!content) return null;

  const assignedMember = assignedToId ? findTeamMember(assignedToId) : null;
  const newTask = {
    id: `tsk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    contentId,
    title: title.trim(),
    isCompleted: false,
    createdById: currentUser.id,
    createdBy: {
      id: currentUser.id,
      name: currentUser.name,
      avatar: currentUser.avatar,
    },
    assignedToId: assignedToId || null,
    assignedTo: assignedMember || null,
    dueDate: dueDate || null,
    createdAt: new Date().toISOString(),
  };

  if (!Array.isArray(content.tasks)) {
    content.tasks = [];
  }
  content.tasks.push(newTask);
  content.updatedAt = new Date().toISOString();

  await saveAllContents(all);

  try {
    const { prisma } = await import("@/lib/prisma");
    await prisma.contentTask.create({
      data: {
        id: newTask.id,
        contentId,
        title: newTask.title,
        isCompleted: false,
        createdById: currentUser.id,
        assignedToId: assignedToId || null,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });
  } catch {
    // Ignore
  }

  return newTask;
}

export async function updateContentTask(
  contentId: string,
  taskId: string,
  updateData: any
): Promise<any | null> {
  const all = await getAllContents();
  const content = all.find((c) => c.id === contentId);
  if (!content || !Array.isArray(content.tasks)) return null;

  const taskIndex = content.tasks.findIndex((t: any) => t.id === taskId);
  if (taskIndex === -1) return null;

  const currentTask = content.tasks[taskIndex];
  let assignedTo = currentTask.assignedTo;
  if (updateData.assignedToId !== undefined) {
    assignedTo = updateData.assignedToId ? findTeamMember(updateData.assignedToId) : null;
  }

  const updatedTask = {
    ...currentTask,
    ...updateData,
    assignedTo,
  };

  content.tasks[taskIndex] = updatedTask;
  content.updatedAt = new Date().toISOString();

  await saveAllContents(all);

  try {
    const { prisma } = await import("@/lib/prisma");
    await prisma.contentTask.update({
      where: { id: taskId },
      data: updateData,
    });
  } catch {
    // Ignore
  }

  return updatedTask;
}

export async function deleteContentTask(contentId: string, taskId: string): Promise<boolean> {
  const all = await getAllContents();
  const content = all.find((c) => c.id === contentId);
  if (!content || !Array.isArray(content.tasks)) return false;

  content.tasks = content.tasks.filter((t: any) => t.id !== taskId);
  content.updatedAt = new Date().toISOString();

  await saveAllContents(all);

  try {
    const { prisma } = await import("@/lib/prisma");
    await prisma.contentTask.delete({ where: { id: taskId } });
  } catch {
    // Ignore
  }

  return true;
}
