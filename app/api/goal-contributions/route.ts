import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth-helper";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request);

    const body = await request.json();
    const { goalId, amount, description } = body;

    if (!goalId || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify the goal belongs to the user
    const goal = await prisma.savingsGoal.findFirst({
      where: { id: goalId, userId },
    });

    if (!goal) {
      return NextResponse.json({ error: "Savings goal not found" }, { status: 404 });
    }

    // Create the contribution
    const contribution = await prisma.goalContribution.create({
      data: {
        goalId,
        amount: parseFloat(String(amount)),
        description,
      },
    });

    // Update the goal's current amount
    await prisma.savingsGoal.update({
      where: { id: goalId },
      data: {
        currentAmount: {
          increment: parseFloat(String(amount)),
        },
      },
    });

    // Return the updated goal with contributions
    const updatedGoal = await prisma.savingsGoal.findUnique({
      where: { id: goalId },
      include: {
        contributions: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return NextResponse.json(updatedGoal, { status: 201 });
  } catch (error) {
    console.error("POST /api/goal-contributions error:", error);
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
