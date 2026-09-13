import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAuditTrail } from "@/lib/audit";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");
    const scopeStatus = searchParams.get("scopeStatus");
    const activityType = searchParams.get("type");
    const search = searchParams.get("search");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const month = searchParams.get("month");

    const whereClause: any = {
      projectId: params.id,
    };

    if (categoryId) whereClause.categoryId = categoryId;
    if (scopeStatus) whereClause.scopeStatus = scopeStatus;
    if (activityType) whereClause.activityType = activityType;

    if (month) {
      const [yearStr, monthStr] = month.split("-");
      const year = parseInt(yearStr);
      const m = parseInt(monthStr);
      const start = new Date(year, m - 1, 1);
      const end = new Date(year, m, 0, 23, 59, 59, 999);
      whereClause.date = { gte: start, lte: end };
    } else if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(startDate),
        lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
      };
    }

    if (search) {
      whereClause.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { outcome: { contains: search } },
        { finding: { contains: search } },
      ];
    }

    const activities = await prisma.activityLog.findMany({
      where: whereClause,
      include: {
        category: true,
        createdBy: true,
        reportToUser: {
          select: { id: true, name: true, title: true, globalRole: true, avatar: true },
        },
        tasks: true,
        recommendations: true,
        issues: true,
      },
      orderBy: { date: "desc" },
    });

    const categories = await prisma.category.findMany({
      where: { projectId: params.id },
    });

    const members = await prisma.projectMember.findMany({
      where: { projectId: params.id },
      include: {
        user: { select: { id: true, name: true, email: true, title: true, globalRole: true, avatar: true } },
      },
    });

    return NextResponse.json({ activities, categories, members });
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
      activityType,
      date,
      startTime,
      endTime,
      durationMinutes,
      categoryId,
      phaseId,
      description,
      participants,
      outcome,
      finding,
      nextAction,
      scopeStatus,
      location,
      status,
      mediaUrl,
      reportToUserId,
      reportedUserIds,
    } = body;

    if (!title || !date || !description) {
      return NextResponse.json({ error: "Judul/Plan, tanggal, dan deskripsi wajib diisi" }, { status: 400 });
    }

    const finalReportedUserIds = Array.isArray(reportedUserIds)
      ? JSON.stringify(reportedUserIds)
      : (reportedUserIds || null);

    const primaryReportTo = reportToUserId || (Array.isArray(reportedUserIds) && reportedUserIds.length > 0 ? reportedUserIds[0] : null);

    const activity = await prisma.activityLog.create({
      data: {
        projectId: params.id,
        title,
        activityType: activityType || "CONSULTATION",
        date: new Date(date),
        startTime: startTime || null,
        endTime: endTime || null,
        durationMinutes: Number(durationMinutes) || 60,
        categoryId: categoryId || null,
        phaseId: phaseId || null,
        description,
        participants: participants || null,
        outcome: outcome || null,
        finding: finding || null,
        nextAction: nextAction || null,
        scopeStatus: scopeStatus || "IN_SCOPE",
        location: location || null,
        status: status || "COMPLETED",
        mediaUrl: mediaUrl || null,
        reportToUserId: primaryReportTo,
        reportedUserIds: finalReportedUserIds,
        createdById: user.id,
      },
      include: {
        category: true,
        createdBy: true,
        reportToUser: {
          select: { id: true, name: true, title: true, globalRole: true, avatar: true },
        },
      },
    });

    // Record digital trail
    await logAuditTrail({
      projectId: params.id,
      userId: user.id,
      action: "CREATE",
      entityType: "ACTIVITY",
      entityId: activity.id,
      description: `${user.name} mencatat kegiatan/jadwal: "${title}" (${status || "COMPLETED"})`,
    });

    return NextResponse.json({ activity });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { id, status, outcome, mediaUrl } = body;

    if (!id) {
      return NextResponse.json({ error: "ID aktivitas diperlukan" }, { status: 400 });
    }

    const updated = await prisma.activityLog.update({
      where: { id },
      data: {
        ...(status !== undefined && { status }),
        ...(outcome !== undefined && { outcome }),
        ...(mediaUrl !== undefined && { mediaUrl }),
      },
      include: {
        category: true,
        createdBy: true,
        reportToUser: {
          select: { id: true, name: true, title: true, globalRole: true, avatar: true },
        },
      },
    });

    return NextResponse.json({ activity: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
