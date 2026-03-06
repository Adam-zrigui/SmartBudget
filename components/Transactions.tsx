import { fmt, getCat, TAG, MONTHS_DE } from "@/lib/utils";
import { useLanguageStore } from "@/lib/store";
import { translations } from "@/lib/translations";
import { memo } from "react";

export interface TransactionsProps {
  filtered: any[];
  bal: number;
  cur: string;
  fMonth: string;
  setFMonth: (m: string) => void;
  fType: string;
  setFType: (t: string) => void;
  q: string;
  setQ: (q: string) => void;
  openEdit: (t: any) => void;
  setDelId: (id: string | null) => void;
}

const calculateNetAmount = (transaction: any) => {
  const { amount, vat, churchTax, employmentStatus } = transaction;
  if (!amount) return 0;
  // Students and apprentices are VAT-exempt (mini-job threshold)
  const effectiveVat = (employmentStatus === 'student' || employmentStatus === 'apprentice') ? 0 : (vat || 0);
  const vatAmount = amount * (effectiveVat / 100);
  const churchTaxAmount = amount * ((churchTax || 0) / 100);
  return amount - vatAmount - churchTaxAmount;
};

export default memo(function Transactions({
  filtered,
  bal,
  cur,
  fMonth,
  setFMonth,
  fType,
  setFType,
  q,
  setQ,
  openEdit,
  setDelId,
}: TransactionsProps) {
  const language = useLanguageStore((s) => s.language);
  const tr = translations[language];
  
  return (
    <div className="space-y-4">
      {/* Filter toolbar */}
      <div className="card bg-base-100 border border-base-200 shadow-sm p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2 sm:gap-3">
          {/* Search */}
          <div className="relative w-full sm:flex-1 sm:min-w-45">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-30"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              type="text"
              placeholder={language === 'de' ? 'Suchen…' : 'Search…'}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="input input-bordered input-sm w-full pl-9 text-sm focus:ring-2 focus:ring-primary/50 transition-all duration-200"
            />
          </div>

          {/* Month */}
          <select
            className="select select-bordered select-sm w-full sm:w-36 text-sm focus:ring-2 focus:ring-primary/50 transition-all duration-200"
            value={fMonth}
            onChange={(e) => setFMonth(e.target.value)}
          >
            <option value="all">{language === 'de' ? 'Alle Monate' : 'All Months'}</option>
            {MONTHS_DE.map((m, i) => (
              <option key={m} value={i}>{m} 2026</option>
            ))}
          </select>

          {/* Type toggle */}
          <div className="flex rounded-lg overflow-hidden border border-base-300">
            {[
              { v: 'all', l: language === 'de' ? 'Alle' : 'All' },
              { v: 'income', l: language === 'de' ? 'Einnahmen' : 'Income' },
              { v: 'expense', l: language === 'de' ? 'Ausgaben' : 'Expenses' },
            ].map((t) => (
              <button
                key={t.v}
                onClick={() => setFType(t.v)}
                className={`px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                  fType === t.v
                    ? 'bg-primary text-primary-content dark:bg-secondary dark:text-secondary-content shadow-md'
                    : 'bg-base-100 hover:bg-base-200 opacity-60 hover:opacity-100'
                }`}
              >
                {t.l}
              </button>
            ))}
          </div>

          {/* Balance badge */}
          <div className={`ml-auto text-sm font-bold px-3 py-1.5 rounded-lg transition-all duration-300 shadow-sm ${bal >= 0 ? 'bg-success/10 text-success hover:shadow-md' : 'bg-error/10 text-error hover:shadow-md'}`}>
            {bal >= 0 ? '+' : ''}{fmt(bal, cur)}
          </div>
        </div>
      </div>

      {/* Table card */}
      <div className="card bg-base-100 border border-base-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="px-5 py-3 border-b border-base-200 flex items-center justify-between">
          <span className="text-sm font-semibold">{filtered.length} {language === 'de' ? 'Buchungen' : 'Transactions'}</span>
          {q && (
            <button
              className="text-xs opacity-40 hover:opacity-70 transition-opacity hover:scale-105 active:scale-95 transform"
              onClick={() => setQ("")}
            >
              ✗ {language === 'de' ? 'Filter zurücksetzen' : 'Reset Filter'}
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-30 animate-in fade-in duration-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <div className="text-sm font-medium">{language === 'de' ? 'Keine Buchungen gefunden' : 'No transactions found'}</div>
            <div className="text-xs mt-1">{language === 'de' ? 'Passe deine Filter an oder erstelle neue Einträge' : 'Adjust filters or create new entries'}</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr className="border-b border-base-200">
                  <th className="bg-base-100 text-xs font-semibold opacity-40 uppercase tracking-wider py-3 px-5">{language === 'de' ? 'Datum' : 'Date'}</th>
                  <th className="bg-base-100 text-xs font-semibold opacity-40 uppercase tracking-wider py-3">{language === 'de' ? 'Beschreibung' : 'Description'}</th>
                  <th className="bg-base-100 text-xs font-semibold opacity-40 uppercase tracking-wider py-3">{language === 'de' ? 'Kategorie' : 'Category'}</th>
                  <th className="bg-base-100 text-xs font-semibold opacity-40 uppercase tracking-wider py-3 text-right">{language === 'de' ? 'Betrag' : 'Amount'}</th>
                  <th className="bg-base-100 w-16" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => {
                  const ct = getCat(t.category) || { color: "#9ca3af", icon: "" };
                  const tagInfo = t.tag ? (TAG as any)[t.tag] : null;
                  const statusLabel = t.employmentStatus
                    ? ((tr.form as any)?.employmentStatus?.[t.employmentStatus] || t.employmentStatus)
                    : '';

                  return (
                    <tr
                      key={t.id}
                      className="border-b border-base-200 last:border-0 hover:bg-base-200/50 transition-all duration-300 group animate-in fade-in slide-in-from-left-2"
                    >
                      <td className="py-3 px-5">
                        <span className="text-xs font-mono opacity-50">
                          {new Date(t.date).toLocaleDateString('de-DE')}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full shrink-0 group-hover:scale-125 transition-transform duration-200"
                            style={{ background: t.type === 'income' ? '#10b981' : '#ef4444' }}
                          />
                          <span className="text-sm font-medium group-hover:opacity-100 transition-opacity duration-200">{tr.description}</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-medium transition-transform duration-200 group-hover:scale-105"
                            style={{ background: `${ct.color}20`, color: ct.color }}
                          >
                            <span style={{ color: ct.color }}>{ct.icon}</span>
                            {t.category}
                          </span>
                          {tagInfo && (
                            <span
                              className="text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider transition-transform duration-200 group-hover:scale-105"
                              style={{ background: tagInfo.bg, color: tagInfo.color }}
                            >
                              {t.tag}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 text-right">
                        <div className="group relative">
                          <span className={`text-sm font-bold tabular-nums transition-all duration-200 cursor-help ${t.type === 'income' ? 'text-success group-hover:text-success/80' : 'text-error group-hover:text-error/80'}`}>
                            {t.type === 'income' ? '+' : '−'}{fmt(calculateNetAmount(t), cur)}
                          </span>
                          {/* Tax Breakdown Tooltip */}
                          {(t.vat || t.churchTax) && (
                            <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block z-50">
                              <div className="bg-base-content text-base-100 text-xs rounded-lg p-3 whitespace-nowrap shadow-lg">
                                <div className="font-semibold mb-2">{language === 'de' ? 'Steueraufschlüsselung' : 'Tax Breakdown'}</div>
                                <div className="space-y-1 text-[11px]">
                                  <div className="flex justify-between gap-3">
                                    <span>{language === 'de' ? 'Brutto' : 'Gross'}:</span>
                                    <span className="font-mono font-semibold">{fmt(t.amount, cur)}</span>
                                  </div>
                                  {(t.employmentStatus === 'student' || t.employmentStatus === 'apprentice') ? (
                                    <div className="flex justify-between gap-3 text-success text-[10px]">
                                      <span>{language === 'de' ? 'MwSt. (befreit)' : 'VAT (exempt)'}</span>
                                      <span className="font-mono">−0,00</span>
                                    </div>
                                  ) : t.vat > 0 ? (
                                    <div className="flex justify-between gap-3 text-base-100/70">
                                      <span>{language === 'de' ? 'MwSt.' : 'VAT'} ({t.vat}%):</span>
                                      <span className="font-mono">−{fmt(t.amount * (t.vat / 100), cur)}</span>
                                    </div>
                                  ) : null}
                                  {t.churchTax > 0 && (
                                    <div className="flex justify-between gap-3 text-base-100/70">
                                      <span>{language === 'de' ? 'Kirchensteuer' : 'Church Tax'} ({t.churchTax}%):</span>
                                      <span className="font-mono">−{fmt(t.amount * (t.churchTax / 100), cur)}</span>
                                    </div>
                                  )}
                                  <div className="border-t border-base-100/30 pt-1 mt-1 flex justify-between gap-3 font-semibold">
                                    <span>{language === 'de' ? 'Netto' : 'Net'}:</span>
                                    <span className="font-mono">{fmt(calculateNetAmount(t), cur)}</span>
                                  </div>
                                </div>
                                <div className="text-[10px] mt-2 opacity-60">
                                  {tr.bundesland || (language === 'de' ? 'Standard' : 'Standard')}{' '}
                                  {statusLabel && `(${statusLabel})`}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                          <button
                            className="btn btn-ghost btn-xs btn-square hover:scale-110 active:scale-95 transition-all duration-200 transform"
                            onClick={() => openEdit(t)}
                            title="Bearbeiten"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a4 4 0 01-2.828 1.172H7v-2a4 4 0 011.172-2.828z" />
                            </svg>
                          </button>
                          <button
                            className="btn btn-ghost btn-xs btn-square text-error hover:scale-110 active:scale-95 transition-all duration-200 transform"
                            onClick={() => setDelId(t.id)}
                            title="Löschen"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M8 7V4h8v3" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
});