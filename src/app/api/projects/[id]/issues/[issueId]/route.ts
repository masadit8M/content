import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAuditTrail } from "@/lib/audit";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; issueId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { status, assignedToId, consultantAnalysis, recommendation, severity } = body;

    const existingIssue = await prisma.issue.findUnique({
      where: { id: params.issueId },
    });

    if (!existingIssue) {
      return NextResponse.json({ error: "Issue tidak ditemukan" }, { status: 404 });
    }

    const updateData: any = {};
    if (status && status !== existingIssue.status) updateData.status = status;
    if (assignedToId !== undefined) updateData.assignedToId = assignedToId;
    if (consultantAnalysis) updateData.consultantAnalysis = consultantAnalysis;
    if (recommendation) updateData.recommendation = recommendation;
    if (severity) updateData.severity = severity;

    const updatedIssue = await prisma.issue.update({
      where: { id: params.issueId },
      data: updateData,
      include: {
        category: true,
        assignedTo: true,
        reportedBy: true,
      },
    });

    if (status && status !== existingIssue.status) {
      await logAuditTrail({
        projectId: params.id,
        userId: user.id,
        action: "STATUS_CHANGE",
        entityType: "ISSUE",
        entityId: existingIssue.id,
        description: `${user.name} memperbarui status isu [${existingIssue.issueCode}] dari ${existingIssue.status} menjadi ${status}`,
        changes: { status: { old: existingIssue.status, new: status } },
      });
    }

    return NextResponse.json({ issue: updatedIssue });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
