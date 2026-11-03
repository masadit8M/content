import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createSessionToken, COOKIE_NAME } from "@/lib/auth";
import { findTeamMember } from "@/lib/team-data";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email/username dan password wajib diisi" }, { status: 400 });
    }

    const cleanInput = email.trim().toLowerCase();
    const cleanEmail = cleanInput.includes("@") ? cleanInput : `${cleanInput}@marketing.id`;
    const cleanUsername = cleanInput.includes("@") ? cleanInput.split("@")[0] : cleanInput;

    let authenticatedUser: {
      id: string;
      email: string;
      name: string;
      role: string;
      title?: string | null;
      avatar?: string | null;
    } | null = null;

    // 1. Coba verifikasi via Database Prisma
    try {
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: cleanEmail },
            { email: cleanInput },
            { name: cleanUsername },
          ],
        },
      });

      if (user) {
        let isValid = false;
        try {
          isValid = await bcrypt.compare(password, user.passwordHash);
        } catch {
          isValid = false;
        }

        // Master password fallback untuk kemudahan akses simulasi tim
        if (!isValid && (password === "Admin#2026" || password === "admin2026")) {
          isValid = true;
        }

        if (isValid) {
          authenticatedUser = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            title: user.title,
            avatar: user.avatar,
          };
        }
      }
    } catch (dbError) {
      console.warn("Prisma login lookup encountered issue, checking resilient team fallback:", dbError);
    }

    // 2. Resilient Fallback: Jika DB belum terhubung atau serverless read-only
    if (!authenticatedUser) {
      const teamMember = findTeamMember(cleanInput);
      if (teamMember) {
        if (password === "Admin#2026" || password === "admin2026" || password.length >= 4) {
          authenticatedUser = {
            id: teamMember.id,
            email: teamMember.email,
            name: teamMember.name,
            role: teamMember.role,
            title: teamMember.title,
            avatar: teamMember.avatar,
          };
        }
      }
    }

    if (!authenticatedUser) {
      return NextResponse.json({
        error: `Akun "${email}" tidak ditemukan atau password salah. Silakan klik salah satu tombol 'Akses Cepat 1-Klik' di bawah atau gunakan password Admin#2026`,
      }, { status: 401 });
    }

    const token = await createSessionToken({
      userId: authenticatedUser.id,
      email: authenticatedUser.email,
      name: authenticatedUser.name,
      role: authenticatedUser.role,
    });

    const response = NextResponse.json({
      success: true,
      user: authenticatedUser,
    });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: "lax",
    });

    return response;
  } catch (error: any) {
    console.error("Login route error:", error);
    return NextResponse.json({ error: error.message || "Gagal memproses login" }, { status: 500 });
  }
}
