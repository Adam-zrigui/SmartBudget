import dynamic from 'next/dynamic';
const ChartArea = dynamic(() => import('./ChartArea'), { ssr: false, loading: () => <div className="h-48 skeleton-pulse rounded-md" /> });

import { useEffect, useMemo, useState } from 'react';
import { useLanguageStore } from '@/lib/store';
import { translations } from '@/lib/translations';

export interface DashboardProps {
  fMonth: string;
  setFMonth: (m: string) => void;
  fType: string;
  setFType: (t: string) => void;
  filtered: any[];
  inc: number;
  exp: number;
  bal: number;
  svRate: number;
  byCat: any[];
  monthly: any[];
  cur: string;
  dark: boolean;
  fmt: (v: number, cur?: string) => string;
  MONTHS_DE: string[];
  txs?: any[];
  savingsGoals?: any[];
  setTab?: (tab: string) => void;
}

const KpiCard = ({
  label,
  value,
  sub,
  progress,
  progressColor,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  progress: number;
  progressColor: string;
  accent?: boolean;
}) => (
  <div className={`card bg-card border border-border p-4 sm:p-6 hover:shadow-lg hover:border-primary/20 transition-all duration-300 ${accent ? 'ring-1 ring-primary/20 ring-offset-0' : ''} animate-in fade-in slide-in-from-bottom-4 duration-500`} style={{ boxShadow: 'var(--shadow-md)' }}>
    <div className="flex items-start justify-between mb-4 pb-3 border-b border-border">
      <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
    </div>
    <div className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mb-4">{value}</div>
    <div className="w-full h-1 bg-base-200 rounded-full overflow-hidden">
      <div
        className={`h-1 rounded-full transition-all duration-700 ${progressColor}`}
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      />
    </div>
    <div className="text-xs opacity-40 mt-2">{sub}</div>
  </div>
);

export default function Dashboard({
  fMonth,
  setFMonth,
  fType,
  setFType,
  filtered,
  inc,
  exp,
  bal,
  svRate,
  byCat,
  monthly,
  cur,
  dark,
  fmt,
  MONTHS_DE,
  txs = [],
  savingsGoals = [],
  setTab,
}: DashboardProps) {
  const language = useLanguageStore((s) => s.language);
  const t = translations[language];
  const [autopilotPercent, setAutopilotPercent] = useState(15);
  const [selectedGoalId, setSelectedGoalId] = useState<string>('');

  const activeGoals = useMemo(
    () =>
      (Array.isArray(savingsGoals) ? savingsGoals : []).filter(
        (g: any) => Number(g?.targetAmount || 0) > Number(g?.currentAmount || 0)
      ),
    [savingsGoals]
  );

  useEffect(() => {
    if (!selectedGoalId && activeGoals[0]?.id) {
      setSelectedGoalId(activeGoals[0].id);
    }
  }, [activeGoals, selectedGoalId]);

  const weeklyStats = useMemo(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - 6);

    const inWindow = (Array.isArray(txs) ? txs : []).filter((tx: any) => {
      const d = new Date(tx.date);
      return d >= start && d <= today;
    });

    const activeDays = new Set(
      inWindow.map((tx: any) => new Date(tx.date).toISOString().slice(0, 10))
    ).size;
    const weekIncome = inWindow
      .filter((tx: any) => tx.type === 'income')
      .reduce((s: number, tx: any) => s + Number(tx.amount || 0), 0);
    const weekExpense = inWindow
      .filter((tx: any) => tx.type === 'expense')
      .reduce((s: number, tx: any) => s + Number(tx.amount || 0), 0);
    const weekNet = weekIncome - weekExpense;

    let streakWeeks = 0;
    for (let w = 0; w < 8; w += 1) {
      const end = new Date(today);
      end.setDate(today.getDate() - w * 7);
      const begin = new Date(end);
      begin.setDate(end.getDate() - 6);
      const wtx = (Array.isArray(txs) ? txs : []).filter((tx: any) => {
        const d = new Date(tx.date);
        return d >= begin && d <= end;
      });
      const wi = wtx
        .filter((tx: any) => tx.type === 'income')
        .reduce((s: number, tx: any) => s + Number(tx.amount || 0), 0);
      const we = wtx
        .filter((tx: any) => tx.type === 'expense')
        .reduce((s: number, tx: any) => s + Number(tx.amount || 0), 0);
      if (wi - we > 0) streakWeeks += 1;
      else break;
    }

    const score = Math.max(
      0,
      Math.min(100, Math.round(activeDays * 8 + (weekNet > 0 ? 45 : 20)))
    );

    return { activeDays, weekIncome, weekExpense, weekNet, streakWeeks, score };
  }, [txs]);

  const autopilot = useMemo(() => {
    const now = new Date();
    const monthTx = (Array.isArray(txs) ? txs : []).filter((tx: any) => {
      const d = new Date(tx.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const monthSalary = monthTx
      .filter((tx: any) => tx.type === 'income' && String(tx.category || '').toLowerCase() === 'gehalt')
      .reduce((s: number, tx: any) => s + Number(tx.amount || 0), 0);

    const selectedGoal = activeGoals.find((g: any) => g.id === selectedGoalId) || activeGoals[0];
    const target = Number(selectedGoal?.targetAmount || 0);
    const current = Number(selectedGoal?.currentAmount || 0);
    const remaining = Math.max(0, target - current);
    const monthlyContribution = (monthSalary * autopilotPercent) / 100;
    const monthsToGoal = monthlyContribution > 0 ? Math.ceil(remaining / monthlyContribution) : null;

    return { monthSalary, selectedGoal, remaining, monthlyContribution, monthsToGoal };
  }, [activeGoals, autopilotPercent, selectedGoalId, txs]);

  function runQuickPrompt(prompt: string) {
    setTab?.('advisor');
    window.dispatchEvent(
      new CustomEvent('ai:quickPrompt', { detail: { prompt } })
    );
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
        <div className="font-semibold mb-2 opacity-60">{label}</div>
        {payload.map((p: any) => (
          <div key={p.name} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="opacity-60">{p.name}:</span>
            <span className="font-bold">{fmt(p.value, cur)}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Filter bar - Mobile optimized */}
      <div className="card bg-base-100 border border-base-200 shadow-sm p-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <select
              className="select select-bordered select-sm w-full sm:w-40 text-sm focus:ring-2 focus:ring-primary/50 transition-all duration-200"
              value={fMonth}
              onChange={(e) => setFMonth(e.target.value)}
            >
              <option value="all">{language === 'de' ? 'Alle Monate' : 'All Months'}</option>
              {MONTHS_DE.map((m, i) => (
                <option key={m} value={i}>{m} 2026</option>
              ))}
            </select>

            <div className="flex rounded-lg overflow-hidden border border-base-300 w-full sm:w-auto">
              {[
                { v: 'all', l: language === 'de' ? 'Alle' : 'All' },
                { v: 'income', l: language === 'de' ? 'Einnahmen' : 'Income' },
                { v: 'expense', l: language === 'de' ? 'Ausgaben' : 'Expenses' },
              ].map((t) => (
                <button
                  key={t.v}
                  className={`flex-1 sm:px-3 px-2 py-2 text-xs font-medium transition-all duration-200 ${
                    fType === t.v
                      ? 'bg-primary text-primary-content dark:bg-secondary dark:text-secondary-content shadow-md'
                      : 'bg-base-100 hover:bg-base-200 opacity-60 hover:opacity-100'
                  }`}
                  onClick={() => setFType(t.v)}
                >
                  {t.l}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center text-xs opacity-60 font-medium">
            <span>{filtered.length} {language === 'de' ? 'Einträge' : 'Entries'}</span>
            <span className="text-xs opacity-40 uppercase tracking-wider">
              {language === 'de' ? 'Übersicht' : 'Overview'}
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards - Better mobile layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 animate-children">
        <div className="animate-stagger-1">
          <KpiCard
            label={language === 'de' ? 'Einnahmen' : 'Income'}
            value={fmt(inc, cur)}
            sub={`${filtered.filter(t => t.type === 'income').length} ${language === 'de' ? 'Buchungen' : 'Entries'}`}
            progress={(inc / (inc + exp || 1)) * 100}
            progressColor="bg-success"
          />
        </div>
        <div className="animate-stagger-2">
          <KpiCard
            label={language === 'de' ? 'Ausgaben' : 'Expenses'}
            value={fmt(exp, cur)}
            sub={`${filtered.filter(t => t.type === 'expense').length} ${language === 'de' ? 'Buchungen' : 'Entries'}`}
            progress={(exp / (inc + exp || 1)) * 100}
            progressColor="bg-error"
          />
        </div>
        <div className="animate-stagger-3 sm:col-span-2 lg:col-span-1">
          <KpiCard
            label={language === 'de' ? 'Sparquote' : 'Savings Rate'}
            value={`${svRate}%`}
            sub={svRate >= 20 ? (language === 'de' ? 'Exzellent – Ziel erreicht' : 'Excellent – Goal Reached') : svRate >= 10 ? (language === 'de' ? 'Gut – Luft nach oben' : 'Good – Room for Improvement') : svRate >= 0 ? (language === 'de' ? 'Niedrig – prüfen' : 'Low – Review') : (language === 'de' ? 'Defizit' : 'Deficit')}
            progress={Math.max(0, svRate)}
            progressColor={svRate >= 20 ? 'bg-success' : svRate >= 0 ? 'bg-warning' : 'bg-error'}
            accent
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left column - Weekly Momentum */}
      

        {/* Right column - Monthly Overview */}
        <div className="card bg-base-100 border border-base-200 p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold">
              {language === 'de' ? 'Monatsverlauf' : 'Monthly Overview'}
            </div>
            <div className="hidden sm:flex items-center gap-3 text-xs opacity-40">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-success inline-block animate-pulse" />
                {language === 'de' ? 'Einnahmen' : 'Income'}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-error inline-block animate-pulse" />
                {language === 'de' ? 'Ausgaben' : 'Expenses'}
              </span>
            </div>
          </div>
          <ChartArea monthly={monthly} colors={colors} language={language} fmt={fmt} cur={cur} />
        </div>     <div className="card bg-base-100 shadow-sm border border-base-200 p-4 sm:p-5 animate-in fade-in slide-in-from-bottom-4 duration-700 hover-lift">
        <div className="text-sm font-semibold mb-4">{language === 'de' ? 'Top Ausgaben' : 'Top Expenses'}</div>
        {byCat.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 sm:h-40 opacity-30 text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            {language === 'de' ? 'Keine Ausgaben' : 'No Expenses'}
          </div>
        ) : (
          <div className="space-y-3">
            {byCat.slice(0, 6).map((ct, i) => (
              <div key={ct.name} className="group animate-in fade-in slide-in-from-left-2 duration-500 hover-float" style={{ animationDelay: `${100 + i * 50}ms` }}>
                <div className="flex items-center justify-between mb-1 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="opacity-30 font-mono text-[10px] w-4 font-bold">{i + 1}</span>
                    <span className="opacity-60 text-base group-hover:scale-110 transition-transform duration-200">{ct.icon}</span>
                    <span className="font-medium opacity-80 truncate max-w-25 group-hover:opacity-100">{ct.name}</span>
                  </div>
                  <span className="text-xs font-bold opacity-70 group-hover:opacity-100 transition-opacity">{fmt(ct.value, cur)}</span>
                </div>
                <div className="w-full h-1.5 bg-base-200 rounded-full overflow-hidden">
                  <div
                    className="h-1.5 rounded-full transition-all duration-500 shadow-sm"
                    style={{ width: `${ct.value / (byCat[0]?.value || 1) * 100}%`, background: ct.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>

     

      {/* Category list */}
 
    </div>
  );
}
