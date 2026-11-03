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

    const { message, taggedUserId } = await request.json();

    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Komentar tidak boleh kosong" }, { status: 400 });
    }

    const comment = await prisma.contentComment.create({
      data: {
        contentId: params.id,
        userId: user.id,
        message: message.trim(),
        taggedUserId: taggedUserId || null,
      },
      include: {
        user: { select: { id: true, name: true, avatar: true, title: true, role: true } },
        taggedUser: { select: { id: true, name: true, avatar: true, title: true, role: true } },
      },
    });

    // Touch content updatedAt
    await prisma.marketingContent.update({
      where: { id: params.id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ success: true, comment }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
