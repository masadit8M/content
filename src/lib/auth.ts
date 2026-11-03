import { cookies } from "next/headers";
import { prisma } from "./prisma";
import {
  COOKIE_NAME,
  SessionPayload,
  createSessionToken,
  verifySessionToken,
} from "./jwt";
import { findTeamMember } from "./team-data";

export {
  COOKIE_NAME,
  type SessionPayload,
  createSessionToken,
  verifySessionToken,
};

export async function getCurrentUser() {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) return null;

  try {
    const session = await verifySessionToken(token);
    if (!session) return null;

    // 1. Coba cari berdasarkan userId di Prisma
    try {
      if (session.userId) {
        const user = await prisma.user.findUnique({
          where: { id: session.userId },
        });
        if (user) return user;
      }

      // 2. Fallback: cari berdasarkan email
      if (session.email) {
        const user = await prisma.user.findUnique({
          where: { email: session.email.toLowerCase() },
        });
        if (user) return user;
      }
    } catch (dbErr) {
      console.warn("DB lookup in getCurrentUser encountered error:", dbErr);
    }

    // 3. Resilient fallback dari data tim statis
    if (session.email || session.userId) {
      const member = findTeamMember(session.email || session.userId);
      if (member) {
        return {
          id: member.id,
          email: member.email,
          name: member.name,
          title: member.title,
          role: member.role,
          avatar: member.avatar,
          passwordHash: "$2a$10$wK10jB24YnZvxB8FkO74hOSLpZc5z7M4XW8y4w7Gk7N38p8p1b8pG", // Admin#2026 hash
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }
    }

    return null;
  } catch (err) {
    console.error("Error getCurrentUser:", err);
    return null;
  }
}
