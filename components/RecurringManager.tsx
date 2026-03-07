"use client"

import React, { useState, useEffect } from 'react';
import { useLanguageStore } from '@/lib/store';
import { translations } from '@/lib/translations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Calendar, Repeat, Plus, Edit, Trash2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface RecurringTransaction {
  id: string;
  templateId?: string;
  type?: string;
  amount?: number;
  category?: string;
  description?: string;
  frequency: string;
  interval: number;
  startDate: Date;
  endDate?: Date;
  nextDue: Date;
  lastProcessed?: Date;
  isActive: boolean;
  autoCreate: boolean;
  transactions: Array<{
    id: string;
    type: string;
    amount: number;
    category: string;
    description: string;
    date: Date;
  }>;
}

interface RecurringInput {
  type: string;
  amount: number;
  category: string;
  description: string;
  frequency: string;
  interval: number;
  startDate: Date;
  endDate?: Date;
  autoCreate: boolean;
}

interface RecurringManagerProps {
  recurringTransactions?: RecurringTransaction[];
  onCreateRecurring?: (recurring: RecurringInput) => void | Promise<unknown>;
  onUpdateRecurring?: (id: string, recurring: Partial<RecurringInput>) => void | Promise<unknown>;
  onDeleteRecurring?: (id: string) => void | Promise<unknown>;
  onToggleActive?: (id: string, active: boolean) => void | Promise<unknown>;
}

const FREQUENCIES = [
  { value: 'daily', label: { de: 'Taeglich', en: 'Daily' } },
  { value: 'weekly', label: { de: 'Woechentlich', en: 'Weekly' } },
  { value: 'biweekly', label: { de: 'Zweiwoechentlich', en: 'Bi-weekly' } },
  { value: 'monthly', label: { de: 'Monatlich', en: 'Monthly' } },
  { value: 'quarterly', label: { de: 'Vierteljaehrlich', en: 'Quarterly' } },
  { value: 'yearly', label: { de: 'Jaehrlich', en: 'Yearly' } }
];

const CATEGORIES = [
  'Gehalt',
  'Miete',
  'Nebenkosten',
  'Versicherungen',
  'Internet & Telefon',
  'Transport',
  'Essen & Trinken',
  'Unterhaltung',
  'Gesundheit',
  'Shopping',
  'Sonstiges'
];

export default function RecurringManager({
  recurringTransactions = [],
  onCreateRecurring = () => {},
  onUpdateRecurring = () => {},
  onDeleteRecurring = () => {},
  onToggleActive = () => {}
}: RecurringManagerProps) {
  const { language } = useLanguageStore();
  const t = translations[language];
  const { toast } = useToast();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingRecurringId, setEditingRecurringId] = useState<string | null>(null);
  const recurringList = Array.isArray(recurringTransactions) ? recurringTransactions : [];
  const [newRecurring, setNewRecurring] = useState({
    type: 'expense',
    amount: 0,
    category: '',
    description: '',
    frequency: 'monthly',
    interval: 1,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    autoCreate: true
  });

  const handleCreateRecurring = async () => {
    if (!newRecurring.description || !newRecurring.category || newRecurring.amount <= 0) {
      toast({
        title: language === 'de' ? 'Fehler' : 'Error',
        description: language === 'de' ? 'Bitte alle erforderlichen Felder ausfuellen' : 'Please fill all required fields',
        variant: 'destructive'
      });
      return;
    }

    const recurringData = {
      ...newRecurring,
      startDate: new Date(newRecurring.startDate),
      endDate: newRecurring.endDate ? new Date(newRecurring.endDate) : undefined
    };

    try {
      if (editingRecurringId) {
        await Promise.resolve(onUpdateRecurring(editingRecurringId, recurringData));
      } else {
        await Promise.resolve(onCreateRecurring(recurringData));
      }
      setNewRecurring({
        type: 'expense',
        amount: 0,
        category: '',
        description: '',
        frequency: 'monthly',
        interval: 1,
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        autoCreate: true
      });
      setIsCreateDialogOpen(false);
      setEditingRecurringId(null);

      toast({
        title: editingRecurringId
          ? (language === 'de' ? 'Buchung aktualisiert' : 'Recurring transaction updated')
          : (language === 'de' ? 'Wiederkehrende Buchung erstellt' : 'Recurring transaction created'),
        description: editingRecurringId
          ? (language === 'de' ? 'Buchung wurde erfolgreich aktualisiert' : 'Recurring transaction updated successfully')
          : (language === 'de' ? 'Neue wiederkehrende Buchung wurde erfolgreich erstellt' : 'New recurring transaction created successfully')
      });
    } catch (err) {
      toast({
        title: language === 'de' ? 'Fehler' : 'Error',
        description: language === 'de'
          ? 'Buchung konnte nicht gespeichert werden.'
          : 'Recurring transaction could not be saved.',
        variant: 'destructive',
      });
    }
  };

  const openEditRecurring = (recurring: RecurringTransaction) => {
    const transaction = recurring.transactions?.[0] || {
      type: recurring.type || 'expense',
      amount: recurring.amount || 0,
      category: recurring.category || '',
      description: recurring.description || '',
    };
    setNewRecurring({
      type: transaction.type || 'expense',
      amount: Number(transaction.amount) || 0,
      category: transaction.category || '',
      description: transaction.description || '',
      frequency: recurring.frequency || 'monthly',
      interval: Number(recurring.interval) || 1,
      startDate: recurring.startDate
        ? new Date(recurring.startDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      endDate: recurring.endDate
        ? new Date(recurring.endDate).toISOString().split('T')[0]
        : '',
      autoCreate: Boolean(recurring.autoCreate),
    });
    setEditingRecurringId(recurring.id);
    setIsCreateDialogOpen(true);
  };

  const handleDeleteRecurring = async (id: string) => {
    const confirmed = window.confirm(
      language === 'de'
        ? 'Moechtest du diese wiederkehrende Buchung wirklich loeschen?'
        : 'Do you really want to delete this recurring transaction?'
    );
    if (!confirmed) return;
    try {
      await Promise.resolve(onDeleteRecurring(id));
      toast({
        title: language === 'de' ? 'Buchung geloescht' : 'Recurring transaction deleted',
        description: language === 'de'
          ? 'Die wiederkehrende Buchung wurde entfernt.'
          : 'The recurring transaction has been removed.',
      });
    } catch (err) {
      toast({
        title: language === 'de' ? 'Fehler' : 'Error',
        description: language === 'de'
          ? 'Buchung konnte nicht geloescht werden.'
          : 'Recurring transaction could not be deleted.',
        variant: 'destructive',
      });
    }
  };

  const getFrequencyLabel = (frequency: string, interval: number) => {
    const freq = FREQUENCIES.find(f => f.value === frequency);
    if (!freq) return frequency;

    const baseLabel = freq.label[language as keyof typeof freq.label];
    if (interval === 1) return baseLabel;

    return language === 'de'
      ? `Alle ${interval} ${baseLabel.toLowerCase()}`
      : `Every ${interval} ${baseLabel.toLowerCase()}`;
  };

  const getNextDueDate = (recurring: RecurringTransaction) => {
    const now = new Date();
    const nextDue = new Date(recurring.nextDue);

    if (nextDue < now) {
      // Calculate next occurrence
      const diff = now.getTime() - nextDue.getTime();
      let nextDate = new Date(nextDue);

      switch (recurring.frequency) {
        case 'daily':
          nextDate.setDate(nextDate.getDate() + Math.ceil(diff / (1000 * 60 * 60 * 24)) * recurring.interval);
          break;
        case 'weekly':
          nextDate.setDate(nextDate.getDate() + Math.ceil(diff / (1000 * 60 * 60 * 24 * 7)) * 7 * recurring.interval);
          break;
        case 'biweekly':
          nextDate.setDate(nextDate.getDate() + Math.ceil(diff / (1000 * 60 * 60 * 24 * 14)) * 14 * recurring.interval);
          break;
        case 'monthly':
          nextDate.setMonth(nextDate.getMonth() + Math.ceil(diff / (1000 * 60 * 60 * 24 * 30)) * recurring.interval);
          break;
        case 'quarterly':
          nextDate.setMonth(nextDate.getMonth() + Math.ceil(diff / (1000 * 60 * 60 * 24 * 90)) * 3 * recurring.interval);
          break;
        case 'yearly':
          nextDate.setFullYear(nextDate.getFullYear() + Math.ceil(diff / (1000 * 60 * 60 * 24 * 365)) * recurring.interval);
          break;
      }

      return nextDate;
    }

    return nextDue;
  };

  const formatCurrency = (amount: number) => `€${amount.toFixed(2)}`;

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(language === 'de' ? 'de-DE' : 'en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {language === 'de' ? 'Wiederkehrende Buchungen' : 'Recurring Transactions'}
          </h2>
          <p className="text-muted-foreground">
            {language === 'de'
              ? 'Verwalte regelmaessige Einnahmen und Ausgaben'
              : 'Manage regular income and expenses'
            }
          </p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) setEditingRecurringId(null);
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              {language === 'de' ? 'Buchung erstellen' : 'Create Transaction'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingRecurringId
                  ? (language === 'de' ? 'Buchung bearbeiten' : 'Edit Recurring Transaction')
                  : (language === 'de' ? 'Neue wiederkehrende Buchung' : 'New Recurring Transaction')}
              </DialogTitle>
              <DialogDescription>
                {language === 'de'
                  ? 'Erstelle eine wiederkehrende Buchung für regelmaessige Zahlungen'
                  : 'Create a recurring transaction for regular payments'
                }
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">
                    {language === 'de' ? 'Typ' : 'Type'}
                  </Label>
                  <Select value={newRecurring.type} onValueChange={(value) => setNewRecurring(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">
                        {language === 'de' ? 'Einnahme' : 'Income'}
                      </SelectItem>
                      <SelectItem value="expense">
                        {language === 'de' ? 'Ausgabe' : 'Expense'}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="amount">
                    {language === 'de' ? 'Betrag (€)' : 'Amount (€)'}
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={newRecurring.amount || ''}
                    onChange={(e) => setNewRecurring(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                    placeholder="100.00"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="category">
                  {language === 'de' ? 'Kategorie' : 'Category'}
                </Label>
                <Select value={newRecurring.category} onValueChange={(value) => setNewRecurring(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder={language === 'de' ? 'Kategorie wählen' : 'Select category'} />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">
                  {language === 'de' ? 'Beschreibung' : 'Description'}
                </Label>
                <Input
                  id="description"
                  value={newRecurring.description}
                  onChange={(e) => setNewRecurring(prev => ({ ...prev, description: e.target.value }))}
                  placeholder={language === 'de' ? 'z.B. Monatsmiete' : 'e.g. Monthly rent'}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="frequency">
                    {language === 'de' ? 'Haeufigkeit' : 'Frequency'}
                  </Label>
                  <Select value={newRecurring.frequency} onValueChange={(value) => setNewRecurring(prev => ({ ...prev, frequency: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FREQUENCIES.map(freq => (
                        <SelectItem key={freq.value} value={freq.value}>
                          {freq.label[language as keyof typeof freq.label]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="interval">
                    {language === 'de' ? 'Intervall' : 'Interval'}
                  </Label>
                  <Input
                    id="interval"
                    type="number"
                    min="1"
                    value={newRecurring.interval}
                    onChange={(e) => setNewRecurring(prev => ({ ...prev, interval: parseInt(e.target.value) || 1 }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="start-date">
                  {language === 'de' ? 'Startdatum' : 'Start Date'}
                </Label>
                <Input
                  id="start-date"
                  type="date"
                  value={newRecurring.startDate}
                  onChange={(e) => setNewRecurring(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="end-date">
                  {language === 'de' ? 'Enddatum (optional)' : 'End Date (optional)'}
                </Label>
                <Input
                  id="end-date"
                  type="date"
                  value={newRecurring.endDate}
                  onChange={(e) => setNewRecurring(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="auto-create"
                  checked={newRecurring.autoCreate}
                  onCheckedChange={(checked) => setNewRecurring(prev => ({ ...prev, autoCreate: checked }))}
                />
                <Label htmlFor="auto-create" className="text-sm">
                  {language === 'de' ? 'Automatisch Buchungen erstellen' : 'Automatically create transactions'}
                </Label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleCreateRecurring} className="flex-1">
                  {editingRecurringId
                    ? (language === 'de' ? 'Speichern' : 'Save')
                    : (language === 'de' ? 'Erstellen' : 'Create')}
                </Button>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  {language === 'de' ? 'Abbrechen' : 'Cancel'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {recurringList.map((recurring) => {
          const transaction = recurring.transactions?.[0] || {
            type: recurring.type,
            amount: recurring.amount,
            category: recurring.category,
            description: recurring.description,
          };
          if (!transaction || !transaction.description) return null;
          const transactionAmount = typeof transaction.amount === 'number' ? transaction.amount : 0;
          const transactionType = transaction.type === 'income' ? 'income' : 'expense';
          const transactionCategory = transaction.category || (language === 'de' ? 'Sonstiges' : 'Other');

          const nextDue = getNextDueDate(recurring);
          const isOverdue = nextDue < new Date();

          return (
            <Card key={recurring.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{transaction.description}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Badge variant={transactionType === 'income' ? 'default' : 'secondary'}>
                        {transactionType === 'income'
                          ? (language === 'de' ? 'Einnahme' : 'Income')
                          : (language === 'de' ? 'Ausgabe' : 'Expense')
                        }
                      </Badge>
                      <span className="text-sm">{transactionCategory}</span>
                    </CardDescription>
                  </div>

                  <div className="flex items-center gap-2 ml-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                      onClick={() => openEditRecurring(recurring)}
                      aria-label={language === 'de' ? 'Buchung bearbeiten' : 'Edit recurring transaction'}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteRecurring(recurring.id)}
                      aria-label={language === 'de' ? 'Buchung loeschen' : 'Delete recurring transaction'}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    {recurring.isActive ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">
                      {formatCurrency(transactionAmount)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {getFrequencyLabel(recurring.frequency, recurring.interval)}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={`text-sm font-medium ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {language === 'de' ? 'Naechste Faelligkeit' : 'Next Due'}
                    </div>
                    <div className={`text-sm ${isOverdue ? 'text-destructive font-medium' : ''}`}>
                      {formatDate(nextDue)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Repeat className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {recurring.autoCreate
                        ? (language === 'de' ? 'Automatisch' : 'Automatic')
                        : (language === 'de' ? 'Manuell' : 'Manual')
                      }
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={recurring.isActive}
                      onCheckedChange={(checked) => onToggleActive(recurring.id, checked)}
                    />
                    <span className="text-xs text-muted-foreground">
                      {recurring.isActive
                        ? (language === 'de' ? 'Aktiv' : 'Active')
                        : (language === 'de' ? 'Inaktiv' : 'Inactive')
                      }
                    </span>
                  </div>
                </div>

                {recurring.endDate && (
                  <div className="text-xs text-muted-foreground">
                    {language === 'de' ? 'Endet am' : 'Ends on'}: {formatDate(recurring.endDate)}
                  </div>
                )}

                {recurring.lastProcessed && (
                  <div className="text-xs text-muted-foreground">
                    {language === 'de' ? 'Zuletzt verarbeitet' : 'Last processed'}: {formatDate(recurring.lastProcessed)}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {recurringList.length === 0 && (
        <Card className="p-8 text-center">
          <Repeat className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {language === 'de' ? 'Keine wiederkehrenden Buchungen' : 'No recurring transactions'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {language === 'de'
              ? 'Erstelle deine erste wiederkehrende Buchung für regelmaessige Zahlungen'
              : 'Create your first recurring transaction for regular payments'
            }
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            {language === 'de' ? 'Buchung erstellen' : 'Create Transaction'}
          </Button>
        </Card>
      )}
    </div>
  );
}
