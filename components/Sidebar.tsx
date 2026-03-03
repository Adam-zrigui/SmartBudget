import React, { useState, useEffect } from "react";
import { IC, fmt, calcGermanTax } from "@/lib/utils";
import { SVGIcon as SVG } from "./SVGIcon";
import { useLanguageStore } from "@/lib/store";
import { translations } from "@/lib/translations";
// using plain anchors to avoid Next.js Link runtime bug
import { usePathname } from "next/navigation";

export interface SidebarProps {
  taxResult: any;
  txsLength: number;
  tab: string;
  setTab: (t: string) => void;
}

const TABS = [
  { id: "dashboard", ic: IC.dash },
  { id: "transactions", ic: IC.list },
  { id: "analytics", ic: IC.chart },
  { id: "tax", ic: IC.tax },
  { id: "advisor", ic: IC.chat },
  { id: "profile", ic: IC.user },
];

import { useTheme } from 'next-themes';

export default function Sidebar({
  taxResult,
  txsLength,
  tab,
  setTab,
}: SidebarProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === 'dark';
  
  const pathname = usePathname();
  
  const language = useLanguageStore((s) => s.language);
  const setLanguage = useLanguageStore((s) => s.setLanguage);
  const t = translations[language];

  const [fallbackNet, setFallbackNet] = useState<number | null>(null);

  // If the provided taxResult is empty (dev/unauth), try to derive a net monthly
  // from persisted income transactions so the sidebar shows realistic numbers.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (taxResult && taxResult.netMonthly > 0) return;
        const res = await fetch('/api/transactions?type=income');
        if (!res.ok) return;
        const data = await res.json();
        const months: Record<string, number> = {};
        (data || []).forEach((tx: any) => {
          const d = new Date(tx.date);
          const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
          months[key] = (months[key] || 0) + (tx.amount || 0);
        });
        const vals = Object.values(months);
        if (vals.length === 0) return;
        const avg = Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100;
        const taxRes = await calcGermanTax({ grossMonthly: avg, taxClass: 1, state: 'NW', kirchenmitglied: false, hasKinder: false });
        if (cancelled) return;
        setFallbackNet(taxRes.netMonthly || null);
      } catch (err) {
        // ignore
      }
    })();
    return () => { cancelled = true; };
  }, [txsLength, taxResult]);

  return (
    <aside className="w-64 bg-base-200 dark:bg-base-800 flex flex-col h-screen overflow-y-auto border-r border-base-300 dark:border-base-700 sticky top-0">
      {/* Brand */}
      <div className="px-6 pt-8 pb-6 border-b border-base-300 dark:border-base-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary dark:bg-white flex items-center justify-center text-primary-content dark:text-black font-bold text-sm">
            H
          </div>
          <div>
            <div className="font-bold text-base tracking-tight text-base-content dark:text-base-100">{t.sidebar.brand}</div>
            <div className="text-xs opacity-40 dark:opacity-60 text-base-content dark:text-base-300">{t.sidebar.subtitle}</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 space-y-1">
        {TABS.map((tabItem) => {
          const tabLabel = translations[language].sidebar.tabs[tabItem.id]?.label || tabItem.id;
          const tabHint = translations[language].sidebar.tabs[tabItem.id]?.hint || '';
          
          // Routes for page-based navigation
          const pageRoutes = ['dashboard', 'transactions', 'analytics', 'tax', 'advisor', 'profile'];
          const isPageRoute = pageRoutes.includes(tabItem.id);
          
          // Check if current route matches tab
          const isActive = tabItem.id === 'dashboard' ? pathname === '/' : pathname === `/${tabItem.id}`;
          
          const navClasses = `w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-300 group transform hover:scale-102 hover:pl-5
            ${isActive
              ? "bg-primary/15 dark:bg-primary/20 text-primary dark:text-primary border-l-4 border-primary pl-3 shadow-sm"
              : "hover:bg-base-300 dark:hover:bg-base-300/20 text-base-content opacity-70 group-hover:opacity-100"
            }`;
          
          const navContent = (
            <>
              <span className={`transition-opacity ${isActive ? "opacity-100" : "opacity-60 group-hover:opacity-80"}`}>
                <SVG d={tabItem.ic} size={16} />
              </span>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium ${isActive ? "font-semibold" : "opacity-80"}`}>{tabLabel}</div>
                <div className={`text-xs truncate ${isActive ? "opacity-60" : "opacity-40"}`}>{tabHint}</div>
              </div>
            </>
          );
          
          if (isPageRoute) {
            return (
              <a
                key={tabItem.id}
                href={tabItem.id === 'dashboard' ? '/' : `/${tabItem.id}`}
                className={navClasses}
              >
                {navContent}
              </a>
            );
          } else {
            return (
              <button
                key={tabItem.id}
                onClick={() => setTab(tabItem.id)}
                className={navClasses}
              >
                {navContent}
              </button>
            );
          }
        })}
      </nav>

      {/* Stats strip */}
      <div className="mx-3 mb-3 p-3 bg-base-100 dark:bg-base-700 rounded-xl border border-base-300 dark:border-base-600 hover:shadow-md transition-all duration-500 animate-in fade-in slide-in-from-bottom-2 select-none text-base-content dark:text-base-100" tabIndex={0}>
        <div className="text-xs opacity-40 dark:opacity-60 mb-1 uppercase tracking-wider font-medium">{t.sidebar.netSalary}</div>
        <div className="text-xl font-bold tracking-tight">{fmt(taxResult.netMonthly || (fallbackNet ?? 0))}</div>
        <div className="text-xs opacity-50 dark:opacity-70 mt-0.5">{txsLength} {t.sidebar.totalEntries}</div>
      </div>

      {/* Controls */}
      <div className="px-3 pb-5 space-y-2">
        {/* Language selector */}
        <div className="flex gap-1 rounded-lg overflow-hidden border border-base-300 dark:border-base-600">
          {(['de', 'en'] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={`flex-1 py-2 text-xs font-medium transition-all duration-200 ${
                language === lang
                  ? 'bg-primary dark:bg-secondary text-primary-content dark:text-secondary-content'
                  : 'bg-base-100 dark:bg-base-700 hover:bg-base-200 dark:hover:bg-base-600 opacity-60 hover:opacity-100 text-base-content dark:text-base-100'
              }`}
              title={lang === 'de' ? 'Deutsch' : 'English'}
            >
              {lang.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Theme only */}
        <div className="flex items-center gap-2">
          {mounted && (
            <button
              className="btn btn-ghost btn-sm btn-square hover:scale-110 active:scale-95 transition-all duration-300 transform dark:hover:bg-base-700"
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              title={isDark ? t.header.lightMode : t.header.darkMode}
            >
              <div className={`transition-transform duration-300 ${isDark ? 'rotate-0' : 'rotate-180'}`}>
                <SVG d={isDark ? IC.sun : IC.moon} size={16} />
              </div>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}

