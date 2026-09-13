import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAuditTrail } from "@/lib/audit";

export async function POST(
  request: Request,
  { params }: { params: { id: string; reportId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const report = await prisma.report.findUnique({
      where: { id: params.reportId },
    });

    if (!report) {
      return NextResponse.json({ error: "Laporan tidak ditemukan" }, { status: 404 });
    }

    const updated = await prisma.report.update({
      where: { id: report.id },
      data: { status: "FINALIZED" },
    });

    await logAuditTrail({
      projectId: params.id,
      userId: user.id,
      action: "FINALIZE",
      entityType: "REPORT",
      entityId: report.id,
      description: `${user.name} memfinalisasi laporan [${report.reportCode}] menjadi Read-Only`,
    });

    return NextResponse.json({ success: true, report: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
