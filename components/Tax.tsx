import { fmt, KIRCHE_RATE, calcGermanTaxMatrix } from "@/lib/utils";
import { useLanguageStore } from "@/lib/store";
import { translations } from "@/lib/translations";
import { useEffect, useState } from "react";

export interface TaxProps {
  tax: any;
  setTax: (t: any) => void;
  taxResult: any;
  DE_TAX_CLASSES: any[];
  DE_STATES: any[];
  TAG: any;
}

// deduction icons for known taxResult keys
const DEDUCTION_ICONS: Record<string, string> = {
  lohnsteuer: '🏛️',
  solidarity: '🤝',
  church: '⛪',
  krankenversicherung: '🏥',
  rentenversicherung: '🎯',
  arbeitslosenversicherung: '🛡️',
  pflegeversicherung: '🤲',
};

// build list dynamically from taxResult in render section below


export default function Tax({ tax, setTax, taxResult, DE_TAX_CLASSES, DE_STATES }: TaxProps) {
  const language = useLanguageStore((s) => s.language);
  const t = translations[language];

  const kirchRate = (KIRCHE_RATE as any)[tax.state] ?? (KIRCHE_RATE as any).default;
  const [showMatrix, setShowMatrix] = useState(false);
  const [matrix, setMatrix] = useState<any[]>([]);
  const [suggestedGross, setSuggestedGross] = useState<number | null>(null);
  const [autoApplied, setAutoApplied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const m = await calcGermanTaxMatrix(tax, DE_TAX_CLASSES, DE_STATES);
        if (!cancelled) setMatrix(m);
      } catch (err) {
        console.error('matrix calc error', err);
      }
    })();
    return () => { cancelled = true; };
  }, [tax, DE_TAX_CLASSES, DE_STATES]);

  // Suggest gross salary from recent income transactions (average per month)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/transactions?type=income');
        if (!res.ok) return; // likely unauthorized in dev
        const data = await res.json();
        if (cancelled) return;
        const months: Record<string, number> = {};
        (data || []).forEach((t: any) => {
          const d = new Date(t.date);
          const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
          months[key] = (months[key] || 0) + (t.amount || 0);
        });
        const vals = Object.values(months);
        if (vals.length > 0) {
          const avg = Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100;
          setSuggestedGross(avg);
        }
      } catch (err) {
        // ignore (auth/dev)
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // auto-apply suggested gross to the tax state once when available
  useEffect(() => {
    if (!autoApplied && suggestedGross && (!tax.grossMonthly || tax.grossMonthly === 0)) {
      try {
        setTax((s: any) => ({ ...s, grossMonthly: suggestedGross }));
        setAutoApplied(true);
      } catch (err) {
        // ignore
      }
    }
  }, [suggestedGross, tax.grossMonthly, autoApplied, setTax]);

  return (
    <div className="space-y-4">
      {/* Input card */}
      <div className="card bg-base-100 border border-base-200 shadow-sm p-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mb-4">
          <div className="text-sm font-semibold">{t.tax.taxCalculator}</div>
          <div className="text-xs opacity-40 mt-0.5">{t.tax.subtitle}</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Gross salary */}
          <div className="md:col-span-1">
            <label className="text-xs font-medium opacity-50 uppercase tracking-wider">{t.tax.grossSalary}</label>
            <div className="relative mt-1.5">
              <input
                className="input input-bordered w-full pr-12 font-mono text-lg font-bold focus:ring-2 focus:ring-primary/50 transition-all duration-200"
                type="number"
                value={tax.grossMonthly && tax.grossMonthly > 0 ? tax.grossMonthly : (suggestedGross ?? '')}
                onChange={e => setTax((s: any) => ({ ...s, grossMonthly: parseFloat(e.target.value) || 0 }))}
                placeholder={suggestedGross ? String(suggestedGross) : ''}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm opacity-30 font-medium">EUR</span>
            </div>
          </div>

          {/* Tax class */}
          <div>
            <label className="text-xs font-medium opacity-50 uppercase tracking-wider">{t.tax.taxClass}</label>
            <select
              className="select select-bordered w-full mt-1.5 text-sm focus:ring-2 focus:ring-primary/50 transition-all duration-200"
              value={tax.taxClass}
              onChange={e => setTax((s: any) => ({ ...s, taxClass: parseInt(e.target.value) }))}
            >
              {DE_TAX_CLASSES.map((cl: any) => (
                <option key={cl.id} value={cl.id}>{cl.label}</option>
              ))}
            </select>
          </div>

          {/* State */}
          <div>
            <label className="text-xs font-medium opacity-50 uppercase tracking-wider">{t.tax.state}</label>
            <select
              className="select select-bordered w-full mt-1.5 text-sm focus:ring-2 focus:ring-primary/50 transition-all duration-200"
              value={tax.state}
              onChange={e => setTax((s: any) => ({ ...s, state: e.target.value }))}
            >
              {DE_STATES.map((s: any) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Toggles */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { key: 'kirchenmitglied', label: t.tax.churchMember, sub: t.tax.churchTax(kirchRate), icon: '⛪' },
            { key: 'hasKinder', label: t.tax.hasChildren, sub: t.tax.childrenBenefit, icon: '👨‍👩‍👦' },
          ].map((row) => (
            <label
              key={row.key}
              className="flex items-center justify-between p-3 rounded-xl bg-base-200/60 border border-base-300/40 cursor-pointer hover:bg-base-200 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{row.icon}</span>
                <div>
                  <div className="text-sm font-medium">{row.label}</div>
                  <div className="text-xs opacity-40">{row.sub}</div>
                </div>
              </div>
              <input
                type="checkbox"
                className="toggle toggle-sm toggle-primary"
                checked={tax[row.key]}
                onChange={() => setTax((s: any) => ({ ...s, [row.key]: !s[row.key] }))}
              />
            </label>
          ))}
        </div>
      </div>

      {/* Result hero */}
      <div className="card bg-gradient-to-br from-primary/8 to-base-100 text-base-content shadow-md p-5 animate-in fade-in slide-in-from-bottom-2 duration-700">
        <div className="text-xs opacity-60 uppercase tracking-wider mb-1">{t.tax.netSalaryMonth}</div>
        <div className="text-4xl font-bold tabular-nums mb-1 text-primary">{fmt(taxResult.netMonthly)}</div>
        <div className="text-xs opacity-60">{t.tax.effectiveRate(taxResult.effectiveRate)} · {fmt(taxResult.totalDeductions)} {t.tax.deductions}</div>

        <div className="mt-3">
          <button className="btn btn-outline btn-sm" onClick={() => setShowMatrix((s) => !s)}>
            {showMatrix ? t.tax.deductions : (language === 'de' ? 'Vergleich ausblenden' : 'Hide comparison')}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          {[
            { l: t.tax.grossMonthly, v: taxResult.gross },
            { l: t.tax.netMonthly, v: taxResult.netMonthly },
            { l: t.tax.grossYearly, v: (taxResult.gross || 0) * 12 },
            { l: t.tax.netYearly, v: (taxResult.netMonthly || 0) * 12 },
          ].map((r) => (
            <div key={r.l} className="bg-primary-content/10 rounded-xl p-3 hover:bg-primary-content/20 transition-all duration-200">
              <div className="text-xs opacity-60">{r.l}</div>
              <div className="text-base font-bold mt-0.5">{fmt(r.v)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Deduction breakdown */}
      <div className="card bg-base-100 border border-base-200 shadow-sm p-5 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-sm font-semibold mb-4">{t.tax.deductionsMonthly}</div>

        {/* Visual bar */}
        <div className="w-full h-2.5 rounded-full bg-base-200 overflow-hidden mb-5 flex shadow-sm">
          <div className="h-2.5 bg-success transition-all duration-1000" style={{ width: `${taxResult.gross > 0 ? (taxResult.netMonthly / taxResult.gross) * 100 : 0}%` }} />
          <div className="h-2.5 bg-error flex-1 transition-all duration-1000" />
        </div>
        <div className="flex items-center justify-between text-xs opacity-40 mb-5 -mt-3">
          <span>{t.tax.netMonthly} {taxResult.gross > 0 ? Math.round((taxResult.netMonthly / taxResult.gross) * 100) : 0}%</span>
          <span>{t.tax.deductions} {taxResult.effectiveRate}%</span>
        </div>

        <div className="space-y-2">
          {Object.entries(taxResult)
          .filter(([key, val]) => {
            // skip metadata, totals, and the aggregated 'social contributions' row
            return (
              key !== 'gross' &&
              key !== 'netMonthly' &&
              key !== 'effectiveRate' &&
              key !== 'totalDeductions' &&
              key !== 'sozialabgaben' &&
              typeof val === 'number' &&
              val !== 0
            );
          })
          .map(([key, val], idx) => {
            const icon = DEDUCTION_ICONS[key] || 'ℹ️';
            const label = (t.tax as any)[key] ?? key;
            return (
              <div key={key} className="flex items-center justify-between py-2 border-b border-base-200 last:border-0 hover:opacity-100 transition-opacity duration-200 animate-in fade-in duration-500" style={{ animationDelay: `${idx * 50}ms` }}>
                <div className="flex items-center gap-2">
                  <span className="text-base">{icon}</span>
                  <span className="text-sm opacity-70">{label}</span>
                </div>
                <span className="text-sm font-semibold text-error">−{fmt(val as number)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Matrix */}
      {showMatrix && (
        <div className="card bg-base-100 border border-base-200 shadow-sm p-5 mt-4 overflow-auto">
          <div className="text-sm font-semibold mb-3">{language === 'de' ? 'Vergleich: Steuerklasse × Bundesland' : 'Comparison: Tax Class × State'}</div>
          <div className="w-full overflow-auto">
            <table className="table table-compact w-full">
              <thead>
                <tr>
                  <th>{language === 'de' ? 'Bundesland' : 'State'}</th>
                  {DE_TAX_CLASSES.map((c: any) => <th key={c.id}>{c.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {matrix.map((row) => (
                  <tr key={row.state}>
                    <td>{row.label}</td>
                    {row.classes.map((cell: any) => (
                      <td key={cell.taxClass} className="font-mono">{fmt(cell.netMonthly)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}