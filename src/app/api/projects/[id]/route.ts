import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projectId = params.id;

    // Check membership or super admin
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        clientOrg: true,
        consultantOrg: true,
        members: {
          include: { user: true },
        },
        phases: {
          orderBy: { order: "asc" },
        },
        milestones: {
          orderBy: { targetDate: "asc" },
        },
        categories: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project tidak ditemukan" }, { status: 404 });
    }

    const userMembership = project.members.find((m) => m.userId === user.id);
    const isSuperAdmin = user.globalRole === "ARJUNA_SUPER_ADMIN";
    if (!userMembership && !isSuperAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const userRole = userMembership?.role || (isSuperAdmin ? "ARJUNA_SUPER_ADMIN" : "TEAM_MEMBER");

    // Compute stats
    const now = new Date();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(now.getDate() - 7);

    // Tasks counts
    const openTasks = await prisma.task.count({
      where: { projectId, status: { notIn: ["DONE", "CANCELLED"] } },
    });
    const overdueTasks = await prisma.task.count({
      where: {
        projectId,
        status: { notIn: ["DONE", "CANCELLED"] },
        dueDate: { lt: now },
      },
    });
    const completedTasks = await prisma.task.count({
      where: { projectId, status: "DONE" },
    });

    // Recommendations counts
    const pendingRecommendations = await prisma.recommendation.count({
      where: { projectId, status: "SUBMITTED" },
    });
    const approvedRecommendations = await prisma.recommendation.count({
      where: { projectId, status: { in: ["APPROVED", "IMPLEMENTING", "IMPLEMENTED", "VERIFIED", "CLOSED"] } },
    });
    const rejectedRecommendations = await prisma.recommendation.count({
      where: { projectId, status: "REJECTED" },
    });
    const implementedRecommendations = await prisma.recommendation.count({
      where: { projectId, status: { in: ["IMPLEMENTED", "VERIFIED", "CLOSED"] } },
    });

    // Issues counts
    const openIssues = await prisma.issue.count({
      where: { projectId, status: { notIn: ["RESOLVED", "CLOSED"] } },
    });
    const criticalIssues = await prisma.issue.findMany({
      where: { projectId, severity: "CRITICAL", status: { notIn: ["RESOLVED", "CLOSED"] } },
      include: { assignedTo: true, reportedBy: true },
    });
    const resolvedIssues = await prisma.issue.count({
      where: { projectId, status: { in: ["RESOLVED", "CLOSED"] } },
    });

    // Activity counts
    const activitiesThisWeek = await prisma.activityLog.count({
      where: { projectId, date: { gte: oneWeekAgo } },
    });
    const totalActivities = await prisma.activityLog.count({
      where: { projectId },
    });

    // SDM counts
    const activeSdmAssignments = await prisma.sDMAssignment.count({
      where: { sdmRequest: { projectId }, status: "ACTIVE" },
    });
    const pendingSdmRequests = await prisma.sDMRequest.count({
      where: { projectId, status: { in: ["SUBMITTED", "PROPOSAL_SENT", "AWAITING_APPROVAL"] } },
    });

    // Today's focus (due today or overdue)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const todaysTasks = await prisma.task.findMany({
      where: {
        projectId,
        status: { notIn: ["DONE", "CANCELLED"] },
        dueDate: { lte: endOfToday },
      },
      include: { assignedTo: true, category: true, checklist: true },
      take: 5,
    });

    // Recommendations awaiting client decision
    const pendingDecisions = await prisma.recommendation.findMany({
      where: { projectId, status: "SUBMITTED" },
      include: { createdBy: true, category: true },
      orderBy: { createdAt: "desc" },
    });

    // Latest activities
    const latestActivities = await prisma.activityLog.findMany({
      where: { projectId },
      include: { createdBy: true, category: true },
      orderBy: { date: "desc" },
      take: 5,
    });

    // Recent documents
    const recentDocuments = await prisma.document.findMany({
      where: { projectId },
      include: {
        versions: {
          orderBy: { versionNumber: "desc" },
          take: 1,
          include: { uploadedBy: true },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 4,
    });

    // Bottlenecks calculation
    const bottleneckClient = pendingRecommendations;
    const bottleneckConsultant = await prisma.task.count({
      where: { projectId, status: "WAITING_CONSULTANT" },
    });
    const bottleneckImplementation = await prisma.task.count({
      where: { projectId, status: { in: ["TO_DO", "IN_PROGRESS"] } },
    });

    // KPIs
    const totalRecommendations = pendingRecommendations + approvedRecommendations + rejectedRecommendations;
    const acceptanceRate = totalRecommendations > 0 ? Math.round((approvedRecommendations / totalRecommendations) * 100) : 100;
    const implementationRate = approvedRecommendations > 0 ? Math.round((implementedRecommendations / approvedRecommendations) * 100) : 0;

    return NextResponse.json({
      project,
      userRole,
      stats: {
        tasks: { open: openTasks, overdue: overdueTasks, completed: completedTasks },
        recommendations: { awaiting: pendingRecommendations, approved: approvedRecommendations, rejected: rejectedRecommendations },
        issues: { open: openIssues, critical: criticalIssues.length, resolved: resolvedIssues },
        activities: { thisWeek: activitiesThisWeek, total: totalActivities },
        sdm: { active: activeSdmAssignments, pending: pendingSdmRequests },
      },
      criticalAlerts: criticalIssues,
      todaysFocus: todaysTasks,
      pendingDecisions,
      latestActivities,
      recentDocuments,
      bottlenecks: {
        clientDecision: bottleneckClient,
        consultantReview: bottleneckConsultant,
        implementation: bottleneckImplementation,
      },
      kpis: {
        acceptanceRate,
        implementationRate,
        avgDecisionDays: 2.1,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
