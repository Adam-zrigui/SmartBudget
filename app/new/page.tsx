'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { CATEGORIES, IC, fmt, DE_TAX_CLASSES } from '@/lib/utils'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import MobileDrawer from '@/components/MobileDrawer'
import { useLanguageStore } from '@/lib/store'
import { useTranslations } from '@/lib/translations'

type BundeslandTax = {
  name: string;
  abbr?: string;
  vat_standard?: number;
  vat_reduced?: number;
  church_tax_rate?: number;
  municipal_tax_range?: { min: number; max: number };
  notes?: string;
};

export default function NewEntryPage () {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === 'dark';

  const toastState = useToast();
  const router = useRouter();

  const [form, setForm] = useState<any>({
    type: 'expense',
    amount: 0,
    category: 'Lebensmittel',
    description: '',
    date: new Date().toISOString().slice(0, 10),
    tag: '',
    bundesland: '',
    vat: 19,
    applyChurchTax: false,
    employmentStatus: 'worker', // 'worker' | 'student' | 'apprentice'
    taxClass: 1,
    hasKinder: false,
    salaryAllocation: {
      'Mieten': 0,
      'Essen': 0,
      'Verkehrsmittel': 0,
      'Sonstiges': 0,
    },
  });

  const [bundeslands, setBundeslands] = useState<BundeslandTax[]>([]);
  const [selectedBundeslandData, setSelectedBundeslandData] = useState<BundeslandTax | null>(null);

  const language = useLanguageStore((s) => s.language);
  const t = useTranslations(language);

  const [dbCategories, setDbCategories] = useState<string[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Load Bundesländer
  useEffect(() => {
    let cancelled = false;
    async function loadBundeslands() {
      try {
        const res = await fetch('/api/taxes');
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        if (data.ok && data.data) {
          const items = Array.isArray(data.data) ? data.data : Object.values(data.data);
          setBundeslands(items as BundeslandTax[]);
        }
      } catch (e) {
        // ignore
      }
    }
    loadBundeslands();
    return () => { cancelled = true };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadCats() {
      try {
        const res = await fetch('/api/transactions');
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        const uniq = Array.from(new Set(data.map((d: any) => d.category))).filter(Boolean) as string[];
        setDbCategories(uniq.length ? uniq : null);
      } catch (e) {
        // ignore
      }
    }
    loadCats();
    return () => { cancelled = true };
  }, []);

  const handleBundeslandChange = (name: string) => {
    setForm((f: any) => ({ ...f, bundesland: name }));
    const found = bundeslands.find(b => b.name === name);
    if (found) {
      setSelectedBundeslandData(found);
      setForm((f: any) => ({ ...f, vat: found.vat_standard || 19 }));
    }
  };

  const calculateTaxes = () => {
    if (!form.amount || !selectedBundeslandData) {
      return {
        grossAmount: 0,
        vatAmount: 0,
        churchTaxAmount: 0,
        netAmount: 0,
        totalTaxes: 0,
        effectiveVatRate: 0,
      };
    }

    const gross = parseFloat(form.amount) || 0;
    // Students and apprentices typically exempt from VAT (mini-job threshold)
    const effectiveVatRate = (form.employmentStatus === 'student' || form.employmentStatus === 'apprentice') 
      ? 0 
      : (selectedBundeslandData.vat_standard || 19);
    const churchTaxRate = form.applyChurchTax ? (selectedBundeslandData.church_tax_rate || 0) : 0;

    const vatAmount = gross * (effectiveVatRate / 100);
    const churchTaxAmount = gross * (churchTaxRate / 100);
    const totalTaxes = vatAmount + churchTaxAmount;
    const netAmount = gross - totalTaxes;

    return {
      grossAmount: gross,
      vatAmount: parseFloat(vatAmount.toFixed(2)),
      churchTaxAmount: parseFloat(churchTaxAmount.toFixed(2)),
      netAmount: parseFloat(netAmount.toFixed(2)),
      totalTaxes: parseFloat(totalTaxes.toFixed(2)),
      effectiveVatRate,
    };
  };

  const taxBreakdown = calculateTaxes();
  async function save() {
    toastState.toast({ title: language === 'de' ? 'Button gedrückt' : 'Button clicked', variant: 'default' }); // DEBUG: simple toast to confirm click
    console.log('[SAVE] Button clicked');
    console.log('[SAVE] Form state:', form);
    console.log('[SAVE] Selected bundesland:', selectedBundeslandData);
    
    if (!form.amount || !form.description) {
      console.log('[SAVE] Validation failed - amount:', form.amount, 'description:', form.description);
      toastState.toast({ title: language === 'de' ? 'Bitte alle Felder ausfüllen' : 'Please fill in all fields', variant: 'destructive' });
      return;
    }
    
    setIsLoading(true);
    console.log('[SAVE] Starting submission, isLoading set to true');
    
    const submitData = { ...form };
    if (selectedBundeslandData) {
      if (form.applyChurchTax) {
        submitData.churchTax = selectedBundeslandData.church_tax_rate;
      }
      submitData.municipalTaxRange = selectedBundeslandData.municipal_tax_range;
      submitData.vat = (form.employmentStatus === 'student' || form.employmentStatus === 'apprentice') 
        ? 0 
        : (selectedBundeslandData.vat_standard || 19);
    }
    
    console.log('[SAVE] Submit data prepared:', submitData);
    
    try {
      console.log('[SAVE] Sending POST request to /api/transactions');
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(submitData),
      });
      console.log('[SAVE] Response received, status:', res.status);
      
      if (!res.ok) {
        const errText = await res.text();
        console.error('[SAVE] Error response:', res.status, errText);
        
        if (res.status === 401) {
          console.log('[SAVE] Got 401, redirecting to signin');
          toastState.toast({ title: language === 'de' ? 'Bitte anmelden' : 'Please log in', variant: 'destructive' });
          setIsLoading(false);
          setTimeout(() => router.push('/auth/signin'), 1500);
          return;
        }
        
        toastState.toast({ title: `${language === 'de' ? 'Fehler' : 'Error'}: ${res.status}`, description: errText, variant: 'destructive' });
        setIsLoading(false);
        return;
      }
      
      const created = await res.json();
      console.log('[SAVE] Success, created:', created);
      toastState.toast({ title: language === 'de' ? 'Buchung hinzugefügt' : 'Transaction created' });
      setTimeout(() => router.push('/'), 500);
    } catch (err) {
      console.error('[SAVE] Exception:', err);
      toastState.toast({ title: language === 'de' ? 'Fehler beim Speichern' : 'Error saving', description: String(err), variant: 'destructive' });
      setIsLoading(false);
    }
  }

  function cancel() {
    router.back();
  }

  const builtCats = CATEGORIES.filter((ct) => ct.type === form.type);
  const categories = dbCategories
    ? dbCategories.map((name) => {
        const m = CATEGORIES.find((c) => c.name === name);
        return { name, icon: m?.icon ?? '' };
      })
    : builtCats;

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

  // shared props for header/sidebar (only necessary ones)

  const shared = {
    taxResult: defaultTaxResult,
    txsLength: 0,
    tab: 'new',
    setTab: () => {},
  } as any;

  return (
    <div className={mounted && isDark ? 'dark' : ''} data-theme={mounted ? resolvedTheme : undefined}>
      <div className="flex min-h-screen bg-base-100 text-base-content">
        <MobileDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          taxResult={defaultTaxResult}
          txsLength={0}
          tab="new"
          setTab={() => {}}
        />
        <div className="hidden lg:flex lg:shrink-0">
          <Sidebar {...shared} />
        </div>

        <div className="flex flex-col flex-1 min-w-0">
          <Header {...shared} onHamburger={() => setDrawerOpen(o => !o)} />
          <main className="flex-1 overflow-y-auto p-5 lg:p-7">
            <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* form card */}
              <div className="bg-base-100 rounded-3xl shadow-lg border border-base-200/50 p-0 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
                {/* Header */}
                <div className="px-6 lg:px-8 py-6 lg:py-8 border-b border-base-200/30 flex items-start justify-between">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight">{t.header.newEntry}</h1>
                    <p className="text-sm opacity-50 mt-1">{t.form.description}</p>
                  </div>

                  {/* Steuerklasse (only for salary entries) */}
                  {form.category === 'Gehalt' && (
                    <div className="mt-4 bg-base-100/0 p-0">
                      <label className="text-xs font-bold uppercase tracking-wider opacity-60 block mb-3">{language === 'de' ? 'Steuerklasse' : 'Tax Class'}</label>
                      <div className="grid grid-cols-3 gap-3 mb-3">
                        {DE_TAX_CLASSES.map((c: any) => (
                          <button
                            key={c.id}
                            onClick={() => setForm((f: any) => ({ ...f, taxClass: c.id }))}
                            className={`p-3 rounded-xl transition-all duration-200 font-medium text-center border-2 hover:scale-105 active:scale-95 transform text-sm ${
                              form.taxClass === c.id
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-base-300 hover:border-base-400 opacity-60 hover:opacity-100'
                            }`}
                          >
                            {c.label}
                          </button>
                        ))}
                      </div>

                      <label className="flex items-center gap-3 cursor-pointer bg-base-200/30 rounded-2xl p-4 border border-base-300/50">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-sm"
                          checked={form.hasKinder}
                          onChange={(e) => setForm((f: any) => ({ ...f, hasKinder: e.target.checked }))}
                        />
                        <span className="text-sm font-medium">{language === 'de' ? 'Kinderfreibetrag (Kinder vorhanden)' : 'Has children (child allowance)'}</span>
                      </label>

                      {/* Salary Split */}
                      <div className="mt-6 pt-6 border-t border-base-300/50">
                        <label className="text-xs font-bold uppercase tracking-wider opacity-60 block mb-4">{language === 'de' ? 'Gehalt aufteilen nach Kategorien' : 'Split salary by categories'}</label>
                        <div className="space-y-3">
                          {['Mieten', 'Essen', 'Verkehrsmittel', 'Sonstiges'].map((cat) => (
                            <div key={cat} className="flex items-center gap-3">
                              <label className="flex-1 text-sm font-medium opacity-70 w-32">{cat}</label>
                              <div className="flex-1 relative flex items-center">
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  className="input input-bordered input-sm w-full"
                                  placeholder="0.00"
                                  value={form.salaryAllocation[cat] || ''}
                                  onChange={(e) => setForm((f: any) => ({
                                    ...f,
                                    salaryAllocation: {
                                      ...f.salaryAllocation,
                                      [cat]: parseFloat(e.target.value) || 0,
                                    },
                                  }))}
                                />
                                <span className="absolute right-3 text-xs opacity-50">EUR</span>
                              </div>
                            </div>
                          ))}
                          <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/10">
                            <div className="flex justify-between text-sm font-bold">
                              <span>{language === 'de' ? 'Gesamt aufgeteilt:' : 'Total allocated:'}</span>
                              <span className="text-primary">
                                {fmt(
                                  Object.values(form.salaryAllocation).reduce((a: number, b: any) => a + (b as number), 0),
                                  'EUR'
                                )}
                              </span>
                            </div>
                            {form.amount > 0 && Object.values(form.salaryAllocation).reduce((a: number, b: any) => a + (b as number), 0) > 0 && (
                              <div className="text-xs opacity-60 mt-2">
                                {form.amount > Object.values(form.salaryAllocation).reduce((a: number, b: any) => a + (b as number), 0)
                                  ? `${language === 'de' ? 'Überschuss:' : 'Remaining:'} ${fmt(form.amount - Object.values(form.salaryAllocation).reduce((a: number, b: any) => a + (b as number), 0))}`
                                  : `${language === 'de' ? 'Überallokation:' : 'Over-allocated:'} ${fmt(Object.values(form.salaryAllocation).reduce((a: number, b: any) => a + (b as number), 0) - form.amount)}`}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <button
                    className="btn btn-ghost btn-circle -mr-2 -mt-2 hover:bg-base-200"
                    onClick={cancel}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="px-6 lg:px-8 py-8 space-y-8">
                  {/* Type Selection */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider opacity-60 block mb-3">{t.form.type} <span className="text-red-500">*</span></label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { key: 'expense', label: t.form.expense, color: 'error' },
                        { key: 'income', label: t.form.income, color: 'success' },
                      ].map((opt) => (
                        <button
                          key={opt.key}
                          onClick={() =>
                            setForm((f: any) => ({
                              ...f,
                              type: opt.key as any,
                              category: opt.key === 'income' ? 'Gehalt' : 'Lebensmittel',
                            }))
                          }
                          className={`p-4 rounded-2xl transition-all duration-200 font-semibold text-center border-2 hover:scale-105 active:scale-95 transform ${
                            form.type === opt.key
                              ? `border-${opt.color} bg-${opt.color}/10 text-${opt.color}`
                              : 'border-base-300 hover:border-base-400 opacity-60 hover:opacity-100'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Amount Section */}
                  <div className="bg-base-200/30 rounded-2xl p-6 lg:p-8">
                    <label className="text-xs font-bold uppercase tracking-wider opacity-60 block mb-4">{t.form.amount} <span className="text-red-500">*</span></label>
                    <div className="flex items-baseline gap-3">
                      <div className="flex-1 relative">
                        <input
                          className="input input-lg input-bordered w-full text-4xl lg:text-5xl font-bold tabular-nums focus:outline-offset-0 focus:ring-2 focus:ring-primary/50 transition-all duration-200"
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder={language === 'de' ? '0,00' : '0.00'}
                          value={form.amount || ''}
                          onChange={(e) => setForm((f: any) => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
                          autoFocus
                        />
                      </div>
                      <span className="text-3xl lg:text-4xl font-bold opacity-40">EUR</span>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider opacity-60 block mb-3">{t.form.description} <span className="text-red-500">*</span></label>
                    <input
                      className="input input-bordered input-lg w-full text-base focus:ring-2 focus:ring-primary/50 transition-all duration-200"
                      type="text"
                      placeholder={t.form.enterDescription}
                      value={form.description}
                      onChange={(e) => setForm((f: any) => ({ ...f, description: e.target.value }))}
                    />
                  </div>

                  {/* Employment Status Selector */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider opacity-60 block mb-3">
                      {(t.form as any)?.employmentStatus?.label || (language === 'de' ? 'Beschäftigungsstatus' : 'Employment Status')}
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {['worker', 'student', 'apprentice'].map((key) => {
                        const label = (t.form as any)?.employmentStatus?.[key] || key;
                        return (
                          <button
                            key={key}
                            onClick={() => setForm((f: any) => ({ ...f, employmentStatus: key }))}
                            className={`p-3 rounded-xl transition-all duration-200 font-medium text-center border-2 hover:scale-105 active:scale-95 transform text-sm ${
                              form.employmentStatus === key
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-base-300 hover:border-base-400 opacity-60 hover:opacity-100'
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Bundesland Selector */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider opacity-60 block mb-3">{language === 'de' ? 'Bundesland' : 'State'}</label>
                    <select
                      className="select select-bordered select-lg w-full text-base focus:ring-2 focus:ring-primary/50 transition-all duration-200"
                      value={form.bundesland}
                      onChange={(e) => handleBundeslandChange(e.target.value)}
                    >
                      <option value="">{language === 'de' ? 'Wählen Sie einen Staat' : 'Select a state'}</option>
                      {bundeslands.map((b) => (
                        <option key={b.name} value={b.name}>
                          {b.name} ({b.abbr})
                        </option>
                      ))}
                    </select>
                    
                    {/* Tax Info Display */}
                    {selectedBundeslandData && (
                      <div className="mt-4 grid grid-cols-3 gap-3">
                        <div className="bg-primary/10 rounded-xl p-3">
                          <div className="text-xs opacity-70">{language === 'de' ? 'MwSt.' : 'VAT'}</div>
                          <div className="text-lg font-bold text-primary">{selectedBundeslandData.vat_standard}%</div>
                        </div>
                        <div className="bg-secondary/10 rounded-xl p-3">
                          <div className="text-xs opacity-70">{language === 'de' ? 'Reduziert' : 'Reduced'}</div>
                          <div className="text-lg font-bold text-secondary">{selectedBundeslandData.vat_reduced}%</div>
                        </div>
                        <div className="bg-accent/10 rounded-xl p-3">
                          <div className="text-xs opacity-70">{language === 'de' ? 'Kirchensteuer' : 'Church tax'}</div>
                          <div className="text-lg font-bold text-accent">{selectedBundeslandData.church_tax_rate}%</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Tax Breakdown */}
                  {selectedBundeslandData && form.amount > 0 && (
                    <div className="bg-base-200/30 rounded-2xl p-6 border border-base-300/50">
                      <h3 className="text-sm font-bold uppercase tracking-wider opacity-70 mb-4">{language === 'de' ? 'Steuerberechnung' : 'Tax Breakdown'}</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm opacity-70">{language === 'de' ? 'Bruttobetrag' : 'Gross Amount'}:</span>
                          <span className="text-lg font-semibold">{fmt(taxBreakdown.grossAmount)} EUR</span>
                        </div>
                        {taxBreakdown.effectiveVatRate > 0 ? (
                          <div className="flex justify-between items-center pl-4 border-l-2 border-primary/50">
                            <span className="text-sm opacity-70">{language === 'de' ? 'MwSt.' : 'VAT'} ({taxBreakdown.effectiveVatRate}%):</span>
                            <span className="text-base font-semibold text-primary">-{fmt(taxBreakdown.vatAmount)} EUR</span>
                          </div>
                        ) : (
                          <div className="flex justify-between items-center pl-4 border-l-2 border-success/50">
                            <span className="text-sm opacity-70 text-success">{language === 'de' ? 'MwSt. (befreit)' : 'VAT (exempt)'}</span>
                            <span className="text-base font-semibold text-success">0,00 EUR</span>
                          </div>
                        )}
                        {form.applyChurchTax && taxBreakdown.churchTaxAmount > 0 && (
                          <div className="flex justify-between items-center pl-4 border-l-2 border-accent/50">
                            <span className="text-sm opacity-70">{language === 'de' ? 'Kirchensteuer' : 'Church Tax'} ({selectedBundeslandData.church_tax_rate}%):</span>
                            <span className="text-base font-semibold text-accent">-{fmt(taxBreakdown.churchTaxAmount)} EUR</span>
                          </div>
                        )}
                        <div className="divider my-2" />
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold opacity-80">{language === 'de' ? 'Netto' : 'Net'} ({language === 'de' ? 'nach Steuern' : 'after taxes'}):</span>
                          <span className="text-lg font-bold text-success">{fmt(taxBreakdown.netAmount)} EUR</span>
                        </div>
                        <div className="flex justify-between items-center text-xs opacity-60">
                          <span>{language === 'de' ? 'Gesamtsteuern' : 'Total Taxes'}:</span>
                          <span>{fmt(taxBreakdown.totalTaxes)} EUR</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Church Tax Checkbox */}
                  {selectedBundeslandData && (
                    <label className="flex items-center gap-3 cursor-pointer bg-base-200/30 rounded-2xl p-5 border border-base-300/50 hover:bg-base-200/50 transition-all duration-200">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm"
                        checked={form.applyChurchTax}
                        onChange={(e) => setForm((f: any) => ({ ...f, applyChurchTax: e.target.checked }))}
                      />
                      <span className="text-sm font-medium flex-1">
                        {language === 'de' ? 'Kirchenmitglied – Kirchensteuer anwenden' : 'Church member – Apply church tax'}
                      </span>
                      <span className="text-xs opacity-60">({selectedBundeslandData.church_tax_rate}%)</span>
                    </label>
                  )}

                  {/* Category */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider opacity-60 block mb-3">{t.form.category} <span className="text-red-500">*</span></label>
                    <select
                      className="select select-bordered select-lg w-full text-base focus:ring-2 focus:ring-primary/50 transition-all duration-200"
                      value={form.category}
                      onChange={(e) => setForm((f: any) => ({ ...f, category: e.target.value }))}
                    >
                      {categories.map((ct: any) => (
                        <option key={ct.name} value={ct.name}>
                          {ct.icon} {ct.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Date & Tag */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider opacity-60 block mb-3">{t.form.dateLabel} <span className="text-red-500">*</span></label>
                      <input
                        className="input input-bordered input-lg w-full text-base focus:ring-2 focus:ring-primary/50 transition-all duration-200"
                        type="date"
                        value={form.date}
                        onChange={(e) => setForm((f: any) => ({ ...f, date: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider opacity-60 block mb-3">{t.form.tagLabel}</label>
                      <select
                        className="select select-bordered select-lg w-full text-base focus:ring-2 focus:ring-primary/50 transition-all duration-200"
                        value={form.tag}
                        onChange={(e) => setForm((f: any) => ({ ...f, tag: e.target.value }))}
                      >
                        <option value="">{t.form.noTag}</option>
                        <option value="recurring">{t.form.recurring}</option>
                        <option value="annual">{t.form.annual}</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 lg:px-8 py-6 border-t border-base-200/30 bg-base-200/10 flex items-center justify-between gap-3">
                  <button className="btn btn-ghost btn-lg hover:scale-105 active:scale-95 transition-all duration-200 transform" onClick={cancel}>
                    {t.form.cancel}
                  </button>
                  <button 
                    disabled={isLoading}
                    className={`btn btn-primary btn-lg gap-2 font-bold px-8 hover:scale-105 active:scale-95 transition-all duration-200 transform ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`} 
                    onClick={save}
                  >
                    {isLoading ? (
                      <span className="loading loading-spinner loading-sm"></span>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                      </svg>
                    )}
                    {isLoading ? (language === 'de' ? 'Speichern...' : 'Saving...') : t.form.create}
                  </button>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
