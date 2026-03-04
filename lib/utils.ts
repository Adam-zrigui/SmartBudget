import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { TAX_CONFIG } from './taxConfig'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Currency formatting
export const fmt = (v: number, cur: string = 'EUR'): string => {
  if (!v || isNaN(v)) return `0,00 ${cur}`;
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: cur,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v);
};

// wrapper around fetch that handles non-JSON and HTTP errors consistently
export async function fetchJson(input: RequestInfo, init?: RequestInit) {
  const res = await fetch(input, init);
  const text = await res.text();
  let data: any = text;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    // if not json, keep raw text
  }
  if (!res.ok) {
    const msg = data?.error || data?.message || text || res.statusText;
    throw new Error(msg);
  }
  return data;
}

// Month names in German
export const MONTHS_DE = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
];

// SVG Icons
export const IC = {
  dash: 'M3 12a9 9 0 1118 0A9 9 0 013 12z',
  list: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  chart: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  tax: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  chat: 'M17 8h-1V6a5 5 0 00-10 0v2H5a2 2 0 00-2 2v6a2 2 0 002 2h3v3l4-3h4a2 2 0 002-2v-6a2 2 0 00-2-2z',
  user: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  sun: 'M12 3v1m0 16v1m9-9h-1m-16 0H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z',
  moon: 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z',
  ok: 'M5 13l4 4L19 7',
  x: 'M6 18L18 6M6 6l12 12',
};

// Categories with icons
export const CATEGORIES = [
  { type: 'expense', name: 'Lebensmittel', icon: '🛒', color: '#f97316' },
  { type: 'expense', name: 'Transport', icon: '🚗', color: '#3b82f6' },
  { type: 'expense', name: 'Wohnung', icon: '🏠', color: '#8b5cf6' },
  { type: 'expense', name: 'Versicherung', icon: '🛡️', color: '#06b6d4' },
  { type: 'expense', name: 'Gesundheit', icon: '🏥', color: '#ec4899' },
  { type: 'expense', name: 'Freizeit', icon: '🎮', color: '#eab308' },
  { type: 'expense', name: 'Bildung', icon: '📚', color: '#14b8a6' },
  { type: 'expense', name: 'Sonstiges', icon: '📦', color: '#6b7280' },
  { type: 'income', name: 'Gehalt', icon: '💰', color: '#10b981' },
  { type: 'income', name: 'Bonus', icon: '🎁', color: '#06b6d4' },
  { type: 'income', name: 'Kapitalerträge', icon: '📈', color: '#059669' },
  { type: 'income', name: 'Sonstiges', icon: '💵', color: '#10b981' },
];

export const getCat = (name: string) => {
  return CATEGORIES.find(c => c.name === name);
};

// Tags
export const TAG = {
  recurring: { color: '#3b82f6', bg: '#3b82f620' },
  annual: { color: '#8b5cf6', bg: '#8b5cf620' },
};

// Seed data
export const SEED = [
  {
    id: 1,
    type: 'income',
    amount: 4200,
    category: 'Gehalt',
    description: 'Monatliches Gehalt',
    date: '2026-02-01',
    tag: 'recurring',
  },
  {
    id: 2,
    type: 'expense',
    amount: 1200,
    category: 'Wohnung',
    description: 'Miete',
    date: '2026-02-01',
    tag: 'recurring',
  },
  {
    id: 3,
    type: 'expense',
    amount: 450,
    category: 'Lebensmittel',
    description: 'Wocheneinkauf',
    date: '2026-02-03',
    tag: '',
  },
  {
    id: 4,
    type: 'expense',
    amount: 80,
    category: 'Transport',
    description: 'Tankstelle',
    date: '2026-02-05',
    tag: '',
  },
  {
    id: 5,
    type: 'expense',
    amount: 120,
    category: 'Freizeit',
    description: 'Kino & Essen',
    date: '2026-02-07',
    tag: '',
  },
  {
    id: 6,
    type: 'income',
    amount: 500,
    category: 'Kapitalerträge',
    description: 'Dividenden',
    date: '2026-02-15',
    tag: '',
  },
  {
    id: 7,
    type: 'expense',
    amount: 90,
    category: 'Versicherung',
    description: 'Krankenversicherung',
    date: '2026-02-20',
    tag: 'recurring',
  },
  {
    id: 8,
    type: 'expense',
    amount: 300,
    category: 'Gesundheit',
    description: 'Zahnarzt',
    date: '2026-02-21',
    tag: '',
  },
];

// German Tax Configuration
export const DE_TAX_CLASSES = [
  { id: 1, label: 'I - Ledig/Lediger' },
  { id: 2, label: 'II - Alleinerziehend' },
  { id: 3, label: 'III - Verheiratet/Verpartnert (höheres Einkommen)' },
  { id: 4, label: 'IV - Verheiratet/Verpartnert (gleiches Einkommen)' },
  { id: 5, label: 'V - Verheiratet/Verpartnert (niedrigeres Einkommen)' },
  { id: 6, label: 'VI - Mehrfachbeschäftigung' },
];

export const DE_STATES = [
  { id: 'BW', label: 'Baden-Württemberg' },
  { id: 'BY', label: 'Bayern' },
  { id: 'BE', label: 'Berlin' },
  { id: 'BB', label: 'Brandenburg' },
  { id: 'HB', label: 'Bremen' },
  { id: 'HH', label: 'Hamburg' },
  { id: 'HE', label: 'Hessen' },
  { id: 'MV', label: 'Mecklenburg-Vorpommern' },
  { id: 'NI', label: 'Niedersachsen' },
  { id: 'NW', label: 'Nordrhein-Westfalen' },
  { id: 'RP', label: 'Rheinland-Pfalz' },
  { id: 'SL', label: 'Saarland' },
  { id: 'SN', label: 'Sachsen' },
  { id: 'ST', label: 'Sachsen-Anhalt' },
  { id: 'SH', label: 'Schleswig-Holstein' },
  { id: 'TH', label: 'Thüringen' },
];

// Import church tax rates from config
export const KIRCHE_RATE = TAX_CONFIG.churchTax.rates;
// optional per-state tax rates
export const STATE_TAX_RATE = (state: string) => (TAX_CONFIG as any).stateTax?.rates?.[state] ?? (TAX_CONFIG as any).stateTax?.default ?? 0;

// German Tax Calculation
export const calcGermanTax = async (taxInput: any) => {
  try {
    const { grossMonthly, taxClass, state, kirchenmitglied, hasKinder } = taxInput;
    const grossMonthlyNum = parseFloat(grossMonthly) || 0;
    const grossAnnual = grossMonthlyNum * 12;

    // Income tax calculation using config
    function calculateIncomeTaxAnnual(gross: number) {
      const { basicAllowance } = TAX_CONFIG.incomeTax;
      if (gross <= basicAllowance) return 0;
      const taxableIncome = gross - basicAllowance;
      if (gross <= 60000) {
        const maxTaxAt60k = 8622.72;
        const maxTaxable = 60000 - basicAllowance;
        return maxTaxAt60k * Math.pow(taxableIncome / maxTaxable, 2);
      } else if (gross <= 70000) {
        const taxAt60k = 8622.72;
        const taxAt70k = 12586;
        const fraction = (gross - 60000) / (70000 - 60000);
        return taxAt60k + fraction * (taxAt70k - taxAt60k);
      } else {
        const taxAt70k = 12586;
        return taxAt70k + 0.30 * (gross - 70000);
      }
    }

    const incomeTaxAnnual = calculateIncomeTaxAnnual(grossAnnual);

    // Apply Steuerklasse multiplier (approximate adjustment)
    const tc = (TAX_CONFIG.taxClasses || []).find((c: any) => c.id === taxClass)?.multiplier ?? 1;
    const adjustedIncomeTaxAnnual = incomeTaxAnnual * tc;

    // Solidarity surcharge from config (applies to adjusted income tax)
    const { rate: soliRate, threshold: soliThreshold } = TAX_CONFIG.solidarity;
    const solidarityAnnual = adjustedIncomeTaxAnnual > soliThreshold ? adjustedIncomeTaxAnnual * soliRate : 0;
    
    // Church tax from config (percentage of adjusted income tax)
    const kirchRates = TAX_CONFIG.churchTax.rates as any;
    const kirchRate = kirchRates[state] ?? TAX_CONFIG.churchTax.default;
    const churchAnnual = kirchenmitglied ? adjustedIncomeTaxAnnual * (kirchRate / 100) : 0;

    // State-specific additional tax (percentage of adjusted income tax)
    const stateRate = STATE_TAX_RATE(state);
    const stateTaxAnnual = adjustedIncomeTaxAnnual * (stateRate / 100);

    // Social contributions from config
    const { healthInsurance, pensionInsurance, unemploymentInsurance, careInsurance } = TAX_CONFIG.socialInsurance;
    const healthAnnual = grossAnnual * healthInsurance;
    const pensionAnnual = grossAnnual * pensionInsurance;
    const unemploymentAnnual = grossAnnual * unemploymentInsurance;
    const careAnnual = hasKinder ? grossAnnual * careInsurance.withChildren : grossAnnual * careInsurance.withoutChildren;

    const socialAnnual = healthAnnual + pensionAnnual + unemploymentAnnual + careAnnual;
    const totalDeductionsAnnual = adjustedIncomeTaxAnnual + solidarityAnnual + churchAnnual + stateTaxAnnual + socialAnnual;
    const netAnnual = grossAnnual - totalDeductionsAnnual;

    const round = (v: number) => Math.round(v * 100) / 100;

    return {
      gross: round(grossMonthlyNum),
      lohnsteuer: round(adjustedIncomeTaxAnnual / 12),
      stateTax: round(stateTaxAnnual / 12),
      solidarity: round(solidarityAnnual / 12),
      church: round(churchAnnual / 12),
      rentenversicherung: round(pensionAnnual / 12),
      krankenversicherung: round(healthAnnual / 12),
      pflegeversicherung: round(careAnnual / 12),
      arbeitslosenversicherung: round(unemploymentAnnual / 12),
      sozialabgaben: round(socialAnnual / 12),
      totalDeductions: round(totalDeductionsAnnual / 12),
      netMonthly: round(netAnnual / 12),
      effectiveRate: grossAnnual > 0 ? Math.round((totalDeductionsAnnual / grossAnnual) * 100) : 0,
    };
  } catch (err) {
    console.error('Tax calculation error:', err);
    return {
      gross: 0,
      lohnsteuer: 0,
      solidarity: 0,
      church: 0,
      rentenversicherung: 0,
      krankenversicherung: 0,
      pflegeversicherung: 0,
      arbeitslosenversicherung: 0,
      sozialabgaben: 0,
      totalDeductions: 0,
      netMonthly: 0,
      effectiveRate: 0,
    };
  }
};

// Compute tax results for every combination of tax class and state
export const calcGermanTaxMatrix = async (taxInput: any, DE_TAX_CLASSES: any[], DE_STATES: any[]) => {
  const { grossMonthly, kirchenmitglied, hasKinder } = taxInput;
  const results: any[] = [];

  for (const st of DE_STATES) {
    const row: any = { state: st.id, label: st.label, classes: [] };
    for (const cl of DE_TAX_CLASSES) {
      const res = await calcGermanTax({ grossMonthly, taxClass: cl.id, state: st.id, kirchenmitglied, hasKinder });
      row.classes.push({ taxClass: cl.id, label: cl.label, netMonthly: res.netMonthly, totalDeductions: res.totalDeductions });
    }
    results.push(row);
  }

  return results;
};
