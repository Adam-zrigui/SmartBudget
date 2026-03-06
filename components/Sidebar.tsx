"use client"

import React, { useState, useEffect } from "react";
import { IC, fmt, calcGermanTax } from "@/lib/utils";
import { SVGIcon as SVG } from "./SVGIcon";
import { useLanguageStore } from "@/lib/store";
import { translations } from "@/lib/translations";
import Link from "next/link";
import { usePathname } from "next/navigation";

export interface SidebarProps {
  taxResult: any;
  txsLength: number;
  tab: string;
  setTab: (t: string) => void;
  onNavigate?: () => void; // callback for mobile to close drawer when navigation occurs
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
  onNavigate,
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
    <aside className="w-full max-w-sm bg-sidebar border-r border-sidebar-border flex flex-col h-screen overflow-y-auto sticky top-0 shadow-lg relative scrollbar-thin scrollbar-thumb-base-300 dark:scrollbar-thumb-base-700">
      {/* close button for mobile drawer */}
      <div className="lg:hidden absolute top-3 right-3 z-10">
        <label htmlFor="sidebar-toggle" className="btn btn-ghost btn-sm btn-square hover:bg-base-200/50 active:scale-95 transition-all duration-200 min-h-[44px] min-w-[44px]">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </label>
      </div>
      {/* Brand */}
      <div className="px-4 sm:px-6 pt-6 sm:pt-8 pb-4 sm:pb-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary dark:bg-white flex items-center justify-center text-primary-content dark:text-black font-bold text-sm flex-shrink-0">
            H
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-bold text-sm sm:text-base tracking-tight text-base-content dark:text-base-100 truncate">{t.sidebar.brand}</div>
            <div className="text-xs opacity-40 dark:opacity-60 text-base-content dark:text-base-300 truncate">{t.sidebar.subtitle}</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 sm:py-5 space-y-1 overflow-y-auto">
        {TABS.map((tabItem) => {
          const tabLabel = translations[language].sidebar.tabs[tabItem.id]?.label || tabItem.id;
          const tabHint = translations[language].sidebar.tabs[tabItem.id]?.hint || '';
          
          // Routes for page-based navigation
          const pageRoutes = ['dashboard', 'transactions', 'analytics', 'tax', 'advisor', 'profile'];
          const isPageRoute = pageRoutes.includes(tabItem.id);
          
          // Check if current route matches tab
          const isActive = tabItem.id === 'dashboard' ? pathname === '/' : pathname === `/${tabItem.id}`;
          
          const navClasses = `w-full flex items-center gap-3 px-3 sm:px-4 py-3 sm:py-3 rounded-xl text-left transition-all duration-300 group transform hover:scale-[1.02] focus:outline-none focus-visible:ring focus-visible:ring-primary/50 min-h-[48px]
            ${isActive
              ? "bg-primary/15 dark:bg-primary/20 text-primary dark:text-primary border-l-4 border-primary pl-3 shadow-sm"
              : "hover:bg-base-300 dark:hover:bg-base-300/20 text-base-content opacity-70 group-hover:opacity-100"
            }`;
          
          const navContent = (
            <>
              <span className={`transition-opacity flex-shrink-0 ${isActive ? "opacity-100" : "opacity-60 group-hover:opacity-80"}`}>
                <SVG d={tabItem.ic} size={18} />
              </span>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium ${isActive ? "font-semibold" : "opacity-80"}`}>{tabLabel}</div>
                <div className={`text-xs truncate ${isActive ? "opacity-60" : "opacity-40"}`}>{tabHint}</div>
              </div>
            </>
          );
          
          if (isPageRoute) {
            return (
              <Link
                key={tabItem.id}
                href={tabItem.id === 'dashboard' ? '/' : `/${tabItem.id}`}
                className={navClasses}
                onClick={onNavigate}
                aria-current={isActive ? 'page' : undefined}
              >
                {navContent}
              </Link>
            );
          } else {
            return (
              <button
                key={tabItem.id}
                onClick={() => {
                  setTab(tabItem.id);
                  onNavigate?.();
                }}
                className={navClasses}
              >
                {navContent}
              </button>
            );
          }
        })}
      </nav>

      {/* Legal & Features Section */}
      <div className="px-3 pb-3 border-t border-base-300 dark:border-base-700">
        <div className="pt-3 pb-2">
          <div className="text-xs opacity-40 dark:opacity-60 uppercase tracking-wider font-medium px-1">
            {language === 'de' ? 'Rechtliches & Features' : 'Legal & Features'}
          </div>
        </div>
        <nav className="space-y-1">
          {[
            {
              href: '/legal/privacy',
              label: language === 'de' ? 'Datenschutz' : 'Privacy Policy',
              hint: language === 'de' ? 'GDPR konform' : 'GDPR compliant',
              icon: '🔒'
            },
            {
              href: '/legal/terms',
              label: language === 'de' ? 'Nutzungsbedingungen' : 'Terms of Service',
              hint: language === 'de' ? 'Regeln & Haftung' : 'Rules & liability',
              icon: '📋'
            },
            {
              href: '/legal/data-processing',
              label: language === 'de' ? 'Datenverarbeitung' : 'Data Processing',
              hint: language === 'de' ? 'Wie wir Daten nutzen' : 'How we use data',
              icon: '📊'
            }
          ].map((item) => {
            const isActive = pathname === item.href;
            const navClasses = `w-full flex items-center gap-3 px-3 sm:px-4 py-2.5 rounded-lg text-left transition-all duration-300 group transform hover:scale-[1.02] min-h-[44px]
              ${isActive
                ? "bg-primary/15 dark:bg-primary/20 text-primary dark:text-primary border-l-3 border-primary pl-3 shadow-sm"
                : "hover:bg-base-300 dark:hover:bg-base-300/20 text-base-content opacity-60 group-hover:opacity-100"
              }`;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={navClasses}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className={`text-base sm:text-lg transition-opacity flex-shrink-0 ${isActive ? "opacity-100" : "opacity-60 group-hover:opacity-80"}`}>
                  {item.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium ${isActive ? "font-semibold" : "opacity-80"}`}>{item.label}</div>
                  <div className={`text-xs truncate ${isActive ? "opacity-60" : "opacity-40"}`}>{item.hint}</div>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Stats strip */}
      <div className="mx-3 mb-3 p-3 bg-base-100 dark:bg-base-700 rounded-xl border border-base-300 dark:border-base-600 hover:shadow-md transition-all duration-500 animate-in fade-in slide-in-from-bottom-2 select-none text-base-content dark:text-base-100" tabIndex={0}>
        <div className="text-xs opacity-40 dark:opacity-60 mb-1 uppercase tracking-wider font-medium">{t.sidebar.netSalary}</div>
        <div className="text-xl font-bold tracking-tight">{fmt(taxResult.netMonthly || (fallbackNet ?? 0))}</div>
        <div className="text-xs opacity-50 dark:opacity-70 mt-0.5">{txsLength} {t.sidebar.totalEntries}</div>
      </div>

      {/* Controls */}
      <div className="px-3 pb-4 sm:pb-5 space-y-3">
        {/* Language selector */}
        <div className="flex gap-1 rounded-lg overflow-hidden border border-base-300 dark:border-base-600">
          {(['de', 'en'] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={`flex-1 py-2.5 text-xs font-medium transition-all duration-200 min-h-[44px] ${
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

        {/* Theme toggle */}
        <div className="flex items-center justify-start">
          {mounted && (
            <button
              className="btn btn-ghost btn-sm btn-square hover:scale-110 active:scale-95 transition-all duration-300 transform dark:hover:bg-base-700 min-h-[44px] min-w-[44px]"
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              title={isDark ? t.header.lightMode : t.header.darkMode}
            >
              <div className={`transition-transform duration-300 ${isDark ? 'rotate-0' : 'rotate-180'}`}>
                <SVG d={isDark ? IC.sun : IC.moon} size={18} />
              </div>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}

