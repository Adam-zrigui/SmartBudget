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
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Plus, PieChart, BarChart3, Trash2, Edit } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface Investment {
  id: string;
  name: string;
  type: string;
  symbol?: string;
  quantity: number;
  purchasePrice: number;
  currentPrice?: number;
  currency: string;
  portfolio?: string;
  purchaseDate: Date;
  lastUpdated?: Date;
  totalValue?: number;
  totalCost?: number;
  unrealizedGain?: number;
  riskLevel?: string;
  expectedReturn?: number;
  broker?: string;
  notes?: string;
}

interface InvestmentTrackerProps {
  investments?: any[];
  addInvestment?: (investment: any) => void | Promise<unknown>;
  updateInvestment?: (investment: any) => void | Promise<unknown>;
  deleteInvestment?: (id: string) => void | Promise<unknown>;
  updatePrices?: (investments: any[]) => void | Promise<unknown>;
  onCreateInvestment?: (investment: any) => void | Promise<unknown>;
  onUpdateInvestment?: (investment: any) => void | Promise<unknown>;
  onDeleteInvestment?: (id: string) => void | Promise<unknown>;
  onUpdatePrices?: (investments: any[]) => void | Promise<unknown>;
}

const INVESTMENT_TYPES = [
  { value: 'stocks', label: { de: 'Aktien', en: 'Stocks' } },
  { value: 'crypto', label: { de: 'Kryptowaehrungen', en: 'Cryptocurrency' } },
  { value: 'bonds', label: { de: 'Anleihen', en: 'Bonds' } },
  { value: 'real_estate', label: { de: 'Immobilien', en: 'Real Estate' } },
  { value: 'mutual_fund', label: { de: 'Investmentfonds', en: 'Mutual Funds' } },
  { value: 'etf', label: { de: 'ETFs', en: 'ETFs' } },
  { value: 'other', label: { de: 'Sonstiges', en: 'Other' } }
];

const PORTFOLIOS = [
  { value: 'conservative', label: { de: 'Konservativ', en: 'Conservative' } },
  { value: 'balanced', label: { de: 'Ausgewogen', en: 'Balanced' } },
  { value: 'aggressive', label: { de: 'Aggressiv', en: 'Aggressive' } },
  { value: 'retirement', label: { de: 'Altersvorsorge', en: 'Retirement' } },
  { value: 'growth', label: { de: 'Wachstum', en: 'Growth' } }
];

const RISK_LEVELS = [
  { value: 'low', label: { de: 'Niedrig', en: 'Low' }, color: 'default' },
  { value: 'medium', label: { de: 'Mittel', en: 'Medium' }, color: 'secondary' },
  { value: 'high', label: { de: 'Hoch', en: 'High' }, color: 'destructive' }
];

export default function InvestmentTracker({
  investments = [],
  addInvestment,
  updateInvestment,
  deleteInvestment,
  updatePrices,
  onCreateInvestment,
  onUpdateInvestment,
  onDeleteInvestment,
  onUpdatePrices
}: InvestmentTrackerProps) {
  const { language } = useLanguageStore();
  const t = translations[language];
  const { toast } = useToast();

  const createInvestmentHandler = addInvestment ?? onCreateInvestment;
  const updateInvestmentHandler = updateInvestment ?? onUpdateInvestment;
  const deleteInvestmentHandler = deleteInvestment ?? onDeleteInvestment;
  const updatePricesHandler = updatePrices ?? onUpdatePrices;

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingInvestmentId, setEditingInvestmentId] = useState<string | null>(null);
  const [newInvestment, setNewInvestment] = useState({
    name: '',
    type: 'stocks',
    symbol: '',
    quantity: 0,
    purchasePrice: 0,
    currentPrice: 0,
    currency: 'EUR',
    portfolio: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    riskLevel: 'medium',
    expectedReturn: 0,
    broker: '',
    notes: ''
  });

  const handleCreateInvestment = async () => {
    if (!newInvestment.name || newInvestment.quantity <= 0 || newInvestment.purchasePrice <= 0) {
      toast({
        title: language === 'de' ? 'Fehler' : 'Error',
        description: language === 'de' ? 'Bitte alle erforderlichen Felder ausfuellen' : 'Please fill all required fields',
        variant: 'destructive'
      });
      return;
    }

    const investmentData = {
      ...newInvestment,
      purchaseDate: new Date(newInvestment.purchaseDate)
    };

    if (editingInvestmentId && !updateInvestmentHandler) {
      toast({
        title: language === 'de' ? 'Fehler' : 'Error',
        description: language === 'de' ? 'Update-Aktion ist nicht verfuegbar' : 'Update action is not available',
        variant: 'destructive'
      });
      return;
    }

    if (!editingInvestmentId && !createInvestmentHandler) {
      toast({
        title: language === 'de' ? 'Fehler' : 'Error',
        description: language === 'de' ? 'Investment-Aktion ist nicht verfuegbar' : 'Investment action is not available',
        variant: 'destructive'
      });
      return;
    }

    try {
      if (editingInvestmentId) {
        await Promise.resolve(updateInvestmentHandler?.({ ...investmentData, id: editingInvestmentId }));
      } else {
        await Promise.resolve(createInvestmentHandler?.(investmentData));
      }
      setNewInvestment({
        name: '',
        type: 'stocks',
        symbol: '',
        quantity: 0,
        purchasePrice: 0,
        currentPrice: 0,
        currency: 'EUR',
        portfolio: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        riskLevel: 'medium',
        expectedReturn: 0,
        broker: '',
        notes: ''
      });
      setIsCreateDialogOpen(false);
      setEditingInvestmentId(null);

      toast({
        title: editingInvestmentId
          ? (language === 'de' ? 'Investment aktualisiert' : 'Investment updated')
          : (language === 'de' ? 'Investment hinzugefuegt' : 'Investment added'),
        description: editingInvestmentId
          ? (language === 'de' ? 'Investment wurde erfolgreich aktualisiert' : 'Investment updated successfully')
          : (language === 'de' ? 'Neues Investment wurde erfolgreich hinzugefuegt' : 'New investment added successfully')
      });
    } catch (err) {
      toast({
        title: language === 'de' ? 'Fehler' : 'Error',
        description: language === 'de'
          ? 'Investment konnte nicht gespeichert werden.'
          : 'Investment could not be saved.',
        variant: 'destructive',
      });
    }
  };

  const openEditInvestment = (investment: any) => {
    setNewInvestment({
      name: investment.name || '',
      type: investment.type || 'stocks',
      symbol: investment.symbol || '',
      quantity: Number(investment.quantity) || 0,
      purchasePrice: Number(investment.purchasePrice) || 0,
      currentPrice: Number(investment.currentPrice) || 0,
      currency: investment.currency || 'EUR',
      portfolio: investment.portfolio || '',
      purchaseDate: investment.purchaseDate
        ? new Date(investment.purchaseDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      riskLevel: investment.riskLevel || 'medium',
      expectedReturn: Number(investment.expectedReturn) || 0,
      broker: investment.broker || '',
      notes: investment.notes || '',
    });
    setEditingInvestmentId(investment.id);
    setIsCreateDialogOpen(true);
  };

  const handleDeleteInvestment = async (id: string, name: string) => {
    if (!deleteInvestmentHandler) {
      toast({
        title: language === 'de' ? 'Fehler' : 'Error',
        description: language === 'de' ? 'Loesch-Aktion ist nicht verfuegbar' : 'Delete action is not available',
        variant: 'destructive',
      });
      return;
    }
    const confirmed = window.confirm(
      language === 'de'
        ? `Moechtest du "${name}" wirklich loeschen?`
        : `Do you really want to delete "${name}"?`
    );
    if (!confirmed) return;
    try {
      await Promise.resolve(deleteInvestmentHandler(id));
      toast({
        title: language === 'de' ? 'Investment geloescht' : 'Investment deleted',
        description: language === 'de' ? 'Das Investment wurde entfernt.' : 'The investment has been removed.',
      });
    } catch (err) {
      toast({
        title: language === 'de' ? 'Fehler' : 'Error',
        description: language === 'de'
          ? 'Investment konnte nicht geloescht werden.'
          : 'Investment could not be deleted.',
        variant: 'destructive',
      });
    }
  };

  const getTypeLabel = (type: string) => {
    const investmentType = INVESTMENT_TYPES.find(t => t.value === type);
    return investmentType ? investmentType.label[language as keyof typeof investmentType.label] : type;
  };

  const getPortfolioLabel = (portfolio: string) => {
    const port = PORTFOLIOS.find(p => p.value === portfolio);
    return port ? port.label[language as keyof typeof port.label] : portfolio;
  };

  const getRiskInfo = (riskLevel: string) => {
    return RISK_LEVELS.find(r => r.value === riskLevel) || RISK_LEVELS[1];
  };

  const calculateGain = (investment: Investment) => {
    if (!investment.currentPrice) return { gain: 0, percentage: 0 };

    const currentValue = investment.quantity * investment.currentPrice;
    const costBasis = investment.quantity * investment.purchasePrice;
    const gain = currentValue - costBasis;
    const percentage = costBasis > 0 ? (gain / costBasis) * 100 : 0;

    return { gain, percentage, currentValue, costBasis };
  };

  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat(language === 'de' ? 'de-DE' : 'en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(language === 'de' ? 'de-DE' : 'en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  // Calculate portfolio totals
  const portfolioTotals = investments.reduce((acc, investment) => {
    const { currentValue = 0, costBasis = 0, gain = 0 } = calculateGain(investment);

    acc.totalValue += currentValue;
    acc.totalCost += costBasis;
    acc.totalGain += gain;

    return acc;
  }, { totalValue: 0, totalCost: 0, totalGain: 0 });

  const totalReturn = portfolioTotals.totalCost > 0
    ? (portfolioTotals.totalGain / portfolioTotals.totalCost) * 100
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {language === 'de' ? 'Investment-Tracking' : 'Investment Tracking'}
          </h2>
          <p className="text-muted-foreground">
            {language === 'de'
              ? 'Verfolge deine Investments und analysiere die Performance'
              : 'Track your investments and analyze performance'
            }
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              if (!updatePricesHandler) {
                toast({
                  title: language === 'de' ? 'Fehler' : 'Error',
                  description: language === 'de' ? 'Preisaktualisierung ist nicht verfuegbar' : 'Price update is not available',
                  variant: 'destructive'
                });
                return;
              }
              updatePricesHandler(investments);
            }}
            className="gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            {language === 'de' ? 'Preise aktualisieren' : 'Update Prices'}
          </Button>

          <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
            setIsCreateDialogOpen(open);
            if (!open) setEditingInvestmentId(null);
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                {language === 'de' ? 'Investment hinzufügen' : 'Add Investment'}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingInvestmentId
                    ? (language === 'de' ? 'Investment bearbeiten' : 'Edit Investment')
                    : (language === 'de' ? 'Neues Investment' : 'New Investment')}
                </DialogTitle>
                <DialogDescription>
                  {language === 'de'
                    ? 'Füge ein neues Investment zu deinem Portfolio hinzu'
                    : 'Add a new investment to your portfolio'
                  }
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="investment-name">
                      {language === 'de' ? 'Name' : 'Name'}
                    </Label>
                    <Input
                      id="investment-name"
                      value={newInvestment.name}
                      onChange={(e) => setNewInvestment(prev => ({ ...prev, name: e.target.value }))}
                      placeholder={language === 'de' ? 'z.B. Apple Aktien' : 'e.g. Apple Stocks'}
                    />
                  </div>

                  <div>
                    <Label htmlFor="investment-type">
                      {language === 'de' ? 'Typ' : 'Type'}
                    </Label>
                    <Select value={newInvestment.type} onValueChange={(value) => setNewInvestment(prev => ({ ...prev, type: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {INVESTMENT_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label[language as keyof typeof type.label]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="symbol">
                      {language === 'de' ? 'Symbol/Ticker' : 'Symbol/Ticker'}
                    </Label>
                    <Input
                      id="symbol"
                      value={newInvestment.symbol}
                      onChange={(e) => setNewInvestment(prev => ({ ...prev, symbol: e.target.value }))}
                      placeholder="AAPL"
                    />
                  </div>

                  <div>
                    <Label htmlFor="portfolio">
                      {language === 'de' ? 'Portfolio' : 'Portfolio'}
                    </Label>
                    <Select value={newInvestment.portfolio} onValueChange={(value) => setNewInvestment(prev => ({ ...prev, portfolio: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder={language === 'de' ? 'Portfolio wählen' : 'Select portfolio'} />
                      </SelectTrigger>
                      <SelectContent>
                        {PORTFOLIOS.map(portfolio => (
                          <SelectItem key={portfolio.value} value={portfolio.value}>
                            {portfolio.label[language as keyof typeof portfolio.label]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="quantity">
                      {language === 'de' ? 'Anzahl' : 'Quantity'}
                    </Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="0"
                      step="0.01"
                      value={newInvestment.quantity || ''}
                      onChange={(e) => setNewInvestment(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                      placeholder="10"
                    />
                  </div>

                  <div>
                    <Label htmlFor="purchase-price">
                      {language === 'de' ? 'Kaufpreis' : 'Purchase Price'}
                    </Label>
                    <Input
                      id="purchase-price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={newInvestment.purchasePrice || ''}
                      onChange={(e) => setNewInvestment(prev => ({ ...prev, purchasePrice: parseFloat(e.target.value) || 0 }))}
                      placeholder="150.00"
                    />
                  </div>

                  <div>
                    <Label htmlFor="current-price">
                      {language === 'de' ? 'Aktueller Preis' : 'Current Price'}
                    </Label>
                    <Input
                      id="current-price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={newInvestment.currentPrice || ''}
                      onChange={(e) => setNewInvestment(prev => ({ ...prev, currentPrice: parseFloat(e.target.value) || 0 }))}
                      placeholder="180.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="purchase-date">
                      {language === 'de' ? 'Kaufdatum' : 'Purchase Date'}
                    </Label>
                    <Input
                      id="purchase-date"
                      type="date"
                      value={newInvestment.purchaseDate}
                      onChange={(e) => setNewInvestment(prev => ({ ...prev, purchaseDate: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="risk-level">
                      {language === 'de' ? 'Risiko' : 'Risk Level'}
                    </Label>
                    <Select value={newInvestment.riskLevel} onValueChange={(value) => setNewInvestment(prev => ({ ...prev, riskLevel: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {RISK_LEVELS.map(risk => (
                          <SelectItem key={risk.value} value={risk.value}>
                            {risk.label[language as keyof typeof risk.label]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expected-return">
                      {language === 'de' ? 'Erwartete Rendite (%)' : 'Expected Return (%)'}
                    </Label>
                    <Input
                      id="expected-return"
                      type="number"
                      min="0"
                      step="0.1"
                      value={newInvestment.expectedReturn || ''}
                      onChange={(e) => setNewInvestment(prev => ({ ...prev, expectedReturn: parseFloat(e.target.value) || 0 }))}
                      placeholder="7.5"
                    />
                  </div>

                  <div>
                    <Label htmlFor="broker">
                      {language === 'de' ? 'Broker' : 'Broker'}
                    </Label>
                    <Input
                      id="broker"
                      value={newInvestment.broker}
                      onChange={(e) => setNewInvestment(prev => ({ ...prev, broker: e.target.value }))}
                      placeholder={language === 'de' ? 'z.B. ING' : 'e.g. ING'}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">
                    {language === 'de' ? 'Notizen (optional)' : 'Notes (optional)'}
                  </Label>
                  <Input
                    id="notes"
                    value={newInvestment.notes}
                    onChange={(e) => setNewInvestment(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder={language === 'de' ? 'Zusaetzliche Informationen' : 'Additional information'}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleCreateInvestment} className="flex-1">
                    {editingInvestmentId
                      ? (language === 'de' ? 'Speichern' : 'Save')
                      : (language === 'de' ? 'Hinzufügen' : 'Add')}
                  </Button>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    {language === 'de' ? 'Abbrechen' : 'Cancel'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Portfolio Overview */}
      {investments.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                {language === 'de' ? 'Portfolio Wert' : 'Portfolio Value'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(portfolioTotals.totalValue)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                {language === 'de' ? 'Gesamtgewinn/Verlust' : 'Total Gain/Loss'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${portfolioTotals.totalGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(portfolioTotals.totalGain)}
              </div>
              <div className={`text-sm ${portfolioTotals.totalGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalReturn >= 0 ? '+' : ''}{totalReturn.toFixed(2)}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                {language === 'de' ? 'Investitionen' : 'Investments'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {investments.length}
              </div>
              <div className="text-sm text-muted-foreground">
                {language === 'de' ? 'verschiedene Assets' : 'different assets'}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Investments Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {investments.map((investment) => {
          const { gain, percentage, currentValue, costBasis } = calculateGain(investment);
          const riskInfo = getRiskInfo(investment.riskLevel || 'medium');
          const isPositive = gain >= 0;

          return (
            <Card key={investment.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{investment.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Badge variant="outline">
                        {getTypeLabel(investment.type)}
                      </Badge>
                      {investment.symbol && (
                        <Badge variant="secondary">
                          {investment.symbol}
                        </Badge>
                      )}
                    </CardDescription>
                  </div>

                  <div className="ml-2 flex items-center gap-1">
                    <Badge variant={riskInfo.color as any}>
                      {riskInfo.label[language as keyof typeof riskInfo.label]}
                    </Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                      onClick={() => openEditInvestment(investment)}
                      aria-label={language === 'de' ? 'Investment bearbeiten' : 'Edit investment'}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteInvestment(investment.id, investment.name)}
                      aria-label={language === 'de' ? 'Investment loeschen' : 'Delete investment'}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">
                      {language === 'de' ? 'Aktueller Wert' : 'Current Value'}
                    </div>
                    <div className="text-lg font-semibold">
                      {formatCurrency(currentValue || (investment.quantity * investment.purchasePrice), investment.currency)}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-muted-foreground">
                      {language === 'de' ? 'Gewinn/Verlust' : 'Gain/Loss'}
                    </div>
                    <div className={`text-lg font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                      {isPositive ? '+' : ''}{formatCurrency(gain, investment.currency)}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{language === 'de' ? 'Performance' : 'Performance'}</span>
                    <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
                      {isPositive ? '+' : ''}{percentage.toFixed(2)}%
                    </span>
                  </div>
                  <Progress
                    value={Math.min(Math.abs(percentage), 100)}
                    className={`h-2 ${isPositive ? 'bg-green-100' : 'bg-red-100'}`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">
                      {language === 'de' ? 'Anzahl' : 'Quantity'}
                    </div>
                    <div className="font-medium">
                      {investment.quantity.toLocaleString()}
                    </div>
                  </div>

                  <div>
                    <div className="text-muted-foreground">
                      {language === 'de' ? 'Ø Preis' : 'Avg Price'}
                    </div>
                    <div className="font-medium">
                      {formatCurrency(investment.purchasePrice, investment.currency)}
                    </div>
                  </div>
                </div>

                {investment.portfolio && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">
                      {language === 'de' ? 'Portfolio:' : 'Portfolio:'}
                    </span>
                    <Badge variant="outline" className="ml-2">
                      {getPortfolioLabel(investment.portfolio)}
                    </Badge>
                  </div>
                )}

                {investment.lastUpdated && (
                  <div className="text-xs text-muted-foreground">
                    {language === 'de' ? 'Zuletzt aktualisiert' : 'Last updated'}: {formatDate(investment.lastUpdated)}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {investments.length === 0 && (
        <Card className="p-8 text-center">
          <PieChart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {language === 'de' ? 'Keine Investments vorhanden' : 'No investments yet'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {language === 'de'
              ? 'Fuege dein erstes Investment hinzu, um dein Portfolio zu verfolgen'
              : 'Add your first investment to start tracking your portfolio'
            }
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            {language === 'de' ? 'Investment hinzufügen' : 'Add Investment'}
          </Button>
        </Card>
      )}
    </div>
  );
}
