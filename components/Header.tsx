"use client";

import { useEffect, useMemo, useState, type FormEvent, type MouseEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Bell, Bot, ChevronDown, Download, Menu, Moon, Plus, Search, Sun } from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { authedFetch } from "@/lib/client-auth";
import { useLanguageStore } from "@/lib/store";
import { translations } from "@/lib/translations";

export interface HeaderProps {
  tab?: string;
  txsLength?: number;
  exportCSV?: () => void;
  onHamburger?: () => void;
  q?: string;
  setQ?: (query: string) => void;
  setTab?: (tab: string) => void;
}

const PAGE_LABELS = {
  dashboard: ["Dashboard", "Your complete money overview"],
  transactions: ["Transactions", "Income, expenses and every movement"],
  analytics: ["Analytics", "Patterns behind your spending"],
  budget: ["Budget", "Keep every monthly plan on track"],
  goals: ["Savings goals", "Turn big plans into visible progress"],
  recurring: ["Recurring", "Manage regular payments"],
  investments: ["Investments", "Follow your portfolio"],
  currency: ["Currency", "Currencies and exchange rates"],
  tax: ["Tax", "Plan gross-to-net income"],
  advisor: ["AI advisor", "Clear answers for your money"],
  profile: ["Profile", "Your account and preferences"],
  new: ["New entry", "Record income or an expense"],
} as const;

export default function Header({
  tab = "",
  txsLength = 0,
  exportCSV = () => {},
  onHamburger,
  q = "",
  setQ,
  setTab,
}: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const language = useLanguageStore((state) => state.language);
  const t = translations[language];
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState(q);

  useEffect(() => setMounted(true), []);
  useEffect(() => setQuery(q), [q]);

  const isDark = mounted && resolvedTheme === "dark";
  const monthLabel = useMemo(
    () => new Intl.DateTimeFormat(mounted ? (language === "de" ? "de-DE" : "en-US") : "en-US", { month: "short", year: "numeric" }).format(new Date()),
    [language, mounted]
  );

  const pageKey = (PAGE_LABELS as Record<string, readonly [string, string]>)[tab] || [
    tab ? tab.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) : "Dashboard",
    language === "de" ? "Deine Finanzen auf einen Blick" : "Your finances at a glance",
  ];

  const title = language === "de" && pageKey === PAGE_LABELS.dashboard ? "Übersicht" : pageKey[0];
  const description = language === "de" && pageKey === PAGE_LABELS.dashboard ? "Deine Finanzen auf einen Blick" : pageKey[1];
  const showHamburger = pathname && !["/auth", "/login"].some((route) => pathname.startsWith(route));
  const isShellView = pathname === "/dashboard" || pathname === "/";

  const navigateToTab = (event: MouseEvent<HTMLAnchorElement>, nextTab: string) => {
    if (!isShellView || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    setTab?.(nextTab);
    const nextUrl = nextTab === "dashboard" ? "/dashboard" : `/dashboard?tab=${nextTab}`;
    window.history.pushState(null, "", nextUrl);
  };

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (setQ) setQ(query);
    if (setTab) {
      setTab("transactions");
      window.history.pushState(null, "", "/dashboard?tab=transactions");
    } else {
      router.push("/dashboard?tab=transactions");
    }
  };

  const handleExport = async (format: "csv" | "json") => {
    try {
      const response = await authedFetch(`/api/transactions/export?format=${format}`);
      if (!response.ok) throw new Error("Export failed");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `smartbudget-transactions.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast({ title: language === "de" ? "Export erfolgreich" : "Export successful" });
    } catch {
      if (format === "csv") exportCSV();
      toast({ title: language === "de" ? "Export fehlgeschlagen" : "Export failed", variant: "destructive" });
    }
  };

  return (
    <header className="sb-header">
      <div className="sb-header-inner">
        {showHamburger && (
          <button className="sb-icon-button sb-menu-button" onClick={onHamburger} aria-label={language === "de" ? "Menü öffnen" : "Open menu"}>
            <Menu className="size-5" />
          </button>
        )}

        <div className="sb-header-title">
          <h1 suppressHydrationWarning>{title}</h1>
          <p suppressHydrationWarning>{description}</p>
        </div>

        <form className="sb-search" onSubmit={handleSearch}>
          <Search className="size-[18px] shrink-0" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={language === "de" ? "Suchen" : "Search anything"}
            aria-label={language === "de" ? "Suchen" : "Search"}
          />
        </form>

        <div className="sb-header-actions">
          <div className="sb-desktop-action hidden items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-[10px] font-medium text-muted-foreground 2xl:flex">
            <span className="size-1.5 rounded-full bg-[#70ca5d]" />
            {txsLength} {t.header.entries} · {monthLabel}
          </div>

          <Link href="/dashboard?tab=advisor" onClick={(event) => navigateToTab(event, "advisor")} className="sb-icon-button sb-desktop-action" title={language === "de" ? "KI-Berater" : "AI advisor"}>
            <Bot className="size-[18px]" />
          </Link>

          <button className="sb-icon-button" aria-label={language === "de" ? "Benachrichtigungen" : "Notifications"}>
            <Bell className="size-[18px]" />
            <span className="sb-notification-dot" />
          </button>

          <button
            className="sb-icon-button sb-desktop-action"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            title={isDark ? t.header.lightMode : t.header.darkMode}
          >
            {isDark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="sb-icon-button sb-desktop-action" title={language === "de" ? "Export" : "Export"}>
                <Download className="size-[18px]" />
                <ChevronDown className="size-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-44">
              <DropdownMenuItem onClick={() => handleExport("csv")}>{language === "de" ? "Als CSV" : "Export CSV"}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("json")}>{language === "de" ? "Als JSON" : "Export JSON"}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Link href="/new" className="sb-header-button">
            <Plus className="size-4" />
            <span>{language === "de" ? "Neue Buchung" : "New entry"}</span>
          </Link>

          {!loading && user ? (
            <Link href="/dashboard?tab=profile" onClick={(event) => navigateToTab(event, "profile")} className="sb-user-avatar sb-desktop-action">
              <img src={user.photoURL || "/placeholder-user.jpg"} alt={user.displayName ?? "User"} />
            </Link>
          ) : (
            <Link href="/auth/signin" className="sb-desktop-action px-2 text-[11px] font-semibold text-muted-foreground hover:text-foreground">
              {language === "de" ? "Anmelden" : "Sign in"}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
