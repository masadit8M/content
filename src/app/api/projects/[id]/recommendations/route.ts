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
    const scopeStatus = searchParams.get("scopeStatus");
    const search = searchParams.get("search");

    const whereClause: any = {
      projectId: params.id,
    };

    if (status) whereClause.status = status;
    if (priority) whereClause.priority = priority;
    if (categoryId) whereClause.categoryId = categoryId;
    if (scopeStatus) whereClause.scopeStatus = scopeStatus;
    if (search) {
      whereClause.OR = [
        { title: { contains: search } },
        { recCode: { contains: search } },
        { problemBackground: { contains: search } },
        { consultantAnalysis: { contains: search } },
        { recommendationText: { contains: search } },
      ];
    }

    const recommendations = await prisma.recommendation.findMany({
      where: whereClause,
      include: {
        category: true,
        createdBy: true,
        decisions: {
          include: { decisionBy: true },
          orderBy: { decisionAt: "desc" },
        },
        tasks: {
          include: { assignedTo: true },
        },
        activity: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const categories = await prisma.category.findMany({
      where: { projectId: params.id },
    });

    return NextResponse.json({ recommendations, categories });
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
      problemBackground,
      consultantAnalysis,
      recommendationText,
      expectedOutcome,
      priority,
      categoryId,
      phaseId,
      scopeStatus,
      decisionRequiredFrom,
      decisionDeadline,
      activityId,
    } = body;

    if (!title || !problemBackground || !consultantAnalysis || !recommendationText) {
      return NextResponse.json({ error: "Judul, latar belakang masalah, analisa, dan teks rekomendasi wajib diisi" }, { status: 400 });
    }

    // Generate rec code (e.g. REC-023)
    const count = await prisma.recommendation.count({ where: { projectId: params.id } });
    const recCode = `REC-${String(count + 1).padStart(3, "0")}`;

    const recommendation = await prisma.recommendation.create({
      data: {
        recCode,
        projectId: params.id,
        title,
        problemBackground,
        consultantAnalysis,
        recommendationText,
        expectedOutcome: expectedOutcome || null,
        priority: priority || "NORMAL",
        status: "SUBMITTED",
        categoryId: categoryId || null,
        phaseId: phaseId || null,
        scopeStatus: scopeStatus || "IN_SCOPE",
        decisionRequiredFrom: decisionRequiredFrom || "Client Owner / Decision Maker",
        decisionDeadline: decisionDeadline ? new Date(decisionDeadline) : null,
        createdById: user.id,
        activityId: activityId || null,
      },
      include: {
        category: true,
        createdBy: true,
      },
    });

    // Notify client decision maker
    const clientMembers = await prisma.projectMember.findMany({
      where: { projectId: params.id, role: { in: ["CLIENT_OWNER", "CLIENT_MANAGER"] } },
      include: { user: true },
    });

    for (const member of clientMembers) {
      await createNotification({
        userId: member.userId,
        projectId: params.id,
        title: `Rekomendasi Baru Membutuhkan Keputusan: [${recCode}]`,
        message: `${user.name} mengajukan rekomendasi: "${title}". Menunggu persetujuan Anda.`,
        linkUrl: `/projects/${params.id}/recommendations`,
        type: "RECOMMENDATION",
      });
    }

    // Digital Trail Audit
    await logAuditTrail({
      projectId: params.id,
      userId: user.id,
      action: "CREATE",
      entityType: "RECOMMENDATION",
      entityId: recommendation.id,
      description: `${user.name} mengajukan rekomendasi [${recCode}] "${title}" (Status: SUBMITTED)`,
    });

    return NextResponse.json({ recommendation });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
