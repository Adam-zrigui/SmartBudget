'use client'

import { useLanguageStore } from "@/lib/store";
import { translations } from "@/lib/translations";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const { user, loading } = useAuth();
  const { toast } = useToast();

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const response = await fetch(`/api/transactions/export?format=${format}`);
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `transactions.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast({ title: language === 'de' ? 'Export erfolgreich' : 'Export successful' });
    } catch (err: any) {
      toast({ 
        title: language === 'de' ? 'Export fehlgeschlagen' : 'Export failed',
        variant: 'destructive' 
      });
    }
  };
  
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
    advisor: { 
      label: language === 'de' ? "Berater" : "Advisor", 
      description: language === 'de' ? "KI-gestützte Finanzberatung" : "AI-powered financial advice" 
    },
    profile: { 
      label: language === 'de' ? "Profil" : "Profile", 
      description: language === 'de' ? "Kontoeinstellungen & Sicherheit" : "Account settings & security" 
    },
  };
  
  const current =
    TABS[tab] ??
    (tab === 'new'
      ? { label: language === 'de' ? t.header.newEntry : t.header.newEntry, description: '' }
      : { label: tab, description: '' });

  return (
    <header className="sticky top-0 z-40 glass bg-base-100/90 dark:bg-base-900/90 border-b border-base-200 dark:border-base-700 backdrop-blur-md transition-all duration-300">
      <div className="flex items-center h-16 ui-container mx-auto px-6 gap-4 text-base-content dark:text-base-100">
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
            <Link
            href="/advisor"
            className="btn btn-ghost btn-sm btn-square hover:scale-110 hover:bg-primary/10 transition-all duration-300 transform"
            title={language === 'de' ? 'AI Berater' : 'AI Advisor'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h-1V6a5 5 0 00-10 0v2H5a2 2 0 00-2 2v6a2 2 0 002 2h3v3l4-3h4a2 2 0 002-2v-6a2 2 0 00-2-2z" />
            </svg>
          </Link>
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                suppressHydrationWarning
                className="btn btn-ghost btn-sm gap-1.5 text-xs font-medium opacity-60 hover:opacity-100 hover:scale-105 active:scale-95 transition-all duration-200 transform"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
                {language === 'de' ? 'Export' : 'Export'}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => handleExport('csv')} className="cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>{language === 'de' ? 'Als CSV' : 'As CSV'}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('json')} className="cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                <span>{language === 'de' ? 'Als JSON' : 'As JSON'}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
          {!loading && user ? (
            <Link href="/profile" className="btn btn-ghost btn-circle avatar p-0" suppressHydrationWarning>
              <div className="w-8 h-8 rounded-full overflow-hidden">
                <img src={user.photoURL || '/avatar.png'} alt={user.displayName ?? 'User'} loading="lazy" className="object-cover w-full h-full" />
              </div>
            </Link>
          ) : (
            <Link href="/auth/signin" className="btn btn-ghost btn-sm text-xs">
              {language === 'de' ? 'Anmelden' : 'Sign In'}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}