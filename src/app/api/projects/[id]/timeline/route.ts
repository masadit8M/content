import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const auditLogs = await prisma.auditLog.findMany({
      where: { projectId: params.id },
      include: { user: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ timeline: auditLogs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
