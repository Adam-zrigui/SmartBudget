import { fmt, KIRCHE_RATE, calcGermanTaxMatrix } from "@/lib/utils";
import { useLanguageStore } from "@/lib/store";
import { translations } from "@/lib/translations";
import { useEffect, useState } from "react";
import { authedFetch } from "@/lib/client-auth";

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

  // state tax info
  interface StateTax {
    name: string;
    abbr?: string;
    vat_standard?: number;
    vat_reduced?: number;
    church_tax_rate?: number;
    municipal_tax_range?: { min: number; max: number };
    notes?: string;
  }
  const [statesData, setStatesData] = useState<StateTax[] | null>(null);
  const [statesLoading, setStatesLoading] = useState(true);
  const [statesError, setStatesError] = useState<string | null>(null);
  const [selectedState, setSelectedState] = useState<StateTax | null>(null);
  const [showStates, setShowStates] = useState(false); // toggle visibility of state rates

  useEffect(() => {
    let mounted = true;
    setStatesLoading(true);
    authedFetch('/api/taxes')
      .then((r) => r.json())
      .then((j) => {
        if (!mounted) return;
        if (!j.ok) throw new Error(j.error || 'Failed to load');
        const items = Array.isArray(j.data) ? j.data : Object.values(j.data ?? {});
        setStatesData(items as StateTax[]);
        if (items.length > 0) setSelectedState(items[0] as StateTax);
      })
      .catch((e) => setStatesError(e.message || String(e)))
      .finally(() => setStatesLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

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
        const res = await authedFetch('/api/transactions?type=income');
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
      <div className="card bg-linear-to-br from-primary/8 to-base-100 text-base-content shadow-md p-5 animate-in fade-in slide-in-from-bottom-2 duration-700">
        <div className="text-xs opacity-60 uppercase tracking-wider mb-1">{t.tax.netSalaryMonth}</div>
        <div className="text-4xl font-bold tabular-nums mb-1 text-primary">{fmt(taxResult.netMonthly)}</div>
        <div className="text-xs opacity-60">{t.tax.effectiveRate(taxResult.effectiveRate)} · {fmt(taxResult.totalDeductions)} {t.tax.deductions}</div>

        <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:gap-2">
          <button className="btn btn-outline btn-sm" onClick={() => setShowMatrix((s) => !s)}>
            {showMatrix ? t.tax.deductions : (language === 'de' ? 'Vergleich ausblenden' : 'Hide comparison')}
          </button>
          <button
            className="btn btn-outline btn-sm mt-2 sm:mt-0"
            onClick={() => setShowStates((s) => !s)}
          >
            {showStates
              ? (language === 'de' ? 'Steuersätze ausblenden' : 'Hide state rates')
              : (language === 'de' ? 'Steuersätze anzeigen' : 'Show state rates')}
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
              <div key={key} className="flex items-center justify-between py-2 border-b border-base-200 last:border-0 hover:opacity-100 transition-opacity animate-in fade-in duration-500" style={{ animationDelay: `${idx * 50}ms` }}>
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

      {/* State rates information (was previously on separate /taxes page) */}
      {showStates && (
        <>
          {statesLoading && (
            <div className="mt-6 text-center">
              <div className="spinner spinner-md"></div>
            </div>
          )}
          {statesError && (
            <div className="mt-6 alert alert-error rounded-2xl">
              <span>{statesError}</span>
            </div>
          )}
          {statesData && selectedState && (
            <div className="mt-8 max-h-[70vh] overflow-auto">
          <div className="text-xl font-bold text-base-content mb-4">
            {language === 'de' ? 'Bundesländer Steuersätze' : 'State Tax Rates'}
          </div>
          <div className="grid grid-cols-1 md:flex md:gap-6">
            <aside className="w-full md:w-64">
              <div className="bg-base-100 border border-base-200/50 rounded-2xl p-6 sticky top-0">
                <h2 className="font-semibold mb-4">{language === 'de' ? 'Bundesländer' : 'States'}</h2>
                <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                  {statesData.map((state) => (
                    <button
                      key={state.name}
                      onClick={() => setSelectedState(state)}
                      className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 ${
                        selectedState?.name === state.name
                          ? 'bg-primary/10 dark:bg-primary/70 text-primary-content shadow-lg'
                          : 'hover:bg-base-200/50 dark:hover:bg-base-300/50'
                      }`}
                    >
                      <div className="font-medium text-sm">{state.name}</div>
                      <div className={`text-xs ${selectedState?.name === state.name ? 'opacity-80' : 'opacity-60'}`}>{state.abbr}</div>
                    </button>
                  ))}
                </div>
              </div>
            </aside>
            <section className="flex-1">
              <div className="space-y-6">
                <div className="bg-base-100 border border-base-200/50 rounded-2xl p-8">
                  <div className="flex items-start justify-between gap-6">
                    <div>
                      <h2 className="text-3xl font-bold text-base-content">{selectedState.name}</h2>
                      {selectedState.notes && <p className="text-sm text-base-content/70 mt-2">{selectedState.notes}</p>}
                    </div>
                    <div className="text-4xl font-bold text-primary bg-primary/10 rounded-xl px-6 py-4">{selectedState.abbr}</div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-base-100 border border-base-200/50 rounded-2xl p-6">
                    <div className="text-xs font-semibold text-base-content/60 uppercase tracking-widest">{language === 'de' ? 'USt Standard' : 'VAT Standard Rate'}</div>
                    <div className="mt-3">
                      <div className="text-4xl font-bold text-primary">{selectedState.vat_standard}%</div>
                      <p className="text-xs text-base-content/70 mt-2">{language === 'de' ? 'Standardrate für die meisten Waren und Dienstleistungen' : 'Standard rate for most goods and services'}</p>
                    </div>
                  </div>
                  <div className="bg-base-100 border border-base-200/50 rounded-2xl p-6">
                    <div className="text-xs font-semibold text-base-content/60 uppercase tracking-widest">{language === 'de' ? 'USt Ermäßigt' : 'VAT Reduced Rate'}</div>
                    <div className="mt-3">
                      <div className="text-4xl font-bold text-secondary">{selectedState.vat_reduced}%</div>
                      <p className="text-xs text-base-content/70 mt-2">{language === 'de' ? 'Bücher, Lebensmittel, Medizin, ...' : 'Books, food, medicine, and essentials'}</p>
                    </div>
                  </div>
                  <div className="bg-base-100 border border-base-200/50 rounded-2xl p-6">
                    <div className="text-xs font-semibold text-base-content/60 uppercase tracking-widest">{language === 'de' ? 'Kirchensteuer' : 'Church Tax'}</div>
                    <div className="mt-3">
                      <div className="text-4xl font-bold text-accent">{selectedState.church_tax_rate}%</div>
                      <p className="text-xs text-base-content/70 mt-2">{language === 'de' ? 'Nur für Kirchenmitglieder' : 'For registered church members only'}</p>
                    </div>
                  </div>
                  {selectedState.municipal_tax_range && (
                    <div className="bg-base-100 border border-base-200/50 rounded-2xl p-6">
                      <div className="text-xs font-semibold text-base-content/60 uppercase tracking-widest">{language === 'de' ? 'Gewerbesteuer' : 'Municipal Trade Tax'}</div>
                      <div className="mt-3">
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm text-base-content/70">{language === 'de' ? 'Hebesatzbereich:' : 'Multiplier Range:'}</span>
                          <span className="text-2xl font-bold text-base-content">{selectedState.municipal_tax_range.min}% – {selectedState.municipal_tax_range.max}%</span>
                        </div>
                        <p className="text-xs text-base-content/70 mt-2">{language === 'de' ? 'Variiert je nach Gemeinde' : 'Varies by municipality (Hebesatz)'}</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="bg-warning/10 border border-warning/30 rounded-2xl p-6">
                  <p className="text-sm text-base-content/80 leading-relaxed">
                    <strong>Disclaimer:</strong> {language === 'de' ? 'Steuergesetze ändern sich häufig...' : 'Tax regulations change frequently and may have local variations. This information is provided for reference only. For accurate tax calculations and official filings, please consult your state\'s finance office (Finanzbehörde) or a qualified tax advisor.'}
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
          )}
        </>
      )}
    </div>
  );
}
