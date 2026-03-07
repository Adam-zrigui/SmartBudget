import { NextResponse } from 'next/server';
import { getAllBundesländerTaxData } from '@/lib/tax-aggregator';

export const dynamic = 'force-static';
export const revalidate = 86400;

export async function GET() {
  try {
    const data = getAllBundesländerTaxData();
    return NextResponse.json(
      { ok: true, data },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message || String(err) },
      { status: 500 }
    );
  }
}
