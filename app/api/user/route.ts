import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

// Explicitly dynamic due to session usage, but with ISR caching
// Cache user data for 5 minutes, revalidate on demand
export const dynamic = 'force-dynamic';
export const revalidate = 300;

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session as any)?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, image: true, twoFactorEnabled: true },
    });

    // Set cache headers for user data
    const response = NextResponse.json(user);
    response.headers.set('Cache-Control', 'private, max-age=300, must-revalidate');
    return response;
  } catch (err) {
    console.error("/api/user GET error", err);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session as any)?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, email, twoFactorEnabled } = body;
    const update: any = {};
    if (name !== undefined) update.name = name;
    if (email !== undefined) update.email = email;
    if (twoFactorEnabled !== undefined) update.twoFactorEnabled = twoFactorEnabled;

    await prisma.user.update({ where: { id: userId }, data: update });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("/api/user PUT error", err);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session as any)?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // delete the user and cascade related data
    await prisma.user.delete({ where: { id: userId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("/api/user DELETE error", err);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
