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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const categoryId = searchParams.get("categoryId");
    const assignedToId = searchParams.get("assignedToId");
    const search = searchParams.get("search");

    const whereClause: any = {
      projectId: params.id,
    };

    if (status) whereClause.status = status;
    if (priority) whereClause.priority = priority;
    if (categoryId) whereClause.categoryId = categoryId;
    if (assignedToId) whereClause.assignedToId = assignedToId;
    if (search) {
      whereClause.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { taskCode: { contains: search } },
      ];
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        category: true,
        assignedTo: true,
        createdBy: true,
        checklist: { orderBy: { sortOrder: "asc" } },
        recommendation: true,
        issue: true,
        activity: true,
      },
      orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
    });

    const members = await prisma.projectMember.findMany({
      where: { projectId: params.id },
      include: { user: true },
    });

    const categories = await prisma.category.findMany({
      where: { projectId: params.id },
    });

    return NextResponse.json({ tasks, members, categories });
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
      title,
      description,
      priority,
      status,
      assignedToId,
      categoryId,
      phaseId,
      dueDate,
      scopeStatus,
      checklists,
      activityId,
      recommendationId,
      issueId,
    } = body;

    if (!title) {
      return NextResponse.json({ error: "Judul task wajib diisi" }, { status: 400 });
    }

    // Generate task code (e.g. TASK-027)
    const count = await prisma.task.count({ where: { projectId: params.id } });
    const taskCode = `TASK-${String(count + 1).padStart(3, "0")}`;

    const task = await prisma.task.create({
      data: {
        taskCode,
        projectId: params.id,
        title,
        description: description || null,
        priority: priority || "NORMAL",
        status: status || "TO_DO",
        assignedToId: assignedToId || null,
        categoryId: categoryId || null,
        phaseId: phaseId || null,
        createdById: user.id,
        dueDate: dueDate ? new Date(dueDate) : null,
        scopeStatus: scopeStatus || "IN_SCOPE",
        activityId: activityId || null,
        recommendationId: recommendationId || null,
        issueId: issueId || null,
        checklist: checklists?.length
          ? {
              create: checklists.map((item: string, idx: number) => ({
                title: item,
                isCompleted: false,
                sortOrder: idx + 1,
              })),
            }
          : undefined,
      },
      include: {
        assignedTo: true,
        checklist: true,
        category: true,
      },
    });

    // Notify assignee if different from creator
    if (assignedToId && assignedToId !== user.id) {
      await createNotification({
        userId: assignedToId,
        projectId: params.id,
        title: `Penugasan Baru: ${taskCode}`,
        message: `${user.name} menugaskan Anda pada: "${title}"`,
        linkUrl: `/projects/${params.id}/tasks`,
        type: "TASK",
      });
    }

    // Digital Trail Audit
    await logAuditTrail({
      projectId: params.id,
      userId: user.id,
      action: "CREATE",
      entityType: "TASK",
      entityId: task.id,
      description: `${user.name} membuat task baru [${taskCode}] "${title}"`,
    });

    return NextResponse.json({ task });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
