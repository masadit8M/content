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
    const severity = searchParams.get("severity");
    const status = searchParams.get("status");
    const categoryId = searchParams.get("categoryId");
    const search = searchParams.get("search");

    const whereClause: any = {
      projectId: params.id,
    };

    if (severity) whereClause.severity = severity;
    if (status) whereClause.status = status;
    if (categoryId) whereClause.categoryId = categoryId;
    if (search) {
      whereClause.OR = [
        { title: { contains: search } },
        { issueCode: { contains: search } },
        { problem: { contains: search } },
        { impact: { contains: search } },
      ];
    }

    const issues = await prisma.issue.findMany({
      where: whereClause,
      include: {
        category: true,
        assignedTo: true,
        reportedBy: true,
        activity: true,
        tasks: true,
      },
      orderBy: [
        { severity: "desc" },
        { createdAt: "desc" },
      ],
    });

    const members = await prisma.projectMember.findMany({
      where: { projectId: params.id },
      include: { user: true },
    });

    const categories = await prisma.category.findMany({
      where: { projectId: params.id },
    });

    return NextResponse.json({ issues, members, categories });
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
      problem,
      impact,
      consultantAnalysis,
      recommendation,
      severity,
      categoryId,
      phaseId,
      assignedToId,
      activityId,
    } = body;

    if (!title || !problem) {
      return NextResponse.json({ error: "Judul masalah dan uraian problem wajib diisi" }, { status: 400 });
    }

    const count = await prisma.issue.count({ where: { projectId: params.id } });
    const issueCode = `ISSUE-${String(count + 1).padStart(3, "0")}`;

    const issue = await prisma.issue.create({
      data: {
        issueCode,
        projectId: params.id,
        title,
        problem,
        impact: impact || null,
        consultantAnalysis: consultantAnalysis || null,
        recommendation: recommendation || null,
        severity: severity || "MEDIUM",
        status: "OPEN",
        categoryId: categoryId || null,
        phaseId: phaseId || null,
        assignedToId: assignedToId || null,
        reportedById: user.id,
        activityId: activityId || null,
      },
      include: {
        category: true,
        assignedTo: true,
        reportedBy: true,
      },
    });

    // If critical issue, notify key stakeholders immediately (PRD #17)
    if (severity === "CRITICAL") {
      const allMembers = await prisma.projectMember.findMany({
        where: { projectId: params.id },
      });
      for (const m of allMembers) {
        await createNotification({
          userId: m.userId,
          projectId: params.id,
          title: `⚠ CRITICAL ISSUE: [${issueCode}]`,
          message: `Masalah kritis dilaporkan: "${title}". Harap segera tindak lanjuti!`,
          linkUrl: `/projects/${params.id}/issues`,
          type: "ISSUE",
        });
      }
    } else if (assignedToId && assignedToId !== user.id) {
      await createNotification({
        userId: assignedToId,
        projectId: params.id,
        title: `Penugasan Isu: [${issueCode}]`,
        message: `${user.name} menugaskan isu: "${title}" kepada Anda`,
        linkUrl: `/projects/${params.id}/issues`,
        type: "ISSUE",
      });
    }

    // Digital Trail Audit
    await logAuditTrail({
      projectId: params.id,
      userId: user.id,
      action: "CREATE",
      entityType: "ISSUE",
      entityId: issue.id,
      description: `${user.name} mencatat isu operasional [${issueCode}] "${title}" (Severity: ${severity || "MEDIUM"})`,
    });

    return NextResponse.json({ issue });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
