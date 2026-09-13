import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/projects/[id]/diary - Mengambil catatan diary pribadi HANYA untuk user yang sedang login
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    const whereClause: any = {
      projectId: params.id,
      userId: user.id, // KETAT: hanya milik user yang sedang login!
    };

    if (search) {
      whereClause.OR = [
        { title: { contains: search } },
        { content: { contains: search } },
        { tags: { contains: search } },
      ];
    }

    const diaries = await prisma.personalDiary.findMany({
      where: whereClause,
      orderBy: { date: "desc" },
    });

    return NextResponse.json({ diaries });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/projects/[id]/diary - Membuat catatan diary pribadi baru
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, date, tags } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "Judul dan isi catatan wajib diisi" },
        { status: 400 }
      );
    }

    const diary = await prisma.personalDiary.create({
      data: {
        projectId: params.id,
        userId: user.id,
        title,
        content,
        date: date ? new Date(date) : new Date(),
        tags: tags || null,
      },
    });

    return NextResponse.json({ diary });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
