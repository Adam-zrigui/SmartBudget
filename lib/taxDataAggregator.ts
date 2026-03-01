/**
 * Aggregates tax data from public sources:
 * - VAT rates from jsonvat.com (public, no auth required)
 * - Church tax (Kirchensteuer) by Bundesland (hardcoded from official church sources)
 * - Basic municipal tax info where available
 */

export interface BundeslandTax {
  name: string;
  abbr: string;
  vat_standard: number;
  church_tax?: number;
  municipal_tax_info?: string;
  last_updated?: string;
}

// Church tax rates (Kirchensteuer) by state — 8% or 9%
// Source: German church diocesan offices and state finance authorities
const CHURCH_TAX_RATES: Record<string, number> = {
  'Baden-Württemberg': 8,
  'Bayern': 8,
  'Berlin': 8,
  'Brandenburg': 9,
  'Bremen': 9,
  'Hamburg': 9,
  'Hesse': 8,
  'Mecklenburg-Vorpommern': 9,
  'Niedersachsen': 9,
  'North Rhine-Westphalia': 9,
  'Rhineland-Palatinate': 8,
  'Saarland': 9,
  'Saxony': 9,
  'Saxony-Anhalt': 9,
  'Schleswig-Holstein': 8,
  'Thuringia': 9,
};

// Standard abbreviations
const STATE_ABBR: Record<string, string> = {
  'Baden-Württemberg': 'BW',
  'Bayern': 'BY',
  'Berlin': 'BE',
  'Brandenburg': 'BB',
  'Bremen': 'HB',
  'Hamburg': 'HH',
  'Hesse': 'HE',
  'Mecklenburg-Vorpommern': 'MV',
  'Niedersachsen': 'NI',
  'North Rhine-Westphalia': 'NW',
  'Rhineland-Palatinate': 'RP',
  'Saarland': 'SL',
  'Saxony': 'SN',
  'Saxony-Anhalt': 'ST',
  'Schleswig-Holstein': 'SH',
  'Thuringia': 'TH',
};

async function getVATData(): Promise<Record<string, number>> {
  try {
    // Try to fetch from jsonvat.com (public, no auth)
    const res = await fetch('https://jsonvat.com/');
    if (!res.ok) throw new Error('jsonvat.com unavailable');
    const data: any = await res.json();
    
    // Extract Germany's standard VAT (usually 'DE' or 'Germany')
    let germanyVAT = 19;
    if (data.Germany?.standard_rate) germanyVAT = parseFloat(String(data.Germany.standard_rate));
    else if (data.DE?.standard_rate) germanyVAT = parseFloat(String(data.DE.standard_rate));
    
    return { germany: germanyVAT };
  } catch (e) {
    // Fallback: Germany's standard VAT is 19%
    console.warn('Failed to fetch VAT data, using fallback:', e);
    return { germany: 19 };
  }
}

export async function aggregateTaxData(): Promise<BundeslandTax[]> {
  const vatData = await getVATData();
  const standardVAT = vatData.germany ?? 19;
  
  const states = Object.keys(CHURCH_TAX_RATES).map((name) => ({
    name,
    abbr: STATE_ABBR[name] || name.substring(0, 2).toUpperCase(),
    vat_standard: standardVAT,
    church_tax: CHURCH_TAX_RATES[name],
    municipal_tax_info: 'Municipal tax varies by municipality. See Gewerbesteuer Hebesätze.',
    last_updated: new Date().toISOString().split('T')[0],
  }));
  
  return states;
}

// Simple in-memory cache
let cachedData: BundeslandTax[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

export async function getTaxDataCached(): Promise<BundeslandTax[]> {
  const now = Date.now();
  if (cachedData && now - cacheTime < CACHE_TTL) {
    return cachedData;
  }
  
  const data = await aggregateTaxData();
  cachedData = data;
  cacheTime = now;
  return data;
}
