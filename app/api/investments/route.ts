import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth-helper";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request);

    const investments = await prisma.investment.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(investments);
  } catch (error) {
    console.error("GET /api/investments error:", error);
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

    const investment = await prisma.investment.create({
      data: {
        userId,
        symbol: symbol || null,
        name,
        type,
        quantity: parseFloat(String(quantity)),
        purchasePrice: parseFloat(String(purchasePrice)),
        currentPrice: currentPrice ? parseFloat(String(currentPrice)) : parseFloat(String(purchasePrice)),
        purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
        currency: currency || "EUR",
        portfolio: portfolio || null,
        riskLevel: riskLevel || null,
        expectedReturn: expectedReturn ? parseFloat(String(expectedReturn)) : null,
        broker: broker || null,
        notes: notes || null,
      },
    });

    return NextResponse.json(investment, { status: 201 });
  } catch (error) {
    console.error("POST /api/investments error:", error);
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
