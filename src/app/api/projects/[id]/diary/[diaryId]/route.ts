import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/projects/[id]/diary/[diaryId] - Update catatan diary pribadi
export async function PATCH(
  request: Request,
  { params }: { params: { id: string; diaryId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Pastikan diary milik user yang login
    const existing = await prisma.personalDiary.findUnique({
      where: { id: params.diaryId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Catatan tidak ditemukan" }, { status: 404 });
    }

    if (existing.userId !== user.id) {
      return NextResponse.json({ error: "Akses ditolak: Ini bukan catatan pribadi Anda" }, { status: 403 });
    }

    const body = await request.json();
    const { title, content, date, tags } = body;

    const updated = await prisma.personalDiary.update({
      where: { id: params.diaryId },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(date !== undefined && { date: new Date(date) }),
        ...(tags !== undefined && { tags }),
      },
    });

    return NextResponse.json({ diary: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/projects/[id]/diary/[diaryId] - Hapus catatan diary pribadi
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; diaryId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.personalDiary.findUnique({
      where: { id: params.diaryId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Catatan tidak ditemukan" }, { status: 404 });
    }

    if (existing.userId !== user.id) {
      return NextResponse.json({ error: "Akses ditolak: Ini bukan catatan pribadi Anda" }, { status: 403 });
    }

    await prisma.personalDiary.delete({
      where: { id: params.diaryId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
