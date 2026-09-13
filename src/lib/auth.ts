import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "./prisma";

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || "arjuna_consulting_workspace_secret_key_super_secure_2026"
);

export const COOKIE_NAME = "arjuna_session";

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  globalRole: string;
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(SECRET_KEY);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

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
