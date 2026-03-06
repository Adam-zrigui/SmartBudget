import { NextResponse } from 'next/server';
import { getBundeslandTaxData } from '@/lib/tax-aggregator';

export async function GET(
  _: Request,
  { params }: { params: Promise<{ state: string }> }
) {
  try {
    const { state } = await params;
    const stateKey = state?.toLowerCase();
    if (!stateKey) {
      return NextResponse.json(
        { ok: false, error: 'state missing' },
        { status: 400 }
      );
    }

    const data = getBundeslandTaxData(
      decodeURIComponent(stateKey)
    );
    if (!data) {
      return NextResponse.json(
        { ok: false, error: 'state not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, data });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message || String(err) },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
