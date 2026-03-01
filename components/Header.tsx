'use client'

import { useLanguageStore } from "@/lib/store";
import { translations } from "@/lib/translations";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";

export interface HeaderProps {
  tab: string;
  txsLength: number;
  exportCSV: () => void;
}

export default function Header({ tab, txsLength, exportCSV }: HeaderProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === 'dark';
  
  const language = useLanguageStore((s) => s.language);
  const t = translations[language];
  const { data: session } = useSession();
  
  const TABS: Record<string, { label: string; description: string }> = {
    dashboard: { 
      label: language === 'de' ? "Übersicht" : "Overview", 
      description: language === 'de' ? "Finanzen auf einen Blick" : "Finance at a glance" 
    },
    transactions: { 
      label: language === 'de' ? "Buchungen" : "Transactions", 
      description: language === 'de' ? "Einnahmen & Ausgaben verwalten" : "Manage income & expenses" 
    },
    analytics: { 
      label: language === 'de' ? "Analyse" : "Analytics", 
      description: language === 'de' ? "Trends, Kategorien & Sparquote" : "Trends, categories & savings rate" 
    },
    tax: { 
      label: language === 'de' ? "Steuer" : "Tax", 
      description: language === 'de' ? "Brutto–Netto-Rechner 2024" : "Gross/Net Calculator 2024" 
    },
  };
  
  const current =
    TABS[tab] ??
    (tab === 'new'
      ? { label: language === 'de' ? t.header.newEntry : t.header.newEntry, description: '' }
      : { label: tab, description: '' });

  return (
    <header className="sticky top-0 z-40 glass bg-base-100/80 border-b border-base-200 backdrop-blur-md transition-all duration-300">
      <div className="flex items-center h-16 ui-container mx-auto px-6 gap-4">
        {/* Mobile hamburger */}
        <label
          htmlFor="sidebar-toggle"
          className="btn btn-ghost btn-sm btn-square lg:hidden"
          aria-label="Menü öffnen"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </label>

        {/* Title block */}
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold tracking-tight leading-none">{current.label}</h1>
          <p className="text-xs opacity-40 mt-0.5 truncate">{current.description}</p>
        </div>

        {/* Pill badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-base-200 rounded-full text-xs opacity-60 font-medium hover:opacity-80 hover:shadow-md transition-all duration-200">
          <span className="w-1.5 h-1.5 rounded-full bg-success inline-block animate-pulse" />
          {txsLength} {language === 'de' ? 'Buchungen' : 'Entries'} · {language === 'de' ? 'Feb 2026' : 'Feb 2026'}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
            <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="btn btn-ghost btn-sm btn-square hover:scale-110 hover:bg-base-200/50 transition-all duration-300 transform"
            title={isDark ? t.header.lightMode : t.header.darkMode}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform duration-300 ${isDark ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isDark ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m8.66-9h-1M4.34 12h-1m15.07 4.95l-.71-.71M6.34 7.05l-.71-.71m12.02-.71l-.71.71M6.34 16.95l-.71.71M12 5a7 7 0 100 14 7 7 0 000-14z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              )}
            </svg>
          </button>
          <button
            onClick={exportCSV}
            className="btn btn-ghost btn-sm gap-1.5 text-xs font-medium opacity-60 hover:opacity-100 hover:scale-105 active:scale-95 transition-all duration-200 transform"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            {language === 'de' ? 'CSV' : 'CSV'}
          </button>
          <Link
            href="/new"
            className="btn btn-primary btn-sm gap-1.5 text-xs font-semibold hover:scale-105 active:scale-95 transition-all duration-200 transform hover:shadow-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            {language === 'de' ? 'Neue Buchung' : 'New Entry'}
          </Link>
          {/* auth actions */}
          {session ? (
            <Link href="/profile" className="btn btn-ghost btn-circle avatar p-0">
              <div className="w-8 h-8 rounded-full overflow-hidden">
                <img src={session.user?.image || '/avatar.png'} alt={session.user?.name ?? 'User'} className="object-cover w-full h-full" />
              </div>
            </Link>
          ) : (
            <Link href="/auth/signin" className="btn btn-ghost btn-sm text-xs">
              {t.auth.signIn}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}