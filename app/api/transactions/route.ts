import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session as any)?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month");
    const type = searchParams.get("type");

    const where: any = { userId };
    if (type && type !== "all") where.type = type;
    if (month && month !== "all") {
      const [y, m] = String(month).split("-");
      const startDate = new Date(parseInt(y), parseInt(m) - 1, 1);
      const endDate = new Date(parseInt(y), parseInt(m), 0, 23, 59, 59);
      where.date = { gte: startDate, lte: endDate };
    }

    const transactions = await prisma.transaction.findMany({ where, orderBy: { date: "desc" } });

    return NextResponse.json(transactions);
  } catch (err) {
    console.error("GET /api/transactions error:", err);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log('[POST /api/transactions] Request received');
    
    const session = await getServerSession(authOptions);
    const userId = (session as any)?.user?.id;
    console.log('[POST] Session:', userId ? 'valid' : 'missing');
    
    if (!userId) {
      console.log('[POST] No session/user ID, returning 401');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    console.log('[POST] Request body:', JSON.stringify(body, null, 2));
    
    const { type, amount, category, description, date, tag, bundesland, vat, churchTax, applyChurchTax, municipalTaxRange, employmentStatus, taxClass, hasKinder, salaryAllocation } = body;

    if (!type || !amount || !category || !description || !date) {
      console.log('[POST] Validation failed - missing required fields');
      console.log('[POST] type:', type, 'amount:', amount, 'category:', category, 'description:', description, 'date:', date);
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const transactionData = {
      userId,
      type,
      amount: parseFloat(String(amount)),
      category,
      description,
      date: new Date(date),
      tag: tag || null,
      bundesland: bundesland || null,
      vat: vat ? parseFloat(String(vat)) : null,
      churchTax: applyChurchTax && churchTax ? parseFloat(String(churchTax)) : null,
      applyChurchTax: applyChurchTax || false,
      municipalTaxRange: municipalTaxRange ? JSON.stringify(municipalTaxRange) : null,
      employmentStatus: employmentStatus || null,
      taxClass: taxClass ? parseInt(String(taxClass)) : null,
      hasKinder: hasKinder || false,
      salaryAllocation: salaryAllocation ? JSON.stringify(salaryAllocation) : null,
    };
    
    console.log('[POST] Creating transaction with data:', JSON.stringify(transactionData, null, 2));

    const transaction = await prisma.transaction.create({
      data: transactionData,
    });

    console.log('[POST] Transaction created successfully, ID:', transaction.id);
    return NextResponse.json(transaction, { status: 201 });
  } catch (err) {
    console.error('[POST /api/transactions] Error:', err);
    return NextResponse.json(
      { error: "Failed to create transaction", details: String(err) },
      { status: 500 }
    );
  }
}
