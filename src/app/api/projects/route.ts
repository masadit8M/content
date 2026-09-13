import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // If Arjuna Super Admin, can view all projects
    const isSuperAdmin = user.globalRole === "ARJUNA_SUPER_ADMIN";

    const projects = await prisma.project.findMany({
      where: isSuperAdmin
        ? {}
        : {
            members: {
              some: { userId: user.id },
            },
          },
      include: {
        clientOrg: true,
        consultantOrg: true,
        _count: {
          select: {
            tasks: { where: { status: { notIn: ["DONE", "CANCELLED"] } } },
            recommendations: { where: { status: "SUBMITTED" } },
            issues: { where: { status: { notIn: ["RESOLVED", "CLOSED"] } } },
            activities: true,
            sdmRequests: { where: { status: { in: ["SUBMITTED", "PROPOSAL_SENT", "AWAITING_APPROVAL"] } } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ projects });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.globalRole !== "ARJUNA_SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden: Hanya Admin yang dapat membuat project" }, { status: 403 });
    }

    const body = await request.json();
    const { displayName, legalName, clientOrgId, consultantOrgId, startDate, endDate } = body;

    const project = await prisma.project.create({
      data: {
        displayName,
        legalName: legalName || displayName,
        clientOrgId,
        consultantOrgId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: "ACTIVE",
        healthScore: "GREEN",
        progressPercentage: 0,
        members: {
          create: {
            userId: user.id,
            role: "ARJUNA_SUPER_ADMIN",
          },
        },
      },
    });

    return NextResponse.json({ project });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
