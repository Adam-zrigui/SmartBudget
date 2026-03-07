import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth-helper";
import { prisma } from "@/lib/prisma";

// Mock function to get current prices - in a real app, you'd integrate with a financial API
async function getCurrentPrice(symbol: string): Promise<number> {
  // This is a mock implementation - replace with actual API calls
  // For example, you could use Alpha Vantage, Yahoo Finance, or other financial APIs
  const mockPrices: { [key: string]: number } = {
    'AAPL': 175.50,
    'GOOGL': 140.25,
    'MSFT': 335.80,
    'TSLA': 248.90,
    'AMZN': 145.20,
    'NVDA': 875.30,
    'META': 325.75,
    'NFLX': 485.60,
    // Add more symbols as needed
  };

  return mockPrices[symbol.toUpperCase()] || 100; // Default fallback price
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request);

    const body = await request.json();
    const { investments } = body;

    if (!investments || !Array.isArray(investments)) {
      return NextResponse.json({ error: "Investments array required" }, { status: 400 });
    }

    const updatedInvestments = [];

    for (const investment of investments) {
      try {
        const currentPrice = await getCurrentPrice(investment.symbol);

        const updated = await prisma.investment.updateMany({
          where: { id: investment.id, userId },
          data: {
            currentPrice,
            lastUpdated: new Date(),
          },
        });

        if (updated.count > 0) {
          const updatedInvestment = await prisma.investment.findUnique({
            where: { id: investment.id },
          });
          if (updatedInvestment) {
            updatedInvestments.push(updatedInvestment);
          }
        }
      } catch (error) {
        console.error(`Error updating price for ${investment.symbol}:`, error);
        // Continue with other investments even if one fails
      }
    }

    return NextResponse.json(updatedInvestments);
  } catch (error) {
    console.error("POST /api/investments/update-prices error:", error);
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
