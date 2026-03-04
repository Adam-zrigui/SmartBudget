"use client";
import { useState, useMemo, useEffect, useId } from "react";
import { useTheme } from 'next-themes';
import { useLanguageStore } from '@/lib/store';
import { translations } from '@/lib/translations';
import { Transaction } from '@/lib/store';
import { usePrefetch } from '@/hooks/use-prefetch';
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
import Header from "./Header";
import Dashboard from "./Dashboard";
import Transactions from "./Transactions";
import Analytics from "./Analytics";
import Tax from "./Tax";
import SalaryPlanner from "./SalaryPlanner";
import Advisor from "./Advisor";
import Profile from "./Profile";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import FormModal from "./FormModal";
import DeleteModal from "./DeleteModal";
import Toast from "./Toast";

export default function BudgetTracker({ initialTab = "dashboard" }: { initialTab?: string }) {
  // Prefetch all API data in the background for faster page switches
  usePrefetch();
  
  // theme is managed by next-themes; resolvedTheme gives the actual value (light or dark)
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === 'dark';
  const [tab, setTab] = useState(initialTab);
  // stable id for popover content to prevent hydration mismatches
  const popoverId = useId();

  // transactions are fetched from API
  const [txs, setTxs] = useState<any[]>([]);
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
      const res = await fetch('/api/transactions');
      if (res.ok) {
        const data = await res.json();
        if (!cancelled) setTxs(data);
      }
    }
    load();
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
      const res = await fetch("/api/transactions", {
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
      const res = await fetch(`/api/transactions/${tx.id}`, {
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
      const res = await fetch(`/api/transactions/${id}`, {
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
    fmt, taxResult, tax, setTax, notify, openEdit, save, del, exportCSV,
    showForm, setShowForm, IC, toast,
    DE_TAX_CLASSES, DE_STATES, CATEGORIES, MONTHS_DE,
    txsLength: txs.length, TAG, cur, dark: isDark,
  } as const;

  return (
    <div className={mounted && isDark ? 'dark' : ''} data-theme={mounted ? resolvedTheme : undefined}>
      <div className="flex min-h-screen bg-base-100 text-base-content">
        <div className="hidden lg:flex lg:shrink-0">
          <Sidebar {...shared} />
        </div>

        <div className="drawer lg:hidden">
          <input id="sidebar-toggle" type="checkbox" className="drawer-toggle" />
          <div className="drawer-side z-50">
            <label htmlFor="sidebar-toggle" className="drawer-overlay lg:hidden" />
            <Sidebar {...shared} />
          </div>
        </div>

        <div className="flex flex-col flex-1 min-w-0">
          <Header {...shared} />
          <main className="flex-1 overflow-y-auto p-5 lg:p-7 bg-gradient-to-b from-base-100 to-base-100">
            <div className="max-w-5xl mx-auto">
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
                </>
              )}
            </div>
          </main>

          {/* floating chat popover using UI popover */}
          <div className="fixed bottom-6 right-6 z-50">
            <Popover open={chatOpen} onOpenChange={(v) => setChatOpen(v)}>
              <PopoverTrigger asChild>
                <button
                  suppressHydrationWarning
                  className="relative bg-primary dark:bg-secondary text-primary-content dark:text-secondary-content rounded-full p-4 shadow-lg hover:shadow-xl transition-shadow"
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
