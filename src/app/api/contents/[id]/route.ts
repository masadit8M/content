import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  getContentById,
  updateContentItem,
  deleteContentItem,
} from "@/lib/content-store";
import { isReviewerRole, isRawMaterialStage } from "@/lib/content-utils";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const content = await getContentById(params.id);
    if (!content) {
      return NextResponse.json(
        { error: "Konten tidak ditemukan" },
        { status: 404 }
      );
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

    const current = await getContentById(params.id);
    if (!current) {
      return NextResponse.json(
        { error: "Konten tidak ditemukan" },
        { status: 404 }
      );
    }

    const body = await request.json();

    // Cegah rebutan bahan mentah yang sudah diambil user lain (kecuali dikembalikan ke null atau diselesaikan)
    const staysRaw =
      !body.status || String(body.status).toUpperCase() === "RAW_MATERIAL";
    if (
      isRawMaterialStage(current) &&
      current.assignedToId &&
      staysRaw &&
      "assignedToId" in body &&
      body.assignedToId !== null &&
      body.assignedToId !== "" &&
      body.assignedToId !== current.assignedToId &&
      !isReviewerRole(user.role)
    ) {
      return NextResponse.json(
        {
          error: `Bahan mentah ini sudah diambil oleh ${
            current.assignedTo?.name || "anggota tim lain"
          } untuk diedit.`,
        },
        { status: 409 }
      );
    }

    const updated = await updateContentItem(params.id, body);
    if (!updated) {
      return NextResponse.json(
        { error: "Konten tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, content: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Gagal mengupdate konten" },
      { status: 500 }
    );
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

    const current = await getContentById(params.id);
    if (!current) {
      return NextResponse.json(
        { error: "Konten tidak ditemukan" },
        { status: 404 }
      );
    }

    const isOwnerOrAssignee =
      current.createdById === user.id || current.assignedToId === user.id;
    if (!isOwnerOrAssignee && !isReviewerRole(user.role)) {
      return NextResponse.json(
        {
          error:
            "Hanya pengunggah, pengedit konten, atau Lead / Admin yang dapat menghapus",
        },
        { status: 403 }
      );
    }

    const deleted = await deleteContentItem(params.id);
    return NextResponse.json({ success: deleted });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
