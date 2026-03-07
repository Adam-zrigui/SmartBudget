import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth-helper";
import { prisma } from "@/lib/prisma";

function getCurrencyName(code: string): string {
  const names: { [key: string]: string } = {
    USD: "US Dollar",
    EUR: "Euro",
    GBP: "British Pound",
    JPY: "Japanese Yen",
    CAD: "Canadian Dollar",
    AUD: "Australian Dollar",
    CHF: "Swiss Franc",
    CNY: "Chinese Yuan",
    SEK: "Swedish Krona",
    NOK: "Norwegian Krone",
    DKK: "Danish Krone",
  };
  return names[code] || code;
}

async function setBaseCurrency(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request);

    const body = await request.json();
    const currencyCode = body?.currencyCode || body?.baseCurrency;

    if (!currencyCode) {
      return NextResponse.json({ error: "Currency code required" }, { status: 400 });
    }

    // Update user settings
    await prisma.userSettings.upsert({
      where: { userId },
      update: { baseCurrency: currencyCode },
      create: { userId, baseCurrency: currencyCode },
    });

    // Ensure selected base exists in the user's currency table.
    await prisma.currency.upsert({
      where: {
        userId_code: {
          userId,
          code: currencyCode,
        },
      },
      update: {
        rateToBase: 1,
        lastUpdated: new Date(),
      },
      create: {
        userId,
        code: currencyCode,
        name: getCurrencyName(currencyCode),
        rateToBase: 1,
      },
    });

    const currencies = await prisma.currency.findMany({
      where: { userId },
      orderBy: { code: "asc" },
    });

    const normalized = currencies.map((currency) => ({
      ...currency,
      exchangeRate: currency.rateToBase,
      isBase: currency.code === currencyCode,
    }));

    return NextResponse.json(normalized);
  } catch (error) {
    console.error("PATCH /api/currencies/set-base error:", error);
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  return setBaseCurrency(request);
}

export async function POST(request: NextRequest) {
  return setBaseCurrency(request);
}
