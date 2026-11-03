import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAllContents, createContentItem } from "@/lib/content-store";
import { isReviewerRole, REVIEWER_HINT } from "@/lib/content-utils";

export const dynamic = "force-dynamic";

/** Status yang hanya boleh ditetapkan Lead / Admin. */
const REVIEWER_ONLY_STATUS = ["READY_TO_PUBLISH", "PUBLISHED", "NEED_REVISION"];

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const platform = searchParams.get("platform");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    let contents = await getAllContents();

    if (platform && platform !== "ALL") {
      contents = contents.filter((c) => c.platform === platform);
    }
    if (status && status !== "ALL") {
      contents = contents.filter((c) => c.status === status);
    }
    if (search) {
      const s = search.toLowerCase();
      contents = contents.filter(
        (c) =>
          c.title?.toLowerCase().includes(s) ||
          c.description?.toLowerCase().includes(s) ||
          c.caption?.toLowerCase().includes(s) ||
          c.prepNotes?.toLowerCase().includes(s)
      );
    }

    return NextResponse.json({ contents });
  } catch (error: any) {
    return NextResponse.json({ contents: [] });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    if (!body.title || !String(body.title).trim()) {
      return NextResponse.json({ error: "Judul konten wajib diisi" }, { status: 400 });
    }

    if (REVIEWER_ONLY_STATUS.includes(body.status) && !isReviewerRole(user.role)) {
      return NextResponse.json({ error: REVIEWER_HINT }, { status: 403 });
    }

    const newContent = await createContentItem(body, user);
    return NextResponse.json({ success: true, content: newContent }, { status: 201 });
  } catch (error: any) {
    console.error("Create content error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal membuat konten" },
      { status: 500 }
    );
  }
}
