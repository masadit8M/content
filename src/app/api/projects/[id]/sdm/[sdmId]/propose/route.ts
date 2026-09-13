import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAuditTrail, createNotification } from "@/lib/audit";

export async function POST(
  request: Request,
  { params }: { params: { id: string; sdmId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { proposedPersonnel, schedule, monthlyCost, additionalCost, notes } = body;

    if (!proposedPersonnel || !monthlyCost) {
      return NextResponse.json(
        { error: "Nama kandidat/kualifikasi dan estimasi biaya bulanan wajib diisi" },
        { status: 400 }
      );
    }

    const sdmReq = await prisma.sDMRequest.findUnique({
      where: { id: params.sdmId },
    });

    if (!sdmReq) {
      return NextResponse.json({ error: "Permintaan SDM tidak ditemukan" }, { status: 404 });
    }

    const mCost = Number(monthlyCost);
    const aCost = Number(additionalCost) || 0;
    const total = mCost + aCost;

    const proposal = await prisma.sDMProposal.create({
      data: {
        sdmRequestId: sdmReq.id,
        proposedPersonnel,
        schedule: schedule || sdmReq.workSchedule,
        monthlyCost: mCost,
        additionalCost: aCost,
        totalCost: total,
        notes: notes || null,
      },
    });

    await prisma.sDMRequest.update({
      where: { id: sdmReq.id },
      data: { status: "PROPOSAL_SENT" },
    });

    // Notify Client Requester
    await createNotification({
      userId: sdmReq.requestedById,
      projectId: params.id,
      title: `Proposal & Biaya SDM Masuk: [${sdmReq.requestCode}]`,
      message: `${user.name} mengirimkan penawaran kandidat & rincian biaya untuk ${sdmReq.position}. Menunggu persetujuan Anda.`,
      linkUrl: `/projects/${params.id}/sdm`,
      type: "SDM",
    });

    // Digital Trail
    await logAuditTrail({
      projectId: params.id,
      userId: user.id,
      action: "CREATE",
      entityType: "SDM",
      entityId: sdmReq.id,
      description: `${user.name} mengirim proposal SDM untuk [${sdmReq.requestCode}]: ${proposedPersonnel} (Total: Rp ${total.toLocaleString("id-ID")})`,
    });

    return NextResponse.json({ proposal });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
