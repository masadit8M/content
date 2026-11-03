import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { TEAM_MEMBERS } from "@/lib/team-data";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          title: true,
          role: true,
          avatar: true,
        },
        orderBy: { name: "asc" },
      });

      if (users && users.length > 0) {
        return NextResponse.json({ users });
      }
    } catch (dbErr) {
      console.warn("DB users query failed, returning static team members:", dbErr);
    }

    // Fallback: return 9 members
    return NextResponse.json({ users: TEAM_MEMBERS });
  } catch (error: any) {
    return NextResponse.json({ users: TEAM_MEMBERS });
  }
}
