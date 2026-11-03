import { NextResponse } from "next/server";
import { getCurrentUser, COOKIE_NAME } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      const res = NextResponse.json({ user: null });
      res.cookies.delete(COOKIE_NAME);
      return res;
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        title: user.title,
        avatar: user.avatar,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.warn("api/auth/me caught error:", error);
    return NextResponse.json({ user: null });
  }
}
