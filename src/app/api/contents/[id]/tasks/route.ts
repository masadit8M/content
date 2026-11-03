import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, assignedToId, dueDate } = await request.json();

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Judul task tambahan wajib diisi" }, { status: 400 });
    }

    const task = await prisma.contentTask.create({
      data: {
        contentId: params.id,
        title: title.trim(),
        isCompleted: false,
        createdById: user.id,
        assignedToId: assignedToId || null,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
      include: {
        createdBy: { select: { id: true, name: true, avatar: true } },
        assignedTo: { select: { id: true, name: true, avatar: true } },
      },
    });

    // Touch the content updatedAt
    await prisma.marketingContent.update({
      where: { id: params.id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ success: true, task }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
