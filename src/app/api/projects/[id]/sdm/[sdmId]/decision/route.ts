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
    const { proposalId, decision, comment } = body;

    if (!proposalId || !decision) {
      return NextResponse.json({ error: "Proposal ID dan keputusan wajib diisi" }, { status: 400 });
    }

    const sdmReq = await prisma.sDMRequest.findUnique({
      where: { id: params.sdmId },
      include: { proposals: true },
    });

    if (!sdmReq) {
      return NextResponse.json({ error: "Permintaan SDM tidak ditemukan" }, { status: 404 });
    }

    const proposal = await prisma.sDMProposal.findUnique({
      where: { id: proposalId },
    });

    if (!proposal) {
      return NextResponse.json({ error: "Proposal tidak ditemukan" }, { status: 404 });
    }

    // Record immutable approval record
    const approval = await prisma.sDMApproval.create({
      data: {
        sdmProposalId: proposal.id,
        decision,
        decisionById: user.id,
        decisionAt: new Date(),
        comment: comment || null,
      },
    });

    let nextStatus = "UNDER_REVIEW";
    if (decision === "APPROVED") {
      nextStatus = "APPROVED";

      // Auto create assignment
      await prisma.sDMAssignment.create({
        data: {
          sdmRequestId: sdmReq.id,
          personnelName: proposal.proposedPersonnel,
          startDate: sdmReq.requestedStartDate,
          status: "ACTIVE",
        },
      });
    } else if (decision === "REJECTED") {
      nextStatus = "REJECTED";
    }

    await prisma.sDMRequest.update({
      where: { id: sdmReq.id },
      data: { status: nextStatus },
    });

    // Notify Arjuna Team
    const consultants = await prisma.projectMember.findMany({
      where: { projectId: params.id, role: { in: ["ARJUNA_SUPER_ADMIN", "ARJUNA_CONSULTANT"] } },
    });

    for (const c of consultants) {
      await createNotification({
        userId: c.userId,
        projectId: params.id,
        title: `Persetujuan Biaya SDM: [${sdmReq.requestCode}] ${decision}`,
        message: `${user.name} memberikan keputusan [${decision}] atas proposal biaya ${sdmReq.position}. ${comment ? `Catatan: "${comment}"` : ""}`,
        linkUrl: `/projects/${params.id}/sdm`,
        type: "SDM",
      });
    }

    // Digital Trail Audit
    await logAuditTrail({
      projectId: params.id,
      userId: user.id,
      action: "COST_APPROVAL",
      entityType: "SDM",
      entityId: sdmReq.id,
      description: `${user.name} menyetujui proposal biaya [${sdmReq.requestCode}] ${decision} (Total: Rp ${proposal.totalCost.toLocaleString("id-ID")})`,
      changes: { decision, totalCost: proposal.totalCost, comment },
    });

    return NextResponse.json({ success: true, approval, status: nextStatus });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
