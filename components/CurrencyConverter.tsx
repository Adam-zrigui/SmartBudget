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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Globe, Plus, RefreshCw, TrendingUp, TrendingDown, AlertTriangle, Calculator, Edit } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  flag: string;
  exchangeRate: number;
  rateToBase?: number;
  lastUpdated: Date;
  isBase: boolean;
}

interface CurrencyConverterProps {
  currencies?: any[];
  baseCurrency?: string;
  updateRates?: () => void | Promise<void>;
  setBaseCurrency?: (currencyCode: string) => void;
  addCurrency?: (currency: { code: string; name?: string; exchangeRate?: number }) => void | Promise<void>;
  removeCurrency?: (currencyCode: string) => void | Promise<void>;
}

const COMMON_CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', flag: '' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', flag: '' },
  { code: 'MXN', name: 'Mexican Peso', symbol: 'Mex$', flag: '' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', flag: '' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', flag: '' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', flag: '' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', flag: '' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺', flag: '' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽', flag: '' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', flag: '' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', flag: '' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', flag: '' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr', flag: '' },
  { code: 'PLN', name: 'Polish Złoty', symbol: 'zł', flag: '' },
  { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč', flag: '' },
  { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft', flag: '' },
  { code: 'ILS', name: 'Israeli Shekel', symbol: '₪', flag: '' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', flag: '' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', flag: '' },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱', flag: '' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', flag: '' },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', flag: '' }
];

export default function CurrencyConverter({
  currencies = [],
  baseCurrency = "EUR",
  updateRates = async () => {},
  setBaseCurrency = () => {},
  addCurrency = async () => {},
  removeCurrency = async () => {}
}: CurrencyConverterProps) {
  const { language } = useLanguageStore();
  const t = translations[language];
  const { toast } = useToast();

  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const [converterAmount, setConverterAmount] = useState(100);
  const [converterFrom, setConverterFrom] = useState(baseCurrency);
  const [converterTo, setConverterTo] = useState('USD');
  const [convertedAmount, setConvertedAmount] = useState(0);
  const [isUpdatingRates, setIsUpdatingRates] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newCurrency, setNewCurrency] = useState({ code: '', name: '', exchangeRate: 1 });
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState({ code: '', name: '', exchangeRate: 1 });
  const currencyList = Array.isArray(currencies) ? currencies : [];

  // Currency converter logic
  useEffect(() => {
    const fromCurrency = currencyList.find(c => c.code === converterFrom);
    const toCurrency = currencyList.find(c => c.code === converterTo);
    const fromRate = fromCurrency?.exchangeRate ?? fromCurrency?.rateToBase;
    const toRate = toCurrency?.exchangeRate ?? toCurrency?.rateToBase;

    if (fromCurrency && toCurrency && fromRate && toRate) {
      // Convert to base currency first, then to target currency
      const amountInBase = converterAmount / fromRate;
      const converted = amountInBase * toRate;
      setConvertedAmount(converted);
    }
  }, [converterAmount, converterFrom, converterTo, currencyList]);

  if (!mounted) {
    return <div>Loading...</div>;
  }

  const handleUpdateRates = async () => {
    setIsUpdatingRates(true);
    try {
      await updateRates();
      toast({
        title: language === 'de' ? 'Wechselkurse aktualisiert' : 'Exchange rates updated',
        description: language === 'de'
          ? 'Die Wechselkurse wurden erfolgreich aktualisiert'
          : 'Exchange rates have been updated successfully'
      });
    } catch (error) {
      toast({
        title: language === 'de' ? 'Fehler' : 'Error',
        description: language === 'de'
          ? 'Fehler beim Aktualisieren der Wechselkurse'
          : 'Error updating exchange rates',
        variant: 'destructive'
      });
    } finally {
      setIsUpdatingRates(false);
    }
  };

  const formatCurrency = (amount: number, currencyCode: string) => {
    const currency = currencyList.find(c => c.code === currencyCode);
    if (!currency) return `${amount.toFixed(2)} ${currencyCode}`;

    return new Intl.NumberFormat(language === 'de' ? 'de-DE' : 'en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (date: Date | string) => {
    const parsedDate = new Date(date);
    return new Intl.DateTimeFormat(language === 'de' ? 'de-DE' : 'en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(parsedDate);
  };

  const getCurrencyInfo = (code: string) => {
    return COMMON_CURRENCIES.find(c => c.code === code) || {
      code,
      name: code,
      symbol: code,
      flag: ''
    };
  };

  const getRateChange = (currency: Currency) => {
    // Keep this deterministic to avoid server/client hydration mismatches.
    const seed = currency.code.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return ((seed % 201) - 100) / 10000; // -1.00% to +1.00%
  };

  const handleAddCurrency = async () => {
    const code = newCurrency.code.toUpperCase().trim();
    if (!code || !Number.isFinite(newCurrency.exchangeRate) || newCurrency.exchangeRate <= 0) {
      toast({
        title: language === 'de' ? 'Fehler' : 'Error',
        description: language === 'de' ? 'Bitte gueltigen Code und Kurs eingeben' : 'Please enter a valid code and rate',
        variant: 'destructive',
      });
      return;
    }
    if (currencyList.some((c) => c.code === code)) {
      toast({
        title: language === 'de' ? 'Bereits vorhanden' : 'Already exists',
        description: language === 'de'
          ? `${code} ist bereits in deiner Liste.`
          : `${code} is already in your list.`,
        variant: 'destructive',
      });
      return;
    }
    try {
      await addCurrency({
        code,
        name: newCurrency.name.trim() || undefined,
        exchangeRate: newCurrency.exchangeRate,
      });
      setNewCurrency({ code: '', name: '', exchangeRate: 1 });
      setIsAddDialogOpen(false);
      toast({
        title: language === 'de' ? 'Waehrung hinzugefuegt' : 'Currency added',
        description: `${code} ${language === 'de' ? 'wurde hinzugefuegt' : 'has been added'}.`,
      });
    } catch (error) {
      toast({
        title: language === 'de' ? 'Fehler' : 'Error',
        description: language === 'de' ? 'Waehrung konnte nicht hinzugefuegt werden' : 'Currency could not be added',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveCurrency = async (code: string) => {
    const confirmed = window.confirm(
      language === 'de'
        ? `Moechtest du ${code} wirklich entfernen?`
        : `Do you really want to remove ${code}?`
    );
    if (!confirmed) return;
    try {
      await removeCurrency(code);
      toast({
        title: language === 'de' ? 'Waehrung entfernt' : 'Currency removed',
        description: `${code} ${language === 'de' ? 'wurde entfernt' : 'has been removed'}.`,
      });
    } catch (error) {
      toast({
        title: language === 'de' ? 'Fehler' : 'Error',
        description: language === 'de' ? 'Waehrung konnte nicht entfernt werden' : 'Currency could not be removed',
        variant: 'destructive',
      });
    }
  };

  const openEditCurrency = (currency: any) => {
    setEditingCurrency({
      code: currency.code,
      name: currency.name || '',
      exchangeRate: Number(currency.exchangeRate ?? currency.rateToBase ?? 1),
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEditedCurrency = async () => {
    if (!editingCurrency.code || !Number.isFinite(editingCurrency.exchangeRate) || editingCurrency.exchangeRate <= 0) {
      toast({
        title: language === 'de' ? 'Fehler' : 'Error',
        description: language === 'de' ? 'Bitte gueltigen Kurs eingeben' : 'Please enter a valid rate',
        variant: 'destructive',
      });
      return;
    }

    try {
      await addCurrency({
        code: editingCurrency.code,
        name: editingCurrency.name || undefined,
        exchangeRate: editingCurrency.exchangeRate,
      });
      setIsEditDialogOpen(false);
      toast({
        title: language === 'de' ? 'Waehrung aktualisiert' : 'Currency updated',
        description: `${editingCurrency.code} ${language === 'de' ? 'wurde aktualisiert' : 'has been updated'}.`,
      });
    } catch (error) {
      toast({
        title: language === 'de' ? 'Fehler' : 'Error',
        description: language === 'de' ? 'Waehrung konnte nicht aktualisiert werden' : 'Currency could not be updated',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {language === 'de' ? 'Multi-Waehrung' : 'Multi-Currency'}
          </h2>
          <p className="text-muted-foreground">
            {language === 'de'
              ? 'Verwalte Waehrungen und konvertiere Betraege'
              : 'Manage currencies and convert amounts'
            }
          </p>
        </div>

        <div className="flex gap-2">
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>{language === 'de' ? 'Waehrung bearbeiten' : 'Edit Currency'}</DialogTitle>
                <DialogDescription>
                  {language === 'de' ? 'Name und Kurs aktualisieren.' : 'Update name and exchange rate.'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="edit-currency-code">Code</Label>
                  <Input id="edit-currency-code" value={editingCurrency.code} disabled />
                </div>
                <div>
                  <Label htmlFor="edit-currency-name">{language === 'de' ? 'Name' : 'Name'}</Label>
                  <Input
                    id="edit-currency-name"
                    value={editingCurrency.name}
                    onChange={(e) => setEditingCurrency((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-currency-rate">{language === 'de' ? 'Kurs' : 'Rate'}</Label>
                  <Input
                    id="edit-currency-rate"
                    type="number"
                    min="0.0001"
                    step="0.0001"
                    value={editingCurrency.exchangeRate}
                    onChange={(e) => setEditingCurrency((prev) => ({ ...prev, exchangeRate: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleSaveEditedCurrency} className="flex-1">
                    {language === 'de' ? 'Speichern' : 'Save'}
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    {language === 'de' ? 'Abbrechen' : 'Cancel'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                {language === 'de' ? 'Waehrung' : 'Currency'}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>{language === 'de' ? 'Waehrung hinzufuegen' : 'Add Currency'}</DialogTitle>
                <DialogDescription>
                  {language === 'de' ? 'Code und Wechselkurs zur Basiswaehrung eingeben.' : 'Enter code and rate to base currency.'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="currency-code">Code</Label>
                  <Input
                    id="currency-code"
                    maxLength={5}
                    value={newCurrency.code}
                    onChange={(e) => setNewCurrency((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    placeholder="USD"
                  />
                </div>
                <div>
                  <Label htmlFor="currency-name">{language === 'de' ? 'Name (optional)' : 'Name (optional)'}</Label>
                  <Input
                    id="currency-name"
                    value={newCurrency.name}
                    onChange={(e) => setNewCurrency((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder={language === 'de' ? 'US Dollar' : 'US Dollar'}
                  />
                </div>
                <div>
                  <Label htmlFor="currency-rate">{language === 'de' ? 'Kurs' : 'Rate'}</Label>
                  <Input
                    id="currency-rate"
                    type="number"
                    min="0.0001"
                    step="0.0001"
                    value={newCurrency.exchangeRate}
                    onChange={(e) => setNewCurrency((prev) => ({ ...prev, exchangeRate: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleAddCurrency} className="flex-1">
                    {language === 'de' ? 'Hinzufuegen' : 'Add'}
                  </Button>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    {language === 'de' ? 'Abbrechen' : 'Cancel'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            onClick={handleUpdateRates}
            disabled={isUpdatingRates}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isUpdatingRates ? 'animate-spin' : ''}`} />
            {language === 'de' ? 'Wechselkurse aktualisieren' : 'Update Rates'}
          </Button>
        </div>
      </div>

      {/* Currency Converter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            {language === 'de' ? 'Waehrungsrechner' : 'Currency Converter'}
          </CardTitle>
          <CardDescription>
            {language === 'de'
              ? 'Konvertiere Betraege zwischen verschiedenen Waehrungen'
              : 'Convert amounts between different currencies'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="converter-amount">
                {language === 'de' ? 'Betrag' : 'Amount'}
              </Label>
              <Input
                id="converter-amount"
                type="number"
                min="0"
                step="0.01"
                value={converterAmount}
                onChange={(e) => setConverterAmount(parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="converter-from">
                {language === 'de' ? 'Von' : 'From'}
              </Label>
              <Select value={converterFrom} onValueChange={setConverterFrom}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencyList.map(currency => {
                    const info = getCurrencyInfo(currency.code);
                    return (
                      <SelectItem key={currency.code} value={currency.code}>
                        <div className="flex items-center gap-2">
                          <span>{info.flag}</span>
                          <span>{currency.code}</span>
                          <span className="text-muted-foreground">({info.name})</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const temp = converterFrom;
                setConverterFrom(converterTo);
                setConverterTo(temp);
              }}
              className="gap-2"
            >
              ⇅ {language === 'de' ? 'Tauschen' : 'Swap'}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="converter-to">
                {language === 'de' ? 'Nach' : 'To'}
              </Label>
              <Select value={converterTo} onValueChange={setConverterTo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencyList.map(currency => {
                    const info = getCurrencyInfo(currency.code);
                    return (
                      <SelectItem key={currency.code} value={currency.code}>
                        <div className="flex items-center gap-2">
                          <span>{info.flag}</span>
                          <span>{currency.code}</span>
                          <span className="text-muted-foreground">({info.name})</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>
                {language === 'de' ? 'Konvertierter Betrag' : 'Converted Amount'}
              </Label>
              <div className="p-3 bg-muted rounded-md font-mono text-lg">
                {formatCurrency(convertedAmount, converterTo)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exchange Rates Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {language === 'de' ? 'Wechselkurse' : 'Exchange Rates'}
          </CardTitle>
          <CardDescription>
            {language === 'de'
              ? `Alle Kurse bezogen auf ${baseCurrency}`
              : `All rates relative to ${baseCurrency}`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  {language === 'de' ? 'Waehrung' : 'Currency'}
                </TableHead>
                <TableHead>
                  {language === 'de' ? 'Code' : 'Code'}
                </TableHead>
                <TableHead className="text-right">
                  {language === 'de' ? 'Kurs' : 'Rate'}
                </TableHead>
                <TableHead className="text-right">
                  {language === 'de' ? 'Änderung' : 'Change'}
                </TableHead>
                <TableHead className="text-right">
                  {language === 'de' ? 'Zuletzt aktualisiert' : 'Last Updated'}
                </TableHead>
                <TableHead className="text-right">
                  {language === 'de' ? 'Aktion' : 'Action'}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currencyList.map(currency => {
                const info = getCurrencyInfo(currency.code);
                const rateChange = getRateChange(currency);
                const isPositive = rateChange >= 0;

                return (
                  <TableRow key={currency.code}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{info.flag}</span>
                        <span className="font-medium">{info.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={currency.isBase ? 'default' : 'secondary'}>
                        {currency.code}
                        {currency.isBase && (
                          <span className="ml-1 text-xs">
                            ({language === 'de' ? 'Basis' : 'Base'})
                          </span>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {(currency.exchangeRate ?? currency.rateToBase ?? 0).toFixed(4)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className={`flex items-center justify-end gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {isPositive ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        <span className="font-mono text-sm">
                          {isPositive ? '+' : ''}{(rateChange * 100).toFixed(2)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {formatDate(currency.lastUpdated)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditCurrency(currency)}
                        >
                          <Edit className="mr-1 h-3.5 w-3.5" />
                          {language === 'de' ? 'Bearbeiten' : 'Edit'}
                        </Button>
                        {!currency.isBase && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleRemoveCurrency(currency.code)}
                          >
                            {language === 'de' ? 'Entfernen' : 'Remove'}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Base Currency Settings */}
      <Card>
        <CardHeader>
          <CardTitle>
            {language === 'de' ? 'Basiswährung' : 'Base Currency'}
          </CardTitle>
          <CardDescription>
            {language === 'de'
              ? 'Wähle deine bevorzugte Basiswährung für Berechnungen'
              : 'Choose your preferred base currency for calculations'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Select value={baseCurrency} onValueChange={setBaseCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencyList.map(currency => {
                    const info = getCurrencyInfo(currency.code);
                    return (
                      <SelectItem key={currency.code} value={currency.code}>
                        <div className="flex items-center gap-2">
                          <span>{info.flag}</span>
                          <span>{currency.code}</span>
                          <span className="text-muted-foreground">({info.name})</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <Alert className="flex-1">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {language === 'de'
                  ? 'Änderungen der Basiswährung wirken sich auf alle bestehenden Berechnungen aus.'
                  : 'Changing the base currency will affect all existing calculations.'
                }
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      {/* Currency Statistics */}
      {currencyList.length > 1 && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                {language === 'de' ? 'Verfügbare Waehrungen' : 'Available Currencies'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {currencyList.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                {language === 'de' ? 'Basiswährung' : 'Base Currency'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {getCurrencyInfo(baseCurrency).flag} {baseCurrency}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                {language === 'de' ? 'Letzte Aktualisierung' : 'Last Update'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                {currencyList.length > 0
                  ? formatDate(currencyList[0].lastUpdated)
                  : language === 'de' ? 'Nie' : 'Never'
                }
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
