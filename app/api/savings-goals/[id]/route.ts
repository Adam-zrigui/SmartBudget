import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth-helper";
import { prisma } from "@/lib/prisma";

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getAuthenticatedUserId(request);
    const { id } = await context.params;

    const body = await request.json();
    const { name, targetAmount, currentAmount, dueDate, priority, category, description, isCompleted } = body;

    if (!name || !targetAmount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const goal = await prisma.savingsGoal.updateMany({
      where: { id, userId },
      data: {
        name,
        targetAmount: parseFloat(String(targetAmount)),
        currentAmount: currentAmount !== undefined ? parseFloat(String(currentAmount)) : undefined,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority: priority !== undefined ? parseInt(String(priority), 10) : undefined,
        category: category || null,
        isCompleted: isCompleted !== undefined ? Boolean(isCompleted) : undefined,
        description,
      },
    });

    if (goal.count === 0) {
      return NextResponse.json({ error: "Savings goal not found" }, { status: 404 });
    }

    const updatedGoal = await prisma.savingsGoal.findUnique({
      where: { id },
      include: {
        contributions: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return NextResponse.json(updatedGoal);
  } catch (error) {
    console.error("PUT /api/savings-goals/[id] error:", error);
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

    // First delete all contributions for this goal
    await prisma.goalContribution.deleteMany({
      where: { goalId: id },
    });

    // Then delete the goal
    const goal = await prisma.savingsGoal.deleteMany({
      where: { id, userId },
    });

    if (goal.count === 0) {
      return NextResponse.json({ error: "Savings goal not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/savings-goals/[id] error:", error);
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
