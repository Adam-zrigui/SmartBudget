"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useLanguageStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Plus, Target, Trash2, Edit } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

type Budget = {
  id: string;
  category: string;
  maxAmount: number;
  alertThreshold?: number;
};

type Tx = {
  id: string;
  type: string;
  amount: number;
  category: string;
  date: string | Date;
};

interface BudgetManagerProps {
  budgets?: Budget[];
  transactions?: Tx[];
  addBudget?: (budget: any) => void | Promise<unknown>;
  updateBudget?: (budget: any) => void | Promise<unknown>;
  deleteBudget?: (id: string) => void | Promise<unknown>;
}

const CATEGORIES = [
  'Essen & Trinken',
  'Transport',
  'Wohnen',
  'Unterhaltung',
  'Gesundheit',
  'Bildung',
  'Shopping',
  'Reisen',
  'Versicherungen',
  'Sonstiges',
];

const CATEGORY_ALIASES: Record<string, string[]> = {
  'Essen & Trinken': ['essen', 'lebensmittel', 'food', 'groceries', 'restaurant'],
  Transport: ['transport', 'mobilitaet', 'fahrt', 'auto', 'benzin'],
  Wohnen: ['wohnen', 'wohnung', 'miete', 'housing', 'rent'],
  Unterhaltung: ['unterhaltung', 'freizeit', 'entertainment'],
  Gesundheit: ['gesundheit', 'health'],
  Bildung: ['bildung', 'education'],
  Shopping: ['shopping', 'einkauf'],
  Reisen: ['reisen', 'reise', 'travel'],
  Versicherungen: ['versicherung', 'versicherungen', 'insurance'],
  Sonstiges: ['sonstiges', 'other', 'misc'],
};

function normalizeCategory(value: string): string {
  const key = String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9& ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  for (const cat of CATEGORIES) {
    const base = cat
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9& ]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (base === key) return cat;
    if ((CATEGORY_ALIASES[cat] || []).some((a) => a === key)) return cat;
  }
  return value;
}

export default function BudgetManager({
  budgets = [],
  transactions = [],
  addBudget,
  updateBudget,
  deleteBudget,
}: BudgetManagerProps) {
  const { language } = useLanguageStore();
  const { toast } = useToast();

  const [list, setList] = useState<Budget[]>(Array.isArray(budgets) ? budgets : []);
  const [txs, setTxs] = useState<Tx[]>(Array.isArray(transactions) ? transactions : []);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ category: '', maxAmount: 0, alertThreshold: 80 });

  useEffect(() => setList(Array.isArray(budgets) ? budgets : []), [budgets]);
  useEffect(() => setTxs(Array.isArray(transactions) ? transactions : []), [transactions]);

  const computed = useMemo(() => {
    const now = new Date();
    return list.map((b) => {
      const maxAmount = Number(b.maxAmount || 0);
      const alertThreshold = Number(b.alertThreshold || 80);
      const spent = txs
        .filter((t) => t.type === 'expense')
        .filter((t) => normalizeCategory(t.category) === normalizeCategory(b.category))
        .filter((t) => {
          const d = new Date(t.date);
          return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
        })
        .reduce((s, t) => s + Number(t.amount || 0), 0);
      const percentage = maxAmount > 0 ? (spent / maxAmount) * 100 : 0;
      return {
        ...b,
        maxAmount,
        alertThreshold,
        spent,
        remaining: maxAmount - spent,
        percentage,
      };
    });
  }, [list, txs]);

  async function onSave() {
    if (!form.category || form.maxAmount <= 0) {
      toast({
        title: language === 'de' ? 'Fehler' : 'Error',
        description: language === 'de' ? 'Bitte alle Felder ausfuellen' : 'Please fill all fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editingId) {
        const payload = { id: editingId, ...form };
        await Promise.resolve(updateBudget?.(payload));
        setList((prev) => prev.map((b) => (b.id === editingId ? { ...b, ...payload } : b)));
      } else {
        await Promise.resolve(addBudget?.(form));
      }
      setOpen(false);
      setEditingId(null);
      setForm({ category: '', maxAmount: 0, alertThreshold: 80 });
    } catch {
      toast({
        title: language === 'de' ? 'Fehler' : 'Error',
        description: language === 'de' ? 'Budget konnte nicht gespeichert werden' : 'Could not save budget',
        variant: 'destructive',
      });
    }
  }

  function onEdit(b: any) {
    setEditingId(b.id);
    setForm({
      category: b.category || '',
      maxAmount: Number(b.maxAmount || 0),
      alertThreshold: Number(b.alertThreshold || 80),
    });
    setOpen(true);
  }

  async function onDelete(id: string) {
    if (!window.confirm(language === 'de' ? 'Budget wirklich loeschen?' : 'Delete this budget?')) return;
    try {
      await Promise.resolve(deleteBudget?.(id));
      setList((prev) => prev.filter((b) => b.id !== id));
    } catch {
      toast({
        title: language === 'de' ? 'Fehler' : 'Error',
        description: language === 'de' ? 'Budget konnte nicht geloescht werden' : 'Could not delete budget',
        variant: 'destructive',
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{language === 'de' ? 'Budget-Planung' : 'Budget Planning'}</h2>
          <p className="text-muted-foreground">
            {language === 'de' ? 'Verwalte monatliche Budgets' : 'Manage monthly budgets'}
          </p>
        </div>

        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditingId(null); }}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" />{language === 'de' ? 'Budget erstellen' : 'Create Budget'}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? (language === 'de' ? 'Budget bearbeiten' : 'Edit Budget') : (language === 'de' ? 'Neues Budget' : 'New Budget')}</DialogTitle>
              <DialogDescription>{language === 'de' ? 'Monatliches Budget fuer Kategorie' : 'Monthly category budget'}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>{language === 'de' ? 'Kategorie' : 'Category'}</Label>
                <Select value={form.category} onValueChange={(v) => setForm((p) => ({ ...p, category: v }))}>
                  <SelectTrigger><SelectValue placeholder={language === 'de' ? 'Kategorie waehlen' : 'Select category'} /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>{language === 'de' ? 'Maximalbetrag (EUR)' : 'Maximum (EUR)'}</Label>
                <Input type="number" min="0" step="0.01" value={form.maxAmount || ''} onChange={(e) => setForm((p) => ({ ...p, maxAmount: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div>
                <Label>{language === 'de' ? 'Warnschwelle (%)' : 'Alert threshold (%)'}</Label>
                <Input type="number" min="1" max="100" value={form.alertThreshold} onChange={(e) => setForm((p) => ({ ...p, alertThreshold: parseInt(e.target.value, 10) || 80 }))} />
              </div>
              <div className="flex gap-2 pt-2">
                <Button className="flex-1" onClick={onSave}>{editingId ? (language === 'de' ? 'Speichern' : 'Save') : (language === 'de' ? 'Erstellen' : 'Create')}</Button>
                <Button variant="outline" onClick={() => setOpen(false)}>{language === 'de' ? 'Abbrechen' : 'Cancel'}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {computed.map((b: any) => {
          const status = b.percentage >= 100 ? 'over' : b.percentage >= b.alertThreshold ? 'warn' : 'ok';
          return (
            <Card key={b.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-lg">{b.category}</CardTitle>
                  <div className="flex items-center gap-1">
                    <Badge variant={status === 'over' ? 'destructive' : status === 'warn' ? 'secondary' : 'default'}>
                      {status === 'over' ? (language === 'de' ? 'Ueber Budget' : 'Over Budget') : status === 'warn' ? (language === 'de' ? 'Achtung' : 'Warning') : (language === 'de' ? 'Im Budget' : 'On Track')}
                    </Badge>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(b)}><Edit className="h-4 w-4" /></Button>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(b.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
                <CardDescription>
                  {language === 'de' ? 'Ausgaben' : 'Spent'}: EUR {b.spent.toFixed(2)} / EUR {b.maxAmount.toFixed(2)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>{b.percentage.toFixed(1)}%</span>
                  <span>EUR {b.remaining.toFixed(2)} {language === 'de' ? 'verbleibend' : 'remaining'}</span>
                </div>
                <Progress value={Math.min(b.percentage, 100)} className="h-2" />
                {b.percentage >= b.alertThreshold && b.percentage < 100 && (
                  <div className="flex items-center gap-2 text-sm text-amber-600"><AlertCircle className="h-4 w-4" />{language === 'de' ? `${b.alertThreshold}% erreicht` : `${b.alertThreshold}% reached`}</div>
                )}
                {b.percentage >= 100 && (
                  <div className="flex items-center gap-2 text-sm text-destructive"><AlertCircle className="h-4 w-4" />{language === 'de' ? `EUR ${(b.spent - b.maxAmount).toFixed(2)} ueber Budget` : `EUR ${(b.spent - b.maxAmount).toFixed(2)} over budget`}</div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {computed.length === 0 && (
        <Card className="p-8 text-center">
          <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">{language === 'de' ? 'Keine Budgets vorhanden' : 'No budgets yet'}</h3>
          <p className="text-muted-foreground mb-4">{language === 'de' ? 'Erstelle dein erstes Budget' : 'Create your first budget'}</p>
          <Button onClick={() => setOpen(true)} className="gap-2"><Plus className="h-4 w-4" />{language === 'de' ? 'Budget erstellen' : 'Create Budget'}</Button>
        </Card>
      )}
    </div>
  );
}
