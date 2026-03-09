import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth-helper";
import { prisma } from "@/lib/prisma";
import { ensureUserRecord } from "@/lib/ensure-user";

// Mock function to get exchange rates - in a real app, you'd integrate with a currency API
async function getExchangeRates(baseCurrency: string = 'EUR'): Promise<{ [key: string]: number }> {
  // This is a mock implementation - replace with actual API calls
  // For example, you could use ExchangeRate-API, Fixer, or other currency APIs
  const mockRates: { [key: string]: { [key: string]: number } } = {
    'EUR': {
      'USD': 1.08,
      'GBP': 0.85,
      'JPY': 160.50,
      'CAD': 1.45,
      'AUD': 1.65,
      'CHF': 0.95,
      'CNY': 7.80,
      'SEK': 11.20,
      'NOK': 11.50,
      'DKK': 7.45,
    },
    'USD': {
      'EUR': 0.93,
      'GBP': 0.79,
      'JPY': 148.75,
      'CAD': 1.34,
      'AUD': 1.53,
      'CHF': 0.88,
      'CNY': 7.23,
      'SEK': 10.38,
      'NOK': 10.65,
      'DKK': 6.90,
    },
  };

  return mockRates[baseCurrency] || mockRates['EUR'];
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request);
    await ensureUserRecord(userId);

    // Get user's base currency
    const userSettings = await prisma.userSettings.findUnique({
      where: { userId },
    });

    const baseCurrency = userSettings?.baseCurrency || 'EUR';

    // Get current exchange rates
    const rates = {
      ...await getExchangeRates(baseCurrency),
      [baseCurrency]: 1,
    };

    // Update or create currency records
    const currencies = [];
    for (const [code, rate] of Object.entries(rates)) {
      const currency = await prisma.currency.upsert({
        where: {
          userId_code: {
            userId,
            code,
          },
        },
        update: {
          rateToBase: rate,
          lastUpdated: new Date(),
        },
        create: {
          userId,
          code,
          name: getCurrencyName(code),
          rateToBase: rate,
          lastUpdated: new Date(),
        },
      });
      currencies.push(currency);
    }

    currencies.sort((a, b) => a.code.localeCompare(b.code));
    const normalized = currencies.map((currency) => ({
      ...currency,
      exchangeRate: currency.rateToBase,
      isBase: currency.code === baseCurrency,
    }));

    return NextResponse.json(normalized);
  } catch (error) {
    console.error("POST /api/currencies/update-rates error:", error);
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function getCurrencyName(code: string): string {
  const names: { [key: string]: string } = {
    'USD': 'US Dollar',
    'EUR': 'Euro',
    'GBP': 'British Pound',
    'JPY': 'Japanese Yen',
    'CAD': 'Canadian Dollar',
    'AUD': 'Australian Dollar',
    'CHF': 'Swiss Franc',
    'CNY': 'Chinese Yuan',
    'SEK': 'Swedish Krona',
    'NOK': 'Norwegian Krone',
    'DKK': 'Danish Krone',
  };
  return names[code] || code;
}
