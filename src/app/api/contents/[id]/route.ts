import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getContentById, updateContentItem, deleteContentItem } from "@/lib/content-store";
import { isReviewerRole, REVIEWER_HINT } from "@/lib/content-utils";

export const dynamic = "force-dynamic";

/** Status yang hanya boleh ditetapkan Lead / Admin. */
const REVIEWER_ONLY_STATUS = ["READY_TO_PUBLISH", "PUBLISHED", "NEED_REVISION"];
/** Konten yang sudah disetujui / tayang hanya boleh dipindahkan keluar oleh Lead / Admin. */
const LOCKED_STATUS = ["READY_TO_PUBLISH", "PUBLISHED"];

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

    const current = await getContentById(params.id);
    if (!current) {
      return NextResponse.json({ error: "Konten tidak ditemukan" }, { status: 404 });
    }

    const body = await request.json();

    if (body.status && body.status !== current.status && !isReviewerRole(user.role)) {
      const targetsGated = REVIEWER_ONLY_STATUS.includes(body.status);
      const leavesLocked = LOCKED_STATUS.includes(current.status);
      if (targetsGated || leavesLocked) {
        return NextResponse.json({ error: REVIEWER_HINT }, { status: 403 });
      }
    }

    const updated = await updateContentItem(params.id, body);
    if (!updated) {
      return NextResponse.json({ error: "Konten tidak ditemukan" }, { status: 404 });
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
      return NextResponse.json({ error: "Konten tidak ditemukan" }, { status: 404 });
    }

    const isOwner = current.createdById === user.id;
    if (!isOwner && !isReviewerRole(user.role)) {
      return NextResponse.json(
        { error: "Hanya pembuat konten atau Lead / Admin yang dapat menghapus" },
        { status: 403 }
      );
    }

    const deleted = await deleteContentItem(params.id);
    return NextResponse.json({ success: deleted });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
