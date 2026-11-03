import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSessionToken, COOKIE_NAME } from "@/lib/auth";
import { findTeamMember } from "@/lib/team-data";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email target diperlukan" }, { status: 400 });
    }

    const cleanInput = email.trim().toLowerCase();
    const cleanEmail = cleanInput.includes("@") ? cleanInput : `${cleanInput}@marketing.id`;

    let targetUser: {
      id: string;
      email: string;
      name: string;
      role: string;
      title?: string | null;
      avatar?: string | null;
    } | null = null;

    try {
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: cleanEmail },
            { email: cleanInput },
          ],
        },
      });

      if (user) {
        targetUser = {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          title: user.title,
          avatar: user.avatar,
        };
      }
    } catch (err) {
      console.warn("DB lookup error in switch-persona, falling back to team data:", err);
    }

    if (!targetUser) {
      const teamMember = findTeamMember(cleanInput);
      if (teamMember) {
        targetUser = {
          id: teamMember.id,
          email: teamMember.email,
          name: teamMember.name,
          role: teamMember.role,
          title: teamMember.title,
          avatar: teamMember.avatar,
        };
      }
    }

    if (!targetUser) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    const token = await createSessionToken({
      userId: targetUser.id,
      email: targetUser.email,
      name: targetUser.name,
      role: targetUser.role,
    });

    const response = NextResponse.json({
      success: true,
      user: targetUser,
    });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Gagal ganti persona" }, { status: 500 });
  }
}
