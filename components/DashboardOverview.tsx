"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, type ReactNode } from "react";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Bot,
  CalendarDays,
  ChevronRight,
  Landmark,
  PiggyBank,
  Plus,
  ReceiptText,
  Target,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import { useLanguageStore } from "@/lib/store";
import { translations } from "@/lib/translations";

const ChartArea = dynamic(() => import("./ChartArea"), {
  ssr: false,
  loading: () => <div className="h-[250px] animate-pulse rounded-2xl bg-muted" />,
});

export interface DashboardProps {
  fMonth: string;
  setFMonth: (month: string) => void;
  fType: string;
  setFType: (type: string) => void;
  filtered: any[];
  inc: number;
  exp: number;
  bal: number;
  svRate: number;
  byCat: any[];
  monthly: any[];
  cur: string;
  dark: boolean;
  fmt: (value: number, currency?: string) => string;
  MONTHS_DE: string[];
  txs?: any[];
  savingsGoals?: any[];
  setTab?: (tab: string) => void;
}

const ALLOCATION_COLORS = ["#79aef8", "#f4be62", "#55c99a", "#a879eb", "#ff7474"];
const SPARK_PATHS = [
  "M1 45 C13 42 16 30 27 32 S42 44 53 29 S69 15 79 23 S93 33 102 16 S113 8 120 6",
  "M1 13 C12 19 16 32 26 28 S42 8 52 15 S65 43 78 34 S92 17 102 26 S113 38 120 42",
  "M1 40 C13 40 17 28 28 30 S43 35 53 26 S65 12 78 17 S92 26 102 13 S113 7 120 9",
  "M1 35 C12 31 18 38 28 29 S44 18 54 23 S68 43 78 33 S92 22 102 26 S113 17 120 11",
];

function Sparkline({ index, color }: { index: number; color: string }) {
  const path = SPARK_PATHS[index % SPARK_PATHS.length];
  const gradientId = `spark-${index}`;

  return (
    <svg className="sb-sparkline" viewBox="0 0 121 55" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.28" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${path} L120 55 L1 55 Z`} fill={`url(#${gradientId})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="2.1" strokeLinecap="round" />
    </svg>
  );
}

function MetricCard({
  label,
  detail,
  value,
  icon,
  color,
  index,
  tone,
}: {
  label: string;
  detail: string;
  value: string;
  icon: ReactNode;
  color: string;
  index: number;
  tone: "income" | "expense" | "balance" | "saved";
}) {
  return (
    <article className="sb-metric-card" data-tone={tone}>
      <div className="sb-metric-head">
        <div className="sb-metric-icon" style={{ backgroundColor: `${color}1c`, color }}>
          {icon}
        </div>
        <div className="sb-metric-copy">
          <div className="sb-metric-label">{label}</div>
          <div className="sb-metric-detail">{detail}</div>
        </div>
      </div>
      <div className="sb-metric-value">{value}</div>
      <Sparkline index={index} color={color} />
    </article>
  );
}

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
  const language = useLanguageStore((state) => state.language);
  const t = translations[language];

  const goals = useMemo(
    () => (Array.isArray(savingsGoals) ? savingsGoals : []).filter((goal: any) => Number(goal?.targetAmount || 0) > 0),
    [savingsGoals]
  );
  const primaryGoal = goals.find((goal: any) => Number(goal?.currentAmount || 0) < Number(goal?.targetAmount || 0)) || goals[0];
  const goalProgress = primaryGoal
    ? Math.max(0, Math.min(100, (Number(primaryGoal.currentAmount || 0) / Number(primaryGoal.targetAmount || 1)) * 100))
    : 0;
  const savedTotal = goals.reduce((sum: number, goal: any) => sum + Number(goal?.currentAmount || 0), 0);

  const recentTransactions = useMemo(
    () =>
      [...(Array.isArray(txs) ? txs : [])]
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5),
    [txs]
  );

  const periodLabel = fMonth === "all"
    ? (language === "de" ? "Gesamter Zeitraum" : "All time")
    : `${MONTHS_DE[Number(fMonth)]} 2026`;
  const expenseTotal = byCat.reduce((sum: number, category: any) => sum + Number(category.value || 0), 0);
  const chartColors = {
    green: "#7bd863",
    red: "#ff7474",
    border: dark ? "rgba(255,255,255,.07)" : "rgba(0,0,0,.07)",
    muted: dark ? "rgba(255,255,255,.36)" : "rgba(0,0,0,.4)",
    cardBg: dark ? "#111111" : "#ffffff",
  };

  const openTab = (nextTab: string) => {
    setTab?.(nextTab);
    window.history.pushState(null, "", nextTab === "dashboard" ? "/dashboard" : `/dashboard?tab=${nextTab}`);
  };

  const openTransactions = () => openTab("transactions");

  return (
    <div className="sb-dashboard">
      <div className="sb-dashboard-toolbar">
        <div className="sb-dashboard-heading">
          <h2>{language === "de" ? "Deine Finanzen heute" : "Your money today"}</h2>
          <p>
            <CalendarDays className="size-3" />
            {periodLabel}
            <span>·</span>
            {filtered.length} {language === "de" ? "Einträge" : "entries"}
          </p>
        </div>

        <div className="sb-filter-group">
          <select className="sb-filter-select" value={fMonth} onChange={(event) => setFMonth(event.target.value)}>
            <option value="all">{language === "de" ? "Alle Monate" : "All months"}</option>
            {MONTHS_DE.map((month, index) => <option key={month} value={index}>{month} 2026</option>)}
          </select>
          <div className="sb-segmented">
            {[
              { value: "all", label: language === "de" ? "Alle" : "All" },
              { value: "income", label: language === "de" ? "Eingang" : "Income" },
              { value: "expense", label: language === "de" ? "Ausgang" : "Expense" },
            ].map((option) => (
              <button
                key={option.value}
                className={fType === option.value ? "is-active" : ""}
                onClick={() => setFType(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="sb-dashboard-layout">
        <main className="sb-dashboard-main">
          <div className="sb-metric-grid">
            <MetricCard
              label={language === "de" ? "Einnahmen" : "Income"}
              detail={`${filtered.filter((item) => item.type === "income").length} ${language === "de" ? "Einträge" : "entries"}`}
              value={fmt(inc, cur)}
              icon={<ArrowDownLeft className="size-[17px]" />}
              color="#7bd863"
              index={0}
              tone="income"
            />
            <MetricCard
              label={language === "de" ? "Ausgaben" : "Expenses"}
              detail={`${filtered.filter((item) => item.type === "expense").length} ${language === "de" ? "Einträge" : "entries"}`}
              value={fmt(exp, cur)}
              icon={<ArrowUpRight className="size-[17px]" />}
              color="#ff7474"
              index={1}
              tone="expense"
            />
            <MetricCard
              label={language === "de" ? "Saldo" : "Balance"}
              detail={periodLabel}
              value={fmt(bal, cur)}
              icon={<WalletCards className="size-[17px]" />}
              color="#b3ff83"
              index={2}
              tone="balance"
            />
            <MetricCard
              label={language === "de" ? "Gespart" : "Saved"}
              detail={language === "de" ? "in allen Zielen" : "across all goals"}
              value={fmt(savedTotal, cur)}
              icon={<PiggyBank className="size-[17px]" />}
              color={svRate >= 20 ? "#b3ff83" : "#f4be62"}
              index={3}
              tone="saved"
            />
          </div>

          <div className="sb-dashboard-lower">
            <section className="sb-card">
              <div className="sb-card-header">
                <div>
                  <div className="sb-card-title">{language === "de" ? "Cashflow-Verlauf" : "Cash flow"}</div>
                  <div className="sb-card-subtitle">{language === "de" ? "Einnahmen und Ausgaben im Jahresverlauf" : "Income and expenses over the year"}</div>
                </div>
                <div className="sb-chart-legend">
                  <span><i style={{ background: "#7bd863" }} />{language === "de" ? "Eingang" : "Income"}</span>
                  <span><i style={{ background: "#ff7474" }} />{language === "de" ? "Ausgang" : "Expense"}</span>
                </div>
              </div>
              {monthly.length > 0 ? (
                <ChartArea monthly={monthly} colors={chartColors} language={language} fmt={fmt} cur={cur} />
              ) : (
                <div className="sb-empty-chart">
                  <div>
                    <TrendingUp className="mx-auto mb-3 size-6 opacity-50" />
                    <strong>{language === "de" ? "Dein Verlauf beginnt hier" : "Your trend starts here"}</strong>
                    <span>{language === "de" ? "Füge Buchungen hinzu, um deine Entwicklung zu sehen." : "Add entries to reveal your money movement."}</span>
                  </div>
                </div>
              )}
            </section>

            <section className="sb-card">
              <div className="sb-card-header">
                <div>
                  <div className="sb-card-title">{language === "de" ? "Ausgaben" : "Spending"}</div>
                  <div className="sb-card-subtitle">{language === "de" ? "Größte Kategorien" : "Top categories"}</div>
                </div>
                <button onClick={openTransactions} className="sb-icon-button !h-8 !w-8" aria-label={language === "de" ? "Alle Buchungen" : "View transactions"}><ArrowRight className="size-3.5" /></button>
              </div>

              {byCat.length > 0 ? (
                <div className="sb-category-list">
                  {byCat.slice(0, 5).map((category: any, index: number) => {
                    const percentage = expenseTotal > 0 ? (Number(category.value || 0) / expenseTotal) * 100 : 0;
                    const color = ALLOCATION_COLORS[index % ALLOCATION_COLORS.length];
                    const name = String(category.name || "?");
                    return (
                      <div key={name} className="sb-category-row">
                        <span className="sb-category-tile" style={{ background: `${color}22`, color }}>
                          {name.charAt(0).toUpperCase()}
                        </span>
                        <div className="sb-category-top">
                          <div className="sb-category-copy">
                            <div className="sb-category-name">{name}</div>
                            <div className="sb-category-meta">
                              {language === "de" ? "Ausgaben" : "Spending"} · {Math.round(percentage)}%
                            </div>
                          </div>
                        </div>
                        <div className="sb-category-side">
                          <span className="sb-category-amount">{fmt(Number(category.value || 0), cur)}</span>
                          <span className="sb-category-mini">
                            <i style={{ width: `${Math.min(100, percentage)}%`, background: color }} />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="sb-empty-chart !h-[250px]">
                  <div>
                    <ReceiptText className="mx-auto mb-3 size-6 opacity-40" />
                    <strong>{language === "de" ? "Noch keine Ausgaben" : "No spending yet"}</strong>
                    <span>{language === "de" ? "Deine Kategorien erscheinen hier." : "Your categories will appear here."}</span>
                  </div>
                </div>
              )}
            </section>
          </div>

          <section className="sb-card sb-next-step">
            <div className="flex min-w-0 items-center gap-4">
              <div className="sb-assistant-icon"><Bot className="size-[18px]" /></div>
              <div className="min-w-0">
                <div className="sb-card-title">{language === "de" ? "Ein klarer nächster Schritt" : "One clear next step"}</div>
                <div className="sb-card-subtitle truncate">
                  {svRate >= 20
                    ? (language === "de" ? "Deine Sparquote ist stärker als dein Ziel." : "Your savings rate is ahead of target.")
                    : (language === "de" ? "Noch 10 Prozentpunkte trennen dich von 20 %." : "Ten percentage points put you on the 20% track.")}
                </div>
              </div>
            </div>
            <button onClick={() => openTab("advisor")} className="sb-secondary-button !w-auto shrink-0 !px-4">
              {language === "de" ? "Berater fragen" : "Ask advisor"}
              <ChevronRight className="size-3.5" />
            </button>
          </section>
        </main>

        <aside className="sb-dashboard-side">
          <section className="sb-balance-card">
            <div className="sb-balance-head">
              <div>
                <div className="sb-balance-label">{language === "de" ? "Mein Saldo" : "My balance"}</div>
                <div className="sb-balance-period">{periodLabel}</div>
              </div>
              <div className="sb-balance-icon"><Landmark className="size-[19px]" /></div>
            </div>

            <div className="sb-balance-content">
              <div className="sb-balance-amount">{fmt(bal, cur)}</div>
              <div className="sb-balance-trend">
                <ArrowUpRight className="size-3.5" />
                {Math.max(0, svRate)}% {language === "de" ? "Sparquote" : "saved"}
              </div>
            </div>

            <div className="sb-allocation">
              <div className="sb-allocation-head">
                <span>{language === "de" ? "Budgetverteilung" : "Budget allocation"}</span>
                <span className="sb-allocation-total">Total: {filtered.length}</span>
              </div>
              <div className="sb-allocation-bar">
                {byCat.length > 0 ? byCat.slice(0, 5).map((category: any, index: number) => (
                  <span
                    key={category.name}
                    style={{
                      width: `${expenseTotal > 0 ? (Number(category.value || 0) / expenseTotal) * 100 : 0}%`,
                      background: ALLOCATION_COLORS[index % ALLOCATION_COLORS.length],
                    }}
                  />
                )) : null}
              </div>
              <div className="sb-allocation-list">
                {byCat.slice(0, 4).map((category: any, index: number) => (
                  <div key={category.name} className="sb-allocation-row">
                    <i style={{ background: ALLOCATION_COLORS[index % ALLOCATION_COLORS.length] }} />
                    <span>{category.name}</span>
                    <strong>{fmt(category.value, cur)}</strong>
                  </div>
                ))}
                {byCat.length === 0 ? <div className="sb-allocation-total">{language === "de" ? "Noch keine Kategorien" : "No categories yet"}</div> : null}
              </div>
            </div>

            <button className="sb-balance-button" onClick={openTransactions}>
              {language === "de" ? "Budget verwalten" : "Manage budget"}
              <ChevronRight className="size-3.5" />
            </button>
          </section>

          <section className="sb-card">
            <div className="sb-card-header">
              <div className="sb-card-title">{language === "de" ? "Letzte Aktivitäten" : "Recent activity"}</div>
              <button onClick={openTransactions} className="sb-card-subtitle hover:text-foreground">{language === "de" ? "Alle" : "View all"}</button>
            </div>
            {recentTransactions.length > 0 ? (
              <div className="sb-activity-list">
                {recentTransactions.map((transaction: any) => {
                  const income = transaction.type === "income";
                  return (
                    <button key={transaction.id} onClick={openTransactions} className="sb-activity-item">
                      <div className="sb-activity-icon" style={{ background: income ? "rgb(123 216 99 / .12)" : "rgb(255 116 116 / .1)", color: income ? "#7bd863" : "#ff7474" }}>
                        {income ? <ArrowDownLeft className="size-4" /> : <ArrowUpRight className="size-4" />}
                      </div>
                      <div className="sb-activity-copy">
                        <div className="sb-activity-title">{transaction.description || transaction.category}</div>
                        <div className="sb-activity-date">
                          {transaction.category} · {new Date(transaction.date).toLocaleDateString(language === "de" ? "de-DE" : "en-US", { month: "short", day: "numeric" })}
                        </div>
                      </div>
                      <div className="sb-activity-amount" style={{ color: income ? "#7bd863" : undefined }}>
                        {income ? "+" : "−"}{fmt(Number(transaction.amount || 0), cur)}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="sb-goal-empty">
                <ReceiptText className="mx-auto mb-3 size-5 opacity-40" />
                {language === "de" ? "Noch keine Aktivitäten" : "No activity yet"}
                <Link href="/new" className="!mt-3"><Plus className="size-3" />{language === "de" ? "Erste Buchung" : "Add first entry"}</Link>
              </div>
            )}
          </section>

          <section className="sb-card">
            <div className="sb-card-header">
              <div>
                <div className="sb-card-title">{language === "de" ? "Sparziel" : "Savings goal"}</div>
                <div className="sb-card-subtitle truncate">{primaryGoal?.name || (language === "de" ? "Noch kein Ziel" : "No goal yet")}</div>
              </div>
              <Target className="size-4 text-muted-foreground" />
            </div>
            {primaryGoal ? (
              <div className="sb-goal-card">
                <div className="sb-goal-top">
                  <div className="sb-goal-amount">{fmt(primaryGoal.currentAmount, cur)}</div>
                  <div className="sb-goal-target">/{fmt(primaryGoal.targetAmount, cur)}</div>
                </div>
                <div className="sb-progress-track">
                  <div className="sb-progress-fill !bg-[#b3ff83]" style={{ width: `${goalProgress}%` }} />
                </div>
                <div className="sb-goal-meta">
                  <span>{Math.round(goalProgress)}% {language === "de" ? "erreicht" : "complete"}</span>
                  <button onClick={() => openTab("goals")} className="font-semibold text-foreground">{language === "de" ? "Öffnen" : "Open"}</button>
                </div>
              </div>
            ) : (
              <div className="sb-goal-empty">
                <strong>{language === "de" ? "Gib deinem Sparen ein Ziel" : "Give your savings a goal"}</strong>
                {language === "de" ? "So wird jeder Fortschritt sichtbar." : "Make every contribution visible."}
                <button onClick={() => openTab("goals")}><Plus className="size-3" />{language === "de" ? "Ziel erstellen" : "Create goal"}</button>
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
