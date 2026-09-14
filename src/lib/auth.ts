import { cookies } from "next/headers";
import { prisma } from "./prisma";
import {
  COOKIE_NAME,
  SessionPayload,
  createSessionToken,
  verifySessionToken,
} from "./jwt";

export {
  COOKIE_NAME,
  type SessionPayload,
  createSessionToken,
  verifySessionToken,
};

export async function getCurrentUser() {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  let userId: string | null = null;

  if (token) {
    const session = await verifySessionToken(token);
    if (session?.userId) {
      userId = session.userId;
    }
  }

  try {
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          organizationMemberships: {
            include: { organization: true },
          },
          projectMemberships: {
            include: { project: true },
          },
        },
      });
      if (user) return user;
    }

    return null;
  } catch {
    return null;
  }
}

export async function getProjectRole(projectId: string, userId: string) {
  const member = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId,
      },
    },
  });
  return member?.role ?? null;
}

export async function requireProjectMembership(projectId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized: Silakan login terlebih dahulu");

  if (user.globalRole === "ARJUNA_SUPER_ADMIN") {
    return { user, role: "ARJUNA_SUPER_ADMIN" };
  }

  const role = await getProjectRole(projectId, user.id);
  if (!role) {
    throw new Error("Forbidden: Anda tidak memiliki akses ke proyek ini");
  }

  return { user, role };
}
