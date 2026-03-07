import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth-helper";
import { prisma } from "@/lib/prisma";

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getAuthenticatedUserId(request);
    const { id } = await context.params;

    const body = await request.json();
    const { category, maxAmount, alertThreshold } = body;

    if (!category || maxAmount === undefined || maxAmount === null) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const budget = await prisma.budget.updateMany({
      where: { id, userId },
      data: {
        category,
        maxAmount: parseFloat(String(maxAmount)),
        alertThreshold: alertThreshold !== undefined && alertThreshold !== null
          ? parseFloat(String(alertThreshold))
          : 80,
      },
    });

    if (budget.count === 0) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }

    const updatedBudget = await prisma.budget.findUnique({
      where: { id },
    });

    return NextResponse.json(updatedBudget);
  } catch (error) {
    console.error("PUT /api/budgets/[id] error:", error);
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getAuthenticatedUserId(request);
    const { id } = await context.params;

    const budget = await prisma.budget.deleteMany({
      where: { id, userId },
    });

    if (budget.count === 0) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/budgets/[id] error:", error);
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
