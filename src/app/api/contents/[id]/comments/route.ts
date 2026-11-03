import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { findTeamMember } from "@/lib/team-data";

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

    try {
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
    } catch (dbErr) {
      console.warn("Prisma comment creation failed, returning mock comment:", dbErr);

      const taggedMember = taggedUserId ? findTeamMember(taggedUserId) : null;

      const mockComment = {
        id: `cm_${Date.now()}`,
        contentId: params.id,
        userId: user.id,
        user: {
          id: user.id,
          name: user.name,
          avatar: user.avatar,
          title: user.title,
          role: user.role,
        },
        message: message.trim(),
        taggedUserId: taggedUserId || null,
        taggedUser: taggedMember
          ? {
              id: taggedMember.id,
              name: taggedMember.name,
              avatar: taggedMember.avatar,
              title: taggedMember.title,
              role: taggedMember.role,
            }
          : null,
        createdAt: new Date().toISOString(),
      };

      return NextResponse.json({ success: true, comment: mockComment }, { status: 201 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Gagal mengirim komentar" }, { status: 500 });
  }
}
