import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAuditTrail, createNotification } from "@/lib/audit";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const requests = await prisma.sDMRequest.findMany({
      where: { projectId: params.id },
      include: {
        requestedBy: true,
        proposals: {
          include: {
            approvals: { include: { decisionBy: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        assignments: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ requests });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const {
      position,
      personnelCount,
      requestedStartDate,
      duration,
      workSchedule,
      duties,
      location,
      reason,
      additionalNotes,
    } = body;

    if (!position || !personnelCount || !requestedStartDate || !workSchedule || !duties) {
      return NextResponse.json(
        { error: "Posisi, jumlah, tanggal mulai, jadwal kerja, dan uraian tugas wajib diisi" },
        { status: 400 }
      );
    }

    const count = await prisma.sDMRequest.count({ where: { projectId: params.id } });
    const requestCode = `SDM-${String(count + 1).padStart(3, "0")}`;

    const sdmReq = await prisma.sDMRequest.create({
      data: {
        requestCode,
        projectId: params.id,
        position,
        personnelCount: Number(personnelCount) || 1,
        requestedStartDate: new Date(requestedStartDate),
        duration: duration || "Sesuai Kontrak PKS",
        workSchedule,
        duties,
        location: location || "Daycare",
        reason: reason || "Kebutuhan operasional daycare",
        additionalNotes: additionalNotes || null,
        status: "SUBMITTED",
        requestedById: user.id,
      },
      include: { requestedBy: true },
    });

    // Notify Arjuna Consultants & Admins
    const arjunaConsultants = await prisma.projectMember.findMany({
      where: {
        projectId: params.id,
        role: { in: ["ARJUNA_SUPER_ADMIN", "ARJUNA_CONSULTANT"] },
      },
    });

    for (const c of arjunaConsultants) {
      await createNotification({
        userId: c.userId,
        projectId: params.id,
        title: `Permintaan SDM Baru: [${requestCode}]`,
        message: `${user.name} mengajukan penambahan SDM: "${position}" (${personnelCount} orang)`,
        linkUrl: `/projects/${params.id}/sdm`,
        type: "SDM",
      });
    }

    // Digital Trail Audit
    await logAuditTrail({
      projectId: params.id,
      userId: user.id,
      action: "CREATE",
      entityType: "SDM",
      entityId: sdmReq.id,
      description: `${user.name} mengajukan permintaan SDM [${requestCode}] ${position} (${personnelCount} orang)`,
    });

    return NextResponse.json({ sdmRequest: sdmReq });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
