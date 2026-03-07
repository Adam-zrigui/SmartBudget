 'use client';

import { useMemo, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLanguageStore } from '@/lib/store';
import { fmt } from '@/lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { authedFetch } from '@/lib/client-auth';

export default function SalaryPlanner({
  txs,
  fMonth,
  dark,
  onSalarySaved,
}: {
  txs: any[];
  fMonth: string;
  dark: boolean;
  onSalarySaved?: () => void;
}) {
  const language = useLanguageStore((s) => s.language);
  const [isAdding, setIsAdding] = useState(false);
  // Use current month's salary from transactions instead of separate input
  const [items, setItems] = useState<Array<{ id: number; name: string; amount: number }>>([
    { id: 1, name: 'Mieten', amount: 0 },
    { id: 2, name: 'Essen', amount: 0 },
    { id: 3, name: 'Verkehrsmittel', amount: 0 },
    { id: 4, name: 'Sonstiges', amount: 0 },
  ]);
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  async function saveSalary() {
    const currentSalary = monthlySalaryData.salary || 0;
    if (currentSalary <= 0) {
      toast.toast({ title: language === 'de' ? 'Kein Gehalt gefunden' : 'No salary found', description: language === 'de' ? 'Bitte erstellen Sie zuerst eine Gehaltstransaktion im Formular.' : 'Please create a salary transaction first using the New Entry form.', variant: 'destructive' });
      return;
    }

    const allocationObj: Record<string, number> = {};
    items.forEach((it) => {
      if (it.name && it.amount > 0) allocationObj[it.name] = it.amount;
    });
    const totalAllocated = Object.values(allocationObj).reduce((a: number, b: number) => a + b, 0);
    if (totalAllocated === 0) {
      toast.toast({ title: language === 'de' ? 'Bitte ordnen Sie Ihr Gehalt mindestens einer Kategorie zu' : 'Please allocate your salary to at least one category', variant: 'destructive' });
      return;
    }

    if (currentSalary > 0 && totalAllocated > currentSalary) {
      toast.toast({
        title: language === 'de' ? 'Überallokation erkannt' : 'Over-allocation detected',
        description: language === 'de'
          ? `Die Summe der Aufteilung (${fmt(totalAllocated)}) übersteigt das Gehalt (${fmt(currentSalary)}). Bitte passen Sie die Beträge an.`
          : `The total allocation (${fmt(totalAllocated)}) exceeds the salary (${fmt(currentSalary)}). Please adjust the amounts.`,
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const res = await authedFetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'income',
          category: 'Gehalt',
          amount: currentSalary,
          description: `${language === 'de' ? 'Monatliches Gehalt (erfasst)' : 'Monthly Salary (captured)'} - ${new Date().toLocaleDateString()}`,
          date: new Date().toISOString().slice(0, 10),
          tag: 'salary',
          salaryAllocation: allocationObj,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        toast.toast({ title: language === 'de' ? 'Fehler beim Speichern' : 'Error saving', description: err, variant: 'destructive' });
        setIsSaving(false);
        return;
      }

      const created = await res.json();
      setItems([
        { id: 1, name: 'Mieten', amount: 0 },
        { id: 2, name: 'Essen', amount: 0 },
        { id: 3, name: 'Verkehrsmittel', amount: 0 },
        { id: 4, name: 'Sonstiges', amount: 0 },
      ]);
      setIsAdding(false);
      setIsSaving(false);
      onSalarySaved?.();
      try {
        window.dispatchEvent(new CustomEvent('transactions:created', { detail: created }));
      } catch (e) {
        // ignore in non-browser environments
      }
    } catch (err) {
      toast.toast({ title: language === 'de' ? 'Fehler beim Speichern des Gehalts' : 'Error saving salary', description: String(err), variant: 'destructive' });
      setIsSaving(false);
    }
  }

  // Get current month salary and allocation
  const monthlySalaryData = useMemo(() => {
    const filtered = fMonth === 'all' 
      ? txs 
      : txs.filter((t) => {
          const mo = new Date(t.date).getMonth();
          return mo === parseInt(fMonth);
        });

    const salary = filtered
      .filter((t) => t.type === 'income' && t.category === 'Gehalt')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const allocation: Record<string, number> = {};
    let totalAllocated = 0;

    filtered
      .filter((t) => t.type === 'income' && t.category === 'Gehalt')
      .forEach((t) => {
        if (t.salaryAllocation) {
          try {
            const parsed = typeof t.salaryAllocation === 'string' 
              ? JSON.parse(t.salaryAllocation) 
              : t.salaryAllocation;
            Object.entries(parsed).forEach(([cat, amount]: [string, any]) => {
              allocation[cat] = (allocation[cat] || 0) + (amount || 0);
              totalAllocated += amount || 0;
            });
          } catch (e) {
            // ignore
          }
        }
      });

    return { salary, allocation, totalAllocated };
  }, [txs, fMonth]);

  // Get actual spending by category compared to allocations
  const budgetComparison = useMemo(() => {
    const filtered = fMonth === 'all' 
      ? txs 
      : txs.filter((t) => {
          const mo = new Date(t.date).getMonth();
          return mo === parseInt(fMonth);
        });

    const actual: Record<string, number> = {};

    filtered
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        actual[t.category] = (actual[t.category] || 0) + (t.amount || 0);
      });

    return { actual };
  }, [txs, fMonth]);

  const chartData = useMemo(() => {
    const alloc = monthlySalaryData.allocation;
    return Object.entries(alloc)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({
        name: language === 'de' 
          ? name 
          : name === 'Mieten' ? 'Rent' : name === 'Essen' ? 'Food' : name === 'Verkehrsmittel' ? 'Transport' : 'Other',
        value: parseFloat(value.toString()),
      }))
      .sort((a, b) => b.value - a.value);
  }, [monthlySalaryData, language]);

  const colors = dark 
    ? ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'] 
    : ['#059669', '#0284c7', '#d97706', '#dc2626'];

  const totalSpent = Object.values(budgetComparison.actual).reduce((a, b) => a + b, 0);
  const remaining = (monthlySalaryData.totalAllocated || monthlySalaryData.salary) - totalSpent;

  return (
    <div className="space-y-6">
      {/* Add Salary Form - EDITABLE ON HOME PAGE */}
      <div className="card bg-linear-to-br from-success/10 to-success/5 border border-success/20 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">{language === 'de' ? '💰 Gehalt hinzufügen & aufteilen' : '💰 Add & Split Salary'}</h3>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className={`btn btn-sm ${isAdding ? 'btn-error' : 'btn-success'}`}
          >
            {isAdding ? (language === 'de' ? 'Abbrechen' : 'Cancel') : (language === 'de' ? '+ Hinzufügen' : '+ Add')}
          </button>
        </div>

        {isAdding && (
          <div className="space-y-4 pt-4 border-t border-success/20">
            {/* Display current month's salary from transactions */}
            <div>
              <label className="text-sm font-bold opacity-60 block mb-2">{language === 'de' ? 'Aktuelles Gehalt (Monat)' : "Current Month's Salary"}</label>
              <div className="text-2xl font-bold">
                {monthlySalaryData.salary > 0 ? fmt(monthlySalaryData.salary) : (language === 'de' ? 'Kein Gehalt gefunden' : 'No salary found')}
              </div>
            </div>

            {/* Allocation Inputs (user-defined categories) */}
            <div>
              <label className="text-sm font-bold opacity-60 block mb-3">{language === 'de' ? 'Aufteilung nach Kategorien' : 'Allocate to Categories'}</label>
              <div className="space-y-3 bg-base-200/20 p-4 rounded-lg">
                {items.map((it) => (
                  <div key={it.id} className="flex items-center gap-3">
                    <input
                      className="input input-sm input-bordered w-40"
                      value={it.name}
                      onChange={(e) => setItems((prev) => prev.map((p) => p.id === it.id ? { ...p, name: e.target.value } : p))}
                    />
                    <div className="flex-1 relative flex items-center">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="input input-bordered input-sm w-full"
                        placeholder="0.00"
                        value={it.amount || ''}
                        onChange={(e) => setItems((prev) => prev.map((p) => p.id === it.id ? { ...p, amount: parseFloat(e.target.value) || 0 } : p))}
                      />
                      <span className="absolute right-3 text-xs opacity-50">EUR</span>
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={() => setItems((prev) => prev.filter((p) => p.id !== it.id))}>✕</button>
                  </div>
                ))}
                <div className="pt-2">
                  <button className="btn btn-link btn-sm" onClick={() => {
                    const id = Math.max(0, ...items.map(i => i.id)) + 1
                    setItems(prev => [...prev, { id, name: 'Neue Kategorie', amount: 0 }])
                  }}>{language === 'de' ? '+ Kategorie hinzufügen' : '+ Add category'}</button>
                </div>
              </div>
            </div>
              {/* Summary */}
              <div className="mt-4 p-4 bg-success/10 rounded-lg border border-success/20">
                <div className="flex justify-between text-sm font-bold mb-3">
                  <span>{language === 'de' ? 'Aufteilung gesamt:' : 'Total Split:'}</span>
                  <span className="text-success">
                    {fmt(items.reduce((a, b) => a + (b.amount || 0), 0))}
                  </span>
                </div>
                {monthlySalaryData.salary > 0 && (
                  <div className="w-full h-2 bg-base-300 rounded-full overflow-hidden mb-3">
                    <div 
                      className="h-full bg-linear-to-r from-success to-success/70 transition-all duration-300"
                      style={{ width: `${Math.min(100, (items.reduce((a, b) => a + (b.amount || 0), 0) / (monthlySalaryData.salary || 1)) * 100)}%` }}
                    />
                  </div>
                )}
                <div className="text-xs opacity-60 font-medium">
                  {monthlySalaryData.salary > 0 && items.reduce((a, b) => a + (b.amount || 0), 0) > 0 && (
                    <>
                      {monthlySalaryData.salary > items.reduce((a, b) => a + (b.amount || 0), 0)
                        ? `✓ ${language === 'de' ? 'Verbleibend:' : 'Remaining:'} ${fmt(monthlySalaryData.salary - items.reduce((a, b) => a + (b.amount || 0), 0))}`
                        : `⚠ ${language === 'de' ? 'Überallokation:' : 'Over-allocated:'} ${fmt(items.reduce((a, b) => a + (b.amount || 0), 0) - monthlySalaryData.salary)}`}
                    </>
                  )}
                </div>
              </div>

            <button
              onClick={saveSalary}
              disabled={isSaving}
              className="btn btn-success w-full mt-4"
            >
              {isSaving ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  {language === 'de' ? 'Speichert...' : 'Saving...'}
                </>
              ) : (
                language === 'de' ? '✓ Gehalt speichern' : '✓ Save Salary'
              )}
            </button>
          </div>
        )}
      </div>

      {monthlySalaryData.salary > 0 && (
        <>
          {/* Salary Header */}
          <div className="card bg-linear-to-br from-primary/10 to-primary/5 border border-primary/20 shadow-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider opacity-60 mb-2">
                  {language === 'de' ? 'Monatliches Gehalt' : 'Monthly Salary'}
                </h3>
                <div className="text-4xl font-bold text-primary">
                  {fmt(monthlySalaryData.salary)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs opacity-60 mb-1">{language === 'de' ? 'Geplant' : 'Allocated'}</div>
                <div className="text-2xl font-bold">
                  {fmt(monthlySalaryData.totalAllocated)}
                </div>
              </div>
            </div>
            <div className="w-full h-2 bg-base-300 rounded-full overflow-hidden">
              <div 
                className="h-full bg-linear-to-r from-primary to-primary/70 transition-all duration-700"
                style={{ width: `${Math.min(100, (monthlySalaryData.totalAllocated / monthlySalaryData.salary) * 100)}%` }}
              />
            </div>
          </div>

          {/* Salary Allocation */}
          {chartData.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Pie Chart */}
              <div className="card bg-base-100 shadow-sm border border-base-200 p-5">
                <h4 className="text-sm font-semibold mb-4">
                  {language === 'de' ? 'Gehalt Aufteilung' : 'Salary Allocation'}
                </h4>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {chartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => fmt(value as number)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Allocation Breakdown */}
              <div className="card bg-base-100 shadow-sm border border-base-200 p-5">
                <h4 className="text-sm font-semibold mb-4">
                  {language === 'de' ? 'Aufteilung Details' : 'Allocation Details'}
                </h4>
                <div className="space-y-3">
                  {chartData.map((item, idx) => (
                    <div key={item.name} className="flex items-center justify-between p-3 bg-base-200/30 rounded-lg hover:bg-base-200/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: colors[idx % colors.length] }}
                        />
                        <span className="text-sm font-medium">{item.name}</span>
                      </div>
                      <span className="text-sm font-bold text-primary">{fmt(item.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Summary */}
      
        </>
      )}

      {monthlySalaryData.salary === 0 && !isAdding && (
        <div className="card bg-base-100 border border-dashed border-base-300 shadow-sm p-8 text-center">
          <div className="text-3xl mb-3">📊</div>
          <div className="text-opacity-60 text-base-content">
            {language === 'de' 
              ? 'Klicken Sie oben auf "+ Hinzufügen", um Ihr monatliches Gehalt hinzuzufügen und es aufzuteilen.'
              : 'Click "+ Add" above to add your monthly salary and split it into categories.'}
          </div>
        </div>
      )}
    </div>
  );
}
