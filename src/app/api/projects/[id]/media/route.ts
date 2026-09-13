import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { storageService } from "@/lib/storage/local";
import { logAuditTrail } from "@/lib/audit";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const month = searchParams.get("month");
    const search = searchParams.get("search");
    const recipientFilter = searchParams.get("recipientFilter"); // "ALL", "FOR_ME", "BY_ME"

    const whereClause: any = {
      projectId: params.id,
    };

    if (category) whereClause.category = category;

    if (month) {
      const [yearStr, monthStr] = month.split("-");
      const year = parseInt(yearStr);
      const m = parseInt(monthStr);
      const start = new Date(year, m - 1, 1);
      const end = new Date(year, m, 0, 23, 59, 59, 999);
      whereClause.createdAt = { gte: start, lte: end };
    }

    if (search) {
      whereClause.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const [allMediaItems, members] = await Promise.all([
      prisma.mediaDocumentation.findMany({
        where: whereClause,
        include: {
          uploadedBy: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              title: true,
              globalRole: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.projectMember.findMany({
        where: { projectId: params.id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              title: true,
              globalRole: true,
            },
          },
        },
      }),
    ]);

    // Permission & Recipient Filter:
    // Items with targetType === "SPECIFIC" are visible only to:
    // 1. The uploader
    // 2. The recipient users listed in targetUserIds
    // 3. Super Admins / Arjuna Consultants
    const isSuperOrConsultant =
      user.globalRole === "ARJUNA_SUPER_ADMIN" || user.globalRole === "ARJUNA_CONSULTANT";

    const filteredMedia = allMediaItems.filter((item: any) => {
      let targetIds: string[] = [];
      if (item.targetUserIds) {
        try {
          targetIds = JSON.parse(item.targetUserIds);
        } catch {
          targetIds = [];
        }
      }

      // Check visibility permission
      const isUploader = item.uploadedById === user.id;
      const isRecipient = targetIds.includes(user.id);
      const isBroadcast = !item.targetType || item.targetType === "ALL";

      const canView = isBroadcast || isUploader || isRecipient || isSuperOrConsultant;
      if (!canView) return false;

      // Apply UI filter if requested
      if (recipientFilter === "FOR_ME") {
        return item.targetType === "SPECIFIC" && isRecipient;
      }
      if (recipientFilter === "BY_ME") {
        return isUploader;
      }

      return true;
    });

    return NextResponse.json({ mediaItems: filteredMedia, members });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string | null;
    const description = (formData.get("description") as string) || "";
    const category = (formData.get("category") as string) || "OPERATIONAL";
    const targetType = (formData.get("targetType") as string) || "ALL"; // "ALL" or "SPECIFIC"
    const targetUserIdsRaw = formData.get("targetUserIds") as string | null;

    if (!file || !title) {
      return NextResponse.json(
        { error: "File foto/video dan judul dokumentasi wajib diisi" },
        { status: 400 }
      );
    }

    let targetUserIds: string | null = null;
    if (targetType === "SPECIFIC" && targetUserIdsRaw) {
      try {
        const parsed = targetUserIdsRaw.startsWith("[")
          ? JSON.parse(targetUserIdsRaw)
          : targetUserIdsRaw.split(",").map((s) => s.trim()).filter(Boolean);
        targetUserIds = JSON.stringify(parsed);
      } catch {
        targetUserIds = JSON.stringify([]);
      }
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const isVideo =
      file.type.startsWith("video/") ||
      /\.(mp4|mov|webm|m4v)$/i.test(file.name);

    const uploadResult = await storageService.uploadFile(fileBuffer, file.name, {
      projectId: params.id,
      folder: isVideo ? "videos" : "photos",
    });

    const mediaItem = await prisma.mediaDocumentation.create({
      data: {
        projectId: params.id,
        title: title.trim(),
        description: description.trim() || null,
        category,
        fileType: isVideo ? "VIDEO" : "IMAGE",
        fileUrl: uploadResult.url,
        fileName: file.name,
        fileSize: uploadResult.fileSize,
        uploadedById: user.id,
        targetType,
        targetUserIds,
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            title: true,
            globalRole: true,
          },
        },
      },
    });

    const targetDesc =
      targetType === "SPECIFIC" ? "untuk user tertentu" : "untuk semua tim";

    await logAuditTrail({
      projectId: params.id,
      userId: user.id,
      action: "UPLOAD_VERSION",
      entityType: "DOCUMENT",
      entityId: mediaItem.id,
      description: `${user.name} mengunggah dokumentasi ${isVideo ? "video" : "foto"} (${targetDesc}): "${title}"`,
    });

    return NextResponse.json({ success: true, mediaItem });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
