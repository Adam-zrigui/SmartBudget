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

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request);
    const settings = await prisma.userSettings.findUnique({ where: { userId } });
    const baseCurrency = settings?.baseCurrency || "EUR";

    let currencies = await prisma.currency.findMany({
      where: { userId },
      orderBy: { code: "asc" },
    });

    if (currencies.length === 0) {
      await prisma.currency.create({
        data: {
          userId,
          code: baseCurrency,
          name: getCurrencyName(baseCurrency),
          rateToBase: 1,
        },
      });
      currencies = await prisma.currency.findMany({
        where: { userId },
        orderBy: { code: "asc" },
      });
    }

    const normalized = currencies.map((currency) => ({
      ...currency,
      exchangeRate: currency.rateToBase,
      isBase: currency.code === baseCurrency,
    }));

    return NextResponse.json(normalized);
  } catch (error) {
    console.error("GET /api/currencies error:", error);
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request);
    const settings = await prisma.userSettings.findUnique({ where: { userId } });
    const baseCurrency = settings?.baseCurrency || "EUR";

    const body = await request.json();
    const code = String(body?.code || "").toUpperCase().trim();
    const name = String(body?.name || getCurrencyName(code)).trim();
    const exchangeRate = Number(body?.exchangeRate ?? 1);

    if (!code || !Number.isFinite(exchangeRate) || exchangeRate <= 0) {
      return NextResponse.json({ error: "Invalid currency payload" }, { status: 400 });
    }

    const currency = await prisma.currency.upsert({
      where: {
        userId_code: {
          userId,
          code,
        },
      },
      update: {
        name,
        rateToBase: exchangeRate,
        lastUpdated: new Date(),
      },
      create: {
        userId,
        code,
        name,
        rateToBase: exchangeRate,
      },
    });

    return NextResponse.json({
      ...currency,
      exchangeRate: currency.rateToBase,
      isBase: code === baseCurrency,
    }, { status: 201 });
  } catch (error) {
    console.error("POST /api/currencies error:", error);
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request);
    const settings = await prisma.userSettings.findUnique({ where: { userId } });
    const baseCurrency = settings?.baseCurrency || "EUR";
    const body = await request.json();
    const code = String(body?.code || "").toUpperCase().trim();

    if (!code) {
      return NextResponse.json({ error: "Currency code required" }, { status: 400 });
    }
    if (code === baseCurrency) {
      return NextResponse.json({ error: "Cannot delete base currency" }, { status: 400 });
    }

    await prisma.currency.deleteMany({
      where: { userId, code },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/currencies error:", error);
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
