import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/auth-helper";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    // Get Firebase user ID from token
    const userId = await getAuthenticatedUserId(req);

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

    const transactions = await prisma.transaction.findMany({
      where,
      select: {
        id: true,
        description: true,
        amount: true,
        type: true,
        date: true,
        category: true,
        tag: true,
        vat: true,
        churchTax: true,
        employmentStatus: true,
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(transactions, {
      headers: {
        'Cache-Control': 'private, max-age=60', // 1 minute cache
      },
    });
  } catch (err: unknown) {
    console.error("GET /api/transactions error:", err);
    const msg = err instanceof Error ? err.message : String(err);
    
    // If auth failed, return 401
    if (msg.includes("Unauthorized") || msg.includes("token")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // If Prisma can't reach the DB (development offline), return empty list so UI remains usable
    if (msg.includes("Can't reach database server") || msg.includes('PrismaClientInitializationError')) {
      return NextResponse.json([], { status: 200 });
    }
    
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log('[POST /api/transactions] Request received');
    
    // Get Firebase user ID from token
    const userId = await getAuthenticatedUserId(req);
    console.log('[POST] Firebase user:', userId);

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
