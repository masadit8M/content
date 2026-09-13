import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAuditTrail, createNotification } from "@/lib/audit";

export async function POST(
  request: Request,
  { params }: { params: { id: string; recId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { decision, comment, createActionTask, taskAssigneeId, taskDueDate } = body;

    if (!decision) {
      return NextResponse.json({ error: "Keputusan wajib dipilih (APPROVED / REJECTED / dll)" }, { status: 400 });
    }

    const rec = await prisma.recommendation.findUnique({
      where: { id: params.recId },
      include: { category: true, createdBy: true },
    });

    if (!rec) {
      return NextResponse.json({ error: "Rekomendasi tidak ditemukan" }, { status: 404 });
    }

    let nextStatus = "UNDER_DISCUSSION";
    if (decision === "APPROVED") nextStatus = "APPROVED";
    if (decision === "REJECTED") nextStatus = "REJECTED";
    if (decision === "REVISION_REQUESTED") nextStatus = "REVISION_REQUESTED";

    let createdTask = null;
    let generatedTaskCode = null;

    // If approved and task creation is requested
    if (decision === "APPROVED" && createActionTask !== false) {
      const taskCount = await prisma.task.count({ where: { projectId: params.id } });
      generatedTaskCode = `TASK-${String(taskCount + 1).padStart(3, "0")}`;

      createdTask = await prisma.task.create({
        data: {
          taskCode: generatedTaskCode,
          projectId: params.id,
          categoryId: rec.categoryId,
          phaseId: rec.phaseId,
          title: `Implementasi: ${rec.title}`,
          description: `Action item implementasi berdasarkan persetujuan rekomendasi [${rec.recCode}].\n\nCatatan Klien: "${comment || '-'}"\n\nRekomendasi Konsultan: ${rec.recommendationText}`,
          priority: rec.priority || "NORMAL",
          status: "TO_DO",
          assignedToId: taskAssigneeId || null,
          createdById: user.id,
          dueDate: taskDueDate ? new Date(taskDueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // default 7 days
          scopeStatus: rec.scopeStatus,
          recommendationId: rec.id,
          checklist: {
            create: [
              { title: "Briefing tim pelaksana & penyiapan materi/dokumen", isCompleted: false, sortOrder: 1 },
              { title: "Pelaksanaan di lapangan", isCompleted: false, sortOrder: 2 },
              { title: "Verifikasi kepatuhan oleh Konsultan Arjuna", isCompleted: false, sortOrder: 3 },
            ],
          },
        },
      });

      // Update recommendation status to IMPLEMENTING if task created
      nextStatus = "IMPLEMENTING";
    }

    // Record decision
    const recDecision = await prisma.recommendationDecision.create({
      data: {
        recommendationId: rec.id,
        decision,
        decisionById: user.id,
        decisionAt: new Date(),
        comment: comment || null,
        generatedTaskId: createdTask?.taskCode || null,
      },
      include: { decisionBy: true },
    });

    // Update recommendation status
    const updatedRec = await prisma.recommendation.update({
      where: { id: rec.id },
      data: { status: nextStatus },
      include: {
        decisions: { include: { decisionBy: true } },
        tasks: true,
      },
    });

    // Notify consultant
    await createNotification({
      userId: rec.createdById,
      projectId: params.id,
      title: `Keputusan Klien: [${rec.recCode}] ${decision}`,
      message: `${user.name} memberikan keputusan "${decision}" pada rekomendasi "${rec.title}". ${comment ? `Catatan: "${comment}"` : ""}`,
      linkUrl: `/projects/${params.id}/recommendations`,
      type: "DECISION",
    });

    // Digital Trail Audit
    await logAuditTrail({
      projectId: params.id,
      userId: user.id,
      action: "CLIENT_DECISION",
      entityType: "RECOMMENDATION",
      entityId: rec.id,
      description: `${user.name} mengambil keputusan [${decision}] pada rekomendasi ${rec.recCode} "${rec.title}"${createdTask ? ` (Otomatis membuat ${generatedTaskCode})` : ""}`,
      changes: {
        decision,
        comment,
        status: { old: rec.status, new: nextStatus },
        taskCreated: generatedTaskCode,
      },
    });

    return NextResponse.json({
      success: true,
      recommendation: updatedRec,
      decision: recDecision,
      task: createdTask,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
