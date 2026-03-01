import { NextResponse } from 'next/server';
import { getAllBundesländerTaxData } from '@/lib/tax-aggregator';

export async function GET() {
  try {
    const data = getAllBundesländerTaxData();
    return NextResponse.json({ ok: true, data });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message || String(err) },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
