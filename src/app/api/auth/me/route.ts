import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    let user = await getCurrentUser();

    // If no session exists yet, default auto-login to Mas Adit (Arjuna Lead Consultant) for seamless demo
    if (!user) {
      const defaultUser = await prisma.user.findFirst({
        where: { email: "masadit@arjuna.id" },
        include: {
          organizationMemberships: { include: { organization: true } },
          projectMemberships: { include: { project: true } },
        },
      });
      if (defaultUser) {
        user = defaultUser;
      }
    }

    if (!user) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        title: user.title,
        avatar: user.avatar,
        globalRole: user.globalRole,
        organizations: user.organizationMemberships.map((om) => ({
          id: om.organization.id,
          name: om.organization.name,
          type: om.organization.type,
          role: om.role,
        })),
        projects: user.projectMemberships.map((pm) => ({
          id: pm.project.id,
          displayName: pm.project.displayName,
          legalName: pm.project.legalName,
          role: pm.role,
          healthScore: pm.project.healthScore,
          progress: pm.project.progressPercentage,
        })),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
