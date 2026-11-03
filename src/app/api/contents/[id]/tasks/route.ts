import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { addContentTask } from "@/lib/content-store";

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

    const { title, assignedToId, dueDate } = await request.json();

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Judul task tambahan wajib diisi" }, { status: 400 });
    }

    const task = await addContentTask(
      params.id,
      title,
      assignedToId || null,
      dueDate || null,
      user
    );

    if (!task) {
      return NextResponse.json({ error: "Konten tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ success: true, task }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Gagal menambah task" }, { status: 500 });
  }
}
