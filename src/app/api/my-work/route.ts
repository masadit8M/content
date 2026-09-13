import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const now = new Date();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const endOfWeek = new Date();
    endOfWeek.setDate(now.getDate() + 7);

    // Tasks assigned to user
    const assignedTasks = await prisma.task.findMany({
      where: {
        assignedToId: user.id,
        status: { notIn: ["DONE", "CANCELLED"] },
      },
      include: { project: true, category: true, checklist: true },
      orderBy: { dueDate: "asc" },
    });

    // Overdue tasks
    const overdueTasks = assignedTasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < startOfToday
    );

    // Due today
    const dueTodayTasks = assignedTasks.filter(
      (t) =>
        t.dueDate &&
        new Date(t.dueDate) >= startOfToday &&
        new Date(t.dueDate) <= endOfToday
    );

    // Due this week
    const dueThisWeekTasks = assignedTasks.filter(
      (t) =>
        t.dueDate &&
        new Date(t.dueDate) > endOfToday &&
        new Date(t.dueDate) <= endOfWeek
    );

    // If Client Owner / Manager, find recommendations requiring their decision
    const userProjects = user.projectMemberships.map((pm) => pm.projectId);
    const pendingDecisions = await prisma.recommendation.findMany({
      where: {
        projectId: { in: userProjects },
        status: "SUBMITTED",
      },
      include: { project: true, createdBy: true, category: true },
      orderBy: { createdAt: "desc" },
    });

    // Issues assigned to user or requiring action
    const myIssues = await prisma.issue.findMany({
      where: {
        OR: [{ assignedToId: user.id }, { reportedById: user.id }],
        status: { notIn: ["RESOLVED", "CLOSED"] },
      },
      include: { project: true, category: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      assignedTasks,
      overdueTasks,
      dueTodayTasks,
      dueThisWeekTasks,
      pendingDecisions,
      myIssues,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
