"use client";

import { useEffect, useState, type ComponentType, type MouseEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  ArrowLeftRight,
  BarChart3,
  Bot,
  ChevronRight,
  Coins,
  Database,
  FileText,
  Landmark,
  LayoutDashboard,
  Moon,
  Repeat2,
  Settings,
  ShieldCheck,
  Sun,
  Target,
  TrendingUp,
  UserRound,
  WalletCards,
} from "lucide-react";
import { fmt } from "@/lib/utils";
import { useLanguageStore } from "@/lib/store";
import { translations } from "@/lib/translations";
import { useAuth } from "@/components/AuthContext";
import BrandMark from "@/components/BrandMark";

export interface SidebarProps {
  taxResult: any;
  txsLength: number;
  tab: string;
  setTab: (tab: string) => void;
  onNavigate?: () => void;
}

type NavItem = {
  id: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  en: string;
  de: string;
  full?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", icon: LayoutDashboard, en: "Dashboard", de: "Übersicht" },
  { id: "transactions", icon: ArrowLeftRight, en: "Transactions", de: "Buchungen" },
  { id: "analytics", icon: BarChart3, en: "Analytics", de: "Analyse" },
  { id: "budget", icon: WalletCards, en: "Budget", de: "Budget" },
  { id: "goals", icon: Target, en: "Goals", de: "Ziele" },
  { id: "recurring", icon: Repeat2, en: "Recurring", de: "Daueraufträge" },
  { id: "investments", icon: TrendingUp, en: "Investments", de: "Investitionen" },
  { id: "currency", icon: Coins, en: "Currency", de: "Währungen" },
  { id: "tax", icon: Landmark, en: "Tax", de: "Steuer" },
  { id: "advisor", icon: Bot, en: "AI advisor", de: "Beratung" },
  { id: "profile", icon: UserRound, en: "Profile", de: "Profil" },
];

const PRIMARY_COUNT = 6;
const PRIMARY_ITEMS = NAV_ITEMS.slice(0, PRIMARY_COUNT);
const SECONDARY_ITEMS = NAV_ITEMS.slice(PRIMARY_COUNT);

const LEGAL_LINKS = [
  { href: "/legal/privacy", icon: ShieldCheck, en: "Privacy", de: "Datenschutz" },
  { href: "/legal/terms", icon: FileText, en: "Terms", de: "Bedingungen" },
  { href: "/legal/data-processing", icon: Database, en: "Data", de: "Daten" },
];

export default function Sidebar({
  taxResult,
  txsLength,
  tab,
  setTab,
  onNavigate,
}: SidebarProps) {
  const pathname = usePathname();
  const language = useLanguageStore((state) => state.language);
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  const { user } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";
  const currentPath = pathname || "/dashboard";
  const userName = user?.displayName || (language === "de" ? "Mein Budget" : "My budget");
  const netMonthly = Number(taxResult?.netMonthly || 0);
  const t = translations[language];
  const isDashboardView = currentPath === "/" || currentPath === "/dashboard";

  const navigateToTab = (event: MouseEvent<HTMLAnchorElement>, nextTab: string) => {
    onNavigate?.();
    if (!isDashboardView || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    setTab(nextTab);
    const nextUrl = nextTab === "dashboard" ? "/dashboard" : `/dashboard?tab=${nextTab}`;
    window.history.pushState(null, "", nextUrl);
  };

  return (
    <aside className="sb-sidebar">
      <div className="sb-rail-brand">
        <BrandMark />
        <div className="sb-rail-brand-copy">
          <div className="sb-brand-name">SmartBudget</div>
          <div className="sb-brand-kicker">Personal finance</div>
        </div>
      </div>

      <Link href="/dashboard?tab=profile" onClick={(event) => navigateToTab(event, "profile")} className="sb-profile">
        <div className="sb-avatar">
          {user?.photoURL ? <img src={user.photoURL} alt="" /> : userName.charAt(0).toUpperCase()}
        </div>
        <div className="sb-profile-copy">
          <div className="sb-profile-name">{userName}</div>
          <div className="sb-profile-meta">
            {netMonthly > 0
              ? `${t.sidebar.netSalary} ${fmt(netMonthly)}`
              : `${txsLength} ${language === "de" ? "Buchungen" : "entries"}`}
          </div>
        </div>
        <Settings className="size-3.5 opacity-40" />
      </Link>

      <nav className="sb-sidebar-nav" aria-label="Main navigation">
        <div className="sb-nav-label">{language === "de" ? "Hauptnavigation" : "Main navigation"}</div>
        <div className="sb-rail-grid">
          {PRIMARY_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === "dashboard"
              ? isDashboardView && (!tab || tab === "dashboard")
              : currentPath === `/${item.id}` || (isDashboardView && tab === item.id);
            const href = item.id === "dashboard" ? "/dashboard" : `/dashboard?tab=${item.id}`;

            return (
              <Link
                key={item.id}
                href={href}
                onClick={(event) => navigateToTab(event, item.id)}
                className={`sb-rail-tile${isActive ? " is-active" : ""}`}
                aria-current={isActive ? "page" : undefined}
              >
                <span className="sb-rail-icon"><Icon /></span>
                <span className="sb-rail-label">{item[language]}</span>
              </Link>
            );
          })}
        </div>

        <div className="sb-nav-label sb-rail-label-spaced">{language === "de" ? "Mehr" : "More"}</div>
        <div className="sb-rail-list">
          {SECONDARY_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === `/${item.id}` || (isDashboardView && tab === item.id);
            const href = item.id === "dashboard" ? "/dashboard" : `/dashboard?tab=${item.id}`;

            return (
              <Link
                key={item.id}
                href={href}
                onClick={(event) => navigateToTab(event, item.id)}
                className={`sb-rail-row${isActive ? " is-active" : ""}`}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon />
                <span>{item[language]}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="sb-sidebar-footer">
        <div className="sb-assistant-card">
          <div className="sb-assistant-head">
            <div className="sb-assistant-icon"><Bot className="size-4" /></div>
            <div className="sb-profile-copy">
              <div className="sb-profile-name">Smart assistant</div>
              <div className="sb-profile-meta">{language === "de" ? "Bereit für deine Ziele" : "Ready for your goals"}</div>
            </div>
            <span className="sb-status-dot" />
          </div>
          <div className="sb-sidebar-tools">
            <button
              className="sb-tool-button is-selected"
              onClick={() => setLanguage(language === "de" ? "en" : "de")}
              aria-label={language === "de" ? "Switch to English" : "Auf Deutsch wechseln"}
            >
              {language.toUpperCase()}
            </button>
            <button className="sb-tool-button" onClick={() => setTheme(isDark ? "light" : "dark")}>
              {isDark ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
              {isDark ? "Light" : "Dark"}
            </button>
          </div>
        </div>

        <details className="sb-legal">
          <summary>
            {language === "de" ? "Rechtliches" : "Legal"}
            <ChevronRight className="size-3" />
          </summary>
          <div className="sb-legal-links">
            {LEGAL_LINKS.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} onClick={onNavigate} className="flex items-center gap-2">
                  <Icon className="size-3" />
                  {item[language]}
                </Link>
              );
            })}
          </div>
        </details>
      </div>
    </aside>
  );
}
