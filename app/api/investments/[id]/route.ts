import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth-helper";
import { prisma } from "@/lib/prisma";

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getAuthenticatedUserId(request);
    const { id } = await context.params;

    const body = await request.json();
    const {
      symbol,
      name,
      type,
      quantity,
      purchasePrice,
      currentPrice,
      purchaseDate,
      currency,
      portfolio,
      riskLevel,
      expectedReturn,
      broker,
      notes,
    } = body;

    if (!name || !type || !quantity || !purchasePrice) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const investment = await prisma.investment.updateMany({
      where: { id, userId },
      data: {
        symbol: symbol || null,
        name,
        type,
        quantity: parseFloat(String(quantity)),
        purchasePrice: parseFloat(String(purchasePrice)),
        currentPrice: currentPrice ? parseFloat(String(currentPrice)) : undefined,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
        currency: currency || "EUR",
        portfolio: portfolio || null,
        riskLevel: riskLevel || null,
        expectedReturn: expectedReturn ? parseFloat(String(expectedReturn)) : null,
        broker: broker || null,
        notes: notes || null,
      },
    });

    if (investment.count === 0) {
      return NextResponse.json({ error: "Investment not found" }, { status: 404 });
    }

    const updatedInvestment = await prisma.investment.findUnique({
      where: { id },
    });

    return NextResponse.json(updatedInvestment);
  } catch (error) {
    console.error("PUT /api/investments/[id] error:", error);
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

    const investment = await prisma.investment.deleteMany({
      where: { id, userId },
    });

    if (investment.count === 0) {
      return NextResponse.json({ error: "Investment not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/investments/[id] error:", error);
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
