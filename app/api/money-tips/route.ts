import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/auth-helper";
import { NextRequest, NextResponse } from "next/server";

/**
 * Generate personalized money-saving recommendations based on user spending
 * Cached for 1 hour as recommendations don't change frequently
 */
// Explicitly mark as dynamic since it reads from session/auth
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Get Firebase user ID from token
    const userId = await getAuthenticatedUserId(req);

    const { searchParams } = new URL(req.url);
    const language = searchParams.get("language") || "de";

    // Get last 3 months of transactions
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    let transactions: Array<{ category: string; amount: number }> = [];
    try {
      transactions = await prisma.transaction.findMany({
        where: {
          userId: userId,
          date: { gte: threeMonthsAgo },
          type: "expense",
        },
        select: {
          category: true,
          amount: true,
        },
      });
    } catch (dbErr: any) {
      const code = String(dbErr?.code || "");
      // P2021 = table missing; also handle temporary DB outages by falling back to generic tips.
      if (code !== "P2021") {
        console.error("GET /api/money-tips query error:", dbErr);
      }
      transactions = [];
    }

    // Calculate spending by category
    const categorySpending: Record<string, number> = {};
    transactions.forEach((tx) => {
      categorySpending[tx.category] = (categorySpending[tx.category] || 0) + tx.amount;
    });

    // Generate recommendations based on spending patterns
    const recommendations = generateRecommendations(
      categorySpending,
      language
    );

    return NextResponse.json(
      { recommendations },
      {
        headers: {
          // User-personalized response: browser-private cache only.
          'Cache-Control': 'private, max-age=300, stale-while-revalidate=900',
        },
      }
    );
  } catch (err: any) {
    const msg = String(err?.message || err);
    if (msg.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/money-tips error:", err);
    return NextResponse.json(
      { error: "Failed to fetch recommendations" },
      { status: 500 }
    );
  }
}

function generateRecommendations(
  categorySpending: Record<string, number>,
  language: string
) {
  const tips = {
    de: [
      {
        category: "Freizeit",
        title: "Streaming-Abos überprüfen",
        description: "Nutzt du wirklich alle 5 Streaming-Dienste? Sparpotenzial: 20-40 €/Monat",
        impact: "Sparen pro Monat: bis zu €40",
      },
      {
        category: "Transport",
        title: "ÖPNV-Jahresticket prüfen",
        description: "Könnte ein Jahresticket günstiger sein als einzelne Fahrten?",
        impact: "Sparen pro Monat: bis zu €50",
      },
      {
        category: "Versicherung",
        title: "Versicherungen vergleichen",
        description: "Krankenversicherung und Kfz-Versicherung jährlich neu vergleichen",
        impact: "Sparen pro Jahr: bis zu €300",
      },
      {
        category: "Lebensmittel",
        title: "Einkaufen mit Liste",
        description: "Impulsives Einkaufen reduzieren könnte bis zu 15% sparen",
        impact: "Sparen pro Monat: bis zu €30",
      },
      {
        category: "Wohnung",
        title: "Energiekosten optimieren",
        description: "Stromvergleiche und LED-Lampen könnten 100+ €/Jahr sparen",
        impact: "Sparen pro Monat: bis zu €10",
      },
    ],
    en: [
      {
        category: "Freizeit",
        title: "Check streaming subscriptions",
        description: "Do you really use all 5 streaming services? Save: €20-40/month",
        impact: "Save per month: up to €40",
      },
      {
        category: "Transport",
        title: "Review annual transit pass",
        description: "Could an annual ticket be cheaper than individual fares?",
        impact: "Save per month: up to €50",
      },
      {
        category: "Versicherung",
        title: "Compare insurance annually",
        description: "Health and car insurance should be compared yearly",
        impact: "Save per year: up to €300",
      },
      {
        category: "Lebensmittel",
        title: "Shop with a list",
        description: "Reduce impulse buying—save up to 15% on groceries",
        impact: "Save per month: up to €30",
      },
      {
        category: "Wohnung",
        title: "Optimize energy costs",
        description: "Compare electricity rates & use LED bulbs for 100+ €/year savings",
        impact: "Save per month: up to €10",
      },
    ],
  };

  const categoryTips = tips[language as keyof typeof tips] || tips.en;

  // Return tips based on their top spending categories
  const topCategories = Object.entries(categorySpending)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map((e) => e[0]);

  return categoryTips.filter(
    (tip) => topCategories.includes(tip.category) || Math.random() > 0.5
  );
}
