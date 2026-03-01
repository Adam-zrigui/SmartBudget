import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  Cell,
} from 'recharts';
import { useLanguageStore } from '@/lib/store';
import { translations } from '@/lib/translations';
import { useEffect, useState } from 'react';
import { getCat, MONTHS_DE, fmt as defaultFmt } from '@/lib/utils';

export interface AnalyticsProps {
  inc: number;
  exp: number;
  bal: number;
  svRate: number;
  byCat: any[];
  monthly: any[];
  cur: string;
  dark: boolean;
  fmt: (v: number, cur?: string) => string;
}

export default function Analytics(props: Partial<AnalyticsProps>) {
  const language = useLanguageStore((s) => s.language);
  const t = translations[language];
  const [txs, setTxs] = useState<any[] | null>(null);

  const {
    inc: pInc,
    exp: pExp,
    bal: pBal,
    svRate: pSvRate,
    byCat: pByCat,
    monthly: pMonthly,
    cur = 'EUR',
    dark = false,
    fmt = defaultFmt,
  } = props as any;

  useEffect(() => {
    if (pInc !== undefined && pMonthly !== undefined) return; // parent provided data
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch('/api/transactions');
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setTxs(data);
      } catch (e) {
        // ignore
      }
    }
    load();
    return () => { cancelled = true };
  }, [pInc, pMonthly]);

  // compute derived data when fetched
  let inc = pInc ?? 0;
  let exp = pExp ?? 0;
  let bal = pBal ?? 0;
  let svRate = pSvRate ?? 0;
  let byCat = pByCat ?? [];
  let monthly = pMonthly ?? [];

  if (txs && !pInc) {
    const getNetAmount = (transaction: any) => {
      const { amount, vat = 0, churchTax = 0, employmentStatus } = transaction;
      if (!amount) return 0;
      const effectiveVat = (employmentStatus === 'student' || employmentStatus === 'apprentice') ? 0 : vat;
      const vatAmount = amount * (effectiveVat / 100);
      const churchTaxAmount = amount * (churchTax / 100);
      return amount - vatAmount - churchTaxAmount;
    };

    const filtered = txs;
    inc = filtered.filter((t: any) => t.type === 'income').reduce((s: number, t: any) => s + getNetAmount(t), 0);
    exp = filtered.filter((t: any) => t.type === 'expense').reduce((s: number, t: any) => s + getNetAmount(t), 0);
    bal = inc - exp;
    svRate = inc > 0 ? Math.round((bal / inc) * 100) : 0;

    const m: any = {};
    filtered.forEach((t: any) => {
      const mo = new Date(t.date).getMonth();
      if (!m[mo]) m[mo] = { month: MONTHS_DE[mo], income: 0, expense: 0, idx: mo };
      m[mo][t.type === 'income' ? 'income' : 'expense'] += getNetAmount(t);
    });
    monthly = Object.values(m).sort((a: any, b: any) => a.idx - b.idx);

    const mcat: any = {};
    filtered.filter((t: any) => t.type === 'expense').forEach((t: any) => { mcat[t.category] = (mcat[t.category] || 0) + getNetAmount(t); });
    byCat = Object.entries(mcat).map(([n, v]: any) => {
      const cat = getCat(n) || {};
      const { name: _omitName, ...rest } = cat as any;
      return { name: n, value: v, ...rest };
    }).sort((a: any, b: any) => b.value - a.value);
  }
  
  const colors = {
    border: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    muted: dark ? '#6b7280' : '#9ca3af',
    green: dark ? '#34d399' : '#059669',
    red: dark ? '#f87171' : '#ef4444',
    blue: dark ? '#60a5fa' : '#3b82f6',
    cardBg: dark ? '#1f2937' : '#ffffff',
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-base-100 border border-base-300 rounded-xl shadow-lg p-3 text-xs">
        <div className="font-semibold mb-2 opacity-50">{label}</div>
        {payload.map((p: any) => (
          <div key={p.name} className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full" style={{ background: p.fill }} />
            <span className="opacity-60">{p.name}:</span>
            <span className="font-bold">{fmt(p.value, cur)}</span>
          </div>
        ))}
      </div>
    );
  };

  const svColor = svRate >= 20 ? colors.green : svRate >= 0 ? colors.blue : colors.red;
  const svLabel = svRate >= 20 ? (language === 'de' ? 'Exzellent' : 'Excellent') : svRate >= 10 ? (language === 'de' ? 'Gut' : 'Good') : svRate >= 0 ? (language === 'de' ? 'Niedrig' : 'Low') : (language === 'de' ? 'Defizit' : 'Deficit');

  return (
    <div className="space-y-5">
      {/* Row 1: Bar chart + savings summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bar chart */}
        <div className="card bg-base-100 border border-base-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-5">
            <div className="text-sm font-semibold">{language === 'de' ? 'Einnahmen vs. Ausgaben' : 'Income vs Expenses'}</div>
            <div className="flex items-center gap-3 text-xs opacity-40">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-success inline-block" />
                {language === 'de' ? 'Einnahmen' : 'Income'}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-error inline-block" />
                {language === 'de' ? 'Ausgaben' : 'Expenses'}
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthly} barCategoryGap="40%" barGap={3}>
              <CartesianGrid vertical={false} stroke={colors.border} />
              <XAxis dataKey="month" tick={{ fill: colors.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: colors.muted, fontSize: 11 }} axisLine={false} tickLine={false} width={46} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }} />
              <Bar dataKey="income" name={language === 'de' ? 'Einnahmen' : 'Income'} fill={colors.green} radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name={language === 'de' ? 'Ausgaben' : 'Expenses'} fill={colors.red} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Savings summary */}
        <div className="card bg-base-100 border border-base-200 shadow-sm p-5">
          <div className="text-sm font-semibold mb-5">{language === 'de' ? 'Sparquote' : 'Savings Rate'}</div>

          {/* Big savings rate display */}
          <div className="flex items-baseline gap-3 mb-5">
            <div className="text-5xl font-bold tabular-nums" style={{ color: svColor }}>
              {svRate}%
            </div>
            <div>
              <div className="text-sm font-semibold" style={{ color: svColor }}>{svLabel}</div>
              <div className="text-xs opacity-40">{language === 'de' ? 'Ziel: > 20 %' : 'Goal: > 20 %'}</div>
            </div>
          </div>

          {/* Stats breakdown */}
          <div className="space-y-3">
            {[
              { label: language === 'de' ? 'Einnahmen' : 'Income', value: inc, color: colors.green, ratio: 1 },
              { label: language === 'de' ? 'Ausgaben' : 'Expenses', value: exp, color: colors.red, ratio: inc > 0 ? exp / inc : 0 },
              { label: language === 'de' ? 'Erspartes' : 'Savings', value: bal, color: colors.blue, ratio: inc > 0 ? Math.max(0, bal / inc) : 0 },
            ].map((r) => (
              <div key={r.label}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs opacity-50 font-medium">{r.label}</span>
                  <span className="text-xs font-bold" style={{ color: r.color }}>{fmt(r.value, cur)}</span>
                </div>
                <div className="w-full h-1.5 bg-base-200 rounded-full overflow-hidden">
                  <div
                    className="h-1.5 rounded-full transition-all duration-700 shadow-md"
                    style={{ width: `${Math.min(100, r.ratio * 100)}%`, background: r.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="card bg-base-100 border border-base-200 shadow-sm p-5">
        <div className="text-sm font-semibold mb-5 flex items-center justify-between">
          <span>{language === 'de' ? 'Kategorienaufteilung' : 'Category Breakdown'}</span>
          <div className="text-xs opacity-40 font-normal">{language === 'de' ? 'Ausgaben nach Kategorie' : 'Expenses by Category'}</div>
        </div>
        {byCat.length === 0 ? (
          <div className="text-center py-10 opacity-30">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto mb-2 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <div className="text-sm">{language === 'de' ? 'Keine Ausgaben vorhanden' : 'No expenses found'}</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {byCat.map((ct) => {
              const pct = exp > 0 ? (ct.value / exp) * 100 : 0;
              return (
                <div key={ct.name} className="p-4 rounded-xl bg-base-200/60 border border-base-300/50 hover:bg-base-200 hover:shadow-md transition-all duration-200 hover:scale-102 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{ct.icon}</span>
                      <span className="text-sm font-medium opacity-80">{ct.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold">{fmt(ct.value, cur)}</div>
                      <div className="text-xs opacity-40 font-medium">{Math.round(pct)}%</div>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-base-300 rounded-full overflow-hidden">
                    <div
                      className="h-2 rounded-full transition-all duration-700 shadow-sm"
                      style={{ width: `${pct}%`, background: ct.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}