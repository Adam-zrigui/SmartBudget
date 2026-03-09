"use client";
import dynamic from "next/dynamic";
import { useState, useMemo, useEffect, useId } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useTheme } from 'next-themes';
import { useLanguageStore } from '@/lib/store';
import { translations } from '@/lib/translations';
import { Transaction } from '@/lib/store';
import { usePrefetch } from '@/hooks/use-prefetch';
import { authedFetch } from '@/lib/client-auth';
import {
  calcGermanTax,
  DE_TAX_CLASSES,
  DE_STATES,
  CATEGORIES,
  MONTHS_DE,
  SEED,
  getCat,
  fmt,
  IC,
  TAG,
} from "@/lib/utils";

import Sidebar from "./Sidebar";
import MobileDrawer from "./MobileDrawer";
import Header from "./Header";
import Transactions from "./Transactions";
import Analytics from "./Analytics";
import Tax from "./Tax";
import SalaryPlanner from "./SalaryPlanner";
import Advisor from "./Advisor";
import Profile from "./Profile";
import BudgetManager from "./BudgetManager";
import SavingsGoals from "./SavingsGoals";
import RecurringManager from "./RecurringManager";
import InvestmentTracker from "./InvestmentTracker";
import CurrencyConverter from "./CurrencyConverter";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import FormModal from "./FormModal";
import DeleteModal from "./DeleteModal";
import Toast from "./Toast";

const Dashboard = dynamic(() => import("./Dashboard"), {
  ssr: false,
  loading: () => <div className="h-80 bg-base-200/40 rounded-2xl animate-pulse" />,
});

export default function BudgetTracker({ initialTab = "dashboard" }: { initialTab?: string }) {
  // Prefetch all API data in the background for faster page switches
  usePrefetch();
  
  // theme is managed by next-themes; resolvedTheme gives the actual value (light or dark)
  const { theme, setTheme, resolvedTheme } = useTheme();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === 'dark';
  
  // Read tab from URL params, fallback to initialTab
  const urlTab = searchParams.get('tab');
  const [tab, setTab] = useState(urlTab || initialTab);
  // stable id for popover content to prevent hydration mismatches
  const popoverId = useId();

  // transactions are fetched from API
  const [txs, setTxs] = useState<any[]>([]);
  const [recurringTransactions, setRecurringTransactions] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<any[]>([]);
  const [investments, setInvestments] = useState<any[]>([]);
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [baseCurrency, setBaseCurrencyCode] = useState<string>("EUR");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [delId, setDelId] = useState<string | null>(null);
  const [fMonth, setFMonth] = useState("all");
  const [fType, setFType] = useState("all");
  const [q, setQ] = useState("");

  // load transactions once
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await authedFetch('/api/transactions');
      if (res.ok) {
        const data = await res.json();
        if (!cancelled) setTxs(data);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // load recurring transactions
  useEffect(() => {
    let cancelled = false;
    async function loadRecurring() {
      const res = await authedFetch('/api/recurring-transactions');
      if (res.ok) {
        const data = await res.json();
        if (!cancelled) setRecurringTransactions(data);
      }
    }
    loadRecurring();
    return () => { cancelled = true; };
  }, []);

  // load budgets
  useEffect(() => {
    let cancelled = false;
    async function loadBudgets() {
      const res = await authedFetch('/api/budgets');
      if (res.ok) {
        const data = await res.json();
        if (!cancelled) setBudgets(data);
      }
    }
    loadBudgets();
    return () => { cancelled = true; };
  }, []);

  // load savings goals
  useEffect(() => {
    let cancelled = false;
    async function loadSavingsGoals() {
      const res = await authedFetch('/api/savings-goals');
      if (res.ok) {
        const data = await res.json();
        if (!cancelled) setSavingsGoals(data);
      }
    }
    loadSavingsGoals();
    return () => { cancelled = true; };
  }, []);

  // load investments
  useEffect(() => {
    let cancelled = false;
    async function loadInvestments() {
      const res = await authedFetch('/api/investments');
      if (res.ok) {
        const data = await res.json();
        if (!cancelled) setInvestments(data);
      }
    }
    loadInvestments();
    return () => { cancelled = true; };
  }, []);

  // load currencies
  useEffect(() => {
    let cancelled = false;
    async function loadCurrencies() {
      const res = await authedFetch('/api/currencies');
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        const detectedBase = list.find((c: any) => c?.isBase)?.code || "EUR";
        if (!cancelled) {
          setCurrencies(list);
          setBaseCurrencyCode(detectedBase);
        }
      }
    }
    loadCurrencies();
    return () => { cancelled = true; };
  }, []);

  // Listen for cross-component transaction creation events (e.g., SalaryPlanner)
  useEffect(() => {
    function onCreated(e: any) {
      const created = e?.detail;
      if (created && created.id) {
        setTxs((prev) => [...prev, created]);
      }
    }
    window.addEventListener('transactions:created', onCreated as EventListener);
    return () => window.removeEventListener('transactions:created', onCreated as EventListener);
  }, []);
  const [form, setForm] = useState<any>({
    type: "expense",
    amount: "",
    category: "Lebensmittel",
    description: "",
    date: new Date().toISOString().slice(0, 10),
    tag: "",
  });
  const [toast, setToast] = useState<any>(null);
  const [tax, setTax] = useState({
    grossMonthly: 0,
    taxClass: 1,
    state: "NW",
    kirchenmitglied: false,
    hasKinder: false,
  });

  // popover open state and unread badge
  const [chatOpen, setChatOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  // listen for assistant messages to show unread when popover closed
  useEffect(() => {
    function onAiMessage(e: any) {
      if (!chatOpen) setUnread((u) => u + 1);
    }
    window.addEventListener('ai:message', onAiMessage as EventListener);
    return () => window.removeEventListener('ai:message', onAiMessage as EventListener);
  }, [chatOpen]);

  // reset unread when opened
  useEffect(() => {
    if (chatOpen) setUnread(0);
  }, [chatOpen]);

  const defaultTaxResult = {
    gross: 0,
    lohnsteuer: 0,
    solidarity: 0,
    church: 0,
    rentenversicherung: 0,
    krankenversicherung: 0,
    pflegeversicherung: 0,
    arbeitslosenversicherung: 0,
    sozialabgaben: 0,
    totalDeductions: 0,
    netMonthly: 0,
    effectiveRate: 0,
  };

  const [taxResult, setTaxResult] = useState<any>(defaultTaxResult);

  useEffect(() => {
    let cancelled = false;
    calcGermanTax(tax)
      .then((r) => { if (!cancelled) setTaxResult(r); })
      .catch((err) => console.error("tax API error", err));
    return () => { cancelled = true; };
  }, [tax]);

  // listen for AI-driven salary adjustments
  useEffect(() => {
    function onAiSet(e: any) {
      const val = e.detail;
      setTax((s: any) => ({ ...s, grossMonthly: val }));
      notify(`Gehalt geändert auf ${val} €`, "ok");
      setTab("tax"); // show tax page so user sees result
    }
    window.addEventListener('ai:setSalary', onAiSet as EventListener);
    return () => window.removeEventListener('ai:setSalary', onAiSet as EventListener);
  }, []);

  // listen for AI plan suggestions
  useEffect(() => {
    function onAiPlan(e: any) {
      const steps: string[] = e.detail;
      if (steps && steps.length) {
        notify("AI Savings Plan received. Check the chat for details.", "ok");
        // optionally log plan to console or store in state for rendering
        console.log("AI plan steps:", steps);
      }
    }
    window.addEventListener('ai:plan', onAiPlan as EventListener);
    return () => window.removeEventListener('ai:plan', onAiPlan as EventListener);
  }, []);

  // Update tab when URL changes
  useEffect(() => {
    const urlTab = searchParams.get('tab');
    if (urlTab && urlTab !== tab) {
      setTab(urlTab);
    }
  }, [searchParams, tab]);

  const filtered = useMemo(
    () =>
      txs
        .filter((t) => {
          const mOk = fMonth === "all" || new Date(t.date).getMonth() === parseInt(fMonth);
          const tOk = fType === "all" || t.type === fType;
          const sOk =
            !q ||
            t.description.toLowerCase().includes(q.toLowerCase()) ||
            t.category.toLowerCase().includes(q.toLowerCase());
          return mOk && tOk && sOk;
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [txs, fMonth, fType, q]
  );

  // Helper to calculate net amount (after taxes)
  const getNetAmount = (transaction: any) => {
    const { amount, vat = 0, churchTax = 0, employmentStatus } = transaction;
    if (!amount) return 0;
    // Students and apprentices are VAT-exempt (mini-job threshold)
    const effectiveVat = (employmentStatus === 'student' || employmentStatus === 'apprentice') ? 0 : vat;
    const vatAmount = amount * (effectiveVat / 100);
    const churchTaxAmount = amount * (churchTax / 100);
    return amount - vatAmount - churchTaxAmount;
  };

  const inc = filtered.filter((t) => t.type === "income").reduce((s, t) => s + getNetAmount(t), 0);
  const exp = filtered.filter((t) => t.type === "expense").reduce((s, t) => s + getNetAmount(t), 0);
  const bal = inc - exp;
  const svRate = inc > 0 ? Math.round((bal / inc) * 100) : 0;

  const byCat = useMemo(() => {
    const m: any = {};
    filtered
      .filter((t) => t.type === "expense")
      .forEach((t) => { m[t.category] = (m[t.category] || 0) + getNetAmount(t); });
    return Object.entries(m)
      .map(([n, v]: any) => {
        const cat = getCat(n) || {};
        const { name: _omitName, ...rest } = cat as any;
        return { name: n, value: v, ...rest };
      })
      .sort((a: any, b: any) => b.value - a.value);
  }, [filtered]);

  const monthly = useMemo(() => {
    const m: any = {};
    txs.forEach((t) => {
      const mo = new Date(t.date).getMonth();
      if (!m[mo]) m[mo] = { month: MONTHS_DE[mo], income: 0, expense: 0, idx: mo };
      m[mo][t.type === "income" ? "income" : "expense"] += getNetAmount(t);
    });
    return Object.values(m).sort((a: any, b: any) => (a as any).idx - (b as any).idx);
  }, [txs]);

  function notify(msg: string, type = "ok") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  }

  // helpers that talk to the transactions API and keep local state in sync
  async function addTx(tx: any) {
    try {
      // don't send an id for new items
      const payload = { ...tx };
      delete payload.id;
      const res = await authedFetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        notify("Fehler beim Erstellen", "err");
        return;
      }
      const created = await res.json();
      setTxs((prev) => [...prev, created]);
      return created;
    } catch (err) {
      console.error("addTx error", err);
      notify("Netzwerkfehler", "err");
    }
  }

  async function updateTx(tx: any) {
    try {
      const res = await authedFetch(`/api/transactions/${tx.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tx),
      });
      if (!res.ok) {
        notify("Fehler beim Aktualisieren", "err");
        return;
      }
      const updated = await res.json();
      setTxs((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      return updated;
    } catch (err) {
      console.error("updateTx error", err);
      notify("Netzwerkfehler", "err");
    }
  }

  async function deleteTx(id: string) {
    try {
      const res = await authedFetch(`/api/transactions/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        notify("Fehler beim Löschen", "err");
        return;
      }
      setTxs((prev) => prev.filter((t) => t.id !== id));
      return true;
    } catch (err) {
      console.error("deleteTx error", err);
      notify("Netzwerkfehler", "err");
    }
  }

  // helpers for recurring transactions
  async function addRecurringTx(recurring: any) {
    try {
      const payload = { ...recurring };
      delete payload.id;
      const res = await authedFetch("/api/recurring-transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        notify("Fehler beim Erstellen der wiederkehrenden Buchung", "err");
        return;
      }
      const created = await res.json();
      setRecurringTransactions((prev) => [...prev, created]);
      return created;
    } catch (err) {
      console.error("addRecurringTx error", err);
      notify("Netzwerkfehler", "err");
    }
  }

  async function updateRecurringTx(recurring: any) {
    try {
      const res = await authedFetch(`/api/recurring-transactions/${recurring.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(recurring),
      });
      if (!res.ok) {
        notify("Fehler beim Aktualisieren der wiederkehrenden Buchung", "err");
        return;
      }
      const updated = await res.json();
      setRecurringTransactions((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      return updated;
    } catch (err) {
      console.error("updateRecurringTx error", err);
      notify("Netzwerkfehler", "err");
    }
  }

  async function deleteRecurringTx(id: string) {
    try {
      const res = await authedFetch(`/api/recurring-transactions/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        notify("Fehler beim Löschen der wiederkehrenden Buchung", "err");
        return;
      }
      setRecurringTransactions((prev) => prev.filter((t) => t.id !== id));
      return true;
    } catch (err) {
      console.error("deleteRecurringTx error", err);
      notify("Netzwerkfehler", "err");
    }
  }

  async function toggleRecurringActive(id: string, active: boolean) {
    try {
      const res = await authedFetch(`/api/recurring-transactions/${id}/toggle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: active }),
      });
      if (!res.ok) {
        notify("Fehler beim Ändern des Status", "err");
        return;
      }
      const updated = await res.json();
      setRecurringTransactions((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      return updated;
    } catch (err) {
      console.error("toggleRecurringActive error", err);
      notify("Netzwerkfehler", "err");
    }
  }

  // helpers for budgets
  async function addBudget(budget: any) {
    try {
      const payload = { ...budget };
      delete payload.id;
      const res = await authedFetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        notify("Fehler beim Erstellen des Budgets", "err");
        return;
      }
      const created = await res.json();
      setBudgets((prev) => [...prev, created]);
      return created;
    } catch (err) {
      console.error("addBudget error", err);
      notify("Netzwerkfehler", "err");
    }
  }

  async function updateBudget(budget: any) {
    try {
      const res = await authedFetch(`/api/budgets/${budget.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(budget),
      });
      if (!res.ok) {
        notify("Fehler beim Aktualisieren des Budgets", "err");
        return;
      }
      const updated = await res.json();
      setBudgets((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
      return updated;
    } catch (err) {
      console.error("updateBudget error", err);
      notify("Netzwerkfehler", "err");
    }
  }

  async function deleteBudget(id: string) {
    try {
      const res = await authedFetch(`/api/budgets/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        notify("Fehler beim Löschen des Budgets", "err");
        return;
      }
      setBudgets((prev) => prev.filter((b) => b.id !== id));
      return true;
    } catch (err) {
      console.error("deleteBudget error", err);
      notify("Netzwerkfehler", "err");
    }
  }

  // helpers for savings goals
  async function addSavingsGoal(goal: any) {
    try {
      const payload = { ...goal };
      delete payload.id;
      const res = await authedFetch("/api/savings-goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        notify("Fehler beim Erstellen des Sparziels", "err");
        return;
      }
      const created = await res.json();
      setSavingsGoals((prev) => [...prev, created]);
      return created;
    } catch (err) {
      console.error("addSavingsGoal error", err);
      notify("Netzwerkfehler", "err");
    }
  }

  async function updateSavingsGoal(goal: any) {
    try {
      const res = await authedFetch(`/api/savings-goals/${goal.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(goal),
      });
      if (!res.ok) {
        notify("Fehler beim Aktualisieren des Sparziels", "err");
        return;
      }
      const updated = await res.json();
      setSavingsGoals((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
      return updated;
    } catch (err) {
      console.error("updateSavingsGoal error", err);
      notify("Netzwerkfehler", "err");
    }
  }

  async function deleteSavingsGoal(id: string) {
    try {
      const res = await authedFetch(`/api/savings-goals/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        notify("Fehler beim Löschen des Sparziels", "err");
        return;
      }
      setSavingsGoals((prev) => prev.filter((g) => g.id !== id));
      return true;
    } catch (err) {
      console.error("deleteSavingsGoal error", err);
      notify("Netzwerkfehler", "err");
    }
  }

  async function addGoalContribution(contribution: any) {
    try {
      const res = await authedFetch("/api/goal-contributions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contribution),
      });
      if (!res.ok) {
        notify("Fehler beim Hinzufügen der Einzahlung", "err");
        return;
      }
      const created = await res.json();
      // Update the goal's current amount
      setSavingsGoals((prev) => prev.map((g) => 
        g.id === contribution.goalId 
          ? { ...g, currentAmount: g.currentAmount + contribution.amount }
          : g
      ));
      return created;
    } catch (err) {
      console.error("addGoalContribution error", err);
      notify("Netzwerkfehler", "err");
    }
  }

  // helpers for investments
  async function addInvestment(investment: any) {
    try {
      const payload = { ...investment };
      delete payload.id;
      const res = await authedFetch("/api/investments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        notify("Fehler beim Erstellen der Investition", "err");
        return;
      }
      const created = await res.json();
      setInvestments((prev) => [...prev, created]);
      return created;
    } catch (err) {
      console.error("addInvestment error", err);
      notify("Netzwerkfehler", "err");
    }
  }

  async function updateInvestment(investment: any) {
    try {
      const res = await authedFetch(`/api/investments/${investment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(investment),
      });
      if (!res.ok) {
        notify("Fehler beim Aktualisieren der Investition", "err");
        return;
      }
      const updated = await res.json();
      setInvestments((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      return updated;
    } catch (err) {
      console.error("updateInvestment error", err);
      notify("Netzwerkfehler", "err");
    }
  }

  async function deleteInvestment(id: string) {
    try {
      const res = await authedFetch(`/api/investments/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        notify("Fehler beim Löschen der Investition", "err");
        return;
      }
      setInvestments((prev) => prev.filter((i) => i.id !== id));
      return true;
    } catch (err) {
      console.error("deleteInvestment error", err);
      notify("Netzwerkfehler", "err");
    }
  }

  async function updateInvestmentPrices(investments: any[]) {
    try {
      const res = await authedFetch("/api/investments/update-prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ investments }),
      });
      if (!res.ok) {
        notify("Fehler beim Aktualisieren der Preise", "err");
        return;
      }
      const updated = await res.json();
      setInvestments((prev) => prev.map((i) => {
        const updatedInvestment = updated.find((u: any) => u.id === i.id);
        return updatedInvestment || i;
      }));
      notify("Preise aktualisiert");
    } catch (err) {
      console.error("updateInvestmentPrices error", err);
      notify("Netzwerkfehler", "err");
    }
  }

  // helpers for currencies
  async function updateExchangeRates() {
    try {
      const res = await authedFetch("/api/currencies/update-rates", {
        method: "POST",
      });
      if (!res.ok) {
        notify("Fehler beim Aktualisieren der Wechselkurse", "err");
        return;
      }
      const updated = await res.json();
      setCurrencies(updated);
      const detectedBase = Array.isArray(updated) ? updated.find((c: any) => c?.isBase)?.code : null;
      if (detectedBase) setBaseCurrencyCode(detectedBase);
      notify("Wechselkurse aktualisiert");
    } catch (err) {
      console.error("updateExchangeRates error", err);
      notify("Netzwerkfehler", "err");
    }
  }

  async function setBaseCurrency(currencyCode: string) {
    try {
      const res = await authedFetch("/api/currencies/set-base", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseCurrency: currencyCode }),
      });
      if (!res.ok) {
        notify("Fehler beim Ändern der Basiswährung", "err");
        return;
      }
      const updated = await res.json();
      setCurrencies(updated);
      setBaseCurrencyCode(currencyCode);
      notify("Basiswährung geändert");
    } catch (err) {
      console.error("setBaseCurrency error", err);
      notify("Netzwerkfehler", "err");
    }
  }

  async function addCurrency(currency: { code: string; name?: string; exchangeRate?: number }) {
    try {
      const res = await authedFetch("/api/currencies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currency),
      });
      if (!res.ok) {
        notify("Fehler beim Hinzufügen der Währung", "err");
        return;
      }
      const created = await res.json();
      setCurrencies((prev) => {
        const withoutExisting = prev.filter((c) => c.code !== created.code);
        return [...withoutExisting, created].sort((a, b) => a.code.localeCompare(b.code));
      });
    } catch (err) {
      console.error("addCurrency error", err);
      notify("Netzwerkfehler", "err");
    }
  }

  async function removeCurrency(code: string) {
    try {
      const res = await authedFetch("/api/currencies", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (!res.ok) {
        notify("Fehler beim Entfernen der Währung", "err");
        return;
      }
      setCurrencies((prev) => prev.filter((c) => c.code !== code));
    } catch (err) {
      console.error("removeCurrency error", err);
      notify("Netzwerkfehler", "err");
    }
  }


  function openEdit(t: any) {
    setEditId(t.id);
    setForm({ type: t.type, amount: t.amount, category: t.category, description: t.description, date: t.date, tag: t.tag || "" });
    setShowForm(true);
  }

  async function save() {
    if (!form.amount || !form.description) {
      notify("Bitte alle Felder ausfüllen", "err");
      return;
    }
    // prepare transaction object; id will only be sent for updates
    const base = { ...form, amount: parseFloat(form.amount) } as any;
    if (editId) {
      base.id = editId;
      const res = await updateTx(base);
      if (res) notify("Buchung aktualisiert");
    } else {
      const res = await addTx(base);
      if (res) notify("Buchung hinzugefügt");
    }
    setShowForm(false);
  }

  async function del(id: string) {
    const res = await deleteTx(id);
    setDelId(null);
    if (res) notify("Buchung gelöscht", "err");
  }

  const cur = "EUR";
  const language = useLanguageStore((s) => s.language);
  const tr = translations[language];
  const pathname = usePathname();
  const noSidebarRoutes = ['/auth', '/login', '/legal', '/new'];
  const showSidebar = pathname && !noSidebarRoutes.some((p) => pathname.startsWith(p));
  const [drawerOpen, setDrawerOpen] = useState(false);

  function exportCSV() {
    const headers = ["Datum", "Typ", "Kategorie", "Beschreibung", "Betrag", "Währung", "Status", "Tag"];
    const rows = [
      headers,
      ...filtered.map((t) => [
        t.date,
        t.type,
        t.category,
        t.description,
        t.amount,
        cur,
        // translate status if possible
        (tr.form?.employmentStatus as any)?.[t.employmentStatus] || t.employmentStatus || '',
        t.tag || "",
      ]),
    ];
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([rows.map((r) => r.join(";")).join("\n")], { type: "text/csv" })),
      download: "haushaltsbuch.csv",
    });
    a.click();
  }

  const shared = {
    tab, setTab,
    fMonth, setFMonth, fType, setFType, q, setQ,
    form, setForm, editId, setEditId, delId, setDelId,
    filtered, inc, exp, bal, svRate, byCat, monthly,
    txs,
    fmt, taxResult, tax, setTax, notify, openEdit, save, del, exportCSV,
    showForm, setShowForm, IC, toast,
    DE_TAX_CLASSES, DE_STATES, CATEGORIES, MONTHS_DE,
    txsLength: txs.length, savingsGoals, TAG, cur, dark: isDark,
  } as const;

  return (
    <div className={mounted && isDark ? 'dark' : ''} data-theme={mounted ? resolvedTheme : undefined}>
      <div className="flex min-h-screen bg-base-100 text-base-content">
        {showSidebar && (
          <>
            <MobileDrawer
              open={drawerOpen}
              onClose={() => setDrawerOpen(false)}
              taxResult={shared.taxResult}
              txsLength={shared.txsLength}
              tab={shared.tab}
              setTab={(t) => {
                shared.setTab(t);
                setDrawerOpen(false);
              }}
            />
            <div className="hidden lg:flex lg:shrink-0">
              <Sidebar {...shared} />
            </div>
          </>
        )}

        <div className="flex flex-col flex-1 min-w-0">
          <Header {...shared} onHamburger={() => setDrawerOpen(o => !o)} />
          <main className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 md:px-8 lg:p-7 bg-gradient-to-b from-base-100 to-base-100">
            <div className="w-full max-w-6xl mx-auto">
              {tab === "tax" ? (
                <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <Tax {...shared} />
                </div>
              ) : tab === "advisor" ? (
                <div className="h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <Advisor />
                </div>
              ) : tab === "profile" ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <Profile setTab={setTab} />
                </div>
              ) : (
                <>
                  {tab === "dashboard" && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                      <SalaryPlanner txs={txs} fMonth={fMonth} dark={isDark} />
                      <Dashboard {...shared} />
                    </div>
                  )}
                  {tab === "transactions" && <div className="animate-in fade-in slide-in-from-bottom-4 duration-500"><Transactions {...shared} /></div>}
                  {tab === "analytics" && <div className="animate-in fade-in slide-in-from-bottom-4 duration-500"><Analytics {...shared} /></div>}
                  {tab === "budget" && <div className="animate-in fade-in slide-in-from-bottom-4 duration-500"><BudgetManager budgets={budgets} transactions={txs} addBudget={addBudget} updateBudget={updateBudget} deleteBudget={deleteBudget} /></div>}
                  {tab === "goals" && <div className="animate-in fade-in slide-in-from-bottom-4 duration-500"><SavingsGoals goals={savingsGoals} addGoal={addSavingsGoal} updateGoal={updateSavingsGoal} deleteGoal={deleteSavingsGoal} addContribution={addGoalContribution} /></div>}
                  {tab === "recurring" && <div className="animate-in fade-in slide-in-from-bottom-4 duration-500"><RecurringManager recurringTransactions={recurringTransactions} onCreateRecurring={addRecurringTx} onUpdateRecurring={updateRecurringTx} onDeleteRecurring={deleteRecurringTx} onToggleActive={toggleRecurringActive} /></div>}
                  {tab === "investments" && <div className="animate-in fade-in slide-in-from-bottom-4 duration-500"><InvestmentTracker investments={investments} addInvestment={addInvestment} updateInvestment={updateInvestment} deleteInvestment={deleteInvestment} updatePrices={updateInvestmentPrices} /></div>}
                  {tab === "currency" && <div className="animate-in fade-in slide-in-from-bottom-4 duration-500"><CurrencyConverter currencies={currencies} baseCurrency={baseCurrency} updateRates={updateExchangeRates} setBaseCurrency={setBaseCurrency} addCurrency={addCurrency} removeCurrency={removeCurrency} /></div>}
                </>
              )}
            </div>
          </main>

          {/* floating chat popover using UI popover */}
          <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50">
            <Popover open={chatOpen} onOpenChange={(v) => setChatOpen(v)}>
              <PopoverTrigger asChild>
                <button
                  suppressHydrationWarning
                  className="relative bg-primary dark:bg-secondary text-primary-content dark:text-secondary-content rounded-full p-3 sm:p-4 shadow-lg hover:shadow-xl transition-shadow active:scale-95 sm:active:scale-100"
                  title="Chat with AI advisor"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h-1V6a5 5 0 00-10 0v2H5a2 2 0 00-2 2v6a2 2 0 002 2h3v3l4-3h4a2 2 0 002-2v-6a2 2 0 00-2-2z" />
                  </svg>
                  {unread > 0 && (
                    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center rounded-full bg-red-600 text-white text-xs px-1.5 h-5 min-w-[20px]">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent id={popoverId} className="w-80 p-0">
                <Advisor compact onClose={() => setChatOpen(false)} focus={chatOpen} />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {showForm && (
        <FormModal
          showForm={showForm}
          form={form}
          setForm={setForm}
          cur={cur}
          save={save}
          setShowForm={setShowForm}
          editId={editId}
          CATEGORIES={CATEGORIES}
          IC={IC as { x: string; ok: string }}
        />
      )}
      {delId && <DeleteModal delId={delId} setDelId={setDelId} del={del} />}
      {toast && <Toast toast={toast} />}
    </div>
  );
}

