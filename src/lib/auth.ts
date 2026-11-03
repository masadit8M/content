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

  if (!token) return null;

  try {
    const session = await verifySessionToken(token);
    if (!session) return null;

    // 1. Coba cari berdasarkan userId
    if (session.userId) {
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
      });
      if (user) return user;
    }

    // 2. Fallback cerdas: cari berdasarkan email jika DB sempat di-reseed
    if (session.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.email.toLowerCase() },
      });
      if (user) return user;
    }

    return null;
  } catch (err) {
    console.error("Error getCurrentUser:", err);
    return null;
  }
}
