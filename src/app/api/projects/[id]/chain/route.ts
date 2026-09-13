import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Fetch activities that have connected issues, recommendations, or tasks
    const activitiesWithChain = await prisma.activityLog.findMany({
      where: {
        projectId: params.id,
        OR: [
          { issues: { some: {} } },
          { recommendations: { some: {} } },
          { tasks: { some: {} } },
        ],
      },
      include: {
        createdBy: true,
        category: true,
        issues: {
          include: {
            assignedTo: true,
            tasks: { include: { assignedTo: true, checklist: true } },
          },
        },
        recommendations: {
          include: {
            createdBy: true,
            decisions: { include: { decisionBy: true } },
            tasks: { include: { assignedTo: true, checklist: true } },
          },
        },
        tasks: {
          include: { assignedTo: true, checklist: true },
        },
      },
      orderBy: { date: "desc" },
    });

    // Also fetch recommendations that have decisions and tasks directly
    const recommendationsWithChain = await prisma.recommendation.findMany({
      where: {
        projectId: params.id,
      },
      include: {
        category: true,
        createdBy: true,
        activity: true,
        decisions: { include: { decisionBy: true }, orderBy: { decisionAt: "desc" } },
        tasks: { include: { assignedTo: true, checklist: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      activityChains: activitiesWithChain,
      recommendationChains: recommendationsWithChain,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
