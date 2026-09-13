import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { storageService } from "@/lib/storage/local";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; mediaId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const mediaItem = await prisma.mediaDocumentation.findUnique({
      where: { id: params.mediaId },
    });

    if (!mediaItem || mediaItem.projectId !== params.id) {
      return NextResponse.json({ error: "Media tidak ditemukan" }, { status: 404 });
    }

    // Delete file from disk if local path
    if (mediaItem.fileUrl.startsWith("/uploads/")) {
      await storageService.deleteFile(mediaItem.fileUrl);
    }

    await prisma.mediaDocumentation.delete({
      where: { id: params.mediaId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
