import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAuditTrail } from "@/lib/audit";
import { format } from "date-fns";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const reports = await prisma.report.findMany({
      where: { projectId: params.id },
      include: { generatedBy: true },
      orderBy: { periodStart: "desc" },
    });

    return NextResponse.json({ reports });
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
      type, // "DAILY", "WEEKLY", "MONTHLY"
      startDate,
      endDate,
      title,
      executiveSummary,
      keyObservations,
      consultantNotes,
      nextPriorities,
    } = body;

    const periodStart = new Date(startDate);
    const periodEnd = new Date(endDate);
    periodEnd.setHours(23, 59, 59, 999);

    // Auto-aggregate from database records (PRD #59)
    const activities = await prisma.activityLog.findMany({
      where: {
        projectId: params.id,
        date: { gte: periodStart, lte: periodEnd },
      },
      include: { category: true, createdBy: true },
      orderBy: { date: "asc" },
    });

    const tasks = await prisma.task.findMany({
      where: {
        projectId: params.id,
        createdAt: { lte: periodEnd },
      },
      include: { assignedTo: true },
    });

    const recommendations = await prisma.recommendation.findMany({
      where: {
        projectId: params.id,
        createdAt: { gte: periodStart, lte: periodEnd },
      },
      include: { decisions: true },
    });

    const issues = await prisma.issue.findMany({
      where: {
        projectId: params.id,
        createdAt: { gte: periodStart, lte: periodEnd },
      },
    });

    const totalDurationMinutes = activities.reduce((acc, a) => acc + (a.durationMinutes || 0), 0);
    const totalConsultingHours = Math.round((totalDurationMinutes / 60) * 10) / 10;

    const completedTasks = tasks.filter((t) => t.status === "DONE").length;
    const openTasks = tasks.filter((t) => !["DONE", "CANCELLED"].includes(t.status)).length;
    const approvedRecs = recommendations.filter((r) => r.status === "APPROVED" || r.decisions.length > 0).length;
    const criticalIssuesCount = issues.filter((i) => i.severity === "CRITICAL").length;

    const metrics = {
      activitiesCount: activities.length,
      consultingHours: totalConsultingHours,
      completedTasks,
      openTasks,
      recommendationsSubmitted: recommendations.length,
      recommendationsApproved: approvedRecs,
      newIssues: issues.length,
      criticalIssues: criticalIssuesCount,
      activitiesList: activities.map((a) => ({
        id: a.id,
        time: a.startTime || format(a.date, "HH:mm"),
        title: a.title,
        type: a.activityType,
        outcome: a.outcome,
        finding: a.finding,
        nextAction: a.nextAction,
      })),
    };

    const count = await prisma.report.count({ where: { projectId: params.id } });
    const codePrefix = type === "DAILY" ? "DLY" : type === "WEEKLY" ? "WKL" : "MTH";
    const reportCode = `REP-${codePrefix}-${format(periodStart, "yyyyMMdd")}-${count + 1}`;

    const report = await prisma.report.create({
      data: {
        reportCode,
        projectId: params.id,
        type: type || "DAILY",
        title: title || `${type} Consulting Report — ${format(periodStart, "dd MMM yyyy")}`,
        periodStart,
        periodEnd,
        status: "DRAFT",
        version: 1,
        executiveSummary: executiveSummary || null,
        keyObservations: keyObservations || null,
        consultantNotes: consultantNotes || null,
        nextPriorities: nextPriorities || null,
        metricsJson: JSON.stringify(metrics),
        generatedById: user.id,
      },
      include: { generatedBy: true },
    });

    await logAuditTrail({
      projectId: params.id,
      userId: user.id,
      action: "CREATE",
      entityType: "REPORT",
      entityId: report.id,
      description: `${user.name} membuat laporan konsultasi [${reportCode}] (${type})`,
    });

    return NextResponse.json({ report });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
