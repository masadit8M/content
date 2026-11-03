import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { addContentComment } from "@/lib/content-store";

export const dynamic = "force-dynamic";

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

    const comment = await addContentComment(
      params.id,
      message,
      taggedUserId || null,
      user
    );

    if (!comment) {
      return NextResponse.json({ error: "Konten tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ success: true, comment }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Gagal menambah komentar" }, { status: 500 });
  }
}
