import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

// Explicitly dynamic due to session usage, but with ISR caching
// Cache sessions for 2 minutes
export const dynamic = 'force-dynamic';
export const revalidate = 120;

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session as any)?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessions = await prisma.session.findMany({
      where: { userId },
      select: { id: true, sessionToken: true, expires: true },
    });
    
    const response = NextResponse.json(sessions);
    response.headers.set('Cache-Control', 'private, max-age=120, must-revalidate');
    return response;
  } catch (err) {
    console.error("/api/user/sessions GET error", err);
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session as any)?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    await prisma.session.deleteMany({ where: { userId, sessionToken: token } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("/api/user/sessions DELETE error", err);
    return NextResponse.json({ error: "Failed to revoke session" }, { status: 500 });
  }
}