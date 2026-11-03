import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const platform = searchParams.get("platform");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const where: any = {};
    if (platform && platform !== "ALL") {
      where.platform = platform;
    }
    if (status && status !== "ALL") {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { prepNotes: { contains: search } },
      ];
    }

    const contents = await prisma.marketingContent.findMany({
      where,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, avatar: true, title: true, role: true },
        },
        assignedTo: {
          select: { id: true, name: true, email: true, avatar: true, title: true, role: true },
        },
        tasks: {
          include: {
            createdBy: { select: { id: true, name: true, avatar: true } },
            assignedTo: { select: { id: true, name: true, avatar: true } },
          },
          orderBy: { createdAt: "asc" },
        },
        comments: {
          include: {
            user: { select: { id: true, name: true, avatar: true, title: true, role: true } },
            taggedUser: { select: { id: true, name: true, avatar: true, title: true, role: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: [{ updatedAt: "desc" }],
    });

    return NextResponse.json({ contents });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      platform,
      contentType,
      status = "RAW_MATERIAL",
      prepNotes,
      assetUrl,
      assetName,
      rawAssetUrl,
      rawAssetName,
      rawAssetType,
      editedAssetUrl,
      editedAssetName,
      editedAssetType,
      revisionNote,
      version = 1,
      targetDate,
      assignedToId,
      liveUrl,
      liveNote,
    } = body;

    if (!title) {
      return NextResponse.json({ error: "Judul konten wajib diisi" }, { status: 400 });
    }

    const isPublished = status === "PUBLISHED" || Boolean(liveUrl);

    const newContent = await prisma.marketingContent.create({
      data: {
        title,
        description: description || null,
        platform: platform || "INSTAGRAM",
        contentType: contentType || "FEED_CAROUSEL",
        status: isPublished ? "PUBLISHED" : status,
        prepNotes: prepNotes || null,
        assetUrl: assetUrl || rawAssetUrl || null,
        assetName: assetName || rawAssetName || null,
        rawAssetUrl: rawAssetUrl || assetUrl || null,
        rawAssetName: rawAssetName || assetName || null,
        rawAssetType: rawAssetType || null,
        editedAssetUrl: editedAssetUrl || null,
        editedAssetName: editedAssetName || null,
        editedAssetType: editedAssetType || null,
        revisionNote: revisionNote || null,
        version: Number(version) || 1,
        liveUrl: liveUrl || null,
        liveNote: liveNote || null,
        publishedAt: isPublished ? new Date() : null,
        targetDate: targetDate ? new Date(targetDate) : null,
        createdById: user.id,
        assignedToId: assignedToId || null,
      },
      include: {
        createdBy: true,
        assignedTo: true,
        tasks: true,
        comments: true,
      },
    });

    return NextResponse.json({ success: true, content: newContent }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
