import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAuditTrail } from "@/lib/audit";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; taskId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { status, assignedToId, checklistToggleId, priority, dueDate } = body;

    const existingTask = await prisma.task.findUnique({
      where: { id: params.taskId },
      include: { checklist: true },
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Task tidak ditemukan" }, { status: 404 });
    }

    // Toggle checklist item if requested
    if (checklistToggleId) {
      const item = existingTask.checklist.find((c) => c.id === checklistToggleId);
      if (item) {
        await prisma.taskChecklist.update({
          where: { id: checklistToggleId },
          data: { isCompleted: !item.isCompleted },
        });

        await logAuditTrail({
          projectId: params.id,
          userId: user.id,
          action: "UPDATE",
          entityType: "TASK",
          entityId: existingTask.id,
          description: `${user.name} menandai checklist "${item.title}" sebagai ${!item.isCompleted ? "selesai" : "belum selesai"} pada ${existingTask.taskCode}`,
        });
      }
    }

    const updateData: any = {};
    if (status && status !== existingTask.status) {
      updateData.status = status;
      if (status === "DONE") {
        updateData.completedDate = new Date();
      }
    }
    if (assignedToId !== undefined) updateData.assignedToId = assignedToId;
    if (priority) updateData.priority = priority;
    if (dueDate) updateData.dueDate = new Date(dueDate);

    const updatedTask = await prisma.task.update({
      where: { id: params.taskId },
      data: updateData,
      include: {
        checklist: { orderBy: { sortOrder: "asc" } },
        assignedTo: true,
        category: true,
      },
    });

    if (status && status !== existingTask.status) {
      await logAuditTrail({
        projectId: params.id,
        userId: user.id,
        action: "STATUS_CHANGE",
        entityType: "TASK",
        entityId: existingTask.id,
        description: `${user.name} mengubah status [${existingTask.taskCode}] dari ${existingTask.status} menjadi ${status}`,
        changes: { status: { old: existingTask.status, new: status } },
      });
    }

    return NextResponse.json({ task: updatedTask });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
