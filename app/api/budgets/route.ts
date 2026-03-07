import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth-helper";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request);

    const budgets = await prisma.budget.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(budgets);
  } catch (error) {
    console.error("GET /api/budgets error:", error);
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request);

    const body = await request.json();
    const { category, maxAmount, alertThreshold } = body;

    if (!category || maxAmount === undefined || maxAmount === null) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const budget = await prisma.budget.create({
      data: {
        userId,
        category,
        maxAmount: parseFloat(String(maxAmount)),
        alertThreshold: alertThreshold !== undefined && alertThreshold !== null
          ? parseFloat(String(alertThreshold))
          : 80,
      },
    });

    return NextResponse.json(budget, { status: 201 });
  } catch (error) {
    console.error("POST /api/budgets error:", error);
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
