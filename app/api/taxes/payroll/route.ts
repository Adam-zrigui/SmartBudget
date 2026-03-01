import { NextRequest, NextResponse } from 'next/server';
import { calcGermanTaxMatrix, DE_TAX_CLASSES, DE_STATES } from '@/lib/utils';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { grossMonthly, kirchenmitglied = false, hasKinder = false } = body;
    if (!grossMonthly) {
      return NextResponse.json({ error: 'Missing grossMonthly' }, { status: 400 });
    }

    const matrix = await calcGermanTaxMatrix({ grossMonthly, kirchenmitglied, hasKinder }, DE_TAX_CLASSES, DE_STATES);
    return NextResponse.json({ ok: true, data: matrix });
  } catch (err) {
    console.error('POST /api/taxes/payroll error:', err);
    return NextResponse.json({ error: 'Failed to compute payroll matrix' }, { status: 500 });
  }
}
