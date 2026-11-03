import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const content = await prisma.marketingContent.findUnique({
      where: { id: params.id },
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
    });

    if (!content) {
      return NextResponse.json({ error: "Konten tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ content });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const existing = await prisma.marketingContent.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Konten tidak ditemukan" }, { status: 404 });
    }

    const updateData: any = {};

    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.platform !== undefined) updateData.platform = body.platform;
    if (body.contentType !== undefined) updateData.contentType = body.contentType;
    if (body.prepNotes !== undefined) updateData.prepNotes = body.prepNotes;
    if (body.assetUrl !== undefined) updateData.assetUrl = body.assetUrl;
    if (body.assetName !== undefined) updateData.assetName = body.assetName;
    if (body.rawAssetUrl !== undefined) updateData.rawAssetUrl = body.rawAssetUrl;
    if (body.rawAssetName !== undefined) updateData.rawAssetName = body.rawAssetName;
    if (body.rawAssetType !== undefined) updateData.rawAssetType = body.rawAssetType;
    if (body.editedAssetUrl !== undefined) updateData.editedAssetUrl = body.editedAssetUrl;
    if (body.editedAssetName !== undefined) updateData.editedAssetName = body.editedAssetName;
    if (body.editedAssetType !== undefined) updateData.editedAssetType = body.editedAssetType;
    if (body.revisionNote !== undefined) updateData.revisionNote = body.revisionNote;
    if (body.version !== undefined) updateData.version = body.version;
    if (body.assignedToId !== undefined) updateData.assignedToId = body.assignedToId;
    if (body.targetDate !== undefined) {
      updateData.targetDate = body.targetDate ? new Date(body.targetDate) : null;
    }

    // Live URL & status handling
    if (body.liveUrl !== undefined) {
      updateData.liveUrl = body.liveUrl;
      if (body.liveUrl && body.status === undefined && existing.status !== "PUBLISHED") {
        updateData.status = "PUBLISHED";
      }
    }
    if (body.liveNote !== undefined) updateData.liveNote = body.liveNote;

    if (body.status !== undefined) {
      updateData.status = body.status;
      if (body.status === "PUBLISHED" && !existing.publishedAt) {
        updateData.publishedAt = new Date();
      }
    }

    const updated = await prisma.marketingContent.update({
      where: { id: params.id },
      data: updateData,
      include: {
        createdBy: true,
        assignedTo: true,
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
    });

    return NextResponse.json({ success: true, content: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.marketingContent.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
